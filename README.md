# Radar đối thủ · 竞品雷达

Trang theo dõi nội dung đối thủ hằng tuần trên kênh truyền thông, dành cho đội marketing.
Theo dõi: **Samsung, Toshiba, LG, AQUA, Hisense** (bản Việt Nam).

Trang tĩnh thuần, không cần máy chủ, không cần build.
Địa chỉ: https://gu-motion.github.io/tcl-radar/ (GitHub Pages, nhánh `main`).

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

## Facebook

Đã bật. Mỗi bài Facebook là một mục `"source": "facebook"` trong `brands[].items`:

```json
{
  "source": "facebook", "type": "post",
  "id": "pfbid02abc...", "url": "https://www.facebook.com/SamsungVietnam/posts/pfbid02abc...",
  "title": "Nội dung bài viết, cắt ngắn", "title_zh": "帖子内容，节选",
  "image": "assets/shots/2026-11-23/samsung-01.jpg",
  "views": 1234, "reactions": 1100, "comments": 80, "shares": 54, "days": 2
}
```

- `views` với Facebook là **tổng tương tác** (cảm xúc + bình luận + chia sẻ),
  vì Facebook không công khai lượt xem bài đăng. Trang ghi rõ đơn vị “tương tác”.
- `type`: `post`, `video` hoặc `reel` (video/reel có nút ▶).
- `image` là ảnh bài thu nhỏ, lưu trong `assets/shots/<tuần>/` (link ảnh gốc của
  Facebook hết hạn sau vài ngày).
- Fanpage từng hãng khai báo ở `brands[].channels.facebook`.

Cách lấy dữ liệu: `collect/EXTRACT.md` (phần Facebook), `collect/fb_grab.js`,
`collect/fb_merge.py`.

---

## Dấu hiệu đẩy media

Một mục được gắn nhãn **có đẩy media** khi con số của nó đạt từ 10 lần
trung vị của chính kênh đó **trên cùng nền tảng** trở lên, và tối thiểu 10.000
lượt xem (YouTube) hoặc 1.000 tương tác (Facebook). YouTube và Facebook được tính
riêng, không trộn với nhau.

Lượt xem tự nhiên hiếm khi chênh tới mức này, nên đây là chỉ báo gián tiếp cho
việc có ngân sách quảng cáo phía sau. **Đây là suy luận, không phải số liệu
chi tiêu thật** — trang ghi rõ điều này ở phần chân trang.

Đổi ngưỡng: sửa `minPaid` trong `SOURCES` và hàm `statsOf` trong `assets/app.js`.

---

## Cập nhật hằng tuần

Tự động 9:00 sáng thứ Hai. Quy trình:

1. Lấy dữ liệu 5 kênh YouTube và 5 fanpage Facebook bằng trình duyệt (xem `collect/EXTRACT.md`)
2. Ghi `data/YYYY-MM-DD.json` mới, thêm tuần đó vào `data/index.json`
3. Commit và push lên nhánh `main`
4. GitHub Pages tự cập nhật trang sau khoảng 1 phút

**Cần máy bật và ứng dụng Claude đang mở** vào giờ đó, vì bước 1 bắt buộc dùng
trình duyệt — YouTube chặn cả `robots.txt` lẫn truy cập từ máy chủ, còn Facebook
cần trình duyệt đã đăng nhập.

Dữ liệu cũ không bao giờ bị ghi đè: mỗi tuần một file riêng, và lịch sử git giữ
lại toàn bộ. Nút chọn tuần ở đầu trang tự hiện khi có từ hai tuần trở lên.

---

## Triển khai

Trang chạy trên **GitHub Pages** (Settings → Pages → nhánh `main`, thư mục gốc).
Mỗi lần push lên `main`, GitHub tự cập nhật trang. Không cần cấu hình gì thêm.
