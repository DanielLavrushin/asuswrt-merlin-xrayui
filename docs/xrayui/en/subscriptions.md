# Guide to Subscriptions

Subscription in the XRAY world is a handy way to simplify the maintenance of configuration between server and client. Once your XRAY server setup is complete, it can expose a subscription URL that any XRAY-compatible client can consume. Subscriptions are not a built-in feature of XRAY Core itself—many third-party server-side dashboards and UIs add this convenience layer.

A growing number of projects can generate subscription URLs for your server. Check the [XRAY Core home page](https://github.com/XTLS/Xray-core) to find supported tools and clients.

## Subscriptions under the Hood

There are two flavors of subscription URLs:

- **Subscription protocol link (a token)**: Starts with a proxy protocol prefix such as `ss://`, `vless://`, `vmess://`, etc. This could be encoded to base64, so you cannot read it.
- **Subscription source**: A list of multiple proxy configurations (each on its own line, encoded).

  > [!info]
  > The only real difference is granularity: a protocol link delivers `one` proxy, while a source link delivers `many`.

  > [!warning]
  > Opening either link in your browser may show “gibberish”—that’s just Base64. XRAYUI will decode it for you. If you’re curious — not required! — you can decode it yourself at [base64decode.org](https://www.base64decode.org/).

  > [!warning]
  > Parsing can get tricky. If something misbehaves, swing by our [Telegram group](https://t.me/asusxray) and we’ll lend a hand.

### Subscription Protocol Link

A single-proxy link—maybe from `3x-u`, `Marzban`, or any other [provider](https://github.com/XTLS/Xray-core). A decoded example might look like this:

```text:no-line-numbers
vless://05519058-d2ac-4f28-9e4a-2b2a1386749e@1.1.1.1:22222?path=/telegram-channel-vlessconfig-ws&security=tls&encryption=none&host=somedomainname.com&type=ws&sni=telegram-channel-vlessconfig.sohala.uk#Telegram @VlessConfig
```

> [!info]
> The link content when opening it in the browser can be encoded, so you don't understand it. This is fine, just try to provide it.

### Subscription Source Link

A subscription source link. Subscription source is a link that contains more than one protocol inside. Basically, it is just a list of protocols (many lines randomly containing `ss://`, `vless://`, etc.).

## XRAYUI: Protocol Link

Let us start with a protocol link (hopefully you did not skip the important previous part, did you?).

XRAYUI is expecting you to know the protocol of the link. So first things first - we need to create an outbound protocol item first.

In the Outbounds section, select a desired protocol from the drop-down and create it. For example, you have a link

```text:no-line-numbers
https://yourserver:2096/asd7696asf98df/d0f97sd00df7s09s8df
```

Insert it to the field `Subscription URL`  
![subscriptions protocol](../.vuepress/public/images/subscriptions/20250731210146.png)  
All dependent on the subscription field becomes inactive. It means these fields and settings will be controlled by your subscription.

Press `save` to save the changes.

> [!warning]  
> Remember: this will not apply the config changes. You still will need to press `apply` in the main form so the changes you made will be sent to the backend and saved.

When you apply main form changes, your changes will be applied and the page will be reloaded. You will notice a link icon next to your outbound indicating this outbound is controlled by the subscription link.  
![proxy subscription line](../.vuepress/public/images/subscriptions/20250731210735.png)

> [!info]  
> Even though the name means subscription, it is not enough just to update the remote side. To ensure the changes are taken into action, you need to press the `apply` button in the XRAYUI every time you change something in your subscription. In this case, the modified changes will be reloaded and applied by XRAYUI.

## XRAYUI: Source Link

Source link is a link that contains more than one protocol inside. It will not work as a protocol link described above, but you will need to set it up differently.

Navigate to the `General Options` in the `Configuration Section` and switch to the `Subscriptions` tab.  
![source link](../.vuepress/public/images/subscriptions/20250731213156.png)  
You can save it, then the window will be reloaded. Or you can give a temporary link and press the button `fetch` below the textarea.

![fetch](../.vuepress/public/images/subscriptions/20250731213401.png)

The system will fetch the links from the Subscription source. Visually nothing happened. You can close the window.

However, if you create a new outbound proxy, you will get a list of available subscriptions you can pick from the list `Available Subscription Configuration`  
![available subscriptions](../.vuepress/public/images/subscriptions/20250731213630.png)

> [!warning]  
> The drop-down is only available when the specific type of subscription was fetched from the URL.

Now you can select the subscription object from the drop-down and apply the configuration settings automatically.

> [!warning]
> The difference between subscription source and subscription protocol is granularity. If the link contains one item - you can insert it into the Subscription URL field and this will perform an automatic reload during service restart.
> Conversely, when it contains more than one source, it will display a drop-down list per outbound connection. This will require you to reapply the settings when changes are performed on the remote side.

## Automatic Subscription Refresh

By default, subscription sources are only fetched when you manually press the `Fetch` button. If your subscription provider updates server endpoints frequently, you can enable automatic refresh so your server list stays up to date without manual intervention.

In `General Options` → `Subscriptions` tab, find the **Auto-refresh interval** setting and choose a schedule:

- **Disabled** — manual refresh only (default)
- **3 hours** — re-fetches your subscription sources every 3 hours
- **6 hours** — every 6 hours
- **12 hours** — every 12 hours

![autosubs](../.vuepress/public/images/subscriptions/20260222194646.png)

The refresh runs silently in the background via a cron job. It uses the same subscription links you already configured in the text area above.

## Auto-Fallback

Auto-fallback is designed for situations where your ISP or network blocks a proxy endpoint. When enabled, XRAYUI will periodically check whether your active proxy is reachable. If it detects that the endpoint is down, it will automatically switch to the next working server from your subscription pool. Your routing rules, DNS settings, and everything else stay intact — only the connection details change.

![autofall](../.vuepress/public/images/subscriptions/20260220235709.png)

### How to Enable

There are two parts to the setup:

**1. Global toggle** — In `General Options` → `Subscriptions` tab:

- Enable the **Auto-fallback** checkbox. This turns on the health monitoring system.
- Choose a **Health check interval** (2, 5, or 10 minutes). This controls how often the system checks if your endpoints are still alive.

> [!important]
> Auto-fallback requires the **Connection Check** feature to be enabled in General Options. Connection Check is what allows Xray to monitor whether your endpoints are alive. If it is disabled, the auto-fallback options will show a message explaining this requirement.

**2. Per-outbound opt-in** — In each outbound's settings:

- First, select an endpoint from the `Available Subscription Configuration` dropdown (this requires subscription sources to be fetched).
- Then enable the **Auto-fallback pool** checkbox. This links the outbound back to the subscription pool for automatic recovery.

> [!info]
> Only outbounds that have the **Auto-fallback pool** checkbox enabled will participate in automatic switching. Other outbounds are left untouched.

### Probe URL

By default, the Connection Check verifies endpoint health by sending a request to `https://www.google.com/generate_204`. If this URL is not suitable for your environment (for example, if it is blocked in your region), you can change it in `General Options` → `Subscriptions` tab under **Probe URL**.

![prob](../.vuepress/public/images/subscriptions/20260222194527.png)

The probe URL must return an HTTP `204 No Content` response to be considered successful. Any endpoint that returns 204 will work.

### Rotation Filters

If your subscription pool contains servers in many regions but you only want to rotate through a subset, you can set **Rotation filters** in `General Options` → `Subscriptions` tab.

Enter comma-separated keywords (e.g., `Canada, Denmark`). When auto-fallback rotates to a new server, only subscription links whose name or URL contains at least one of these keywords will be considered. Links that do not match any keyword are skipped.

If no filters are set, or if none of the keywords match any links in the pool, the full subscription pool is used as before.

### How It Works

The system checks your pool-enabled outbounds on the schedule you configured. For each one:

1. It checks whether the endpoint is alive using the **Connection Check** feature. Xray continuously probes your configured endpoints and provides reliable, up-to-date health status.
2. If a check fails, it does not switch immediately. It waits for **3 consecutive failures** to avoid reacting to temporary network glitches.
3. After 3 failures, it switches to the next server in your subscription pool (filtered by your rotation filters, if any). The Connection Check will verify the new server's health on the next check cycle.
4. The switch is performed instantly via the **Xray API** with near-zero downtime. If the API is unavailable, the system falls back to a full Xray restart automatically.

> [!info]
> Subscription pool settings are preserved across Xray restarts. You do not need to reconfigure the pool after restarting the service.

A built-in safety limit prevents excessive switching — no more than 5 switches per hour per outbound. If all endpoints in the pool are unreachable, the system clears its failed list and retries on the next cycle.
