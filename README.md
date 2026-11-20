# Radar đối thủ · 竞品雷达

Trang theo dõi nội dung đối thủ hằng tuần trên kênh truyền thông, dành cho đội marketing.
Theo dõi: **Samsung, Toshiba, LG, AQUA, Hisense** (bản Việt Nam).

Trang tĩnh thuần, không cần máy chủ, không cần build. Vercel chỉ việc phục vụ file.

---

## Cấu trúc

```
index.html            khung trang
assets/style.css      giao diện
assets/app.js         bộ dựng nội dung + song ngữ + lọc theo nguồn
data/index.json       danh sách các tuần đã có
data/YYYY-MM-DD.json  dữ liệu một tuần
collect/EXTRACT.md    cách lấy dữ liệu hằng tuần
```

Mọi nội dung hiển thị đều đọc từ `data/`. Muốn sửa số liệu hay nhận định thì
sửa file JSON, không đụng vào HTML.

---

## Song ngữ

Hai nút ở góc trên phải chuyển giữa **Tiếng Việt** và **中文 (giản thể)**.
Lựa chọn được nhớ lại trong trình duyệt. Mở thẳng bản tiếng Trung bằng `#zh`
ở cuối địa chỉ.

Phần được dịch: toàn bộ nhãn giao diện, phần nhận định, và tiêu đề từng video
(trường `title_zh`). Nếu một video chưa có bản dịch, trang tự hiện tiêu đề gốc.

Thêm ngôn ngữ mới: thêm một khối vào `T` trong `assets/app.js` và một nút vào
`#langSeg` trong `index.html`.

---

## Thêm nguồn Facebook sau này

Hệ thống đã dựng sẵn cho việc này. Mỗi mục nội dung có trường `source`,
và thanh lọc nguồn ở đầu trang tự hiện thêm nút khi dữ liệu có nguồn đó.

Chỉ cần thêm mục có `"source": "facebook"` vào `brands[].items`:

```json
{
  "source": "facebook",
  "id": "pfbid02abc...",
  "url": "https://www.facebook.com/SamsungVietnam/posts/pfbid02abc...",
  "title": "Nội dung bài viết, cắt ngắn",
  "title_zh": "帖子内容，节选",
  "image": "assets/shots/2026-11-23/samsung-01.jpg",
  "views": 1234,
  "days": 2
}
```

Ghi chú:
- `image` là ảnh chụp bài viết, lưu trong repo. Không có thì trang hiện ô màu thay thế.
- `views` dùng chung cho mọi nguồn — với Facebook thì đổ tổng tương tác
  (like + comment + share) vào đây để so sánh được giữa các hãng.
- Khai báo tên nguồn trong `SOURCES` ở `assets/app.js` nếu muốn đổi nhãn hiển thị.

Khai báo kênh Facebook của từng hãng trong `brands[].channels.facebook`:

```json
"channels": {
  "youtube":  { "name": "...", "name_zh": "...", "url": "..." },
  "facebook": { "name": "...", "name_zh": "...", "url": "..." }
}
```

---

## Dấu hiệu đẩy media

Một mục được gắn nhãn **có đẩy media** khi lượt xem của nó đạt từ 10 lần
trung vị của chính kênh đó trở lên, và tối thiểu 10.000.

Lượt xem tự nhiên hiếm khi chênh tới mức này, nên đây là chỉ báo gián tiếp cho
việc có ngân sách quảng cáo phía sau. **Đây là suy luận, không phải số liệu
chi tiêu thật** — trang ghi rõ điều này ở phần chân trang.

Đổi ngưỡng: sửa hàm `statsOf` trong `assets/app.js`.

---

## Cập nhật hằng tuần

Tự động 9:15 sáng thứ Hai. Quy trình:

1. Lấy dữ liệu 5 kênh YouTube bằng trình duyệt (xem `collect/EXTRACT.md`)
2. Ghi `data/YYYY-MM-DD.json` mới, thêm tuần đó vào `data/index.json`
3. Commit và push lên nhánh `main`
4. Vercel tự deploy

**Cần máy bật và ứng dụng Claude đang mở** vào giờ đó, vì bước 1 bắt buộc dùng
trình duyệt — YouTube chặn cả `robots.txt` lẫn truy cập từ máy chủ.

Dữ liệu cũ không bao giờ bị ghi đè: mỗi tuần một file riêng, và lịch sử git giữ
lại toàn bộ. Nút chọn tuần ở đầu trang tự hiện khi có từ hai tuần trở lên.

---

## Triển khai trên Vercel

1. Vercel → Add New → Project → chọn repo này
2. Framework Preset: **Other**
3. Build Command: để trống
4. Output Directory: để trống (hoặc `.`)
5. Deploy

Mỗi lần push lên `main`, Vercel tự deploy lại. Không cần cấu hình gì thêm.
