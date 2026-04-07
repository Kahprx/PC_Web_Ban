# Prompt Figma 25 Trang (Bam Sat `src`)

Copy khoi prompt ben duoi vao Figma AI de dung bo frame theo UI trong code:

```text
Thiet ke he thong UI cho website KAH Gaming theo style hien co trong source React:
- Tong trang xam + vang dong + den.
- Card bo tron, border mong, chu dam de doc.
- Layout desktop first 1440px va co bien the mobile 375px.
- Noi dung tieng Viet co dau, khong loi encoding.

Design tokens:
- Primary: #D4AF37
- Primary Dark: #B8932E
- Text: #1F1F1F
- Background: #F1F1F1
- Surface: #FFFFFF
- Border: #D8C8B4

Dark mode:
- Background: #0F1013
- Surface: #17191F
- Border: #2D313D
- Text: #ECE8E1

Yeu cau trang thai:
- Loading / Empty / Error / Success cho form va danh sach.

Danh sach 25 frame:
1) Home
2) Product list tong
3) Danh muc PC
4) Danh muc Linh kien
5) Danh muc Man hinh
6) Danh muc Gaming gear
7) Danh muc Laptop
8) Danh muc Macbook
9) Product detail
10) Cart
11) Checkout
12) Order confirm success
13) Build PC tong quan
14) Build PC modal chon linh kien
15) Build PC ket qua + tong tien + export PDF/Excel
16) Login
17) Register
18) Forgot password
19) Reset password
20) Profile user
21) Order history + order detail + warranty
22) Blog list
23) Blog detail
24) About + Contact
25) Admin dashboard (overview + products + orders + support chat + users)

Thanh phan bat buoc:
- Header co mega menu, search suggest (anh + ma + gia), tai khoan, gio hang.
- Cart drawer dang panel truot tu phai.
- Chat support widget goc phai duoi.
- Admin support chat 2 cot (session list + khung hoi thoai).
- Admin order status: pending / processing / shipping / completed / cancelled.

Prototype flow:
- Home -> Product list -> Product detail -> Cart -> Checkout -> Confirm
- Login -> Forgot password -> Reset password
- Admin dashboard -> Orders -> Update status
- Admin dashboard -> Support chat -> Reply user
```

## Mapping Route Hien Tai

- `/user`
- `/products`
- `/product/:id`
- `/build-pc`
- `/cart`
- `/checkout`
- `/confirm`
- `/login`
- `/register`
- `/forgot-password`
- `/reset-password`
- `/profile`
- `/orders`
- `/orders/:id`
- `/blog`
- `/blog/:slug`
- `/about`
- `/contact`
- `/policy-warranty`
- `/admin/dashboard`
- `/admin/products`
- `/admin/orders`
- `/admin/support-chat`
- `/admin/users`
