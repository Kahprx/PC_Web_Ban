# Phan tich nghiep vu PC Store

## 1. Tac nhan
- User: xem san pham, tim kiem, build PC, dat hang.
- Admin: CRUD san pham, quan ly don hang, thong ke doanh thu.

## 2. Use case chinh
- UC01 Dang ky/Dang nhap.
- UC02 Xem danh sach san pham + tim kiem theo ten/mo ta.
- UC03 Xem chi tiet san pham.
- UC04 Them gio hang va cap nhat so luong.
- UC05 Build PC (chon linh kien theo nhom).
- UC06 Checkout tao don hang.
- UC07 Admin CRUD category/product.
- UC08 Admin xem danh sach don, cap nhat trang thai.
- UC09 Admin xem dashboard thong ke tong don va tong doanh thu.

## 3. Rule nghiep vu
- Gia tri don hang = tong (so luong * don gia) cua order_items.
- Khong cho dat hang neu stock_qty khong du.
- Tao don hang bat buoc dung transaction (BEGIN/COMMIT/ROLLBACK).
- API quan tri yeu cau JWT role = admin.
- User chi duoc xem don cua chinh minh.

## 4. Mapping database (5 bang)
- users 1-N orders
- categories 1-N products
- orders 1-N order_items
- products 1-N order_items

## 5. Mapping API bat buoc
- Auth: register, login, profile
- Product: list/search, create, update, delete
- Order: create (transaction), list my orders, list all (admin)
- Stats: overview (admin)
- Upload: image upload local /uploads
