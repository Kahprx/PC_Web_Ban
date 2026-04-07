# GitHub Workflow Quy Dinh

## Branch model
- `master`: nhanh san pham on dinh.
- `develop`: nhanh tich hop.
- `feature/*`: nhanh tung tinh nang.

## Quy tac dat ten
- Mau: `feature/<thanh-vien>/<mo-ta>`
- Vi du:
  - `feature/long/product-crud`
  - `feature/linh/order-transaction`
  - `feature/huy/frontend-checkout`

## Quy trinh lam viec
1. Tao branch tu `develop`.
2. Code + commit nho, ro rang.
3. Push len remote va tao Pull Request vao `develop`.
4. Nhom truong review va merge.
5. Cuoi sprint moi merge `develop` -> `master`.

## Mau commit
- `feat(product): add search with pagination`
- `fix(order): rollback when stock not enough`
- `docs(report): add jira evidence screenshots`
