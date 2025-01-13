# XRAYUI Changelog

## [0.xx.x] - xxxx-xx-xx

- ADDED: DNS redirection for router-originated traffic: Implemented an iptables rule to redirect UDP DNS queries (dport 53) originating from the router itself to the configured Xray DNS port. This ensures that all DNS traffic, including system-level queries from the router, is routed through Xray, preventing DNS leaks and maintaining consistent DNS behavior across the network.
- UPDATED: Added logic to remove the new OUTPUT chain DNS redirection rule during cleanup, ensuring proper cleanup of all firewall rules when Xray is stopped or reconfigured.

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
