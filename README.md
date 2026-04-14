# Clash Check Diary — Web App

Phiên bản web của file Excel Clash Check Diary. Multi-user, real-time, deploy miễn phí.

---

## 🗂 Tính năng

- **Dashboard** — KPI cards, By Coordinator, By Month (đến tháng hiện tại), By Project
- **Project Detail** — nhập/sửa packages, inline editing, import file .xlsx clash report
- **Weekly Report** — chọn tuần, xem packages trong tuần đó
- **Free Clash** — tổng hợp tất cả packages có tên "Free Clash"
- **Auth** — login bằng email/password (5 tài khoản)

---

## ⚙️ Setup (lần đầu ~15 phút)

### Bước 1: Tạo Supabase project

1. Vào [supabase.com](https://supabase.com) → **New project**
2. Đặt tên project, chọn region gần nhất (Singapore)
3. Chờ project khởi động (~2 phút)

### Bước 2: Tạo database

1. Vào **SQL Editor** → **New query**
2. Copy toàn bộ nội dung file `supabase/schema.sql`
3. Paste vào → **Run**

### Bước 3: Lấy API keys

1. Vào **Project Settings** → **API**
2. Copy 2 giá trị:
   - **Project URL** → `VITE_SUPABASE_URL`
   - **anon public key** → `VITE_SUPABASE_ANON_KEY`

### Bước 4: Tạo 5 tài khoản user

1. Vào **Authentication** → **Users** → **Add user**
2. Tạo lần lượt 5 email/password cho team
   ```
   Ví dụ:
   dat@company.com        / password123
   phuong@company.com     / password123
   tuan@company.com       / password123
   tuyen@company.com      / password123
   vu@company.com         / password123
   ```

### Bước 5: Deploy lên Vercel

1. Push code lên GitHub:
   ```bash
   git init
   git add .
   git commit -m "init"
   git remote add origin https://github.com/your-username/clash-diary
   git push -u origin main
   ```

2. Vào [vercel.com](https://vercel.com) → **New Project** → Import repo vừa tạo

3. Thêm **Environment Variables**:
   ```
   VITE_SUPABASE_URL      = https://xxx.supabase.co
   VITE_SUPABASE_ANON_KEY = eyJ...
   ```

4. Click **Deploy** → Vercel tự build và cấp link (vd: `clash-diary.vercel.app`)

---

## 💻 Chạy local (để test)

```bash
# Cài dependencies
npm install

# Tạo file .env.local
cp .env.example .env.local
# Điền VITE_SUPABASE_URL và VITE_SUPABASE_ANON_KEY vào .env.local

# Chạy dev server
npm run dev
# → Mở http://localhost:5173
```

---

## 🔄 Luồng sử dụng

### Coordinator (nhập data)
1. Login → vào project sheet mình phụ trách
2. Click **Add row** → nhập Work Package name
3. Chọn ngày Start/Finish, Status, Coordinator
4. Click **xlsx** ở cuối row → upload file clash report từ Navisworks
5. App tự parse và điền STR/MEP, ARC/STR, ARC/MEP, MEP/MEP
6. Click **Save** để lưu

### Manager (xem dashboard)
1. Login → Dashboard tự tính toàn bộ
2. Click **Refresh** để cập nhật
3. Click tên project để vào chi tiết
4. Vào **Weekly Report** → chọn tuần để xem báo cáo

---

## 🏗 Tech stack

| Tầng | Công nghệ | Chi phí |
|------|-----------|---------|
| Frontend | React 18 + Vite + Tailwind CSS | Miễn phí |
| Database + Auth | Supabase (PostgreSQL) | Miễn phí đến 500MB |
| Hosting | Vercel | Miễn phí |

**Tổng chi phí: $0/tháng** cho team 5 người.

---

## 🗃 Cấu trúc file

```
clash-diary/
├── src/
│   ├── contexts/AuthContext.jsx   # Login state
│   ├── lib/supabase.js            # Database client
│   ├── pages/
│   │   ├── Login.jsx              # Trang đăng nhập
│   │   ├── Dashboard.jsx          # Dashboard chính
│   │   ├── ProjectDetail.jsx      # Chi tiết project
│   │   ├── WeeklyReport.jsx       # Báo cáo tuần
│   │   └── FreeClash.jsx          # Free clash packages
│   └── components/
│       ├── Layout.jsx             # Sidebar + navigation
│       ├── ImportModal.jsx        # Upload & parse xlsx
│       └── NewProjectModal.jsx    # Tạo project mới
├── supabase/schema.sql            # Database schema
├── .env.example                   # Template env vars
└── vercel.json                    # Vercel SPA routing
```

---

## ❓ FAQ

**Q: Thêm coordinator mới?**
Mở `src/pages/ProjectDetail.jsx`, tìm `const COORDS = [...]` và thêm tên vào.

**Q: Thêm trạng thái mới?**
Tìm `const STATUSES = [...]` trong `ProjectDetail.jsx`.

**Q: Export báo cáo ra Excel?**
Tính năng này có thể bổ sung sau. Hiện tại có thể print/screenshot từ browser.

**Q: App có hoạt động offline không?**
Cần kết nối internet để đọc/ghi dữ liệu Supabase.
