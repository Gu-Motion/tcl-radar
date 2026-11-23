# Lấy dữ liệu hằng tuần

YouTube chặn cả `robots.txt` (WebFetch không đọc được) lẫn truy cập từ máy chủ
trong môi trường chạy code. **Bắt buộc dùng trình duyệt** trên máy người dùng.

## Kênh theo dõi

| Hãng | Kênh |
|---|---|
| Samsung | https://www.youtube.com/user/samsungvietnam/videos |
| Toshiba | https://www.youtube.com/@ToshibalifestyleVietnam/videos |
| LG | https://www.youtube.com/@LGVietnam/videos |
| AQUA | https://www.youtube.com/@Aquavietnam/videos |
| Hisense | https://www.youtube.com/@HisenseVietnam/videos |

## Cách làm với từng kênh

Mở trang, chờ 4 giây, rồi chạy đoạn JS dưới đây. Nếu trả về mảng rỗng thì chờ
thêm và chạy lại một lần nữa trước khi bỏ qua — trang YouTube đôi khi chưa kịp
dựng lưới video.

```js
async function grab(max){
  for(let i=0;i<4;i++){ window.scrollBy(0,2000); await new Promise(r=>setTimeout(r,1200)); }
  window.scrollTo(0,0); await new Promise(r=>setTimeout(r,500));
  const seen=new Set(), out=[];
  for(const a of document.querySelectorAll('a[href*="/watch?v="]')){
    const m=a.href.match(/v=([\w-]{11})/); if(!m) continue;
    const id=m[1]; if(seen.has(id)) continue;
    const card=a.closest('ytd-rich-item-renderer,ytd-grid-video-renderer,ytd-video-renderer');
    if(!card) continue;
    const L=(card.innerText||'').split('\n').map(s=>s.trim()).filter(Boolean);
    if(L.length<3) continue;
    seen.add(id);
    out.push({id,len:L[0],title:L[1],views:L[2],age:L[3]});
    if(out.length>=max) break;
  }
  return out;
}
JSON.stringify({ch:document.title, v: await grab(14)})
```

## Chuẩn hoá về định dạng của site

- `views`: `"470 N"` → `470000`, `"1,2 N"` → `1200`, `"169"` → `169`
  (N = nghìn, Tr = triệu, dấu phẩy là dấu thập phân)
- `age` → `days`: giờ→0, ngày→×1, tuần→×7, tháng→×30, năm→×365
- `title_zh`: dịch sang tiếng Trung giản thể
- Giữ nguyên `id`, `len`, `title`

## Nhận định

Viết phần `notes` song ngữ dựa trên so sánh với file tuần trước. Ưu tiên:
hãng nào đổi nhịp đăng rõ rệt; video mới có dấu hiệu đẩy media; cụm từ hay
hashtag mới lặp lại (nhất là nội dung Tết); hãng nào vừa khởi động chiến dịch.

Nêu con số cụ thể. Nếu tuần đó không có gì đáng kể thì nói thẳng, đừng bịa.

---

# Facebook

Dùng **cùng trình duyệt tích hợp**, và trình duyệt phải **đang đăng nhập Facebook**.
Nếu chưa đăng nhập, Facebook chỉ cho xem 1–3 bài rồi chặn, dữ liệu sẽ thiếu.
Gặp trang đăng nhập hay checkpoint thì dừng phần Facebook và báo lại, đừng tự đăng nhập.

## Fanpage theo dõi

Mỗi fanpage đều lấy từ link Facebook trên website chính thức tại Việt Nam của hãng.

| Hãng | Fanpage |
|---|---|
| Samsung | https://www.facebook.com/SamsungVietnam |
| Toshiba | https://www.facebook.com/ToshibaLifestyleVietnam |
| LG | https://www.facebook.com/LGEVietnam |
| AQUA | https://www.facebook.com/aquavietnam |
| Hisense | https://www.facebook.com/Hisense.Vietnam |

## Cách làm với từng fanpage

1. Mở fanpage, chờ 5 giây.
2. Chạy toàn bộ nội dung `collect/fb_grab.js`, nối thêm dòng
   `window.__fb = await grabFB(15); JSON.stringify({lo: __fb.loggedOut, p: __fb.posts.map(p => [p.id, p.url.replace('https://www.facebook.com',''), p.type, p.text.slice(0,170), p.reactions, p.comments, p.shares, p.days])})`
   ở cuối. Script tự cuộn trang, giả lập rê chuột vào mốc thời gian của từng bài để
   đọc ngày đăng, và đọc cảm xúc / bình luận / chia sẻ. Mất khoảng 1 phút mỗi trang.
3. `lo: true` nghĩa là Facebook đã đăng xuất → dừng phần Facebook, báo người dùng
   đăng nhập lại. Nếu `p` rỗng hoặc dưới 3 bài: chờ 5 giây, chạy lại một lần;
   vẫn rỗng thì ghi nhận hãng đó không lấy được.
4. Chụp thiết kế (ngay trên trang đó, ngay sau khi lấy dữ liệu — mã bài `pfbid…`
   có thể đổi giữa các phiên, nên phải chụp trong cùng lần lấy):
   - Chạy đoạn sau để chuẩn bị (nền hồng #f0f để cắt viền tự động):
     ```js
     window.__ov = () => { let o=document.getElementById('__ov'); if(!o){o=document.createElement('div');o.id='__ov';document.body.appendChild(o);} o.style.cssText='position:fixed;inset:0;z-index:2147483647;background:#f0f;display:flex;align-items:center;justify-content:center'; o.innerHTML=''; return o; };
     window.__want = __fb.posts.filter(p => p.days !== null && p.days <= 7);
     window.__capN = async (i) => { const p=__want[i]; const o=__ov(); if (p.img) { const im=new Image(); im.style.cssText='max-width:100vw;max-height:100vh;display:block'; im.src=p.img; o.appendChild(im); await im.decode().catch(()=>{}); return p.id+' img'; } o.remove(); return p.id+' none'; };
     JSON.stringify(__want.map((p,i) => i+':'+p.id+':'+(p.img?1:0)))
     ```
   - Với mỗi bài có ảnh (`:1`), dùng `browser_batch` xen kẽ: `javascript_tool`
     `await __capN(i)` rồi `computer` `screenshot` (độ phân giải đầy đủ, KHÔNG
     dùng scale). Mỗi ảnh chụp được lưu thành file trong thư mục kết quả công cụ
     (đường dẫn hiện ngay dưới ảnh, dạng `/tmp/claude-tool-results/…/…jpg`).
   - Bỏ ảnh nào chỉ là khung đen/trống/logo (khung đầu của reel) — không có giá trị tham khảo.
   - Sau khi đã chạy `fb_merge.py` (bước "Ghi vào file tuần"), gắn ảnh vào bài:
     `python3 collect/fb_crop.py YYYY-MM-DD <Hãng> <id_bài>=<file_ảnh_chụp> ...`
     Script cắt viền hồng, lưu `assets/shots/YYYY-MM-DD/<hãng>-<8 ký tự cuối id>.jpg`
     và ghi `image` vào bài. Ảnh hiện ở mục "Thiết kế bài đăng Facebook" (tab Facebook).

Tiêu đề hiển thị: rút gọn đoạn chữ của bài thành một câu ngắn (dưới ~100 ký tự,
giữ tên sản phẩm / chiến dịch), dịch câu đó sang tiếng Trung giản thể cho `text_zh`.

Bài ghim (pinned) có thể cũ: vẫn giữ, vì `days` cho biết tuổi thật của bài.
Bài livestream đang diễn ra thì lấy số tại thời điểm đó.

## Ghi vào file tuần

Gom kết quả 5 hãng thành một file tạm `/tmp/fb_raw.json` theo mẫu trong đầu
`collect/fb_merge.py` (`url` của bài = `https://www.facebook.com` + đường dẫn,
`interactions` = cảm xúc + bình luận + chia sẻ, không cần `thumbs`), rồi chạy:

```
python3 collect/fb_merge.py data/YYYY-MM-DD.json /tmp/fb_raw.json
```

Script ghi bài vào `brands[].items` với `"source": "facebook"`,
`views` = tổng tương tác. Chạy lại không bị trùng.
Không commit file tạm.

## Nhận định Facebook

Mỗi mục trong `notes` có trường `"source"`: `"youtube"` hoặc `"facebook"` (để trống =
nhận định chung cả hai). Tab YouTube / Facebook chỉ hiện nhận định của nền tảng đó.
Luôn có một nhận định Facebook về **phong cách thiết kế** trong tuần (màu, bố cục,
typography, khuôn mẫu cố định, ảnh AI, tỉ lệ khung) dựa trên các ảnh đã chụp. Gợi ý so sánh:
số bài/tuần từng hãng; bài nào tương tác vượt hẳn trung vị Facebook của hãng
(dấu hiệu chạy quảng cáo); chủ đề lặp lại (khuyến mãi, Tết, livestream bán hàng,
minigame); hãng nào hoạt động mạnh trên Facebook nhưng im ở YouTube hoặc ngược lại.
Không so lượt xem YouTube với tương tác Facebook như cùng một thước đo.
