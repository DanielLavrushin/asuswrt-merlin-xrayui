# B4SNI Logs - SNI Traffic Monitor

## What is B4SNI Logs?

B4SNI Logs is a network monitoring feature in `XRAYUI` that captures and displays `Server Name Indication` (SNI) information from your network traffic. SNI is the hostname that devices request when making HTTPS connections, allowing you to see which websites and services are being accessed through your network.

## How to Use

### Starting the Monitor

1. Navigate to the **B4SNI Logs** section in your `XRAYUI` interface (very bottom of the main screen)
   ![b4sni](../.vuepress/public/images/b4sni/20251025222843.png)
2. Click the **start** button to begin capturing SNI data
3. The button will change to **Stop** when the service is running

### Monitoring requests

1. Click the **display** button to open the log viewer
2. Logs will automatically refresh every 3 seconds while the window is open
3. The most recent connections appear at the top of the list

### Understanding the logs

![logs](../.vuepress/public/images/b4sni/20251025223201.png)

Each log entry shows:

- **Time**: When the connection was made (HH:MM:SS format)
- **Protocol**: Either `TCP` (blue badge) or `UDP` (yellow badge)
- **Source**: The device making the connection
  - Shows device name if recognized, otherwise shows IP address
  - Includes the port number used
- **Destination**: The server being connected to (IP:port)
- **SNI**: The domain name being accessed (e.g., google.com, netflix.com)

### Statistics Bar

At the top of the log viewer, you'll see:

- **Total**: Total number of connections logged
- **TCP/UDP**: Breakdown by protocol type
- **Unique SNI**: Number of different domains accessed

### Filtering Logs

Use the search boxes at the top of each column to filter logs:

- **Protocol Filter**: Type "tcp" or "udp" to see only those protocols
- **Source Filter**: Search by device name, IP address, or port
- **Destination Filter**: Search by destination IP or port
- **SNI Filter**: Search for specific domain names

### Managing Logs

- **Clear Logs**: Click to remove all captured logs and start fresh.
- **Export CSV**: Download the filtered logs as a spreadsheet file for analysis
- **Raw**: View the raw log file in a new browser tab

### Stopping the Monitor

Click the **stop** button when you're done monitoring to conserve system resources.

### Privacy Note

B4SNI Logs only captures the domain names (SNI), not the actual content of your internet traffic. It's like seeing the address on an envelope without opening the letter.

## Troubleshooting

### No Logs Appearing

- Make sure the service is started (`start` button clicked)
- Wait a few seconds for traffic to be captured
- Try refreshing the page
- Check if there's actual network activity

### Device Names Not Showing

- Device names only appear for recognized devices on your network
- New devices may take time to be identified
- Guest devices might only show IP addresses

### Service Won't Start

- Another monitoring service might be running
- Try stopping and starting again
- Refresh the XRAYUI interface

### Logs Growing Too Large

- The system automatically limits log file size
- Use "Clear Logs" periodically to start fresh
- Export important logs before clearing

## Frequently Asked Questions

**Q: Does this slow down my internet?**

A: No, B4SNI Logs operates passively and doesn't impact network performance.

**Q: Can I see what people are browsing?**
A: You can see domain names (like youtube.com) but not specific pages or content.

**Q: How long are logs kept?**

A: Logs are kept until you clear them or restart the service. The system automatically manages file size.

**Q: Can I monitor specific devices only?**

A: Currently, all traffic is monitored, but you can use filters (source field) to view specific devices.
