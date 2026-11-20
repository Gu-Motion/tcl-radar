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
