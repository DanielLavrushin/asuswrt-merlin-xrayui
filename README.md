```shell
echo "$2" | grep -q "^xrayui" && /jffs/scripts/xrayui service_event $(echo "$2" | cut -d'_' -f2- | tr '_' ' ') & #xrayui
```
