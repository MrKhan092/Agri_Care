# 🌾 AgriCare

Farm management dashboard for modern farmers — built with React, Express, MongoDB, and JWT cookie-based auth with role-based access control (RBAC).

## Project Structure

```
Agri_Care/
├── backend/
│   ├── config/db.js              # MongoDB connection
│   ├── middleware/authMiddleware.js  # protect + authorize middleware
│   ├── models/User.js            # User schema (role, status, profile fields)
│   ├── routes/
│   │   ├── auth.js               # Register, login, logout, /me
│   │   ├── admin.js              # User management (approve/reject/delete)
│   │   └── dashboard.js          # Role-specific dashboard data
│   ├── seed.js                   # Create default admin user
│   ├── server.js                 # Express entry point
│   └── .env                      # Environment variables
├── frontend/
│   └── src/
│       ├── api/axios.js          # Axios instance (withCredentials)
│       ├── components/ProtectedRoute.jsx  # Role-aware route guard
│       ├── context/AuthContext.jsx        # Auth state management
│       └── pages/
│           ├── Login.jsx
│           ├── Register.jsx       # Role selector + conditional fields
│           ├── AdminDashboard.jsx  # User management table
│           ├── FarmerDashboard.jsx # Farm stats & tasks
│           ├── SupplierDashboard.jsx  # Business & orders
│           ├── PendingApproval.jsx # Shown while awaiting admin approval
│           └── Unauthorized.jsx   # Role mismatch page
└── README.md
```

## Roles & Approval Flow

| Role     | Self-Register? | Requires Approval? | Dashboard Path         |
|----------|----------------|---------------------|------------------------|
| Admin    | No (seeded)    | No (auto-approved)  | `/admin/dashboard`     |
| Farmer   | Yes            | Yes                 | `/farmer/dashboard`    |
| Supplier | Yes            | Yes                 | `/supplier/dashboard`  |

### How it works

1. **Farmer/Supplier registers** → status is set to `pending`
2. User sees "Account Pending Approval" page
3. **Admin logs in** → sees all users in the management table
4. Admin **approves or rejects** the user
5. Approved users can log in and access their role-specific dashboard
6. Rejected users see an error on login attempt

## Prerequisites

- **Node.js** ≥ 18
- **MongoDB** running locally or a MongoDB Atlas URI

## Setup

### 1. Backend

```bash
cd backend

# Copy env template and edit values
cp .env.example .env

# Install dependencies
npm install

# Seed the default admin user
npm run seed

# Start dev server (with nodemon)
npm run dev
```

The API starts at **http://localhost:5000**.

### 2. Frontend

```bash
cd frontend

# Install dependencies
npm install

# Start dev server
npm run dev
```

The client starts at **http://localhost:5173**.

## Default Admin Credentials

| Field    | Value              |
|----------|--------------------|
| Email    | `admin@agricare.com` |
| Password | `admin123`         |

> ⚠️ Change these in production! Set `ADMIN_EMAIL` and `ADMIN_PASSWORD` in `.env` before running `npm run seed`.

## Environment Variables (backend/.env)

| Variable        | Description                  | Default                                |
|----------------|------------------------------|----------------------------------------|
| `PORT`         | API server port              | `5000`                                 |
| `MONGO_URI`    | MongoDB connection URI       | `mongodb://localhost:27017/agri_care`   |
| `JWT_SECRET`   | Secret key for JWT           | *(change this in production!)*         |
| `CLIENT_URL`   | Frontend origin for CORS     | `http://localhost:5173`                |
| `ADMIN_NAME`   | Default admin name           | `Admin`                                |
| `ADMIN_EMAIL`  | Default admin email          | `admin@agricare.com`                   |
| `ADMIN_PASSWORD`| Default admin password      | `admin123`                             |

## API Endpoints

### Auth
| Method | Endpoint             | Auth | Description                          |
|--------|----------------------|------|--------------------------------------|
| POST   | `/api/auth/register` | ✗    | Create farmer/supplier account       |
| POST   | `/api/auth/login`    | ✗    | Sign in (blocked if pending/rejected)|
| POST   | `/api/auth/logout`   | ✗    | Clear auth cookie                    |
| GET    | `/api/auth/me`       | ✓    | Get current user (role + status)     |

### Admin (requires admin role)
| Method | Endpoint                       | Description           |
|--------|--------------------------------|-----------------------|
| GET    | `/api/admin/users`             | List users (filterable) |
| PATCH  | `/api/admin/users/:id/approve` | Approve a user        |
| PATCH  | `/api/admin/users/:id/reject`  | Reject a user         |
| DELETE | `/api/admin/users/:id`         | Delete a user         |

### Dashboard (role-specific)
| Method | Endpoint                 | Role     | Description           |
|--------|--------------------------|----------|-----------------------|
| GET    | `/api/dashboard/admin`   | admin    | Admin stats           |
| GET    | `/api/dashboard/farmer`  | farmer   | Farm data & tasks     |
| GET    | `/api/dashboard/supplier`| supplier | Business & orders     |

## License

MIT
