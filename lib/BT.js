// 两个BT (bttwo.me / bttwoo.com) 新版前端
// 旧前端已废弃: bttwo.net 301 自循环, 播放地址改由 WASM 本地签名
// 签名算法已逆向: s = HMAC_SHA256(key=v, msg="p:t:v") 取前 32 位; k = base64(userlink XOR "nbmovie2024secretkey")
var BT_UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36';
var BT_PAD = 'nbmovie2024secretkey';

var rule = {
    title: '两个BT',
    host: 'https://www.bttwo.me',
    homeUrl: '/filter',
    url: '/filter?page=fypage&classify=fyclass',
    detailUrl: '/play/fyid',
    searchUrl: '/search?q=**&page=fypage',
    searchable: 2,
    quickSearch: 0,
    headers: { 'User-Agent': BT_UA },
    timeout: 20000,
    class_name: '全部&电影&电视剧&动漫&综艺',
    class_url: '0&1&2&3&4',
    play_parse: true,
    limit: 6,
    推荐: '*',
    一级: 'js:var _pg=(typeof MY_PAGE!=="undefined"&&MY_PAGE)?MY_PAGE:1;var _u="";if(TYPE==="search"){_u=rule.host+"/search?q="+encodeURIComponent(KEY)+"&page="+_pg}else if(TYPE==="cate"){_u=rule.host+"/filter?page="+_pg+(MY_CATE&&String(MY_CATE)!=="0"?"&classify="+MY_CATE:"")}else{_u=rule.host+"/filter"}VODS=rule.pickList(request(_u))',
    二级: 'js:VOD=rule.parseDetail(request(input),input)',
    搜索: '*',
    lazy: 'js:var _v="",_p="";if(input&&input.indexOf("|")>-1){var _a=input.split("|");_v=_a[0];_p=_a[1]}else{_v=MY_URL.split("/play/").pop();_p=""}var _r=rule.playReal(_v,_p);if(_r){input={parse:0,url:_r,header:{"User-Agent":rule.ua,"Referer":rule.host+"/"}}}else{input={parse:1,url:MY_URL}}'
};

rule.ua = BT_UA;

// ---------- 工具 ----------
rule.dec = function (s) {
    if (!s) return '';
    return s.replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&nbsp;/g, ' ').replace(/\s+/g, ' ').trim();
};

// UTF-8 字节
rule.utf8 = function (s) {
    var b = [];
    for (var i = 0; i < s.length; i++) {
        var c = s.charCodeAt(i);
        if (c < 128) b.push(c);
        else if (c < 2048) b.push(192 | (c >> 6), 128 | (c & 63));
        else b.push(224 | (c >> 12), 128 | ((c >> 6) & 63), 128 | (c & 63));
    }
    return b;
};

// base64 (标准, 带 = 填充)
rule.b64 = function (bytes) {
    var T = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
    var o = '', i = 0;
    for (; i + 2 < bytes.length; i += 3) {
        var n = (bytes[i] << 16) | (bytes[i + 1] << 8) | bytes[i + 2];
        o += T[(n >> 18) & 63] + T[(n >> 12) & 63] + T[(n >> 6) & 63] + T[n & 63];
    }
    var r = bytes.length - i;
    if (r === 1) { var n1 = bytes[i] << 16; o += T[(n1 >> 18) & 63] + T[(n1 >> 12) & 63] + '=='; }
    else if (r === 2) { var n2 = (bytes[i] << 16) | (bytes[i + 1] << 8); o += T[(n2 >> 18) & 63] + T[(n2 >> 12) & 63] + T[(n2 >> 6) & 63] + '='; }
    return o;
};

// SHA-256 (输入字节数组, 输出 32 字节数组)
rule.sha256 = function (msg) {
    var K = [0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5, 0x3956c25b, 0x59f111f1, 0x923f82a4, 0xab1c5ed5,
        0xd807aa98, 0x12835b01, 0x243185be, 0x550c7dc3, 0x72be5d74, 0x80deb1fe, 0x9bdc06a7, 0xc19bf174,
        0xe49b69c1, 0xefbe4786, 0x0fc19dc6, 0x240ca1cc, 0x2de92c6f, 0x4a7484aa, 0x5cb0a9dc, 0x76f988da,
        0x983e5152, 0xa831c66d, 0xb00327c8, 0xbf597fc7, 0xc6e00bf3, 0xd5a79147, 0x06ca6351, 0x14292967,
        0x27b70a85, 0x2e1b2138, 0x4d2c6dfc, 0x53380d13, 0x650a7354, 0x766a0abb, 0x81c2c92e, 0x92722c85,
        0xa2bfe8a1, 0xa81a664b, 0xc24b8b70, 0xc76c51a3, 0xd192e819, 0xd6990624, 0xf40e3585, 0x106aa070,
        0x19a4c116, 0x1e376c08, 0x2748774c, 0x34b0bcb5, 0x391c0cb3, 0x4ed8aa4a, 0x5b9cca4f, 0x682e6ff3,
        0x748f82ee, 0x78a5636f, 0x84c87814, 0x8cc70208, 0x90befffa, 0xa4506ceb, 0xbef9a3f7, 0xc67178f2];
    var H = [0x6a09e667, 0xbb67ae85, 0x3c6ef372, 0xa54ff53a, 0x510e527f, 0x9b05688c, 0x1f83d9ab, 0x5be0cd19];
    var b = msg.slice(0), l = b.length;
    b.push(0x80);
    while (b.length % 64 !== 56) b.push(0);
    var bits = l * 8;
    b.push(0, 0, 0, 0, (bits >>> 24) & 255, (bits >>> 16) & 255, (bits >>> 8) & 255, bits & 255);
    var w = new Array(64), i, j;
    for (var off = 0; off < b.length; off += 64) {
        for (i = 0; i < 16; i++) w[i] = (b[off + i * 4] << 24) | (b[off + i * 4 + 1] << 16) | (b[off + i * 4 + 2] << 8) | b[off + i * 4 + 3];
        for (i = 16; i < 64; i++) {
            var x = w[i - 15], y = w[i - 2];
            var s0 = ((x >>> 7) | (x << 25)) ^ ((x >>> 18) | (x << 14)) ^ (x >>> 3);
            var s1 = ((y >>> 17) | (y << 15)) ^ ((y >>> 19) | (y << 13)) ^ (y >>> 10);
            w[i] = (w[i - 16] + s0 + w[i - 7] + s1) | 0;
        }
        var a = H[0], bb = H[1], c = H[2], d = H[3], e = H[4], f = H[5], g = H[6], h = H[7];
        for (i = 0; i < 64; i++) {
            var S1 = ((e >>> 6) | (e << 26)) ^ ((e >>> 11) | (e << 21)) ^ ((e >>> 25) | (e << 7));
            var ch = (e & f) ^ (~e & g);
            var t1 = (h + S1 + ch + K[i] + w[i]) | 0;
            var S0 = ((a >>> 2) | (a << 30)) ^ ((a >>> 13) | (a << 19)) ^ ((a >>> 22) | (a << 10));
            var mj = (a & bb) ^ (a & c) ^ (bb & c);
            var t2 = (S0 + mj) | 0;
            h = g; g = f; f = e; e = (d + t1) | 0; d = c; c = bb; bb = a; a = (t1 + t2) | 0;
        }
        H[0] = (H[0] + a) | 0; H[1] = (H[1] + bb) | 0; H[2] = (H[2] + c) | 0; H[3] = (H[3] + d) | 0;
        H[4] = (H[4] + e) | 0; H[5] = (H[5] + f) | 0; H[6] = (H[6] + g) | 0; H[7] = (H[7] + h) | 0;
    }
    var out = [];
    for (j = 0; j < 8; j++) { out.push((H[j] >>> 24) & 255, (H[j] >>> 16) & 255, (H[j] >>> 8) & 255, H[j] & 255); }
    return out;
};

// HMAC-SHA256 -> hex 小写
rule.hmac = function (key, msg) {
    var k = rule.utf8(key);
    if (k.length > 64) k = rule.sha256(k);
    while (k.length < 64) k.push(0);
    var ip = [], op = [], i;
    for (i = 0; i < 64; i++) { ip.push(k[i] ^ 0x36); op.push(k[i] ^ 0x5c); }
    var inner = rule.sha256(ip.concat(rule.utf8(msg)));
    var outer = rule.sha256(op.concat(inner));
    var hx = '';
    for (i = 0; i < outer.length; i++) hx += (outer[i] < 16 ? '0' : '') + outer[i].toString(16);
    return hx;
};

rule.xor64 = function (pk) {
    if (!pk || pk === '0') return '0';
    var bytes = [];
    for (var i = 0; i < pk.length; i++) bytes.push(pk.charCodeAt(i) ^ BT_PAD.charCodeAt(i % BT_PAD.length));
    return rule.b64(bytes);
};

// ---------- 列表 ----------
rule.pickList = function (html) {
    var out = [], seen = {};
    if (!html) return out;
    var re = /href="\/play\/([a-z0-9]{4,})"([\s\S]{0,1600})/g, m;
    while ((m = re.exec(html)) !== null) {
        var id = m[1];
        if (seen[id]) continue;
        var seg = m[2];
        var im = seg.match(/<img[^>]*>/);
        if (!im) continue;
        var tag = im[0];
        var pic = (tag.match(/data-src="([^"]+)"/) || tag.match(/src="([^"]+)"/) || ['', ''])[1];
        var name = (tag.match(/alt="([^"]*)"/) || ['', ''])[1];
        if (!name) {
            var h = seg.match(/<h3[^>]*>([\s\S]{0,150}?)<\/h3>/);
            if (h) name = h[1].replace(/<[^>]+>/g, '');
        }
        name = rule.dec(name);
        if (!name) continue;
        seen[id] = 1;
        var yr = seg.match(/top-2 left-2[^>]*>\s*(\d{4})\s*</);
        var rm = (seg.match(/top-2 right-2[^>]*>\s*([^<]{1,8})\s*</) || ['', ''])[1];
        out.push({
            vod_id: id,
            vod_name: name,
            vod_pic: pic.replace(/&amp;/g, '&'),
            vod_remarks: rm ? rm.trim() : (yr ? yr[1] : ''),
            vod_year: yr ? yr[1] : ''
        });
        if (out.length >= 60) break;
    }
    return out;
};

// ---------- 详情 ----------
rule.parseDetail = function (html, url) {
    var v = { vod_id: '', vod_name: '', vod_pic: '', vod_content: '', vod_play_from: '', vod_play_url: '', vod_year: '', vod_area: '', vod_actor: '', vod_director: '', type_name: '', vod_remarks: '' };
    if (!html) return v;
    var vid = (url.match(/\/play\/([a-z0-9]+)/) || ['', ''])[1];
    v.vod_id = vid;

    var t = html.match(/<meta property="og:title" content="([^"]*)"/) || html.match(/<title>([^<]*)<\/title>/);
    if (t) v.vod_name = rule.dec(t[1]).split(' - ')[0].replace(/第\d+集$/, '').trim();

    var p = html.match(/<meta property="og:image" content="([^"]*)"/);
    if (p) v.vod_pic = p[1].replace(/&amp;/g, '&');

    var kw = html.match(/<meta name="keywords" content="([^"]*)"/);
    if (kw) {
        var parts = kw[1].split(',');
        for (var i = 0; i < parts.length; i++) if (/^(19|20)\d{2}$/.test(parts[i])) v.vod_year = parts[i];
    }

    // 属性表: <div class="col-span-1 text-gray-500">导演</div><div class="col-span-2 text-gray-300">xxx</div>
    var kvRe = /col-span-1[^>]*>\s*([^<]{1,10})\s*<\/div>\s*<div class="col-span-2[^"]*">\s*([\s\S]{0,200}?)\s*<\/div>/g, km;
    var descLines = [];
    while ((km = kvRe.exec(html)) !== null) {
        var k = rule.dec(km[1]), val = rule.dec(km[2].replace(/<[^>]+>/g, ' '));
        if (!val) continue;
        if (k.indexOf('导演') > -1) v.vod_director = val;
        else if (k.indexOf('主演') > -1) v.vod_actor = val;
        else if (k.indexOf('地区') > -1) v.vod_area = val;
        else if (k.indexOf('类型') > -1) v.type_name = val;
        if (descLines.length < 8) descLines.push(k + ': ' + val);
    }
    var md = html.match(/<meta name="description" content="([^"]*)"/);
    var intro = md ? rule.dec(md[1]) : '';
    v.vod_content = descLines.join('  ') + (intro ? '\n简介: ' + intro : '');

    // 线路名
    var lineNames = [];
    var em = html.match(/episodeManager\(\s*\d+\s*,\s*\d+\s*,\s*(\[[\s\S]*?\])\s*\)/);
    if (em) {
        try {
            var arr = JSON.parse(em[1].replace(/'/g, '"'));
            for (var j = 0; j < arr.length; j++) lineNames.push(arr[j].lineName || ('线路' + (j + 1)));
        } catch (e) { }
    }

    // 剧集: href=/play/xxx ... data-line data-episode dataid
    var epRe = /href="\/play\/([a-z0-9]+)"[^>]*?data-line="(\d+)"[^>]*?data-episode="(\d+)"[^>]*?dataid="(\d+)"/g, em2;
    var lines = {}, seenEp = {};
    while ((em2 = epRe.exec(html)) !== null) {
        var hvid = em2[1], ln = parseInt(em2[2]), ep = parseInt(em2[3]), did = em2[4];
        if (!vid) vid = hvid, v.vod_id = hvid;
        var sig = ln + '-' + did;
        if (seenEp[sig]) continue;
        seenEp[sig] = 1;
        if (!lines[ln]) lines[ln] = [];
        lines[ln].push({ ep: ep, did: did });
    }

    var fl = [], fu = [];
    var lineKeys = Object.keys(lines);
    for (var ki = 0; ki < lineKeys.length; ki++) {
        var k2 = lineKeys[ki];
        var eps = lines[k2];
        if (!eps || !eps.length) continue;
        eps.sort(function (a, b) { return a.ep - b.ep; });
        var items = [];
        for (var n = 0; n < eps.length; n++) items.push('第' + eps[n].ep + '集$' + (vid || hvid) + '|' + eps[n].did);
        fl.push(lineNames[parseInt(k2) - 1] || ('线路' + k2));
        fu.push(items.join('#'));
    }
    if (fl.length === 0) {
        // 单集页面(电影)兜底
        fl.push('正片');
        fu.push('正片$' + vid + '|');
    }
    v.vod_play_from = fl.join('$$$');
    v.vod_play_url = fu.join('$$$');
    v.vod_remarks = v.vod_year || '';
    return v;
};

// ---------- 播放 ----------
rule.playReal = function (vid, dataid) {
    try {
        if (!dataid) {
            var h0 = request(rule.host + '/play/' + vid);
            var d0 = h0.match(/dataid="(\d+)"/);
            if (d0) dataid = d0[1];
        }
        if (!dataid) return '';
        var html = request(rule.host + '/play/' + vid);
        var ul = (html.match(/userlink:'([^']*)'/) || ['', '0'])[1] || '0';
        var t = String(new Date().getTime());
        var s = rule.hmac(vid, dataid + ':' + t + ':' + vid).substr(0, 32);
        var k = rule.xor64(ul);
        var api = rule.host + '/video/play?p=' + dataid + '&v=' + vid + '&q=1080&s=' + s + '&t=' + t + '&k=' + encodeURIComponent(k);
        var body = request(api, { headers: { 'User-Agent': BT_UA, 'Referer': rule.host + '/play/' + vid } });
        var jo = JSON.parse(body);
        if (!jo || !jo.data || !jo.data.quality_urls) return '';
        var qs = jo.data.quality_urls, best = '';
        for (var i = 0; i < qs.length; i++) {
            var q = qs[i];
            if (!q || !q.url || q.url.indexOf('http') !== 0) continue;
            if (q.locked) continue;
            if (!best) best = q.url;
            if (q.bitrate == 1080) { best = q.url; break; }
        }
        return best || '';
    } catch (e) {
        return '';
    }
};

// 兼容: 部分版本用 rule.lazy 字符串直接取 input
if (typeof module !== 'undefined' && module.exports) module.exports = rule;
