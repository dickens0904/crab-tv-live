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
- **判活看返回体**（2026-11-08）：HTTP 200 不等于有流。playlist 必须含 `#EXTM3U` / `#EXT-X-` / `#EXTINF`（master playlist 只有 `#EXT-X-STREAM-INF`，合法，不按分片数误杀）；直链复核 Content-Type 与 body 大小，JSON/HTML 错误页与空响应判假活立即剔除；gzip/deflate 压缩的合法 m3u8 会先解压再判。
- **发布闸门**（2026-11-08）：`export_merged()` 导出前对**每一条即将写入 merged.m3u 的 URL** 并发复检一次，只发布当场验证通过的；软失败（403/超时）仍保活发布以免误杀盒上可播的源；硬失败剔除并写回库，下轮不再导出。复检结论同步写回 `sources.db`（`last_online`/`last_seen`/`online_rate`），让陈旧标记不再被沿用。`status.json` 的 `gate` 字段记录本轮复检数 / 通过 / 软保活 / 剔除。
- **线路 1 优先验活源**（2026-11-08）：用户点开一个台默认播「线路 1」，若第一条是陈旧/软失败的源就会先转圈黑屏。现把闸门复检结果作为线路排序的**第一权重**（本轮验活 → 软保活 → 未知），再按窗口长度 / 清晰度 / 在线率 / 耗时排。实测线路 1 真实可用率 **81.5% → 88.0%**，timeout 占比 9.5% → 1.0%。
- **种子镜像链**（2026-11-08）：`raw.githubusercontent.com` 国内直连不通时依次回退 `gh-proxy.com` → `cdn.jsdelivr.net`（修正为 `@branch` 格式）→ `ghfast.top`。原实现的 jsDelivr 少了 `@`、ghfast 偶发整段不可达，导致 5 个大种子（约 1.2 万频道）每轮全丢。修好后实测 5/5 恢复。
- **成人过滤**：频道级硬词拦截，黄台不会出现在电视列表。
- **EPG**：本机 serve.py 后台缓存公网 EPG，电视/手机走局域网取（5.4s → 0.26s）。发布到 GitHub 时首行 `x-tvg-url` 会改写为公网地址，离开家庭网络也能取到节目单。

## 2026-11-08 有效性修复
此前 `upsert()` 的 UPDATE 参数顺序错位（`pid` 塞给 `name`、`logo` 塞给 `WHERE id=?`），
导致 **UPDATE 永远匹配 0 行**：每轮探测结论全部丢弃，库里 14476 行的 `last_seen`
停在 2026-10-24，死源清不掉、在线率与 soft_streak 从不更新。抽样实测
`last_seen=10-24` 的陈旧组真实可用率仅 **72.3%**，新鲜组 **89.2%**。
现修正参数顺序并加上判活收紧 + 发布闸门，形成「探测 → 写库 → 导出前复检 → 发布」
闭环。验证脚本：`probe_validity.py`（抽样测真实可用率）、`test_validity_fix.py`（库副本单测）。
