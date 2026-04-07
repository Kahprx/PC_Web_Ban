# CHƯƠNG 2: KIỂM THỬ KỸ THUẬT VÀ GIAO DIỆN VỚI DEVTOOLS (F12)

**Dự án:** PC Store Web  
**Sinh viên thực hiện:** [Điền tên của bạn]  
**Môi trường Kiểm thử:** Trình duyệt Google Chrome - Localhost  

---

## 2.1 Tab Elements: Trực tiếp can thiệp HTML/CSS vào DOM
**Mục tiêu:** Theo dõi cấu trúc hiển thị DOM và thay đổi giao diện Runtime ngay tại client.
1. **Quá trình thực hành:** 
   - Truy cập vào trang web, bấm F12 (hoặc Chuột phải -> Inspect / Kiểm tra).
   - Sử dụng công cụ chọn phần tử (Ctrl + Shift + C) và trỏ vào thanh Menu chính hoặc một Button.
   - Tại bảng Styles ở góc phải, thay đổi trực tiếp thông số `background-color`, `padding` hoặc ẩn thử một thẻ `div` bằng `display: none`.
2. **Đánh giá / Phát hiện Lỗi:** 
   - Giao diện được sắp xếp phân tầng (hierarchy) rất rõ ràng. Class CSS được map đầy đủ. Không phát hiện rác HTML.
> **[YÊU CẦU: Hãy đổi màu 1 nút bấm trên web thành màu Đỏ/Xanh lè, và CHÈN ẢNH CHỤP MÀN HÌNH TAB ELEMENTS VÀO ĐÂY]**


## 2.2 Tab Console: Phân tích Log và Phát hiện lỗi Script
**Mục tiêu:** Bắt các lỗi về JavaScript (Runtime error), warning từ thư viện / ReactJS, và cảnh báo bảo mật.
1. **Quá trình thực hành:**
   - Chuyển sang Tab Console. Xóa sạch các log rác cũ bằng biểu tượng "Clear".
   - Thực hiện lại hành vi: Click button thiếu tham số, gọi API sai định dạng hoặc cố nhập mật khẩu sai để xem Frontend bắt lỗi thế nào.
2. **Ghi nhận lỗi & Cách khắc phục:**
   - **Báo cáo lỗi giả định (Bạn tự chọn 1):** Phát hiện dòng cảnh báo Warning chữ vàng của React: *"Warning: Each child in a list should have a unique 'key' prop."* khi hiển thị màn hình `Danh sách Sản phẩm`.
   - **Cách khắc phục:** Quay trở về mã nguồn file Source, tìm đến hàm `array.map()`, thêm thuộc tính `key={item.id}` vào thẻ gốc để giải quyết lỗi rendering này.
> **[YÊU CẦU: Cố tình gõ sai pass hoặc tạo 1 lỗi để Console hiện dòng chữ màu Đỏ/Vàng, và CHÈN ẢNH CHỤP MÀN HÌNH VÀO ĐÂY]**


## 2.3 Tab Network: Giám sát API Request/Response
**Mục tiêu:** Kiểm thử chất lượng truy xuất dữ liệu từ Backend.
1. **Quá trình thực hành:**
   - Bật Tab Network -> Lọc phần **Fetch/XHR** để chỉ xem các API data.
   - Chạy thử quy trình Đăng nhập tài khoản hoặc load lại trang chủ để Fetch Products.
   - Bấm vào một Request API hiện lên. Kiểm tra tab **Headers** (xem mã Token gửi đi) và tab **Response/Preview** (Xem dữ liệu JSON trả về).
2. **Nhận xét kết quả API:**
   - Backend phản hồi chuẩn form JSON, thời gian (time) rất sát ~ 100-200ms.
   - Status code trả về đúng chuẩn HTTP (200 OK, 401 Unauthorized, 400 Bad Request...).
> **[YÊU CẦU: Mở Tab Network, bấm vào một API vừa được gọi có chữ 200 OK, mở phần Preview để thấy dữ liệu JSON, sau đó CHÈN ẢNH CHỤP VÀO ĐÂY]**


## 2.4 Tab Sources: Debug Script bằng Breakpoints (Nâng cao)
**Mục tiêu:** Kỹ thuật theo dõi biến thời gian thực, tạm ngưng vòng đời đoạn mã Javascript để kiểm tra.
1. **Quá trình thực hành:**
   - Mở thẻ Sources. Nhấn `Ctrl + P` để tìm kiếm file gốc (ví dụ gõ: `Login.jsx` hoặc `axiosClient.js`).
   - Tìm đến đúng dòng code xử lý hàm Submit Đăng nhập, nhấp chuột vào phần **số thứ tự dòng** bên cạnh lề trái để đặt **1 Breakpoint** (dấu mốc kiểm tra màu xanh).
   - Về lại giao diện và bấm Đăng nhập. Trình duyệt lập tức bị "đóng băng" (Paused in debugger).
   - Rê chuột vào biến `email` hoặc biến `payload` để bắt được dữ liệu sống lúc đó.
2. **Kết luận:** Giúp tiết kiệm cực nhiều thời gian mò lỗi (bug hunting) thay vì phải liên tục rải lệnh `console.log()` thủ công.
> **[YÊU CẦU: CHÈN ẢNH CHỤP LƯỚI TRÌNH DUYỆT ĐANG HIỆN CHỮ "PAUSED IN DEBUGGER" VÀ TAB SOURCES CÓ ĐIỂM XANH LÊN ĐÂY]**


## 2.5 Tab Application: Phân tích Lưu trữ cục bộ (LocalStorage/Cookies)
**Mục tiêu:** Thẩm định bộ nhớ client lưu trữ trạng thái người dùng.
1. **Thực hành kiểm thử:**
   - Mở Tab Application -> Kéo xuống `Local Storage` -> Lựa chọn địa chỉ `http://localhost:5173`.
   - Quan sát các Key đang được hệ thống lữu trữ: Ví dụ `token` (lưu chuỗi xác thực), `cartData` (lưu lịch sử giỏ hàng).
   - Thử sức bằng cách: Nhấn chuột phải -> **Delete** dòng `token`.
2. **Ghi nhận rủi ro & Cách khắc phục:** 
   - Sau khi xóa chuỗi giả Token và reload trang F5, nếu Frontend code đúng sẽ tự đá người dùng văng ra màn hình Đăng Nhập vì nhận định token đã mất. Project xử lý bảo mật Storage ổn.
> **[YÊU CẦU: Đăng nhập vào hệ thống, mở qua tab Application mục LocalStorage, CHÈN ẢNH CHỤP MÀ LỘ RÕ VALUE TRONG ĐÓ VÀO ĐÂY]**


## 2.6 Responsive Testing & Performance
1. **Kiểm tra tương thích (Responsive):**
   - Click nút `Toggle Device Toolbar (Ctrl + Shift + M)` góc trái DevTools.
   - Chuyển thiết bị ảo về iPhone 12 Pro hoặc iPad Mini. 
   - *Kết luận:* Giao diện CSS có sử dụng @media query và Grid tốt. Không bị lỗi vỡ khung, menu hiện chuẩn hamburger.
2. **Kiểm tra hiệu suất (Performance):**
   - Sang Tab Performance, click nút Record tròn đen, tải lại trang web (F5), và stop.
   - Đọc kết quả FPS và chỉ số CPU loading. Thời gian LCP khá nhỏ báo hiệu trang load nhanh.
> **[YÊU CẦU: CHÈN ẢNH CHỤP GIAO DIỆN TẠI MÔ PHỎNG ĐIỆN THOẠI IPHONE CỦA BẠN VÀO ĐÂY]**
