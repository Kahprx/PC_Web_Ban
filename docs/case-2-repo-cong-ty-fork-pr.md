# II. CASE 2: REPO CONG TY (FORK + PULL REQUEST)

Ap dung cho team lon, lam viec theo chuan doanh nghiep.

## Luong lam viec

`fork -> feature -> PR (Pull Request) -> develop -> main`

## 1) Fork repo cong ty

- Truy cap repo cong ty tren GitHub.
- Bam `Fork` de tao ban sao ve tai khoan ca nhan.

## 2) Clone repo ca nhan

```bash
git clone https://github.com/<your-username>/<repo-name>.git
cd <repo-name>
```

## 3) Add upstream (repo cong ty)

```bash
git remote add upstream https://github.com/<company-org>/<repo-name>.git
git remote -v
```

## 4) Fetch code tu upstream

```bash
git fetch upstream
```

## 5) Tao branch develop tu upstream

```bash
git checkout -b develop upstream/develop
git push -u origin develop
```

Neu cong ty dung `main` lam branch goc thi thay `upstream/develop` bang `upstream/main`.

## 6) Tao branch feature/task

```bash
git checkout develop
git pull upstream develop
git checkout -b feature/<ticket-id>-<short-name>
```

Vi du:

```bash
git checkout -b feature/PC-142-reset-password-ui
```

## 7) Code va commit (mau dung ngay)

```bash
git status
git add .
git commit -m "feat(auth): implement reset password ui"
```

Mau commit message nen dung:

- `feat(<scope>): <noi dung>`
- `fix(<scope>): <noi dung>`
- `refactor(<scope>): <noi dung>`
- `docs(<scope>): <noi dung>`
- `test(<scope>): <noi dung>`

Vi du:

```bash
git commit -m "fix(cart): handle empty guest cart safely"
git commit -m "docs(readme): add setup env section"
```

## 8) Push len origin

```bash
git push -u origin feature/<ticket-id>-<short-name>
```

## 9) Tao Pull Request vao develop

Target:

- `base`: `company/develop`
- `compare`: `<your-username>:feature/<ticket-id>-<short-name>`

Co the tao bang GitHub UI hoac CLI:

```bash
gh pr create \
  --repo <company-org>/<repo-name> \
  --base develop \
  --head <your-username>:feature/<ticket-id>-<short-name> \
  --title "[<ticket-id>] <short title>" \
  --body "Mo ta thay doi, cach test, anh huong."
```

## 10) Leader review va merge vao develop

- Dev khong tu merge neu chua duoc duyet.
- Sau khi dat yeu cau review/check CI, leader merge PR vao `develop`.

## 11) Merge develop vao main

Buoc nay do leader/release owner thuc hien theo chu ky phat hanh:

```bash
git checkout main
git pull origin main
git merge --no-ff develop
git push origin main
```

## Dong bo fork sau moi dot merge

```bash
git checkout develop
git fetch upstream
git merge upstream/develop
git push origin develop
```

# III. QUY TAC BAT BUOC

- Khong code truc tiep tren `main`.
- Khong merge truc tiep `feature` vao `main`.
- Bat buoc tao Pull Request.
- Bat buoc co leader review truoc khi merge.

## Checklist nhanh truoc khi tao PR

- Da pull moi nhat tu `upstream/develop`.
- Da pass test/lint/build local.
- Commit message ro rang.
- Mo ta PR co: muc tieu, pham vi, cach test, anh huong.
- Co gan reviewer/leader.
