# XHTTP settings representation

The editor keeps `host`, `path` and `mode` in `xhttpSettings`. Every other XHTTP
option lives in `xhttpSettings.extra`, including headers, padding, uplink/session/
sequence options, performance options, `xmux` and `downloadSettings`. Download
transports use the same representation recursively.

Xray's `SplitHTTPConfig.Build` replaces the outer configuration with `extra` when
present and then restores only `host`, `path` and `mode`. Keeping additional outer
copies therefore creates settings that look editable but have no effect.

## Migration and saving

Hydration and JSON imports accept both layouts. Outer-only fields move into
`extra`; an explicitly supplied nested value wins, including `false`, `0` and an
empty header map. This intentionally repairs earlier UI output whose outer-only
values were ignored by core. Defaults are applied after merging. Unknown options
are retained. Clearing an option cannot restore a stale outer copy.

The editor uses `sessionIDPlacement` and `sessionIDKey`. Import accepts the old
`sessionPlacement` / `sessionKey` aliases. Within one location the modern spelling
wins; between locations, `extra` wins. Serialization uses legacy names below
26.6.22 and modern names from 26.6.22 onward. As elsewhere in the application, an
unknown core version assumes current support. The rename first shipped in
[core commit e10347bf](https://github.com/XTLS/Xray-core/commit/e10347bf01f28bca118002963ee29bbcf529cb25).

Saving operates on a clone, so version-specific wire names do not change the
editor model. Numeric and string ranges remain supported. Explicit uplink data
placement `body` is retained because core's default is `auto`.

The serializer rejects GET or header/cookie uplink data without `packet-up`, and
split download with `stream-one`. Apply displays these errors without submitting
the configuration. These checks are not a replacement for core's full validation.

This change builds on the split-download padding fix: independent download
settings, padding seeding, port 443 fallback and packet-up selection remain.

## Verification

Regression tests cover migration precedence, aliases across the version boundary,
range values, editor bindings, independent download settings and stable repeated
saves. Generated split-XHTTP configurations also passed `xray run -test -config`
with official Linux binaries for 26.3.27 and 26.6.22. This validates configuration
acceptance, not a live connection through a router or CDN.
