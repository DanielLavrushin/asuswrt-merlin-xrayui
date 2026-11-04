# xray-schema

Dumps the JSON config schema Xray-core reads, taken from the Go source of its `infra/conf`
package, and diffs two dumps ([#450](https://github.com/DanielLavrushin/asuswrt-merlin-xrayui/issues/450)).

Xray-core decodes its config with plain `json.Unmarshal`, without `DisallowUnknownFields`.
When core removes or renames a key, a config that still has it starts normally, `xray run -test`
passes, and the setting silently does nothing. That is how
[#441](https://github.com/DanielLavrushin/asuswrt-merlin-xrayui/issues/441),
[#443](https://github.com/DanielLavrushin/asuswrt-merlin-xrayui/issues/443),
[#444](https://github.com/DanielLavrushin/asuswrt-merlin-xrayui/issues/444) and
[#445](https://github.com/DanielLavrushin/asuswrt-merlin-xrayui/issues/445) went unnoticed.

`schema.json` is the dump of the core XRAYUI is tested with: `XRAYUI_TESTED_CORE` in
`src/backend/_globals.sh`, the version fresh installs get
([#451](https://github.com/DanielLavrushin/asuswrt-merlin-xrayui/issues/451)).
The workflow `.github/workflows/xray-schema.yml`:

- runs daily, diffs the latest Xray-core release against `schema.json` and keeps one open issue
  labelled `xray-schema-drift` with the report. The issue closes by itself once the snapshot
  matches the latest release.
- on a push or pull request that touches this folder or `_globals.sh`, fails unless `schema.json`
  is exactly what this tool produces for `XRAYUI_TESTED_CORE`.

## What a dump holds

- `structs`: every Go struct in `infra/conf` and the JSON keys `encoding/json` decodes into it:
  json tag names, or the Go name of an exported field without a tag. Types and anonymous structs
  declared inside a function are included, such as the routing rule
  (`parseFieldRule.RawFieldRule`) and the DNS server object
  (`NameServerConfig.UnmarshalJSON.advanced`). `embeds` lists embedded structs, whose keys belong
  to the embedding object too.
- `loaders`: the names each `NewJSONConfigLoader` registry accepts (inbound and outbound
  `protocol`, finalmask `type`, balancer strategy `type`, TCP header `type`) and the struct each
  name decodes into.
- `switches`: the string values a `switch` statement matches, such as transport names, XHTTP
  modes, domain strategies and Shadowsocks ciphers.

Struct names are not tied to files, so a struct that only moves to another file is not a change.
Letter-case-only renames are listed apart: `encoding/json` matches keys case-insensitively.

## Raising the tested core

Part of each release:

1. Handle the open `xray-schema-drift` issue: update XRAYUI for the removed and renamed keys.
2. Read the core release notes for changes the schema cannot show, such as new defaults, and
   smoke-test the new core on a router.
3. In one commit, regenerate the snapshot and raise `XRAYUI_TESTED_CORE` (here to v26.10.31):

```sh
TAG=v26.10.31
git clone --depth 1 --branch "$TAG" --filter=blob:none --sparse https://github.com/XTLS/Xray-core.git /tmp/xray-core-$TAG
git -C /tmp/xray-core-$TAG sparse-checkout set infra/conf
go -C tools/xray-schema run . dump -tag "$TAG" /tmp/xray-core-$TAG/infra/conf > tools/xray-schema/schema.json
sed -i "s/^XRAYUI_TESTED_CORE=.*/XRAYUI_TESTED_CORE=\"${TAG#v}\"/" src/backend/_globals.sh  # macOS: sed -i ''
```

To compare any two releases, dump both and run `go -C tools/xray-schema run . diff old.json new.json`.

## Limits

- It reads source, not behaviour. A changed default or meaning under the same key does not show.
- Switch values are a heuristic: only `switch` statements on a string with literal or
  package-constant cases are read. Values checked with `if`, maps or `strings.EqualFold`, or
  constants from other packages, are not.
- Keys a custom `UnmarshalJSON` reads by hand, for example from a `map[string]json.RawMessage`,
  are not seen.
- It does not check the keys XRAYUI writes against core (the reverse check proposed in #450),
  and it does not run `xray run -test` on generated configs.
