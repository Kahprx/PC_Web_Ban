# CHƯƠNG 3: QUẢN LÝ MÃ NGUỒN GITHUB & WORKFLOW NHÓM

**Dự án:** PC_Web_Ban  
**Repo Chính (Company Repo):** https://github.com/Kahprx/PC_Web_Ban  
**Mô hình áp dụng:** CASE 2 - FORK + PULL REQUEST (Chuẩn quy trình doanh nghiệp lớn).

---

## 👨‍💻 PHÂN CÔNG THÀNH VIÊN VÀ NHÁNH (BRANCH)

Vì nhóm chỉ có 2 thành viên nên quy trình chia việc được cấu trúc xoay quanh Frontend (Kha) và Backend (Dũng):

| Thành viên | Vai trò | Trách nhiệm | Tên nhánh (Branch) |
| :--- | :--- | :--- | :--- |
| **Kha** | Lập trình Frontend | Xử lý diện mạo, UI/UX (Login, Cart, Home...) | VD: `feature/kha-frontend`, `feature/ui-cart` |
| **Dũng** | Lập trình Backend | Xử lý API, Code luồng Checkout hệ thống | VD: `feature/dung-backend`, `feature/api-payment` |
| **Leader (Chung)** | Quản trị viên Repo `Kahprx`| Tạo nhánh `develop`, Review Code, Merge PR | `main` & `develop` |

---

## 🛠 HƯỚNG DẪN TỪNG BƯỚC ĐỂ SINH VIÊN BÁO CÁO MÔN HỌC

### BƯỚC 1: XÁC LẬP REPO CHÍNH VÀ NHÁNH DEV (LEADER LÀM)
Nhóm sẽ sử dụng chung kho lưu trữ `Kahprx`. (Thao tác này nhóm ĐÃ ĐƯỢC CHẠY BẰNG TOOL THÀNH CÔNG RỒI).
1. Khởi tạo và đẩy nhánh:
   ```bash
   git clone https://github.com/Kahprx/PC_Web_Ban.git
   cd PC_Web_Ban
   git checkout -b develop
   git push origin develop
   ```
2. **YÊU CẦU BÁO CÁO:** Bạn chụp lại kho lưu trữ Github chỗ Dropdown nhánh thấy đủ 2 nhánh `main` và `develop`.
> **[CHÈN ẢNH REPO CÓ LIBRARIES MAIN & DEVELOP TẠI ĐÂY]**

### BƯỚC 2: CÁC THÀNH VIÊN FORK VÀ CLONE (Trường hợp nhóm muốn đóng giả Case 2)
Kha và Dũng bấm vào link gốc, ấn nút **Fork** (Góc phải trên cùng) để tạo bản copy chức năng về nick Github Desktop cá nhân của mỗi người.
1. Clone repo Fork về máy cá nhân:
   ```bash
   git clone https://github.com/<tên_nick_của_bạn>/PC_Web_Ban.git
   cd PC_Web_Ban
   ```
2. Thêm liên kết ngược về Repo Project (để sau này cập nhật Code chuẩn):
   ```bash
   git remote add upstream https://github.com/Kahprx/PC_Web_Ban.git
   ```

### BƯỚC 3: TẠO NHÁNH CHỨC NĂNG VÀ LẬP TRÌNH CODE
Tuyệt đối tuân thủ quy tắc KHÔNG code trực tiếp trên `main`.
1. Đồng bộ code `develop` gốc nhất:
   ```bash
   git fetch upstream
   git checkout -b develop upstream/develop
   ```
2. Tách nhánh. **Ví dụ Kha phụ trách Frontend Login:**
   ```bash
   git checkout -b feature/kha-frontend-login
   ```
3. Chỉnh sửa code, ghi lại Lịch sử (kèm Mã Jira của bài 4 để liên kết liên hoàn):
   ```bash
   git add .
   git commit -m "TASK-01: Kha hoan thien UI Login Form"
   git push origin feature/kha-frontend-login
   ```

### BƯỚC 4: TẠO PULL REQUEST (PR) VÀ CODE REVIEW
1. Lên lại trang nick cá nhân bấm nút **"Compare & pull request"** màu xanh bự.
2. **CHIẾN THUẬT SIÊU QUAN TRỌNG CHỖ NÀY:**
   - **Base repository:** `Kahprx/PC_Web_Ban`  *(Đích đến)*
   - **Base:** Chọn `develop` *(TUYỆT ĐỐI KHÔNG GHÉP VÀO MAIN)*
   - **Head repository:** `<tên_nick_của_Kha hoặc Dũng>/PC_Web_Ban` *(Nguồn)*
   - **Compare:** Chọn nhánh vừa làm là `feature/kha-frontend-login`.
3. Bấm **Create Pull Request**.
> **[CHÈN ẢNH GIAO DIỆN TẠO PULL REQUEST CHỨA BASE VÀ HEAD Ở ĐÂY VÀO TRONG WORD CỦA BẠN]**

### BƯỚC 5: LEADER THẨM ĐỊNH REVIEW & MERGE
1. **Dũng** có thể vào đóng vai trò thủ kho, rà soát code của **Kha**.
2. Dũng vào kho `Kahprx`, vào tab **Pull Requests**, chuyển xuống tab "Files Changed" để kiểm thử Code có bị xung đột (conflict) không. 
3. Nếu Ok, Dũng bấm nút màu xanh **"Merge pull request"** để trộn code UI của Kha vào code API của Dũng. (Như lúc nãy mình mới nhắc bạn bấm đó!).
> **[CHÈN ẢNH CHỤP MÀN HÌNH NÚT "MERGE PULL REQUEST" Ở BÊN GIAO DIỆN GITHUB VÀO ĐÂY]**

### BƯỚC 6: MERGE DEVELOP -> MAIN VÀ CHUẨN BỊ DEPLOY
Sau nhiều vòng Sprint cực khổ, app PC Store coi như viết xong trên `develop`. 
Nhóm trưởng tiến hành gộp vào nhánh chính `main` để mang đi chạy Demo cho giảng viên xem (Production):
1. Tạo 1 PR mới trên Github, đẩy từ `develop` qua `main`.
2. Hợp nhất thành công.
3. Code mới nhất trên `main` sẽ được đóng gói Node/Vite và tự động bắn lên máy bay rải thảm Server Cloud AWS hoặc Firebase bằng Command Line.
> **[CHÈN ẢNH PULL REQUEST TỪ DEVELOP SANG MAIN VÀO ĐÂY LÀ ĐẸP ĐIỂM 10]**
