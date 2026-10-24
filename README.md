# crab-tv-live · 蟹老板TV 直播源库

本机（192.168.31.29）每日 23:30 跑一轮采集→探测→去重归并→导出 `merged.m3u`，
跑完自动推送到本仓库，供**手机/电视在脱离家庭网络时**订阅。

## 订阅地址

**推荐（raw 代理，无 CDN 陈旧缓存，手机 5G 实测 1.9s）**
```
https://ghfast.top/https://raw.githubusercontent.com/dickens0904/crab-tv-live/main/merged.m3u
```

**备选（jsDelivr，国内更快 1.5s，但分支缓存刷新慢，EPG 指针可能滞后几小时）**
```
https://cdn.jsdelivr.net/gh/dickens0904/crab-tv-live@main/merged.m3u
```

> `raw.githubusercontent.com` 在国内直连不通（实测 HTTP 000），故用 raw 代理。

## 文件
| 文件 | 说明 |
|---|---|
| `merged.m3u` | 电视/手机订阅用：中文优先、按「央视→卫视→地方→港澳台→国际→其他」分组、每台最多 12 条线路（App 端可切"线路 N"，坏一条自动跳）、已剔除节目内容类分组 |
| `merged_all.m3u` | 全量（含节目类与英文名源） |
| `status.json` | 上一轮采集汇总（存活/失效/保活/拦黄/库总数/导出数） |

## 机制
- **死源分级**：软失败（403/超时/重置＝主机侧疑似受限）保活，连续 >3 次才判死；硬失败（404/410/NXDOMAIN）立即判死 → 不误杀盒上仍可播的源。
- **成人过滤**：频道级硬词拦截，黄台不会出现在电视列表。
- **EPG**：本机 serve.py 后台缓存公网 EPG，电视/手机走局域网取（5.4s → 0.26s）。
