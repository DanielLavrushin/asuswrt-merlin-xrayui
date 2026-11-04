// Command xray-schema dumps the JSON config schema Xray-core reads, taken from the Go
// source of its infra/conf package, and diffs two dumps.
//
// Xray-core decodes its config with encoding/json and no DisallowUnknownFields, so a key
// core no longer reads is dropped without an error: Xray starts, `xray run -test` passes
// and the XRAYUI setting silently does nothing. Diffing the dumps of two core versions
// lists every such change. See README.md.
//
//	xray-schema dump [-tag vX.Y.Z] <Xray-core>/infra/conf > schema.json
//	xray-schema diff old.json new.json    Markdown report; exit 1 when they differ
package main

import (
	"bytes"
	"encoding/json"
	"flag"
	"fmt"
	"go/ast"
	"go/parser"
	"go/token"
	"go/types"
	"io/fs"
	"os"
	"path/filepath"
	"reflect"
	"sort"
	"strconv"
	"strings"
)

// Schema is one dump. Lists are sorted and maps are written with sorted keys, so two
// dumps of the same source are byte-identical and a snapshot diffs line by line.
type Schema struct {
	Tag      string             `json:"tag,omitempty"`
	Structs  map[string]*Struct `json:"structs"`
	Loaders  map[string]*Loader `json:"loaders"`
	Switches map[string]*Switch `json:"switches"`
}

// Struct is a Go struct type that encoding/json decodes a JSON object into.
// Top-level types are keyed by name; types and anonymous structs declared inside a
// function by "Func.name" or "Type.Method.name", such as the routing rule
// ("parseFieldRule.RawFieldRule") and the DNS server object
// ("NameServerConfig.UnmarshalJSON.advanced").
type Struct struct {
	File string `json:"file"`
	// Keys holds the json tag names. An exported field without a tag is decoded under its
	// Go name, so that name is listed. encoding/json matches keys case-insensitively.
	Keys []string `json:"keys,omitempty"`
	// Embeds lists embedded types without a json tag. Their keys belong to this object too.
	Embeds []string `json:"embeds,omitempty"`
}

// Loader is a NewJSONConfigLoader registry: the names core accepts in IDKey (such as an
// inbound's "protocol" or a finalmask "type") and the struct each name decodes the
// ConfigKey object (such as "settings") into.
type Loader struct {
	File      string            `json:"file"`
	IDKey     string            `json:"idKey"`
	ConfigKey string            `json:"configKey"`
	Entries   map[string]string `json:"entries"`
}

// Switch lists the string values one switch statement matches, such as the transport
// names TransportProtocol.Build accepts. A value that leaves the list usually makes core
// fail or fall back to a default.
type Switch struct {
	File   string   `json:"file"`
	Values []string `json:"values"`
}

func main() {
	if len(os.Args) < 2 {
		usage()
	}
	switch os.Args[1] {
	case "dump":
		flags := flag.NewFlagSet("dump", flag.ExitOnError)
		tag := flags.String("tag", "", "Xray-core tag the source was checked out at, recorded in the dump")
		_ = flags.Parse(os.Args[2:])
		if flags.NArg() != 1 {
			usage()
		}
		s, err := dump(flags.Arg(0), *tag)
		if err != nil {
			fail(err)
		}
		var buf bytes.Buffer
		enc := json.NewEncoder(&buf)
		enc.SetEscapeHTML(false)
		enc.SetIndent("", "  ")
		if err := enc.Encode(s); err != nil {
			fail(err)
		}
		_, _ = os.Stdout.Write(buf.Bytes())
	case "diff":
		if len(os.Args) != 4 {
			usage()
		}
		a, err := load(os.Args[2])
		if err != nil {
			fail(err)
		}
		b, err := load(os.Args[3])
		if err != nil {
			fail(err)
		}
		report, changed := diff(a, b)
		fmt.Print(report)
		if changed {
			os.Exit(1)
		}
	default:
		usage()
	}
}

func usage() {
	fmt.Fprintln(os.Stderr, "usage: xray-schema dump [-tag vX.Y.Z] <Xray-core>/infra/conf")
	fmt.Fprintln(os.Stderr, "       xray-schema diff <old.json> <new.json>")
	os.Exit(2)
}

func fail(err error) {
	fmt.Fprintln(os.Stderr, "xray-schema:", err)
	os.Exit(2)
}

func load(path string) (*Schema, error) {
	data, err := os.ReadFile(path)
	if err != nil {
		return nil, err
	}
	s := new(Schema)
	if err := json.Unmarshal(data, s); err != nil {
		return nil, fmt.Errorf("%s: %w", path, err)
	}
	if len(s.Structs) == 0 {
		return nil, fmt.Errorf("%s: no structs, not a dump", path)
	}
	return s, nil
}

// ---- dump ----

type extractor struct {
	schema  *Schema
	consts  map[string]map[string]string // package dir -> string constant -> value
	handled map[ast.Node]bool            // structs and loader calls already named
}

type goFile struct {
	pkg, rel string
	ast      *ast.File
}

func dump(root, tag string) (*Schema, error) {
	var files []goFile
	fset := token.NewFileSet()
	err := filepath.WalkDir(root, func(path string, d fs.DirEntry, err error) error {
		if err != nil {
			return err
		}
		name := d.Name()
		if d.IsDir() {
			if path != root && (name == "testdata" || strings.HasPrefix(name, ".") || strings.HasPrefix(name, "_")) {
				return filepath.SkipDir
			}
			return nil
		}
		if !strings.HasSuffix(name, ".go") || strings.HasSuffix(name, "_test.go") {
			return nil
		}
		f, err := parser.ParseFile(fset, path, nil, parser.SkipObjectResolution)
		if err != nil {
			return err
		}
		rel, err := filepath.Rel(root, path)
		if err != nil {
			return err
		}
		rel = filepath.ToSlash(rel)
		files = append(files, goFile{pkg: pathDir(rel), rel: rel, ast: f})
		return nil
	})
	if err != nil {
		return nil, err
	}
	if len(files) == 0 {
		return nil, fmt.Errorf("%s: no Go files", root)
	}

	e := &extractor{
		schema:  &Schema{Tag: tag, Structs: map[string]*Struct{}, Loaders: map[string]*Loader{}, Switches: map[string]*Switch{}},
		consts:  map[string]map[string]string{},
		handled: map[ast.Node]bool{},
	}
	for _, f := range files {
		e.collectConsts(f)
	}
	for _, f := range files {
		for _, decl := range f.ast.Decls {
			switch d := decl.(type) {
			case *ast.GenDecl:
				e.walk(f, "", d)
			case *ast.FuncDecl:
				if d.Body != nil {
					e.walk(f, funcName(d), d.Body)
				}
			}
		}
	}
	if len(e.schema.Structs) == 0 {
		return nil, fmt.Errorf("%s: no structs found", root)
	}
	return e.schema, nil
}

func pathDir(rel string) string {
	if i := strings.LastIndex(rel, "/"); i >= 0 {
		return rel[:i]
	}
	return ""
}

func (e *extractor) collectConsts(f goFile) {
	for _, decl := range f.ast.Decls {
		gd, ok := decl.(*ast.GenDecl)
		if !ok || gd.Tok != token.CONST {
			continue
		}
		for _, spec := range gd.Specs {
			vs := spec.(*ast.ValueSpec)
			for i, id := range vs.Names {
				if i >= len(vs.Values) {
					continue
				}
				if s, ok := stringLit(vs.Values[i]); ok {
					if e.consts[f.pkg] == nil {
						e.consts[f.pkg] = map[string]string{}
					}
					e.consts[f.pkg][id.Name] = s
				}
			}
		}
	}
}

// walk names every struct, loader and string switch under node. scope is "" at the top
// level, otherwise the enclosing function.
func (e *extractor) walk(f goFile, scope string, node ast.Node) {
	count := map[string]int{}
	next := func(kind string) string {
		count[kind]++
		return fmt.Sprintf("#%s%d", kind, count[kind])
	}
	ast.Inspect(node, func(n ast.Node) bool {
		switch n := n.(type) {
		case *ast.TypeSpec:
			if st, ok := n.Type.(*ast.StructType); ok {
				e.addStruct(f, qualify(f.pkg, scope, n.Name.Name), st)
			}
		case *ast.ValueSpec:
			for i, id := range n.Names {
				if st, ok := n.Type.(*ast.StructType); ok && i == 0 {
					e.addStruct(f, qualify(f.pkg, scope, id.Name), st)
				}
				if i < len(n.Values) {
					e.value(f, scope, id.Name, n.Values[i])
				}
			}
		case *ast.AssignStmt:
			if len(n.Lhs) == len(n.Rhs) {
				for i, lhs := range n.Lhs {
					if id, ok := lhs.(*ast.Ident); ok && id.Name != "_" {
						e.value(f, scope, id.Name, n.Rhs[i])
					}
				}
			}
		case *ast.StructType:
			if !e.handled[n] {
				e.addStruct(f, qualify(f.pkg, scope, next("struct")), n)
			}
		case *ast.CallExpr:
			if !e.handled[n] && isLoaderCall(n) {
				e.addLoader(f, qualify(f.pkg, scope, next("loader")), n)
			}
		case *ast.SwitchStmt:
			e.addSwitch(f, scope, n)
		}
		return true
	})
}

// value names a struct literal or loader by the variable it is assigned to.
func (e *extractor) value(f goFile, scope, name string, x ast.Expr) {
	x = ast.Unparen(x)
	if u, ok := x.(*ast.UnaryExpr); ok && u.Op == token.AND {
		x = ast.Unparen(u.X)
	}
	switch v := x.(type) {
	case *ast.CompositeLit:
		if st, ok := v.Type.(*ast.StructType); ok {
			e.addStruct(f, qualify(f.pkg, scope, name), st)
		}
	case *ast.CallExpr:
		if isLoaderCall(v) {
			e.addLoader(f, qualify(f.pkg, scope, name), v)
		} else if id, ok := v.Fun.(*ast.Ident); ok && id.Name == "new" && len(v.Args) == 1 {
			if st, ok := v.Args[0].(*ast.StructType); ok {
				e.addStruct(f, qualify(f.pkg, scope, name), st)
			}
		}
	}
}

// addStruct records the keys encoding/json decodes into st, following its rules: an
// unexported field or `json:"-"` is skipped, an untagged field is decoded under its Go
// name, an untagged embedded struct promotes its own keys.
func (e *extractor) addStruct(f goFile, name string, st *ast.StructType) {
	e.handled[st] = true
	s := &Struct{File: f.rel}
	for _, field := range st.Fields.List {
		tag := ""
		if field.Tag != nil {
			tag, _ = strconv.Unquote(field.Tag.Value)
		}
		jv, tagged := reflect.StructTag(tag).Lookup("json")
		if tagged && jv == "-" {
			markStructs(e, field.Type)
			continue
		}
		jname, _, _ := strings.Cut(jv, ",")
		var keys []string
		if len(field.Names) == 0 {
			if jname != "" {
				keys = append(keys, jname)
			} else {
				s.Embeds = append(s.Embeds, typeName(field.Type))
			}
		} else {
			for _, id := range field.Names {
				if !id.IsExported() {
					continue
				}
				if jname != "" {
					keys = append(keys, jname)
				} else {
					keys = append(keys, id.Name)
				}
			}
		}
		s.Keys = append(s.Keys, keys...)
		if inner := innerStruct(field.Type); inner != nil {
			if len(keys) > 0 {
				e.addStruct(f, name+"."+keys[0], inner)
			} else {
				markStructs(e, inner)
			}
		}
	}
	if len(s.Keys) == 0 && len(s.Embeds) == 0 {
		return
	}
	s.Keys = sortedUnique(s.Keys)
	s.Embeds = sortedUnique(s.Embeds)
	e.schema.Structs[unique(name, func(k string) bool { return e.schema.Structs[k] != nil })] = s
}

func (e *extractor) addLoader(f goFile, name string, call *ast.CallExpr) {
	e.handled[call] = true
	l := &Loader{File: f.rel, Entries: map[string]string{}}
	if len(call.Args) > 1 {
		l.IDKey = e.str(f.pkg, call.Args[1])
	}
	if len(call.Args) > 2 {
		l.ConfigKey = e.str(f.pkg, call.Args[2])
	}
	if len(call.Args) > 0 {
		if lit, ok := ast.Unparen(call.Args[0]).(*ast.CompositeLit); ok {
			for _, elt := range lit.Elts {
				if kv, ok := elt.(*ast.KeyValueExpr); ok {
					l.Entries[e.str(f.pkg, kv.Key)] = creatorType(kv.Value)
				}
			}
		}
	}
	e.schema.Loaders[unique(name, func(k string) bool { return e.schema.Loaders[k] != nil })] = l
}

func (e *extractor) addSwitch(f goFile, scope string, sw *ast.SwitchStmt) {
	if sw.Tag == nil {
		return
	}
	var values []string
	for _, stmt := range sw.Body.List {
		for _, x := range stmt.(*ast.CaseClause).List {
			if s, ok := stringLit(x); ok {
				values = append(values, s)
			} else if id, ok := ast.Unparen(x).(*ast.Ident); ok {
				if s, ok := e.consts[f.pkg][id.Name]; ok {
					values = append(values, s)
				}
			}
		}
	}
	values = sortedUnique(values)
	if len(values) == 0 || len(values) == 1 && values[0] == "" {
		return
	}
	name := qualify(f.pkg, scope, "switch "+types.ExprString(sw.Tag))
	e.schema.Switches[unique(name, func(k string) bool { return e.schema.Switches[k] != nil })] = &Switch{File: f.rel, Values: values}
}

// str resolves a string literal or a package string constant, like a loader key.
func (e *extractor) str(pkg string, x ast.Expr) string {
	if s, ok := stringLit(x); ok {
		return s
	}
	if id, ok := ast.Unparen(x).(*ast.Ident); ok {
		if s, ok := e.consts[pkg][id.Name]; ok {
			return s
		}
	}
	return types.ExprString(x)
}

func isLoaderCall(c *ast.CallExpr) bool {
	switch fn := c.Fun.(type) {
	case *ast.Ident:
		return fn.Name == "NewJSONConfigLoader"
	case *ast.SelectorExpr:
		return fn.Sel.Name == "NewJSONConfigLoader"
	}
	return false
}

// creatorType returns the struct a loader entry decodes into: T in
// `func() interface{} { return new(T) }` or `return &T{...}`.
func creatorType(x ast.Expr) string {
	lit, ok := ast.Unparen(x).(*ast.FuncLit)
	if !ok {
		return types.ExprString(x)
	}
	result := ""
	ast.Inspect(lit.Body, func(n ast.Node) bool {
		ret, ok := n.(*ast.ReturnStmt)
		if result != "" || !ok || len(ret.Results) == 0 {
			return result == ""
		}
		switch v := ast.Unparen(ret.Results[0]).(type) {
		case *ast.CallExpr:
			if id, ok := v.Fun.(*ast.Ident); ok && id.Name == "new" && len(v.Args) == 1 {
				result = typeName(v.Args[0])
			}
		case *ast.UnaryExpr:
			if cl, ok := v.X.(*ast.CompositeLit); ok && v.Op == token.AND {
				result = typeName(cl.Type)
			}
		case *ast.CompositeLit:
			result = typeName(v.Type)
		}
		if result == "" {
			result = types.ExprString(ret.Results[0])
		}
		return false
	})
	return result
}

func markStructs(e *extractor, x ast.Expr) {
	ast.Inspect(x, func(n ast.Node) bool {
		if st, ok := n.(*ast.StructType); ok {
			e.handled[st] = true
		}
		return true
	})
}

func innerStruct(x ast.Expr) *ast.StructType {
	switch t := x.(type) {
	case *ast.StructType:
		return t
	case *ast.StarExpr:
		return innerStruct(t.X)
	case *ast.ArrayType:
		return innerStruct(t.Elt)
	case *ast.MapType:
		return innerStruct(t.Value)
	}
	return nil
}

func funcName(d *ast.FuncDecl) string {
	if d.Recv != nil && len(d.Recv.List) > 0 {
		return typeName(d.Recv.List[0].Type) + "." + d.Name.Name
	}
	return d.Name.Name
}

func typeName(x ast.Expr) string {
	switch t := x.(type) {
	case *ast.Ident:
		return t.Name
	case *ast.StarExpr:
		return typeName(t.X)
	case *ast.IndexExpr:
		return typeName(t.X)
	case *ast.IndexListExpr:
		return typeName(t.X)
	case *ast.SelectorExpr:
		return typeName(t.X) + "." + t.Sel.Name
	}
	return types.ExprString(x)
}

func qualify(pkg, scope, name string) string {
	if scope != "" {
		name = scope + "." + name
	}
	if pkg != "" {
		name = pkg + "." + name
	}
	return name
}

func unique(name string, taken func(string) bool) string {
	if !taken(name) {
		return name
	}
	for i := 2; ; i++ {
		if k := fmt.Sprintf("%s#%d", name, i); !taken(k) {
			return k
		}
	}
}

func stringLit(x ast.Expr) (string, bool) {
	lit, ok := ast.Unparen(x).(*ast.BasicLit)
	if !ok || lit.Kind != token.STRING {
		return "", false
	}
	s, err := strconv.Unquote(lit.Value)
	return s, err == nil
}

func sortedUnique(in []string) []string {
	if len(in) == 0 {
		return nil
	}
	sort.Strings(in)
	out := in[:1]
	for _, s := range in[1:] {
		if s != out[len(out)-1] {
			out = append(out, s)
		}
	}
	return out
}

// ---- diff ----

func diff(a, b *Schema) (string, bool) {
	from, to := label(a.Tag, "the snapshot"), label(b.Tag, "the new dump")
	var removed, added, cased, embeds, loaders, switches []string

	// Struct names: a struct renamed only in letter case (Xdns -> XDNS) is compared as one.
	oldName := map[string]string{}
	for name := range b.Structs {
		if a.Structs[name] == nil {
			if prev := caseTwin(name, a.Structs, b.Structs); prev != "" {
				oldName[name] = prev
			}
		}
	}
	renamedFrom := map[string]bool{}
	for _, prev := range oldName {
		renamedFrom[prev] = true
	}

	for _, name := range sortedKeys(a.Structs) {
		if b.Structs[name] == nil && !renamedFrom[name] {
			s := a.Structs[name]
			removed = append(removed, fmt.Sprintf("- `%s` (%s): struct removed. It had %s", name, s.File, codeList(s.Keys)))
		}
	}
	for _, name := range sortedKeys(b.Structs) {
		ns := b.Structs[name]
		was, prev := a.Structs[name], name
		if was == nil {
			if prev = oldName[name]; prev == "" {
				added = append(added, fmt.Sprintf("- `%s` (%s): new struct with %s", name, ns.File, codeList(ns.Keys)))
				if len(ns.Embeds) > 0 {
					embeds = append(embeds, fmt.Sprintf("- `%s`: new struct, embeds %s", name, codeList(ns.Embeds)))
				}
				continue
			}
			was = a.Structs[prev]
		}
		title := fmt.Sprintf("`%s` (%s)", name, ns.File)
		if prev != name {
			title += fmt.Sprintf(", was `%s`", prev)
		}
		gone, fresh := minus(was.Keys, ns.Keys), minus(ns.Keys, was.Keys)
		gone, fresh, renames := caseRenames(gone, fresh)
		if len(gone) > 0 {
			removed = append(removed, fmt.Sprintf("- %s: %s", title, codeList(gone)))
		}
		if len(fresh) > 0 {
			added = append(added, fmt.Sprintf("- %s: %s", title, codeList(fresh)))
		}
		if len(renames) > 0 {
			cased = append(cased, fmt.Sprintf("- %s: %s", title, strings.Join(renames, ", ")))
		}
		if g, n := minus(was.Embeds, ns.Embeds), minus(ns.Embeds, was.Embeds); len(g) > 0 || len(n) > 0 {
			embeds = append(embeds, fmt.Sprintf("- %s: %s", title, plusMinus(n, g)))
		}
	}

	for _, name := range union(sortedKeys(a.Loaders), sortedKeys(b.Loaders)) {
		ol, nl := a.Loaders[name], b.Loaders[name]
		switch {
		case nl == nil:
			loaders = append(loaders, fmt.Sprintf("- `%s` (%s): loader removed. It accepted %s", name, ol.File, codeList(sortedKeys(ol.Entries))))
		case ol == nil:
			loaders = append(loaders, fmt.Sprintf("- `%s` (%s, `%s`): new loader with %s", name, nl.File, nl.IDKey, entryList(nl.Entries, sortedKeys(nl.Entries))))
		default:
			var parts []string
			if n := minus(sortedKeys(nl.Entries), sortedKeys(ol.Entries)); len(n) > 0 {
				parts = append(parts, "added "+entryList(nl.Entries, n))
			}
			if g := minus(sortedKeys(ol.Entries), sortedKeys(nl.Entries)); len(g) > 0 {
				parts = append(parts, "removed "+codeList(g))
			}
			for _, k := range sortedKeys(nl.Entries) {
				if prev, ok := ol.Entries[k]; ok && prev != nl.Entries[k] {
					parts = append(parts, fmt.Sprintf("`%s` now decodes into `%s`, was `%s`", k, nl.Entries[k], prev))
				}
			}
			if ol.IDKey != nl.IDKey || ol.ConfigKey != nl.ConfigKey {
				parts = append(parts, fmt.Sprintf("keys are now `%s`/`%s`, were `%s`/`%s`", nl.IDKey, nl.ConfigKey, ol.IDKey, ol.ConfigKey))
			}
			if len(parts) > 0 {
				loaders = append(loaders, fmt.Sprintf("- `%s` (%s, `%s`): %s", name, nl.File, nl.IDKey, strings.Join(parts, "; ")))
			}
		}
	}

	for _, name := range union(sortedKeys(a.Switches), sortedKeys(b.Switches)) {
		was, cur := a.Switches[name], b.Switches[name]
		switch {
		case cur == nil:
			switches = append(switches, fmt.Sprintf("- `%s` (%s): switch removed. It matched %s", name, was.File, codeList(was.Values)))
		case was == nil:
			switches = append(switches, fmt.Sprintf("- `%s` (%s): new switch matching %s", name, cur.File, codeList(cur.Values)))
		default:
			if g, n := minus(was.Values, cur.Values), minus(cur.Values, was.Values); len(g) > 0 || len(n) > 0 {
				switches = append(switches, fmt.Sprintf("- `%s` (%s): %s", name, cur.File, plusMinus(n, g)))
			}
		}
	}

	var out strings.Builder
	changed := len(removed)+len(added)+len(cased)+len(embeds)+len(loaders)+len(switches) > 0
	if !changed {
		fmt.Fprintf(&out, "No config schema changes from %s to %s.\n", from, to)
		return out.String(), false
	}
	fmt.Fprintf(&out, "### Xray-core config schema changes from %s to %s\n", from, to)
	section(&out, "Keys core no longer reads",
		"A config that still has one of these starts normally, `xray run -test` passes, and the setting does nothing.", removed)
	section(&out, "New keys", "", added)
	section(&out, "Loaders: protocol, mask and header type names", "", loaders)
	section(&out, "String values matched in switch statements",
		"Heuristic: only `switch` statements on a string are read. A removed value usually makes core fail to start or fall back to a default.", switches)
	section(&out, "Embedded structs", "The keys of an embedded struct belong to the struct that embeds it.", embeds)
	section(&out, "Keys renamed only in letter case",
		"Harmless: encoding/json matches keys case-insensitively, so XRAYUI's spelling still works.", cased)
	return out.String(), true
}

func section(out *strings.Builder, title, note string, lines []string) {
	if len(lines) == 0 {
		return
	}
	fmt.Fprintf(out, "\n#### %s\n\n", title)
	if note != "" {
		fmt.Fprintf(out, "%s\n\n", note)
	}
	for _, l := range lines {
		fmt.Fprintln(out, l)
	}
}

func label(tag, fallback string) string {
	if tag == "" {
		return fallback
	}
	return "**" + tag + "**"
}

func caseTwin(name string, olds, news map[string]*Struct) string {
	for prev := range olds {
		if news[prev] == nil && strings.EqualFold(prev, name) {
			return prev
		}
	}
	return ""
}

// caseRenames pairs removed and added keys that differ only in letter case.
func caseRenames(gone, fresh []string) ([]string, []string, []string) {
	var renames, keptGone []string
	used := map[string]bool{}
	for _, g := range gone {
		match := ""
		for _, f := range fresh {
			if !used[f] && strings.EqualFold(f, g) {
				match = f
				break
			}
		}
		if match == "" {
			keptGone = append(keptGone, g)
			continue
		}
		used[match] = true
		renames = append(renames, fmt.Sprintf("`%s` to `%s`", g, match))
	}
	var keptFresh []string
	for _, f := range fresh {
		if !used[f] {
			keptFresh = append(keptFresh, f)
		}
	}
	return keptGone, keptFresh, renames
}

func plusMinus(added, removed []string) string {
	var parts []string
	if len(added) > 0 {
		parts = append(parts, "added "+codeList(added))
	}
	if len(removed) > 0 {
		parts = append(parts, "removed "+codeList(removed))
	}
	return strings.Join(parts, "; ")
}

func codeList(items []string) string {
	if len(items) == 0 {
		return "no keys"
	}
	quoted := make([]string, len(items))
	for i, s := range items {
		if s == "" {
			s = `""`
		}
		quoted[i] = "`" + s + "`"
	}
	return strings.Join(quoted, ", ")
}

func entryList(entries map[string]string, names []string) string {
	parts := make([]string, len(names))
	for i, n := range names {
		parts[i] = fmt.Sprintf("`%s` (%s)", n, entries[n])
	}
	return strings.Join(parts, ", ")
}

func minus(a, b []string) []string {
	in := map[string]bool{}
	for _, s := range b {
		in[s] = true
	}
	var out []string
	for _, s := range a {
		if !in[s] {
			out = append(out, s)
		}
	}
	return out
}

func union(a, b []string) []string {
	return sortedUnique(append(append([]string{}, a...), b...))
}

func sortedKeys[V any](m map[string]V) []string {
	keys := make([]string, 0, len(m))
	for k := range m {
		keys = append(keys, k)
	}
	sort.Strings(keys)
	return keys
}
