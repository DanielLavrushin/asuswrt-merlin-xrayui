# XRAYUI Changelog

## [x.xx.x] - 2025-01-xx

- REMOVED: doublicate `testconfig` invokation form the `xrayui` script
- ADDED: Log an error when curl failed to download/update `geosite` files.
- IMPROVED: minor cosmetic `xrayui` script fixes.

## [0.22.1] - 2025-01-16

- FIXED: The `Toggle Xray startup on reboot` checkbox occasionally reverted to its previous state.

## [0.22.0] - 2025-01-15

- ADDED: An option to toggle Xray startup on router reboot (enable/disable) (available under `Connection Status`).
- ADDED: Introduced a Transparent Proxy `Mark` field in the `sockopt` configuration.
- ADDED: Added an `Outbound network interface` field in the `sockopt` configuration.
- ADDED: Implemented `sockopt object` normalization.
- IMPROVED: Redesigned outbound proxy server lookup to exclude entries from the NAT and MANGLE tables (issue #3).
- IMPROVED: Refactored client firewall rules configuration by separating DIRECT and TPROXY rules (issue #3).
- IMPROVED: Simplified and optimized the firewall rules cleanup process.
- UPDATED: Increased `configuration apply` time from 5 seconds to 10 seconds to ensure the Xray service fully restarts.
- REMOVED: Deprecated shell functions `client add` and `client delete` .

## [0.21.1] - 2025-01-13

- REMOVED: Comment out redundant iptables rules for TCP DNS redirection (persistent android issue)

## [0.21.0] - 2025-01-13

- ADDED: Support for dynamic changelog display.
- FIXED: Routing issues for Wi-Fi-connected devices by adding OUTPUT chain rules to process locally generated traffic.
- FIXED: DNS redirection inconsistencies by applying rules for both UDP and TCP DNS traffic (dport 53, 853).
- ADDED: Exclusion of traffic destined for the Xray server (SERVER_IP) to prevent routing loops.
- ADDED: Explicit exemption for NTP traffic (dports 123, 323) to ensure reliable time synchronization.
- ADDED: Logging for dropped packets in the XRAYUI chain to facilitate debugging.
- ADDED: PID file check before restarting XRAY server so XRAY is restarted only when it runs
- IMPROVED: Consistent marking of intercepted traffic with 0x8777 for proper routing via table 8777.

## [0.20.1] - 2025-01-12

- ADDED: Custom Scripts for Firewall Rules/IPTABLES (see readme)
- FIXED: wireless devices are not able to connect when enabling xray in a client mode
