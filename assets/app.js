/* Radar doi thu — renderer song ngu (vi / zh)
   Du lieu: data/index.json -> danh sach tuan; data/<tuan>.json -> noi dung tuan.
   Moi item co "source" (youtube | facebook). Khai bao nguon trong SOURCES ben duoi. */

// metric: nhan cua con so "views" o moi nguon. minPaid: nguong toi thieu de gan "day media".
// YouTube: views = luot xem. Facebook: views = tong tuong tac (cam xuc + binh luan + chia se).
const SOURCES = {
  youtube:  { vi: 'YouTube',  zh: 'YouTube',  minPaid: 10000,
              metric: { vi: 'lượt xem', zh: '次播放' }, mshort: { vi: 'xem', zh: '播放' } },
  facebook: { vi: 'Facebook', zh: 'Facebook', minPaid: 1000,
              metric: { vi: 'tương tác', zh: '次互动' }, mshort: { vi: 'tương tác', zh: '互动' } }
};

const T = {
  vi: {
    title: 'Radar đối thủ',
    notes: 'Nhận định tuần này', compare: 'So sánh nhanh',
    latest: 'Nội dung mới nhất từng hãng', all: 'Tất cả',
    th_brand: 'Thương hiệu', th_7: '7 ngày', th_30: '30 ngày',
    th_fresh: 'Ngày từ bài mới', th_median: 'Trung vị', th_max: 'Cao nhất',
    fbpage: 'Fanpage',
    gallery: 'Thiết kế bài đăng Facebook', gallery_sub: 'Ảnh chụp thiết kế các bài đăng trong tuần của từng hãng, để tham khảo phong cách. Bấm vào ảnh để xem cỡ lớn.',
    open_post: 'Mở bài trên Facebook ↗', plat_all: 'Chung',
    th_paid: 'Dấu hiệu đẩy media',
    yes: 'có', no: 'không thấy',
    s7: 'bài trong 7 ngày', s30: 'bài trong 30 ngày',
    sfresh: 'ngày từ bài mới nhất', smed: 'trung vị',
    boost: 'có đẩy media', views: 'lượt xem', empty: 'Không có nội dung ở nguồn này.',
    sub: w => `Tuần ${w} · Samsung, Toshiba, LG, AQUA, Hisense`,
    ago: d => d === 0 ? 'hôm nay' : d === 1 ? 'hôm qua' :
          d < 7 ? `${d} ngày trước` : d < 30 ? `${Math.round(d / 7)} tuần trước` :
          d < 365 ? `${Math.round(d / 30)} tháng trước` : `${Math.round(d / 365)} năm trước`,
    f1: '<b>Cách đọc:</b> YouTube tính theo lượt xem; Facebook tính theo tổng tương tác (cảm xúc + bình luận + chia sẻ), vì Facebook không công khai lượt xem bài đăng. Hai con số này không so trực tiếp với nhau. "Dấu hiệu đẩy media" bật khi một bài cao gấp từ 10 lần trở lên so với trung vị của chính kênh đó trên cùng nền tảng (tối thiểu 10.000 lượt xem với YouTube, 1.000 tương tác với Facebook). Đây là suy luận, không phải số liệu chi tiêu thật.',
    f2: '<b>Giới hạn:</b> Số liệu là con số tại thời điểm lấy dữ liệu. Không bao gồm quảng cáo chỉ chạy trong luồng tin (dark post) mà không đăng lên trang. Facebook chỉ lấy 15 bài mới nhất mỗi trang, nên với hãng đăng dày, cột 30 ngày có thể thấp hơn thực tế.',
    f3: '<b>Cập nhật:</b> tự động vào 9:00 sáng thứ Hai hằng tuần.'
  },
  zh: {
    title: '竞品雷达',
    notes: '本周观察', compare: '快速对比',
    latest: '各品牌最新内容', all: '全部',
    th_brand: '品牌', th_7: '7 天', th_30: '30 天',
    th_fresh: '距最新内容', th_median: '中位数', th_max: '最高',
    fbpage: '粉丝页',
    gallery: 'Facebook 帖子设计', gallery_sub: '各品牌本周帖子的设计截图，供参考风格。点击图片查看大图。',
    open_post: '在 Facebook 打开帖子 ↗', plat_all: '综合',
    th_paid: '媒体投放迹象',
    yes: '有', no: '未发现',
    s7: '条 / 7 天', s30: '条 / 30 天',
    sfresh: '天前最新一条', smed: '中位数',
    boost: '疑似投放', views: '次播放', empty: '该来源暂无内容。',
    sub: w => `${w} 当周 · 三星、东芝、LG、AQUA、海信`,
    ago: d => d === 0 ? '今天' : d === 1 ? '昨天' :
          d < 7 ? `${d} 天前` : d < 30 ? `${Math.round(d / 7)} 周前` :
          d < 365 ? `${Math.round(d / 30)} 个月前` : `${Math.round(d / 365)} 年前`,
    f1: '<b>读法：</b>YouTube 按播放量计；Facebook 按总互动（表情 + 评论 + 分享）计，因为 Facebook 不公开帖子播放量。两者不可直接比较。当某条内容达到同一平台上该频道中位数的 10 倍或以上时（YouTube 至少 1 万次播放，Facebook 至少 1,000 次互动），标记为「媒体投放迹象」。这是推断，并非真实投放数据。',
    f2: '<b>局限：</b>数据为抓取时点的数值，不包含仅在信息流中投放、未发布到主页的广告（暗帖）。Facebook 每页仅抓取最新 15 条，发帖频繁的品牌其 30 天数据可能偏低。',
    f3: '<b>更新：</b>每周一上午 9:00 自动更新。'
  }
};

const COLOR = { Samsung:'#2f6fe4', Toshiba:'#e4392f', LG:'#b4365c',
                AQUA:'#1aa6b7', Hisense:'#3c9e4a', TCL:'#f0a020' };

let lang = 'vi', src = 'all', week = null, DATA = null;
const $ = s => document.querySelector(s);
const esc = s => String(s).replace(/[&<>"]/g, c =>
  ({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;' }[c]));

const fmt = n => n >= 1e6 ? (n / 1e6).toFixed(1).replace('.0','') + 'M'
               : n >= 1e3 ? Math.round(n / 1e3) + 'K' : String(n);
const median = a => { if (!a.length) return 0;
  const s = [...a].sort((x, y) => x - y), m = s.length >> 1;
  return s.length % 2 ? s[m] : Math.round((s[m - 1] + s[m]) / 2); };

function titleOf(it) { return (lang === 'zh' && it.title_zh) ? it.title_zh : it.title; }
function thumbOf(it) {
  if (it.image) return it.image;
  if (it.source === 'youtube') return `https://i.ytimg.com/vi/${it.id}/hqdefault.jpg`;
  return null;
}
function linkOf(it) {
  if (it.url) return it.url;
  if (it.source === 'youtube') return `https://youtu.be/${it.id}`;
  return '#';
}

function statsOf(items) {
  // Moi nguon tinh rieng: luot xem YouTube va tuong tac Facebook khong cung thuoc do.
  const bySrc = {};
  items.forEach(i => { (bySrc[i.source] = bySrc[i.source] || []).push(i); });
  const per = {}, paid = new Set();
  Object.keys(SOURCES).filter(k => bySrc[k]).forEach(k => {
    const arr = bySrc[k], vals = arr.map(i => i.views || 0), med = median(vals);
    arr.forEach(i => { if (med && (i.views || 0) >= Math.max(10 * med, SOURCES[k].minPaid))
                         paid.add(k + ':' + i.id); });
    per[k] = { med, max: Math.max(...vals) };
  });
  return {
    n7: items.filter(i => i.days <= 7).length,
    n30: items.filter(i => i.days <= 30).length,
    fresh: items.length ? Math.min(...items.map(i => i.days)) : null,
    per, paid
  };
}

// Hien trung vi / cao nhat theo tung nguon, kem don vi (xem / tuong tac).
function perCell(st, key) {
  const ks = Object.keys(st.per);
  if (!ks.length) return '—';
  return ks.map(k => `<span class="pm">${fmt(st.per[k][key])}` +
    `<small> ${esc(SOURCES[k].mshort[lang])}</small></span>`).join('<br>');
}

function visible(b) {
  return src === 'all' ? b.items : b.items.filter(i => i.source === src);
}

function render() {
  const t = T[lang];
  document.documentElement.lang = lang === 'zh' ? 'zh-CN' : 'vi';
  document.body.dataset.lang = lang;
  document.querySelectorAll('[data-t]').forEach(el => { el.textContent = t[el.dataset.t]; });
  $('#sub').textContent = t.sub(week);
  ['f1','f2','f3'].forEach(k => { $('#' + k).innerHTML = t[k]; });

  // nguon
  const present = new Set(DATA.brands.flatMap(b => b.items.map(i => i.source)));
  $('#srcSeg').innerHTML =
    [['all', t.all]].concat(Object.keys(SOURCES).map(k => [k, SOURCES[k][lang]]))
      .map(([k, label]) => {
        const off = k !== 'all' && !present.has(k);
        return `<button data-src="${k}"${off ? ' disabled' : ''}` +
               `${k === src ? ' class="on"' : ''}>${esc(label)}</button>`;
      }).join('');

  // nhan dinh
  // Nhan dinh theo tab: tab YouTube chi hien nhan dinh YouTube, tab Facebook chi hien Facebook,
  // tab Tat ca hien het kem nhan nen tang. Nhan dinh khong co "source" la nhan dinh chung.
  const notes = (DATA.notes || []).filter(n => src === 'all' || !n.source || n.source === src);
  $('#notes').innerHTML = notes.map(n => {
    const tag = src === 'all' ? `<span class="ntag">${esc(n.source ? SOURCES[n.source][lang] : t.plat_all)}</span>` : '';
    return `<div class="note${n.source ? ' n-' + n.source : ''}"><h3>${tag}${esc(n.title[lang] || n.title.vi)}</h3>
     <p>${esc(n.body[lang] || n.body.vi)}</p></div>`; }).join('');

  renderGallery(t);

  // bang so sanh
  const rows = DATA.brands.map(b => ({ b, items: visible(b), st: statsOf(visible(b)) }))
    .sort((x, y) => y.st.n30 - x.st.n30 || (x.st.fresh ?? 999) - (y.st.fresh ?? 999));
  $('#tbl tbody').innerHTML = rows.map(({ b, st }) => `<tr>
    <td><span class="dot" style="--c:${COLOR[b.brand] || '#888'}"></span>${esc(b.brand)}</td>
    <td class="num">${st.n7}</td><td class="num">${st.n30}</td>
    <td class="num">${st.fresh ?? '—'}</td><td class="num">${perCell(st, 'med')}</td>
    <td class="num">${perCell(st, 'max')}</td>
    <td>${st.paid.size ? `<span class="tag">${t.yes}</span>`
                       : `<span class="tag off">${t.no}</span>`}</td></tr>`).join('');

  // khoi tung hang
  $('#brands').innerHTML = rows.map(({ b, items, st }) => {
    const c = COLOR[b.brand] || '#888';
    const chs = Object.keys(SOURCES).filter(k => b.channels[k] && (src === 'all' || src === k))
      .map(k => { const ch = b.channels[k];
        const nm = (lang === 'zh' && ch.name_zh) ? ch.name_zh : (ch.name || SOURCES[k][lang]);
        return `<a class="src" href="${esc(ch.url)}" target="_blank" rel="noopener">${esc(SOURCES[k][lang])}: ${esc(nm)} ↗</a>`; })
      .join('');
    const tiles = items.slice().sort((x, y) => x.days - y.days).slice(0, src === 'all' ? 8 : 6).map(it => {
      const S = SOURCES[it.source] || SOURCES.youtube;
      const isVideo = it.source === 'youtube' || it.type === 'video' || it.type === 'reel';
      const th = thumbOf(it);
      return `<a class="v" href="${esc(linkOf(it))}" target="_blank" rel="noopener">
        <div class="thumb${th ? '' : ' noimg'}" style="--c:${c}">
          ${th ? `<img loading="lazy" src="${esc(th)}" alt=""
               onerror="this.closest('.thumb').classList.add('noimg')">` : ''}
          ${isVideo ? '<span class="play">▶</span>' : ''}
          ${it.len ? `<span class="len">${esc(it.len)}</span>` : ''}
          ${src === 'all' ? `<span class="badge">${esc(SOURCES[it.source]?.[lang] || it.source)}</span>` : ''}
          ${st.paid.has(it.source + ':' + it.id) ? `<span class="boost">${t.boost}</span>` : ''}
        </div>
        <div class="vt">${esc(titleOf(it))}</div>
        <div class="vm">${t.ago(it.days)} · ${fmt(it.views || 0)} ${esc(S.metric[lang])}</div></a>`;
    }).join('');
    return `<section class="brand" style="--c:${c}">
      <header><h2><span class="dot" style="--c:${c}"></span>${esc(b.brand)}</h2>
      <div class="srcs">${chs}</div></header>
      <div class="stats">
        <div><b>${st.n7}</b><span>${t.s7}</span></div>
        <div><b>${st.n30}</b><span>${t.s30}</span></div>
        <div><b>${st.fresh ?? '—'}</b><span>${t.sfresh}</span></div>
        <div><b>${perCell(st, 'med')}</b><span>${t.smed}</span></div>
      </div>
      ${items.length ? `<div class="grid">${tiles}</div>`
                     : `<div class="empty">${t.empty}</div>`}</section>`;
  }).join('');
}

// Thu vien thiet ke Facebook: moi hang mot hang anh, bam de phong to.
function renderGallery(t) {
  const wrap = $('#galleryWrap');
  const groups = DATA.brands.map(b => ({ b, items: b.items
      .filter(i => i.source === 'facebook' && i.image).sort((x, y) => x.days - y.days) }))
    .filter(g => g.items.length);
  wrap.hidden = !(src === 'facebook' && groups.length);
  if (wrap.hidden) return;
  $('#gallery').innerHTML = groups.map(({ b, items }) => {
    const c = COLOR[b.brand] || '#888', st = statsOf(b.items.filter(i => i.source === 'facebook'));
    return `<div class="gbrand" style="--c:${c}">
      <h3><span class="dot" style="--c:${c}"></span>${esc(b.brand)} <small>${items.length}</small></h3>
      <div class="gstrip">${items.map(it => `
        <figure class="gcard" data-brand="${esc(b.brand)}" data-id="${esc(it.id)}">
          <div class="gimg"><img loading="lazy" src="${esc(it.image)}" alt="">
            ${st.paid.has('facebook:' + it.id) ? `<span class="boost">${t.boost}</span>` : ''}
            ${it.type !== 'post' ? '<span class="gplay">▶</span>' : ''}</div>
          <figcaption><span class="gt">${esc(titleOf(it))}</span>
            <span class="vm">${t.ago(it.days)} · ${fmt(it.views || 0)} ${esc(SOURCES.facebook.metric[lang])}</span></figcaption>
        </figure>`).join('')}</div></div>`;
  }).join('');
}

function openLB(brand, id) {
  const b = DATA.brands.find(x => x.brand === brand); if (!b) return;
  const it = b.items.find(x => x.id === id); if (!it) return;
  const t = T[lang], lb = $('#lb');
  lb.querySelector('img').src = it.image;
  lb.querySelector('.lbcap').innerHTML =
    `<b>${esc(brand)}</b> · ${esc(titleOf(it))}<br><span class="vm">${t.ago(it.days)} · ` +
    `${fmt(it.views || 0)} ${esc(SOURCES.facebook.metric[lang])}` +
    (it.reactions != null ? ` (${fmt(it.reactions)} 👍 · ${fmt(it.comments || 0)} 💬 · ${fmt(it.shares || 0)} ↗)` : '') +
    `</span> · <a href="${esc(linkOf(it))}" target="_blank" rel="noopener">${t.open_post}</a>`;
  lb.hidden = false;
}

async function loadWeek(w) {
  DATA = await (await fetch(`data/${w}.json`)).json();
  week = w;
  render();
}

function setLang(l) {
  lang = l;
  try { localStorage.setItem('radar_lang', l); } catch (e) {}
  document.querySelectorAll('#langSeg button')
    .forEach(b => b.classList.toggle('on', b.dataset.lang === l));
  if (DATA) render();
}

(async function init() {
  try { const s = localStorage.getItem('radar_lang'); if (s === 'vi' || s === 'zh') lang = s; }
  catch (e) {}
  if (location.hash === '#zh') lang = 'zh';

  document.querySelectorAll('#langSeg button')
    .forEach(b => b.addEventListener('click', () => setLang(b.dataset.lang)));
  $('#srcSeg').addEventListener('click', ev => {
    const b = ev.target.closest('button[data-src]');
    if (!b || b.disabled) return;
    src = b.dataset.src; render();
  });
  $('#weekSel').addEventListener('change', ev => loadWeek(ev.target.value));
  $('#gallery').addEventListener('click', ev => {
    const f = ev.target.closest('.gcard'); if (f) openLB(f.dataset.brand, f.dataset.id);
  });
  $('#lb').addEventListener('click', ev => {
    if (ev.target.id === 'lb' || ev.target.closest('.lbx')) $('#lb').hidden = true;
  });
  document.addEventListener('keydown', ev => { if (ev.key === 'Escape') $('#lb').hidden = true; });

  setLang(lang);
  const idx = await (await fetch('data/index.json')).json();
  const weeks = idx.weeks.slice().sort().reverse();
  $('#weekSel').innerHTML = weeks.map(w => `<option value="${w}">${w}</option>`).join('');
  $('#weekSel').style.display = weeks.length > 1 ? '' : 'none';
  await loadWeek(weeks[0]);
})();
