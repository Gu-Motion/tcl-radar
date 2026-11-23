#!/usr/bin/env python3
"""Gop du lieu Facebook vao file tuan.

Cach dung:
    python3 collect/fb_merge.py data/2026-11-23.json fb_raw.json

fb_raw.json (tam thoi, KHONG commit) co dang:
{
  "Samsung": {
    "url": "https://www.facebook.com/SamsungVietnam",
    "name": "Samsung Vietnam", "name_zh": "三星越南",
    "posts": [ {id,url,type,text,text_zh,reactions,comments,shares,interactions,days}, ... ],
    "thumbs": { "<post id>": "<base64 jpeg>" , ... }
  },
  ...
}

Viec script lam:
- luu anh vao assets/shots/<tuan>/<hang>-<so>.jpg
- xoa cac muc facebook cu cua tuan do (chay lai khong bi trung), them muc moi
- khai bao brands[].channels.facebook va them "facebook" vao danh sach sources
Chi sua file tuan duoc chi dinh, khong dung toi tuan khac.
"""
import base64, json, os, re, sys

week_path, raw_path = sys.argv[1], sys.argv[2]
week = re.search(r'(\d{4}-\d{2}-\d{2})', week_path).group(1)
data = json.load(open(week_path, encoding='utf-8'))
raw = json.load(open(raw_path, encoding='utf-8'))

shot_dir = os.path.join('assets', 'shots', week)

by_brand = {b['brand']: b for b in data['brands']}
total = 0
for brand, fb in raw.items():
    b = by_brand.get(brand)
    if b is None:
        print(f'!! Bo qua {brand}: khong co trong file tuan'); continue
    b.setdefault('channels', {})['facebook'] = {
        'name': fb.get('name') or brand, 'name_zh': fb.get('name_zh') or fb.get('name') or brand,
        'url': fb['url']}
    b['items'] = [i for i in b.get('items', []) if i.get('source') != 'facebook']
    slug = re.sub(r'[^a-z0-9]+', '-', brand.lower()).strip('-')
    thumbs = fb.get('thumbs', {})
    for n, p in enumerate(fb.get('posts', []), 1):
        if p.get('days') is None:
            print(f'!! {brand}: bai {p["id"][:20]} khong ro ngay dang, bo qua'); continue
        item = {
            'source': 'facebook', 'id': p['id'], 'url': p['url'],
            'type': p.get('type', 'post'),
            'title': (p.get('text') or '').strip() or '(không có chữ)',
            'title_zh': (p.get('text_zh') or '').strip() or None,
            'views': int(p.get('interactions') or 0),
            'reactions': int(p.get('reactions') or 0),
            'comments': int(p.get('comments') or 0),
            'shares': int(p.get('shares') or 0),
            'days': int(p['days']),
        }
        if not item['title_zh']: item.pop('title_zh')
        if p['id'] in thumbs and thumbs[p['id']]:
            os.makedirs(shot_dir, exist_ok=True)
            fn = f'{slug}-{n:02d}.jpg'
            with open(os.path.join(shot_dir, fn), 'wb') as f:
                f.write(base64.b64decode(thumbs[p['id']]))
            item['image'] = f'assets/shots/{week}/{fn}'
        elif p.get('img'):
            # khong luu duoc anh: dung link anh Facebook (het han sau vai ngay, trang tu hien o mau)
            item['image'] = p['img']
        b['items'].append(item); total += 1

srcs = data.get('sources')
if isinstance(srcs, list) and 'facebook' not in srcs:
    srcs.append('facebook')
elif isinstance(srcs, dict):
    srcs.setdefault('facebook', {'vi': 'Facebook', 'zh': 'Facebook'})

json.dump(data, open(week_path, 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
print(f'Da gop {total} bai Facebook vao {week_path}; anh trong {shot_dir}')
