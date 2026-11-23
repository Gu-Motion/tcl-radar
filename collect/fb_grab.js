// Lay bai dang tu mot fanpage Facebook (chay trong trinh duyet, da dang nhap).
// Tra ve JSON: {page, posts:[{id,url,type,text,reactions,comments,shares,interactions,days,stamp,img}]}
// Dung duoc voi giao dien Facebook tieng Anh lan tieng Viet.
async function grabFB(max) {
  const sleep = ms => new Promise(r => setTimeout(r, ms));
  // 1) Cuon de Facebook tai them bai
  for (let i = 0; i < 8; i++) { window.scrollBy(0, 2500); await sleep(1500); }
  // 2) Mo "Xem them / See more" de lay du noi dung
  document.querySelectorAll('div[role=button]').forEach(b => {
    if (/^(See more|Xem thêm)$/.test((b.innerText || '').trim())) { try { b.click(); } catch (e) {} }
  });
  await sleep(800);

  const num = s => {                       // "1,2K" "1.2K" "2 N" "3,4 Tr" "1M" "15"
    if (!s) return 0;
    s = String(s).trim().replace(/ /g, ' ');
    const m = s.match(/([\d.,]+)\s*(K|N|M|Tr|triệu|nghìn|B)?/i);
    if (!m) return 0;
    let v = m[1], u = (m[2] || '').toLowerCase();
    if (u) v = v.replace(',', '.'); else v = v.replace(/[.,]/g, '');
    v = parseFloat(v) || 0;
    if (u === 'k' || u === 'n' || u === 'nghìn') v *= 1e3;
    if (u === 'm' || u === 'tr' || u === 'triệu') v *= 1e6;
    if (u === 'b') v *= 1e9;
    return Math.round(v);
  };
  const ageDays = lines => {               // tu nhan thoi gian ngan: "2h" "3d" "1w" "5 giờ" "3 ngày" "Hôm qua"
    for (const l of lines) {
      const t = l.trim();
      let m;
      if (/^(just now|vừa xong)$/i.test(t)) return 0;
      if ((m = t.match(/^(\d+)\s*(m|min|phút|h|hr|giờ)$/i))) return 0;
      if (/^(yesterday|hôm qua)/i.test(t)) return 1;
      if ((m = t.match(/^(\d+)\s*(d|ngày)$/i))) return +m[1];
      if ((m = t.match(/^(\d+)\s*(w|tuần)$/i))) return +m[1] * 7;
      if ((m = t.match(/^(\d+)\s*(y|năm)$/i))) return +m[1] * 365;
    }
    // ngay day du: "23 November 2026" / "23 tháng 11, 2026" / "November 23" / "23 tháng 11"
    const months = { january:1,february:2,march:3,april:4,may:5,june:6,july:7,august:8,
                     september:9,october:10,november:11,december:12 };
    const now = new Date();
    for (const l of lines) {
      let m, d = null;
      if ((m = l.match(/(\d{1,2}) (January|February|March|April|May|June|July|August|September|October|November|December)(?: (\d{4}))?/i)))
        d = new Date(+(m[3] || now.getFullYear()), months[m[2].toLowerCase()] - 1, +m[1]);
      else if ((m = l.match(/(January|February|March|April|May|June|July|August|September|October|November|December) (\d{1,2})(?:, (\d{4}))?/i)))
        d = new Date(+(m[3] || now.getFullYear()), months[m[1].toLowerCase()] - 1, +m[2]);
      else if ((m = l.match(/(\d{1,2}) [Tt]háng (\d{1,2})(?:,? (\d{4}))?/)))
        d = new Date(+(m[3] || now.getFullYear()), +m[2] - 1, +m[1]);
      if (d) { if (d > now) d.setFullYear(d.getFullYear() - 1);
               return Math.max(0, Math.floor((now - d) / 864e5)); }
    }
    return null;
  };

  const arts = [...document.querySelectorAll('div[role=article]')]
    .filter(a => !a.parentElement.closest('div[role=article]') && (a.innerText || '').trim());
  const seen = new Set(), posts = [];
  const ICONS = {}, pending = [];   // hoc vi tri icon tu bai co du 2 nut de doan bai chi co 1 nut
  for (const a of arts) {
    const hrefs = [...a.querySelectorAll('a[href]')].map(x => x.href);
    const main = hrefs.find(h => /\/(posts|videos|reel)\/|story_fbid=|\/permalink/.test(h) && !/comment_id=/.test(h))
              || hrefs.find(h => /photo\/?\?fbid=|\/photos\//.test(h));
    if (!main) continue;
    let id = (main.match(/\/posts\/([\w]+)/) || main.match(/\/(?:videos|reel)\/(\d+)/) ||
              main.match(/story_fbid=([\w]+)/) || main.match(/fbid=(\d+)/) || [])[1];
    if (!id || seen.has(id)) continue;
    seen.add(id);
    const url = main.split('?')[0] + (/story_fbid|fbid=/.test(main) && !/\/posts\//.test(main)
              ? '?' + (main.match(/(story_fbid=[\w]+&id=\d+|fbid=\d+)/) || [''])[0] : '');
    const type = /\/reel\//.test(main) ? 'reel' : /\/videos\//.test(main) ? 'video' : 'post';
    const L = a.innerText.split('\n').map(s => s.trim()).filter(Boolean);

    // tuong tac
    let reactions = 0, comments = 0, shares = 0;
    const ri = L.findIndex(l => /^(All reactions|Tất cả cảm xúc):?$/i.test(l));
    if (ri >= 0) reactions = num(L[ri + 1]);
    const aria = [...a.querySelectorAll('[aria-label]')].map(x => x.getAttribute('aria-label'));
    if (!reactions) { const r = aria.find(s => /^(Like|Thích):/.test(s)); if (r) reactions = num(r.split(':')[1]); }
    // Kieu cu: dong chu "12 comments" / "3 shares"
    for (const l of L) {
      let m;
      if ((m = l.match(/^([\d.,]+\s*(?:K|N|M|Tr)?)\s*(comments?|bình luận)$/i))) comments = num(m[1]);
      if ((m = l.match(/^([\d.,]+\s*(?:K|N|M|Tr)?)\s*(shares?|lượt chia sẻ|chia sẻ)$/i))) shares = num(m[1]);
    }
    // Kieu moi: nut chi co so + icon (binh luan truoc, chia se sau). Tong tuong tac khong phu thuoc
    // vao viec phan biet dung binh luan/chia se, nen chi can lay du cac con so.
    const countBtns = [...a.querySelectorAll('div[role=button]')]
      .filter(b => !b.getAttribute('aria-label') && /^\d[\d.,]*\s*(K|N|M|Tr)?$/i.test((b.innerText || '').trim()))
      .map(b => ({ n: num(b.innerText), icon: (b.querySelector('i') || {}).style?.backgroundPosition || '' }));
    if (!comments && !shares && countBtns.length) {
      if (countBtns.length >= 2) { comments = countBtns[0].n; shares = countBtns[1].n;
        ICONS.comment = countBtns[0].icon; ICONS.share = countBtns[1].icon; }
      else pending.push({ idx: posts.length, ...countBtns[0] });
    }

    // noi dung: dong dai nhat truoc khoi tuong tac, bo cac dong he thong
    const stopAt = ri >= 0 ? ri : L.length;
    const skip = /^(·|Like|Thích|Comment|Bình luận|Share|Chia sẻ|See more|Xem thêm|See less|Ẩn bớt|Follow|Theo dõi|Sponsored|Được tài trợ|Accounts with a verified badge.*|Tài khoản có huy hiệu.*|.* ago|.* trước)$/i;
    const body = L.slice(1, stopAt).filter(l => !skip.test(l) && l.length > 3 &&
                   !/^\d+\s*(h|d|w|m|giờ|ngày|tuần|phút)$/i.test(l) &&
                   !/^(Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday|Thứ|Chủ nhật)/i.test(l));
    const text = body.join(' ').replace(/\s*(See less|Ẩn bớt)$/i, '').slice(0, 300);

    // anh: anh lon nhat trong bai (khong phai avatar)
    const imgs = [...a.querySelectorAll('img')].filter(i => /scontent|fbcdn/.test(i.src) && i.naturalWidth >= 200);
    imgs.sort((x, y) => y.naturalWidth * y.naturalHeight - x.naturalWidth * x.naturalHeight);
    const stampLine = L.find(l => /\d{4} at \d|lúc \d/.test(l)) || '';
    posts.push({ id, url, type, text, reactions, comments, shares,
                 interactions: reactions + comments + shares,
                 days: ageDays(L.slice(0, 8)), stamp: stampLine,
                 img: imgs[0] ? imgs[0].src : null });
    if (posts.length >= max) break;
  }
  for (const p of pending) {
    const post = posts[p.idx]; if (!post) continue;
    if (p.icon && p.icon === ICONS.share) post.shares = p.n; else post.comments = p.n;
    post.interactions = post.reactions + post.comments + post.shares;
  }
  window.scrollTo(0, 0);
  return { page: document.title.replace(/\s*\|\s*Facebook$/, ''), posts };
}

// Thu nho anh bai dang thanh JPEG ~480px, tra ve base64 (khong co tien to data:)
async function shrink(src) {
  const blob = await (await fetch(src)).blob();
  const bmp = await createImageBitmap(blob);
  const w = Math.min(480, bmp.width), h = Math.round(bmp.height * w / bmp.width);
  const c = document.createElement('canvas'); c.width = w; c.height = h;
  c.getContext('2d').drawImage(bmp, 0, 0, w, h);
  return c.toDataURL('image/jpeg', 0.72).split(',')[1];
}
