// Lay bai dang tu mot fanpage Facebook. Chay trong trinh duyet DA DANG NHAP Facebook.
// Dung duoc voi giao dien tieng Viet va tieng Anh.
// Tra ve: {page, loggedOut, posts:[{id,url,type,text,reactions,comments,shares,interactions,days,date,img}]}
//
// Ghi chu ky thuat (giao dien Facebook 11/2026):
// - Moi bai la mot khoi [aria-posinset]; Facebook chi dung khoi khi cuon toi, nen phai xu ly trong luc cuon.
// - Chu trong phan dau bai bi xao tron chong scraping; ngay dang va link bai chi hien khi re chuot
//   vao moc thoi gian (tooltip + href). Script gia lap re chuot de doc.
// - So tuong tac nam trong aria-label cua cac nut "Binh luan ..., N binh luan" / "Chia se ..., N luot chia se".
async function grabFB(max) {
  const sleep = ms => new Promise(r => setTimeout(r, ms));
  const num = s => {                       // "1,2K" "1.2K" "2 N" "3,4 Tr" "1M" "15"
    if (!s) return 0;
    const m = String(s).replace(/ /g, ' ').match(/([\d.,]+)\s*(K|N|M|Tr|triệu|nghìn|B)?/i);
    if (!m) return 0;
    let v = m[1], u = (m[2] || '').toLowerCase();
    v = u ? v.replace(',', '.') : v.replace(/[.,]/g, '');
    v = parseFloat(v) || 0;
    if (u === 'k' || u === 'n' || u === 'nghìn') v *= 1e3;
    if (u === 'm' || u === 'tr' || u === 'triệu') v *= 1e6;
    if (u === 'b') v *= 1e9;
    return Math.round(v);
  };
  const MONTHS = { january:1,february:2,march:3,april:4,may:5,june:6,july:7,august:8,
                   september:9,october:10,november:11,december:12 };
  const parseDate = s => {                 // "Thứ Hai, 23 Tháng 11, 2026 lúc 11:03" | "Monday 23 November 2026 at 11:03" | "Monday, November 23, 2026 at 11:03 AM"
    if (!s) return null; let m;
    if ((m = s.match(/(\d{1,2}) [Tt]háng (\d{1,2}),? (\d{4})/))) return new Date(+m[3], +m[2] - 1, +m[1]);
    if ((m = s.match(/(\d{1,2}) ([A-Za-z]+),? (\d{4})/)) && MONTHS[m[2].toLowerCase()]) return new Date(+m[3], MONTHS[m[2].toLowerCase()] - 1, +m[1]);
    if ((m = s.match(/([A-Za-z]+) (\d{1,2}),? (\d{4})/)) && MONTHS[m[1].toLowerCase()]) return new Date(+m[3], MONTHS[m[1].toLowerCase()] - 1, +m[2]);
    return null;
  };
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const iso = d => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

  const loggedOut = !!document.querySelector('form[action*="login"]') ||
                    /^(Log in to Facebook|Đăng nhập Facebook)/m.test(document.body.innerText.slice(0, 500));

  const hover = async a => {
    const fire = (T, t) => a.dispatchEvent(new T(t, { bubbles: true }));
    fire(PointerEvent, 'pointerover'); fire(MouseEvent, 'mouseover'); fire(MouseEvent, 'mouseenter');
    fire(FocusEvent, 'focus'); fire(FocusEvent, 'focusin');
    let tip = null;
    for (let i = 0; i < 12 && !tip; i++) {
      await sleep(250);
      const t = [...document.querySelectorAll('[role=tooltip]')].map(x => x.innerText.trim()).find(Boolean);
      if (t && parseDate(t)) tip = t;
    }
    fire(PointerEvent, 'pointerout'); fire(MouseEvent, 'mouseout'); fire(MouseEvent, 'mouseleave');
    fire(FocusEvent, 'blur'); fire(FocusEvent, 'focusout');
    await sleep(150);
    return tip;
  };

  const done = new WeakSet(), seen = new Set(), posts = [];
  const handle = async p => {
    done.add(p);
    // nut "Xem them" trong phan noi dung
    const msgEl = p.querySelector('[data-ad-rendering-role="story_message"], [data-ad-preview="message"], [data-ad-comet-preview="message"]');
    if (msgEl) {
      const more = [...msgEl.querySelectorAll('div[role=button]')].find(b => /^(Xem thêm|See more)$/.test(b.innerText.trim()));
      if (more) { more.click(); await sleep(400); }
    }
    // moc thoi gian: link dau tien trong phan dau bai, href chua san (chi co khi re chuot)
    const msgTop = msgEl ? msgEl.getBoundingClientRect().top : Infinity;
    const cands = [...p.querySelectorAll('a[role=link], a')].filter(a => {
      const h = a.getAttribute('href') || '';
      return (h.startsWith('?') || h.startsWith('#') || /\/(posts|videos|reel)\/|story_fbid|permalink/.test(h)) &&
             !/comment_id=/.test(h) && a.getBoundingClientRect().top <= msgTop && !(msgEl && msgEl.contains(a));
    });
    let href = '', date = null;
    for (const a of cands.slice(0, 3)) {
      const tip = await hover(a);
      const h = a.getAttribute('href') || '';
      if (/\/(posts|videos|reel)\/|story_fbid|fbid=|permalink/.test(h)) { href = h; date = parseDate(tip || a.getAttribute('aria-label')); break; }
    }
    if (!href) {   // du phong: lay link bai tu link binh luan / anh
      const h = [...p.querySelectorAll('a[href]')].map(a => a.href)
        .find(h => /\/(posts|videos|reel)\//.test(h)) || [...p.querySelectorAll('a[href]')].map(a => a.href).find(h => /fbid=/.test(h));
      if (h) href = h;
    }
    if (!href) return;
    const id = (href.match(/\/posts\/(\w+)/) || href.match(/\/(?:videos|reel)\/(\d+)/) ||
                href.match(/story_fbid=(\w+)/) || href.match(/fbid=(\d+)/) || [])[1];
    if (!id || seen.has(id)) return;
    seen.add(id);
    const abs = new URL(href, location.href);
    let url = abs.origin + abs.pathname;
    if (/story_fbid|fbid=/.test(href) && !/\/(posts|videos|reel)\//.test(href)) {
      const keep = ['story_fbid', 'id', 'fbid'].filter(k => abs.searchParams.get(k)).map(k => `${k}=${abs.searchParams.get(k)}`);
      url += '?' + keep.join('&');
    }
    const type = /\/reel\//.test(href) ? 'reel' : /\/videos\/|\/watch/.test(href) || p.querySelector('video') ? 'video' : 'post';

    // tuong tac tu aria-label cua cac nut
    let reactions = 0, comments = 0, shares = 0;
    for (const b of p.querySelectorAll('div[role=button], span[role=button]')) {
      const al = b.getAttribute('aria-label') || '', tx = (b.innerText || '').trim();
      let m;
      if (/(bài viết|post|video|reel|thước phim)/i.test(al) || /^(All reactions|Tất cả cảm xúc)/i.test(al)) {
        if ((m = al.match(/,\s*([\d.,]+\s*(?:K|N|M|Tr)?)\s*(bình luận|comments?)/i))) comments = Math.max(comments, num(m[1]));
        else if ((m = al.match(/,\s*([\d.,]+\s*(?:K|N|M|Tr)?)\s*(lượt chia sẻ|chia sẻ|shares?)/i))) shares = Math.max(shares, num(m[1]));
        else if (/^(Bày tỏ cảm xúc|React|Like|Thích|All reactions|Tất cả cảm xúc)/i.test(al) && /^\d/.test(tx)) reactions = Math.max(reactions, num(tx));
      }
    }
    if (!reactions) {   // du phong: cong cac dong "Thich: 8 nguoi", "Wow: 4 nguoi" cua bai
      reactions = [...p.querySelectorAll('[aria-label]')].map(e => e.getAttribute('aria-label'))
        .filter(s => /^[^:;]{2,15}:\s*[\d.,]+\s*(K|N|M|Tr)?\s*(người|people|person)/i.test(s))
        .reduce((t, s) => t + num(s.split(':')[1]), 0);
    }

    const text = msgEl ? msgEl.innerText.replace(/\s*(Xem thêm|See more|Ẩn bớt|See less)\s*$/i, '').replace(/\s+/g, ' ').trim().slice(0, 300) : '';
    const imgs = [...p.querySelectorAll('img')].filter(i => /scontent|fbcdn/.test(i.src) && i.naturalWidth >= 200);
    imgs.sort((x, y) => y.naturalWidth * y.naturalHeight - x.naturalWidth * x.naturalHeight);
    const img = imgs[0] ? imgs[0].src : (p.querySelector('video[poster]') || {}).poster || null;
    posts.push({ id, url, type, text, reactions, comments, shares,
                 interactions: reactions + comments + shares,
                 days: date ? Math.max(0, Math.round((today - date) / 864e5)) : null,
                 date: date ? iso(date) : null, img });
  };

  if (!loggedOut) {
    let idle = 0;
    for (let step = 0; step < 40 && posts.length < max && idle < 6; step++) {
      const before = posts.length;
      for (const p of document.querySelectorAll('[aria-posinset]')) {
        if (done.has(p) || !(p.innerText || '').trim()) continue;
        p.scrollIntoView({ block: 'center' }); await sleep(600);
        await handle(p);
        if (posts.length >= max) break;
      }
      idle = posts.length === before ? idle + 1 : 0;
      window.scrollBy(0, 1800); await sleep(1500);
    }
  }
  window.scrollTo(0, 0);
  return { page: document.title.replace(/^\(\d+\)\s*/, '').replace(/\s*\|\s*Facebook$/, ''), loggedOut, posts };
}

// Thu nho anh bai dang thanh JPEG rong toi da 400px, tra ve base64 (khong co tien to data:)
async function shrink(src) {
  const blob = await (await fetch(src)).blob();
  const bmp = await createImageBitmap(blob);
  const w = Math.min(400, bmp.width), h = Math.round(bmp.height * w / bmp.width);
  const c = document.createElement('canvas'); c.width = w; c.height = h;
  c.getContext('2d').drawImage(bmp, 0, 0, w, h);
  return c.toDataURL('image/jpeg', 0.7).split(',')[1];
}
