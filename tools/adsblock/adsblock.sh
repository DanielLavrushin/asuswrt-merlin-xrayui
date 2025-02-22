#!/bin/sh

DATA_DIR="/opt/share/xrayui/data"

url_list='https://blocklistproject.github.io/Lists/abuse.txt
https://pgl.yoyo.org/adservers/serverlist.php?hostformat=hosts&mimetype=plaintext&useip=0.0.0.0
https://raw.githubusercontent.com/FadeMind/hosts.extras/master/add.Risk/hosts
https://raw.githubusercontent.com/FadeMind/hosts.extras/master/add.Spam/hosts
https://raw.githubusercontent.com/FiltersHeroes/KADhosts/master/KADhosts.txt
https://raw.githubusercontent.com/StevenBlack/hosts/master/alternates/fakenews-gambling/hosts
https://raw.githubusercontent.com/StevenBlack/hosts/master/data/StevenBlack/hosts
https://raw.githubusercontent.com/deathbybandaid/piholeparser/master/Subscribable-Lists/ParsedBlacklists/RU-AdList.txt
https://raw.githubusercontent.com/mitchellkrogza/Badd-Boyz-Hosts/master/hosts
https://small.oisd.nl/dnsmasq2
https://raw.githubusercontent.com/deathbybandaid/piholeparser/master/Subscribable-Lists/CountryCodesLists/Russia.txt
https://raw.githubusercontent.com/deathbybandaid/piholeparser/master/Subscribable-Lists/ParsedBlacklists/RUAdListCounters.txt
https://raw.githubusercontent.com/deathbybandaid/piholeparser/master/Subscribable-Lists/ParsedBlacklists/RUAdListBitBlock.txt'

filename_list='abuse
serverlist
addRisk
addSpam
KADhosts
fakenewsgambling
StevenBlack
RUAdList
BaddBoyz
dnsmasq2
Russia
RUAdListCounters
RUAdListBitBlock'

total=$(echo "$url_list" | wc -l)

i=1
echo "$url_list" | while IFS= read -r url; do
    fname=$(echo "$filename_list" | sed -n "${i}p")
    echo "Downloading $fname ($i of $total) from: $url"
    wget -qO "$DATA_DIR/$fname" "$url"
    i=$((i + 1))
done

for file in "$DATA_DIR"/*; do
    echo "Processing $file"
    sed -i '/#/d' $file
    awk '
    /^\s*#/ { next }
    NF {
        if ($1 ~ /^local=\//) {
            sub(/^local=\//, "", $1)
            sub(/\/$/, "", $1)
            print $1
        } else if ($1 ~ /^https?:\/\//) {
            sub(/^https?:\/\//, "", $1)
            split($1, a, "/")
            print a[1]
        } else if (NF > 1) {
            print $NF
        } else {
            print $1
        }
    }' "$file" >"${file}.tmp" && mv "${file}.tmp" "$file"
done

xrayui service_event geodata customrecompileall
