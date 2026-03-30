# 🎓 Tawjih — Plateforme d'Orientation Post-Bac au Maroc

> A full-stack orientation platform for Moroccan students, built with React + Vite, Node.js/Express, and Supabase.

---

## 🗂️ Project Structure

```
tawjih/
├── frontend/          # React + Vite frontend
│   └── src/
│       ├── components/   # Reusable UI components
│       ├── pages/        # Route pages
│       ├── hooks/        # Custom React hooks
│       ├── lib/          # Supabase client, utils
│       ├── context/      # Auth & theme context
│       └── styles/       # Global CSS
├── backend/           # Express.js REST API
│   ├── routes/        # API route handlers
│   ├── controllers/   # Business logic
│   ├── middleware/    # Auth & role guards
│   ├── config/        # Supabase config
│   └── utils/         # Helper functions
└── README.md
```

---

## ⚡ Quick Start

### Prerequisites
- Node.js 18+
- A Supabase project (free at supabase.com)

### 1. Clone & Install

```bash
# Install frontend dependencies
cd frontend && npm install

# Install backend dependencies
cd ../backend && npm install
```

### 2. Supabase Setup

Go to your Supabase project → SQL Editor, and run the schema in `backend/config/schema.sql`.

### 3. Environment Variables

**Frontend** — create `frontend/.env`:
```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
VITE_API_URL=http://localhost:3001
```

**Backend** — create `backend/.env`:
```env
PORT=3001
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_KEY=your-service-role-key
JWT_SECRET=your-jwt-secret-min-32-chars
FRONTEND_URL=http://localhost:5173
```

### 4. Run the App

```bash
# Terminal 1 — Backend
cd backend && npm run dev

# Terminal 2 — Frontend
cd frontend && npm run dev
```

Open http://localhost:5173

---

## 🔐 Roles

| Role    | Access                                                   |
|---------|----------------------------------------------------------|
| student | Dashboard, questionnaire, school search, saved paths     |
| admin   | Full CRUD on schools/programs, user management, stats    |

To make a user admin: In Supabase → Table Editor → `users` → set `role = 'admin'`

---

## 📡 API Routes

| Method | Endpoint                    | Description                  | Auth         |
|--------|-----------------------------|------------------------------|--------------|
| POST   | /api/auth/register          | Register new user            | Public       |
| POST   | /api/auth/login             | Login                        | Public       |
| GET    | /api/students/profile       | Get student profile          | Student      |
| PUT    | /api/students/profile       | Update profile               | Student      |
| POST   | /api/orientation/submit     | Submit questionnaire         | Student      |
| GET    | /api/orientation/results    | Get recommendations          | Student      |
| GET    | /api/schools                | List schools (with filters)  | Public       |
| GET    | /api/schools/:id            | School detail                | Public       |
| POST   | /api/schools                | Add school                   | Admin        |
| PUT    | /api/schools/:id            | Update school                | Admin        |
| DELETE | /api/schools/:id            | Delete school                | Admin        |
| GET    | /api/admins/users           | List all users               | Admin        |
| PUT    | /api/admins/users/:id       | Update user (suspend, role)  | Admin        |
| GET    | /api/admins/stats           | Platform statistics          | Admin        |
| POST   | /api/admins/create          | Create admin account         | Admin        |

---

## 🧪 Tech Stack

- **Frontend**: React 18, Vite, React Router v6, TailwindCSS
- **Backend**: Node.js, Express.js
- **Database & Auth**: Supabase (PostgreSQL + GoTrue Auth)
- **Design**: "The Modern Riad" — teal/amber palette, Manrope + Inter fonts
