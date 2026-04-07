# CHƯƠNG 3: QUẢN LÝ MÃ NGUỒN GITHUB & WORKFLOW NHÓM

**Dự án:** PC_Web_Ban  
**Repo Chính (Company Repo):** https://github.com/Kahprx/PC_Web_Ban  
**Mô hình áp dụng:** CASE 2 - FORK + PULL REQUEST (Chuẩn quy trình doanh nghiệp lớn).

---

## 👨‍💻 PHÂN CÔNG THÀNH VIÊN VÀ NHÁNH (BRANCH)

| Thành viên | Vai trò thực hiện lệnh Git | Trách nhiệm | Tên nhánh (Branch) |
| :--- | :--- | :--- | :--- |
| **Leader** | Quản trị viên Repo `Kahprx` | Tạo `develop`, Review Code, Merge PR | `main` & `develop` |
| **SV 1** | Lập trình viên | Chức năng Tài khoản / Đăng nhập | `feature/login` |
| **SV 2** | Lập trình viên | Chức năng Danh sách Sản phẩm | `feature/product` |
| **SV 3** | Lập trình viên | Chức năng Giỏ hàng | `feature/cart` |
| **SV 4** | Lập trình viên | Chức năng Thanh Toán | `feature/payment` |

---

## 🛠 HƯỚNG DẪN TỪNG BƯỚC ĐỂ SINH VIÊN BÁO CÁO MÔN HỌC

### BƯỚC 1: XÁC LẬP REPO CHÍNH VÀ NHÁNH DEV (DÀNH CHO LEADER)
Leader sẽ chuẩn bị nền tảng ban đầu tại công ty.
1. Mở Git Bash/Terminal, leader thực thi lệnh:
   ```bash
   git clone https://github.com/Kahprx/PC_Web_Ban.git
   cd PC_Web_Ban
   git checkout -b develop
   git push origin develop
   ```
2. **YÊU CẦU BÁO CÁO:** Chụp ảnh kho lưu trữ `Kahprx/PC_Web_Ban` trên giao diện Github cho thấy đang có đủ 2 nhánh là `main` và `develop`.
> **[CHÈN ẢNH REPO CÓ MAIN & DEVELOP TẠI ĐÂY]**

### BƯỚC 2: CÁC THÀNH VIÊN FORK VÀ CLONE
Mỗi bạn (SV1->SV4) bấm vào link gốc, ấn nút **Fork** (Góc phải trên cùng) để tạo bản copy về nick Github riêng của mình.
1. Clone repo Fork về máy cá nhân:
   ```bash
   git clone https://github.com/<tên_nick_của_bạn>/PC_Web_Ban.git
   cd PC_Web_Ban
   ```
2. Thêm liên kết ngược về Repo Công Ty (để sau này cập nhật Code chuẩn):
   ```bash
   git remote add upstream https://github.com/Kahprx/PC_Web_Ban.git
   ```

### BƯỚC 3: TẠO NHÁNH CHỨC NĂNG VÀ LẬP TRÌNH CODE
Tuyệt đối tuân thủ quy tắc KHÔNG code trực tiếp trên `main`.
1. Đồng bộ code `develop` gốc nhất từ Leader:
   ```bash
   git fetch upstream
   git checkout -b develop upstream/develop
   ```
2. Tách nhánh và bắt đầu làm phần của mình. **Ví dụ đối với SV2:**
   ```bash
   git checkout -b feature/product
   ```
3. Sau khi chỉnh sửa code, ghi lại Lịch sử (kèm Mã Jira của bài 4):
   ```bash
   git add .
   git commit -m "TASK-05: Hoàn thiện UI Danh Sách Sản Phẩm"
   git push origin feature/product
   ```

### BƯỚC 4: TẠO PULL REQUEST VÀ CODE REVIEW
1. SV đăng nhập lên Github của nick cá nhân, bấm **"Compare & pull request"**.
2. **QUAN TRỌNG:** Chọn thiết lập Merging theo quy định:
   - **Base repository:** `Kahprx/PC_Web_Ban`  *(Đích đến)*
   - **Base:** Chọn `develop` *(TUYỆT ĐỐI KHÔNG CHỌN MAIN)*
   - **Head repository:** `<tên_nick_của_bạn>/PC_Web_Ban` *(Nguồn)*
   - **Compare:** Chọn nhánh vừa push tên là `feature/product`.
3. Điền Title PR mô tả chức năng và bấm **Create Pull Request**.
> **[CHÈN ẢNH GIAO DIỆN TẠO PULL REQUEST THỂ HIỆN RÕ CÁC NHÁNH BASE VÀ HEAD Ở ĐÂY]**

### BƯỚC 5: LEADER THẢM ĐỊNH REVIEW & MERGE
1. **Leader** là người duy nhất sở hữu quyền hành cao nhất vào repo `Kahprx`. 
2. Leader vào tab **Pull Requests**, click vào PR của SV gửi lên. Chuyển qua tab "Files Changed" để kiểm thử dòng code rủi ro. 
3. Nếu Ok, Leader bấm nút màu xanh **"Merge pull request"**. 
> **[CHÈN ẢNH CHỤP MÀN HÌNH NÚT "MERGE PULL REQUEST" Ở BÊN GIAO DIỆN CỦA LEADER VÀO ĐÂY]**

### BƯỚC 6: MERGE DEVELOP -> MAIN VÀ CHUẨN BỊ DEPLOY
Giai đoạn cuối cùng của đồ án, khi cả nhóm đã đóng góp tất cả Code thành công vào `develop`. 
Leader tiến hành gộp vào nhánh chính `main` để làm Sản phẩm (Production):
1. Leader tạo 1 PR mới trên Github, yêu cầu hợp nhất từ `develop` sang `main`.
2. Sau khi kiểm duyệt chéo, PR này được Merge.
3. Code mới nhất trên `main` được đóng gói bằng Docker và deploy tự động lên AWS/Firebase/Salesforce (Nội dung của Bài 5).
> **[CHÈN ẢNH PULL REQUEST TỪ DEVELOP SANG MAIN VÀO ĐÂY]**
