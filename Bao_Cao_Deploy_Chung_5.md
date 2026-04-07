# CHƯƠNG 5: TRIỂN KHAI HỆ THỐNG LÊN CLOUD (FIREBASE/AWS)

**Dự án:** PC_Web_Ban  
**Giảng viên/Người hướng dẫn:** [Điền Tên]  
**Nhóm Sinh Viên Thực Hiện:** KHA & DŨNG

---

## 1. MỤC TIÊU TRIỂN KHAI
Sử dụng công nghệ nền tảng Cloud **Firebase Hosting** (của Google) kết hợp với mô hình **Single Page Application (SPA)** của ReactJS/ViteJS để đẩy hệ thống Frontend lên chạy trực tiếp trên môi trường mạng Internet quốc tế, giúp người dùng ở bất cứ đâu cũng có thể truy cập được thông qua đường Link (URL). 

## 2. KIẾN TRÚC & CÔNG ĐOẠN ĐÓNG GÓI
Hệ thống Frontend chạy localhost được đóng gói (Build Production) sang dạng Native HTML, CSS, JavaScript tĩnh thông qua quy trình cấu hình `Vite Build`.  
Để cấu hình hạ tầng cho máy chủ Firebase đọc được luồng React Router, quy tắc `rewrites (index.html)` đã được tiêm vào file hệ thống `firebase.json`.

---

## 3. QUY TRÌNH THAO TÁC CÂU LỆNH FIREBASE
*(Sinh viên cần chụp ảnh cửa sổ Command Line (Terminal) đen thui thể hiện gõ thành công các lệnh này nha).*

**Bước 1: Cài đặt công cụ nền của Firebase**
```bash
npm install -g firebase-tools
```

**Bước 2: Xác thực tài khoản Google lên hệ thống Terminal**
```bash
firebase login
```
*(Chụp ảnh dòng báo "Success! Logged in as [email của bạn]" và dán vào đây)*
> **[CHÈN ẢNH LOGIN THÀNH CÔNG FIREBASE TẠI ĐÂY]**

**Bước 3: Khởi tạo và thiết lập hạ tầng Firebase**
*Do dự án đã cấu hình sẵn file `firebase.json` ẩn ở trùm gốc, sinh viên chỉ việc thiết lập liên kết Project ID trên Firebase Console mà thôi:*
```bash
firebase init
```
- Khi được hỏi, di chuyển phím lên xuống và chọn mục `Hosting: Configure files for Firebase Hosting`. 
- Chọn `Use an existing project` -> Chọn bừa 1 cái tên Project bạn vừa bấm tạo trên trang chủ Firebase web.

**Bước 4: Đóng gói (Build) sản phẩm & Đẩy lên Đám Mây**
1. Biên dịch bộ mã nguồn từ máy dev sang dạng Production nén:
   ```bash
   npm run build
   ```
2. Tung bản Build lên tên miền toàn cầu:
   ```bash
   firebase deploy
   ```

*(Chụp ảnh khoảnh khắc dòng chữ thần thánh "Deploy complete!" màu xanh lá cây kèm theo đường link "Hosting URL" và dán ảnh vào đây)*
> **[CHÈN ẢNH HIỂN THỊ LINK HOSTING FIREBASE THÀNH CÔNG VÀO ĐÂY]**

---

## 4. KẾT QUẢ SẢN PHẨM & ĐÁNH GIÁ
**Web Hosting Link URL (Gắn vào Bài bảo vệ đồ án):**   
`[Điền cái link https://pc-store-xxxxx.web.app mà cửa sổ đen đen lúc nãy tạo cho bạn vào đây nha]`

**Vận hành:** Tốc độ load cực cao dưới 1.5s (do máy chủ CDN từ Google đặt Server toàn cầu). Các trang auth, product, cart bấm chuyển qua lại không bị lỗi Not Found 404. Tính năng bảo mật SSL tự động được đính kèm. Khả thi để tiến hành vận hành thực tiễn kinh doanh.
