# Routing Rules Guide

Routing rules are the core of Xray's traffic control system. They determine which outbound connection (outbound proxy (`vless`/`vmess`/`xhttp` etc), direct(`freedom`), or block(`blackhole`)) should handle specific traffic based on various criteria like domains, IPs, ports, and protocols.

## Traffic Flow Architecture

Before diving into routing rules, it's crucial to understand that **not all traffic automatically goes through Xray**. The XRAYUI module implements a multi-layer traffic control system:

### Layer 1: System-Level Interception

First, the router decides what traffic to intercept based on your basic configuration:

- **[Bypass/Redirect Policies](br-policy.md)** determine which devices and ports are handled
- **[DNS Bypass Mode](general-options#enable-dns-bypass-ipset)** affects how domain-based decisions are made
- Only intercepted traffic reaches Xray for processing

### Layer 2: DNS Resolution & Bypass

Before Xray routing rules are evaluated, the **DNS Bypass/Redirect** feature can make routing decisions.

Initially, the module intercepts any traffic (well, almost any, but that's not important in this case) and redirects it to Xray's dokodemo inbound port. As it turned out, under heavy loads, Xray struggles to handle such traffic flow on weak routers.

#### DNS Bypass Modes

- **OFF**: All intercepted traffic goes to Xray for rule-based routing

- **BYPASS**: Extracts all rules from the config that are specified with `FREEDOM` outbound type, and essentially any traffic to these domains won't be sent to Xray. For example, if you made a rule `domain:ru` to FREEDOM - this way any traffic to .ru domains won't be thrown to Xray, but will flow as if there's no Xray on the router at all. Other traffic goes through Xray.

- **REDIRECT**: Works opposite to bypass - extracts all rules where the outbound type is NOT FREEDOM and sends them to Xray. So if you made a rule `geosite:youtube` to proxy outbound, this way all traffic except YouTube domains will bypass Xray, and YouTube will be thrown to the Xray process.

> [!important]
> DNS Bypass/Redirect happens BEFORE Xray routing rules! This is traffic routing even before it gets into the Xray process. It's important to remember that how and where your traffic goes inside Xray depends on your rules in Xray, but that's another story entirely.

> [!note]
> Important point: in geodata categories, you may occasionally (very rarely, but it happens) encounter `regexp:` prefixes for domains. Such "domains" are ignored by the "enable DNS bypass" option and won't work, but this is, let's say, a minor issue.

### Layer 3: Xray Routing Rules

Only traffic that passes through the previous layers reaches Xray's routing engine, where your rules are evaluated sequentially.

## Understanding Domain Prefixes

Domain routing in Xray provides flexible traffic management through various matching approaches. Understanding these prefixes is essential for effective rule creation.

### Basic Domain Matching

The `domain:` prefix is the foundation of domain-based routing:

- **`domain:com`** — Matches ALL .com top-level domains and their subdomains

  - ✅ Matches: `dmn.com`, `example.com`, `sub.example.com`
  - ❌ Doesn't match: `us.com`, `us-server.net`

- **`domain:dmn.com`** — Matches the domain and all its subdomains

  - ✅ Matches: `dmn.com`, `www.dmn.com`, `some.sub.domain.dmn.com`
  - ❌ Doesn't match: `domains.com`, `notdmn.com`

- **`domain:www.dmn.com`** — Matches only this specific subdomain and its sub-subdomains
  - ✅ Matches: `www.dmn.com`, `api.www.dmn.com`
  - ❌ Doesn't match: `dmn.com`, `m.dmn.com`

### Full Domain Matching

Use `full:` when you need exact domain matching without subdomains:

- **`full:google.com`** — Matches ONLY `google.com`
  - ✅ Matches: `google.com`
  - ❌ Doesn't match: `www.google.com`, `maps.google.com`

### Pattern Matching

For more flexible matching, use keyword and regex patterns:

- **`keyword:google`** — Matches any domain containing "google"

  - ✅ Matches: `google.com`, `googleusercontent.com`, `mygooglesite.net`

- **`regexp:.*\.edu$`** — Matches domains ending with .edu using regular expressions
  - ✅ Matches: `harvard.edu`, `mit.edu`
  - ❌ Doesn't match: `education.com`

## Working with Geosite Databases

For managing large collections of domains efficiently, Xray supports geosite files. These are community-maintained databases that group hundreds or thousands of related domains under single tags.

### Why Use Geosite?

Instead of manually listing dozens of domains for a service like YouTube:

```text
domain:youtube.com
domain:youtube.ru
domain:youtu.be
domain:youtubeeducation.com
domain:youtube-nocookie.com
domain:googleapis.com
# ... and many more
```

You can simply use:

```text
geosite:youtube
```

This automatically includes ALL YouTube-related domains from the community database, including CDNs, API endpoints, and regional variants.

### Available Geosite Categories

The community maintains extensive domain lists. You can find all available categories at:
[GitHub: v2fly/domain-list-community](https://github.com/v2fly/domain-list-community/tree/master/data)

Common categories include:

- `geosite:google` — All Google services
- `geosite:youtube` — YouTube and related domains
- `geosite:netflix` — Netflix streaming service
- `geosite:telegram` — Telegram messenger
- `geosite:facebook` — Facebook and Instagram
- `geosite:twitter` — Twitter/X platform
- `geosite:cn` — Chinese websites
- `geosite:category-media-ru` - All banned media in Russia
- `geosite:category-ads-all` — Advertisement networks
- `geosite:geolocation-!cn` — Non-Chinese sites

### Understanding Category Contents

Let's examine how categories work with a simple example:

The `geosite:actalis` category contains just two domains:

```text
domain:actalis.com
domain:actalis.it
```

When you use `geosite:actalis`, it's equivalent to adding both domains manually. However, the key advantage is **automatic updates** — if the community adds new Actalis domains in the future, your rules automatically include them when you update the geosite database.

### Community Contributions

The geosite database is community-driven. For example, the `category-media-ru` category was recently added:

```text
geosite:category-media-ru
```

This now automatically includes all category-media-ru-related domains without needing to list them individually.

### Creating Custom Geosite Categories

You can create your own domain lists using xrayui's custom geosite feature:
Read more about [custom geosite dat files](/en/custom-geodata).

### Updating Geosite Databases

The community geosite databases are regularly updated with new domains and categories. To keep your routing accurate:

#### Manual Update

1. Go to **Routing** section
2. Click **Update community files** button
3. Wait for the update to complete
4. Apply configuration

#### Automatic Updates

1. Go to **General Options** → **Geodata** tab
2. Enable **Auto-update geodata files**
3. Updates will occur nightly at 03:00

> [!tip]
> Regular updates ensure your rules catch newly added domains for services like streaming platforms that frequently add new CDN endpoints.

### Verifying Geosite Contents

To see what domains are included in a geosite category:

1. Check the [official repository](https://github.com/v2fly/domain-list-community/tree/master/data)
2. Search for the category file (e.g., `youtube`)
3. Review the included domains and patterns

This helps you understand exactly what traffic your rules will match.

## Understanding Routing Rules

In `XRAYUI`, routing rules work as a **sequential decision tree**. When traffic arrives, Xray evaluates rules from top to bottom and applies the **first matching rule**. If no rules match, traffic uses the default behavior.

> [!important]
> Rule order matters! Rules are evaluated sequentially, so more specific rules should generally come before broader ones.

## The Rules Interface

To manage routing rules in `XRAYUI`:

1. Navigate to the **Routing** section on the main page
   ![](../.vuepress/public/images/routing/20251025011730.png)
2. Click the **Manage** button next to **Rules**
3. The Rules Manager window will open
   ![](../.vuepress/public/images/routing/20251025011756.png)

## Adding a New Rule

### Step 1: Open the Rule Editor

Click **Add new rule** at the bottom of the Rules Manager window.

### Step 2: Configure Basic Settings

| Field                   | Description                             | Example              |
| ----------------------- | --------------------------------------- | -------------------- |
| **Friendly Name**       | Optional descriptive name for your rule | "Netflix to Proxy"   |
| **Outbound connection** | Which outbound to use when rule matches | proxy, direct, block |
| **Enabled**             | Toggle rule on/off without deleting     | ✓ (checked)          |

### Step 3: Define Matching Criteria

![](../.vuepress/public/images/routing/20251025011905.png)

Rules can match traffic based on multiple criteria:

#### Domains

Enter domains to match, one per line. Supports multiple formats:

```text
# Exact domain and subdomains
domain:google.com

# Only exact match
full:www.google.com

# Keyword matching
keyword:facebook

# Regular expression
regexp:.*\.gov$

# Geosite databases
geosite:netflix
geosite:category-ads
ext:xrayui:streaming
```

> [!tip]
> Use the **geosite:** and **ext:xrayui:** buttons above the domain field for quick prefix insertion. The autocomplete feature will help you find available tags.

#### IP Addresses

Specify IP addresses or ranges:

```text
# Single IP
1.1.1.1

# CIDR notation
192.168.1.0/24

# IP range
10.0.0.1-10.0.0.100

# GeoIP database
geoip:cn
geoip:ru
geoip:private
```

#### Ports

Define specific ports or ranges:

```text
# Single port
443

# Port range (use colon)
8080:8090

# Multiple ports
80,443,8080
```

#### Source IPs

Match traffic from specific source IPs (useful for device-specific rules):

```text
192.168.1.100
192.168.1.0/24
```

#### Protocols

Select protocols to match:

- HTTP
- TLS (HTTPS)
- BitTorrent

#### Network Type

Choose the transport protocol:

- TCP
- UDP
- TCP,UDP (both)

#### Inbound Tags

Match traffic from specific inbounds (useful when you have multiple entry points).

> [!tip]
> Remember the **Golden Rule**: If nothing is selected - everything is selected. it means you dont need to select everything to cover all. Just leave ithe field blank.

### Step 4: Save the Rule

Click **Save** to add the rule to your configuration.

## Practical Examples: DNS Bypass + Routing Rules

Understanding how DNS Bypass and routing rules interact is crucial for proper configuration. Here are real-world scenarios:

### Scenario 1: Performance Optimization

**Goal**: Proxy only blocked services, everything else direct

**Configuration**:

```yaml
DNS B/R Option: REDIRECT mode
B/R Policy: Redirect ports 80,443

Routing Rules:
1. YouTube → geosite:youtube → proxy
2. Netflix → geosite:netflix → proxy
```

**Result**: Only YouTube and Netflix go through Xray. All other traffic bypasses Xray entirely at the DNS/IPSET level, reducing CPU load.

### Scenario 2: Maximum Control

**Goal**: Complex routing with different proxies for different services

**Configuration**:

```yaml
DNS Bypass: OFF
B/R Policy: all to xray

Routing Rules:
1. Work traffic → domain:company.com → work-proxy
2. Streaming → geosite:netflix → us-proxy
3. Social Media → geosite:twitter → europe-proxy
4. Gaming → ports:27000-27100 → direct
5. Default → * → smart-proxy
```

**Result**: All traffic goes through Xray for evaluation, allowing sophisticated routing decisions.

### Scenario 3: Device-Specific with Bypass

**Goal**: Smart TV direct, other devices proxied

**Configuration**:

```yaml
DNS Bypass: BYPASS mode
B/R Policy:
  - Bypass MAC:AA:BB:CC:DD:EE:FF (Smart TV)
  - Redirect others on ports 80,443

Routing Rules:
1. Local network → geoip:private → direct
2. Blocked sites → geosite:netflix → proxy
3. Default → * → proxy
```

**Result**: Smart TV never reaches Xray. Other devices have Netflix proxied, rest goes direct via DNS bypass.

## Rule Priority and Ordering

Rules are processed in order from top to bottom. Here's the recommended priority order:

1. **System rules** (xrayui auto-generated, usually at the top, start with prefix `sys:`)
2. **Blocking rules** (ads, malware, trackers)
3. **Device-specific rules** (by source IP/MAC)
4. **Service-specific rules** (streaming, gaming)
5. **Port-based rules** (specific applications)
6. **Geographic rules** (country-based routing)
7. **Catch-all rules** (default behavior)

> [!tip]
> Use the drag handle (⋮⋮) on the left of each rule to reorder them. The visual order in the list represents the actual evaluation order.

### Interaction with DNS Bypass

Remember that DNS Bypass mode affects which traffic reaches your rules:

**In BYPASS mode:**

- Domains matching rules with `FREEDOM` outbound never reach Xray
- Only non-FREEDOM domains are evaluated by routing rules
- This improves performance but reduces control

**In REDIRECT mode:**

- Only domains NOT matching FREEDOM rules go through Xray
- Inverse logic of BYPASS mode
- Useful when most traffic should be direct

**With DNS Bypass OFF:**

- All intercepted traffic reaches Xray routing rules
- Maximum control but higher resource usage
- Recommended for complex routing scenarios

> [!warning]
> If using DNS Bypass, ensure your FREEDOM rules in Xray align with your bypass intentions. Misalignment can cause unexpected routing behavior.

## Working with Geosite/GeoIP

### Using Built-in Databases

**XRAYUI** includes community-maintained geographic databases:

**Common Geosite Tags:**

- `geosite:google` - All Google services
- `geosite:facebook` - Facebook and subsidiaries
- `geosite:netflix` - Netflix domains
- `geosite:telegram` - Telegram messenger
- `geosite:cn` - Chinese websites
- `geosite:category-ads-all` - Advertisement domains

**Common GeoIP Tags:**

- `geoip:cn` - Chinese IP addresses
- `geoip:us` - US IP addresses
- `geoip:private` - Private/LAN addresses
- `geoip:cloudflare` - Cloudflare IPs

### Custom Geosite Files

You can create custom domain lists. See [Custom Geosite Files](custom-geodata) for details.

## Advanced Features

### Domain Matching Strategies

Set the **Domain Matcher** to optimize performance:

- **hybrid** (default): Balanced performance and accuracy
- **linear**: Sequential matching, more accurate but slower

![](../.vuepress/public/images/routing/20251025013437.png)

### Using Multiple Criteria

Rules with multiple criteria use AND logic. The rule matches only when **ALL** specified conditions are met:

```yaml
# This rule matches HTTPS traffic from 192.168.1.100
Domains: domain:example.com
Source IPs: 192.168.1.100
Ports: 443
# ALL three conditions must be true for a match
```

### Temporary Rule Disabling

Instead of deleting rules, you can temporarily disable them:

1. Uncheck the checkbox next to the rule name
2. The rule moves to the "disabled" section but retains its configuration
3. Re-enable when needed without reconfiguration

## Best Practices

### 1. Start Specific, Then Generalize

Begin with specific rules for critical services, then add broader catch-all rules.

### 2. Use Descriptive Names

Give rules meaningful names that describe their purpose:

- ✅ "Netflix to Proxy"
- ❌ "Rule 1"

### 3. Group Related Rules

Keep similar rules together for easier management:

- Group all streaming rules
- Group all blocking rules
- Group all device-specific rules

### 4. Test Before Deploying

1. Add new rules as disabled
2. Enable and test individually
3. Monitor logs for unexpected behavior
4. Adjust as needed

### 5. Regular Maintenance

- Review rules periodically
- Remove obsolete rules
- Update geosite/geoip databases regularly
- Consolidate similar rules when possible

### 6. Document Complex Rules

For complex regex or multi-condition rules, add clear names and consider keeping external documentation.

## Troubleshooting

### Rules Not Working

1. **Check DNS Bypass mode** - Your rules might not be reached due to DNS bypass
   - If using BYPASS/REDIRECT, verify domains aren't being handled before Xray
   - Try temporarily disabling DNS bypass to isolate the issue
2. **Verify B/R Policies** - Traffic might not be intercepted at all
   - Check if the device/port is set to redirect to Xray
   - Verify MAC addresses and port ranges
3. **Check rule order** - More specific rules must come before general ones

4. **Verify outbound tags** - Ensure the specified outbound exists

5. **Check syntax** - Validate domain/IP formats
   - Remember: `domain:` not `domain.`
   - Use `geosite:` not `geosite.`
6. **Review logs** - Enable logs to see which rules are matching

### Traffic Not Going Through Proxy

**Symptom**: Sites load but aren't proxied despite having rules

**Common causes**:

1. **DNS Bypass is ON** with REDIRECT mode and domain matches FREEDOM
2. **B/R Policy** doesn't include the ports being used
3. **DNS resolution** happening before proxy (check DNS leak prevention)
4. **QUIC/HTTP3** traffic on UDP 443 not being intercepted

**Solution steps**:

```bash
1. Set DNS Bypass to OFF temporarily
2. Ensure B/R Policy includes both TCP and UDP
3. Add UDP port 443 to your redirect policy
4. Check logs to verify traffic reaches Xray
```

### Unexpected Direct Connections

**Symptom**: Some traffic bypasses proxy without matching any direct rule

**Check**:

1. **ipset rules** from DNS bypass creating kernel-level bypasses
2. **System DNS** queries not being intercepted
3. **IPv6 traffic** if not properly handled
4. **Cached DNS** responses from before configuration change

### Performance Issues

If routing is slow:

1. Reduce regex usage (most resource-intensive)
2. Consolidate similar rules
3. Use geosite tags instead of listing many domains
4. Switch domain matcher to "linear" if accuracy is more important than speed

### Debugging Rules

Enable logging to see rule matches:

1. Go to **General Options** → **Logs**
2. Enable **Access logs**
3. Set **Log level** to "info" or "debug"
4. Check logs to see which rules are triggered

### Common Mistakes to Avoid

- **Wrong prefix format**: Use `domain:` not `domain.`
- **Port format confusion**: Use `:` for ranges (8080:8090), not `-`
- **Missing network type**: Specify tcp, udp, or both
- **Incorrect rule order**: Catch-all rules placed too early
- **Conflicting rules**: Multiple rules matching the same traffic

## Quick Reference

### Domain Prefixes

| Prefix        | Matches                   | Example                                       |
| ------------- | ------------------------- | --------------------------------------------- |
| `domain:`     | Domain and all subdomains | `domain:google.com` matches `maps.google.com` |
| `full:`       | Exact domain only         | `full:google.com` matches only `google.com`   |
| `keyword:`    | Contains keyword          | `keyword:google` matches `googleplex.com`     |
| `regexp:`     | Regular expression        | `regexp:.*\.edu$` matches `.edu` domains      |
| `geosite:`    | Geosite database          | `geosite:netflix`                             |
| `ext:xrayui:` | Custom xrayui lists       | `ext:xrayui:mylist`                           |

## Configuration Decision Tree

When setting up routing in xrayui, follow this decision tree:

```plain
1. How much traffic needs proxying?
   ├─ Most traffic → DNS Bypass OFF
   └─ Selective → DNS Bypass ON
       ├─ Proxy specific sites → REDIRECT mode
       └─ Bypass specific sites → BYPASS mode

2. Which devices need proxying?
   ├─ All devices → B/R Policy: Redirect all
   └─ Specific devices → B/R Policy: By MAC/IP

3. What ports to intercept?
   ├─ Web only → TCP/UDP 80,443
   ├─ All traffic → All ports
   └─ Custom apps → Specific port ranges

4. How complex is routing?
   ├─ Simple (proxy/direct) → Basic rules
   ├─ By service → Use geosite categories
   └─ Complex logic → Multiple rule layers
```

## Summary

Effective routing in xrayui requires understanding three layers:

### Layer 1: B/R Policies

Controls which devices and ports are intercepted by the system.

### Layer 2: DNS Bypass

Pre-filters traffic before Xray, improving performance but reducing control.

### Layer 3: Xray Routing Rules

Fine-grained control over traffic that reaches Xray.

**Key concepts to remember:**

- Not all traffic automatically goes through Xray
- DNS Bypass can prevent rules from being evaluated
- Rule order matters (first match wins)
- Geosite categories simplify domain management
- Different domain prefixes serve different purposes
- Performance and control are often trade-offs

**Best practices:**

1. Start with DNS Bypass OFF to understand traffic flow
2. Use geosite categories instead of listing individual domains
3. Test rules incrementally
4. Monitor logs during initial setup
5. Optimize with DNS Bypass once routing works correctly
6. Document complex configurations

> [!note]
> Remember to click **Apply** on the main page after making any configuration changes to activate your new routing setup.
