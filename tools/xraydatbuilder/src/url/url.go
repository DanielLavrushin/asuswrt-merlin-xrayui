package url

import (
	"fmt"
	"io"
	"net/http"
	"os"
	"slices"
	"sort"
	"strings"
	"time"

	router "github.com/v2fly/v2ray-core/v5/app/router/routercommon"
)

type fetchArgs struct {
	SourceFile    string
	OutDir        string
	WhiteListFile string
}


func Fetch(url string) ([]*router.Domain, error) {
	

	client := &http.Client{Timeout: 15 * time.Second}


	whiteList := []string{}


		fmt.Fprintln(os.Stdout, "Fetching:",url)
		resp, err := client.Get(url)
		if err != nil {
			return nil, err
		}
		defer resp.Body.Close()

		body, err := io.ReadAll(resp.Body)
		if err != nil {
			return nil, err
		}

		body, err = convertContent(body, whiteList)
		if err != nil {
			return nil, err
		}
		fmt.Fprintln(os.Stdout, "  Domains fetched:", len(strings.Split(string(body), "\n")))
		lines := strings.Split(string(body), "\n")
		var domains []*router.Domain
		for _, line := range lines {
			line = strings.TrimSpace(line)
			if line == "" {
				continue
			}
			domains = append(domains, &router.Domain{
				Type:      router.Domain_RootDomain,
				Value:     line,
				Attribute: nil,
			})
		}
		return domains, nil
	}

func convertContent(content []byte, whiteList []string) ([]byte, error) {
	lines := strings.Split(string(content), "\n")
	var domains []string

	for _, line := range lines {
		line = strings.TrimSpace(line)
		if line == "" || strings.HasPrefix(line, "#") || strings.HasPrefix(line, "!") {
			continue
		}
		if idx := strings.Index(line, "#"); idx >= 0 {
			line = strings.TrimSpace(line[:idx])
			if line == "" {
				continue
			}
		}

		if strings.HasPrefix(line, "||") && strings.HasSuffix(line, "^") {
			d := strings.ToLower(line[2 : len(line)-1])
			if len(whiteList) > 0 && slices.Contains(whiteList, d) {
				continue
			}
			domains = append(domains, d)
			continue
		}

		fields := strings.Fields(line)
		switch len(fields) {
		case 1:
			d := strings.ToLower(fields[0])
			d = strings.TrimPrefix(d, "www.")
			if len(whiteList) > 0 && slices.Contains(whiteList, d) {
				continue
			}
			domains = append(domains, d)

		default:
			for _, raw := range fields[1:] {
				d := strings.ToLower(raw)
				d = strings.TrimPrefix(d, "www.")
				if len(whiteList) > 0 && slices.Contains(whiteList, d) {
					continue
				}
				domains = append(domains, d)
			}
		}
	}

	set := make(map[string]struct{}, len(domains))
	for _, d := range domains {
		set[d] = struct{}{}
	}
	unique := make([]string, 0, len(set))
	for d := range set {
		unique = append(unique, d)
	}
	sort.Strings(unique)
	return []byte(strings.Join(unique, "\n")), nil
}
