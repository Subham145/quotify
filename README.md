# Quotify (Frontend + Backend Split)

Project is now organized into individual folders without changing app logic:

- `frontend/` : React + Vite UI
- `backend/` : Express + SQLite + optional Mongo sync

## Run

From project root:

```bash
npm install
npm run dev:all
```

- Frontend: `http://127.0.0.1:5173`
- Backend: `http://localhost:4050/api`
- Frontend: `http://localhost:5180`

## Workspace scripts (root)

- `npm run dev:frontend`
- `npm run dev:backend`
- `npm run dev:all`
- `npm run build`

## Login

- SuperAdmin: `superadmin@quotify.local` / `superadmin123`
- Admin: `admin@quotify.local` / `admin123`
- User: `user@quotify.local` / `user123`
