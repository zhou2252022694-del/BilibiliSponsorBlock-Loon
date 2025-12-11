// ==UserScript==
// @name              Bilibili SponsorBlock for Loon
// @description       Loon脚本：自动调用 SponsorBlock API 过滤 B站剧集分段中的广告、片头、片尾区间
// @version           1.0.0
// @author            hanydd/GitHub Copilot Chat Assistant整合
// @compatible        Loon, Surge, QuanX
// ==/UserScript==

const SB_API = "https://bsbsb.top/api/skipSegments?videoID=";
const BV_KEY = "bvid";
const SECTION_KEY = "sections";

(async () => {
  try {
    let body = $response.body;
    let obj = JSON.parse(body);

    let bvid = obj.data?.[BV_KEY] || obj.data?.bvid;
    if (!bvid && obj.data?.aid) {
      // 这里可补充aid转bvid
    }
    if (!bvid) return $done({body});

    let sbrsp = await new Promise(res =>
      $httpClient.get({url: SB_API + encodeURIComponent(bvid)}, (err, resp, data) =>
        !err && resp.status === 200 ? res(data) : res(null)
      )
    );
    if (!sbrsp) return $done({body});

    let sbList = [];
    try { sbList = JSON.parse(sbrsp); } catch (e) {}

    let sponsorSegments = sbList.map(i => i.segment).filter(x => x && x.length===2);

    let arr = obj.data?.[SECTION_KEY];
    if (Array.isArray(arr) && sponsorSegments.length > 0) {
      obj.data[SECTION_KEY] = arr.filter(section => {
        let st = Number(section.start_time || section.from || section.start || 0);
        let et = Number(section.end_time || section.to || section.end || 0);
        if (et <= st) return true;
        for (let [s, e] of sponsorSegments) {
          if (Math.max(st, s) < Math.min(et, e)) return false;
        }
        return true;
      });
    }
    $done({body: JSON.stringify(obj)});
  } catch (e) {
    $done({});
  }
})();
