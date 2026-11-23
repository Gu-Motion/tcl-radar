#!/usr/bin/env python3
"""Cat anh chup man hinh bai Facebook (nen hong #f0f) thanh anh thiet ke gon.

Cach dung:
    python3 collect/fb_crop.py <tuan YYYY-MM-DD> <hang> <post_id>=<file_chup.jpg> [...]

- Bo vien hong va thanh cuon ben phai, luu JPEG rong toi da 720px vao
  assets/shots/<tuan>/<hang>-<8 ky tu cuoi id>.jpg
- Ghi duong dan anh vao muc facebook tuong ung trong data/<tuan>.json
"""
import json, os, re, sys
from PIL import Image

week, brand = sys.argv[1], sys.argv[2]
pairs = [a.split('=', 1) for a in sys.argv[3:]]
slug = re.sub(r'[^a-z0-9]+', '-', brand.lower()).strip('-')
out_dir = os.path.join('assets', 'shots', week)
os.makedirs(out_dir, exist_ok=True)
data_path = os.path.join('data', f'{week}.json')
data = json.load(open(data_path, encoding='utf-8'))
items = {i['id']: i for b in data['brands'] if b['brand'] == brand
         for i in b['items'] if i.get('source') == 'facebook'}

def is_bg(px):
    r, g, b = px[:3]
    return r > 200 and b > 200 and g < 90          # mau hong #f0f (sau nen JPEG)

for pid, path in pairs:
    im = Image.open(path).convert('RGB')
    w, h = im.size
    im = im.crop((0, 0, w - 16, h))                 # bo thanh cuon
    w, h = im.size
    px = im.load()
    def row_bg(y): return sum(is_bg(px[x, y]) for x in range(0, w, 4)) > (w // 4) * 0.9
    def col_bg(x): return sum(is_bg(px[x, y]) for y in range(0, h, 4)) > (h // 4) * 0.9
    top = next((y for y in range(h) if not row_bg(y)), 0)
    bot = next((y for y in range(h - 1, -1, -1) if not row_bg(y)), h - 1)
    left = next((x for x in range(w) if not col_bg(x)), 0)
    right = next((x for x in range(w - 1, -1, -1) if not col_bg(x)), w - 1)
    im = im.crop((left, top, right + 1, bot + 1))
    if im.width > 720:
        im = im.resize((720, round(im.height * 720 / im.width)), Image.LANCZOS)
    fn = f'{slug}-{pid[-8:]}.jpg'
    im.save(os.path.join(out_dir, fn), 'JPEG', quality=84, optimize=True)
    if pid in items:
        items[pid]['image'] = f'assets/shots/{week}/{fn}'
        status = 'ok'
    else:
        status = 'KHONG THAY BAI TRONG DATA'
    print(f'{brand} {pid[:14]}… {im.width}x{im.height} {status}')

json.dump(data, open(data_path, 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
