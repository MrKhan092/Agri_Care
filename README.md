# 🌾 AgriCare

**Smart farming dashboard for Indian farmers** — real-time mandi prices, AI-powered soil analysis, crop care timelines, weather forecasts, farm management tools, and government scheme info — all in one platform.

Built with **React**, **Express**, **MongoDB**, and **JWT cookie-based authentication** with role-based access control.

---

## ✨ Features

| Feature | Description |
|---------|-------------|
| 📊 **Farmer Dashboard** | Farm overview with active crops, upcoming tasks, and quick stats |
| 🏪 **Mandi Prices** | Real-time commodity prices from markets across India |
| 🌤️ **Weather Forecast** | 5-day hyperlocal weather forecasts |
| 🧪 **Soil Analysis** | AI-powered soil health reports from uploaded PDF reports |
| 📅 **Crop Calendar** | Stage-by-stage care timelines for 15+ crops |
| 💰 **Farm Management** | Track expenses, income, and inventory |
| 🏛️ **Govt Schemes** | Central & state subsidies, insurance, and credit info |
| 📰 **Farm News** | Latest agriculture news and updates |
| 🌍 **Farm Profile** | Manage farm details, location, and crops |
| 🗂️ **Land Records** | View and manage land records |
| 🛡️ **Admin Panel** | User management with approve/reject/delete |

---

## 🏗️ Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 19, Vite 8, React Router 7, Recharts, Axios |
| Backend | Node.js, Express 5, Mongoose, JWT, Multer |
| Database | MongoDB 7 |
| AI | Groq SDK (soil analysis) |
| Deployment | Docker, Docker Compose |

---

## 📁 Project Structure

```
Agri_Care/
├── backend/
│   ├── config/db.js                # MongoDB connection
│   ├── middleware/authMiddleware.js # protect + authorize middleware
│   ├── models/
│   │   ├── User.js                 # User schema (admin, farmer)
│   │   ├── Farm.js                 # Farm profile schema
│   │   ├── FarmTransaction.js      # Income/expense records
│   │   ├── InventoryItem.js        # Farm inventory
│   │   ├── SoilBooking.js          # Soil test bookings
│   │   └── SoilReport.js           # AI soil analysis reports
│   ├── routes/
│   │   ├── auth.js                 # Register, login, logout, /me
│   │   ├── admin.js                # User management (approve/reject/delete)
│   │   ├── dashboard.js            # Role-specific dashboard data
│   │   ├── farm.js                 # Farm profile CRUD
│   │   ├── farmManagement.js       # Transactions & inventory
│   │   ├── cropCalendar.js         # Crop stage timelines
│   │   ├── soilTest.js             # Soil booking & AI analysis
│   │   ├── mandiPrice.js           # Live mandi commodity prices
│   │   ├── weather.js              # Weather forecast API
│   │   ├── farmNews.js             # Agriculture news
│   │   └── schemes.js              # Government schemes
│   ├── data/                       # Static data (crop timelines, schemes)
│   ├── utils/                      # AI soil extractor, analyzer
│   ├── seed.js                     # Create default admin user
│   ├── server.js                   # Express entry point
│   ├── Dockerfile
│   └── .env
├── frontend/
│   └── src/
│       ├── api/axios.js            # Axios instance (withCredentials)
│       ├── context/AuthContext.jsx  # Auth state management
│       ├── components/
│       │   ├── ProtectedRoute.jsx  # Role-aware route guard
│       │   └── DashboardLayout.jsx # Sidebar layout
│       └── pages/
│           ├── LandingPage.jsx     # Public landing page
│           ├── Login.jsx           # Login with role selector
│           ├── Register.jsx        # Farmer registration
│           ├── AdminDashboard.jsx  # User management table
│           ├── FarmerDashboard.jsx  # Farm stats & tasks
│           ├── FarmProfile.jsx     # Farm setup & editing
│           ├── FarmManagement.jsx  # Expenses, income, inventory
│           ├── MandiPrice.jsx      # Mandi commodity prices
│           ├── Weather.jsx         # Weather forecasts
│           ├── SoilBooking.jsx     # Book soil test
│           ├── SoilAnalysis.jsx    # AI soil reports
│           ├── CropCalendar.jsx    # Crop care timeline
│           ├── GovSchemes.jsx      # Government schemes
│           ├── FarmNews.jsx        # Agriculture news
│           ├── LandRecords.jsx     # Land records
│           ├── PendingApproval.jsx  # Awaiting approval screen
│           └── Unauthorized.jsx    # Access denied screen
├── docker-compose.yml
└── README.md
```

---

## 👤 Roles

| Role   | Self-Register? | Dashboard Path       |
|--------|----------------|----------------------|
| Admin  | No (seeded)    | `/admin/dashboard`   |
| Farmer | Yes            | `/farmer/dashboard`  |

**How it works:**

1. Farmer registers → status is set to `approved` (auto-approved)
2. Farmer logs in → accesses full dashboard with all features
3. Admin logs in → manages all users (delete accounts)

---

## 🚀 Getting Started

### Prerequisites

- **Node.js** ≥ 18
- **MongoDB** running locally or a MongoDB Atlas URI

### Option 1 — Manual Setup

**1. Clone the repo**

```bash
git clone https://github.com/your-username/Agri_Care.git
cd Agri_Care
```

**2. Backend**

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

**3. Frontend**

```bash
cd frontend

# Install dependencies
npm install

# Start dev server
npm run dev
```

The client starts at **http://localhost:5173**.

---

### Option 2 — Docker Setup

> Only requires **Docker** and **Docker Compose** installed. No need for Node.js or MongoDB on your machine.

**1. Configure environment**

```bash
cd backend
cp .env.example .env
# Edit .env with your values (JWT_SECRET, API keys, etc.)
```

**2. Build and run**

```bash
# From the project root
docker compose up --build
```

This starts 3 containers:

| Service  | Container | Port | Description |
|----------|-----------|------|-------------|
| MongoDB  | `agricare-mongo` | `27017` | Database with persistent volume |
| Backend  | `agricare-backend` | `5000` | Express API server |
| Frontend | `agricare-frontend` | `80` | React app served by Nginx |

**3. Access the app**

- Frontend → **http://localhost**
- Backend API → **http://localhost:5000/api**

**4. Seed admin user**

```bash
docker compose exec backend node seed.js
```

**5. Stop everything**

```bash
docker compose down
```

To also remove the database volume:

```bash
docker compose down -v
```

---

### Deploying to AWS (or any server)

Update the build arg and environment in `docker-compose.yml`:

```yaml
# frontend build arg — point to your server's public IP/domain
args:
  VITE_API_URL: http://your-server-ip:5000/api

# backend environment — allow frontend origin for CORS
environment:
  - CLIENT_URL=http://your-server-ip
```

Then run `docker compose up --build -d` on the server.

---

## 🔐 Default Admin Credentials

| Field    | Value              |
|----------|--------------------|
| Email    | `admin@agricare.com` |
| Password | `admin123`         |

> ⚠️ **Change these in production!** Set `ADMIN_EMAIL` and `ADMIN_PASSWORD` in `.env` before running `npm run seed`.

---

## ⚙️ Environment Variables

Configure these in `backend/.env`:

| Variable          | Description                | Default                               |
|-------------------|----------------------------|---------------------------------------|
| `PORT`            | API server port            | `5000`                                |
| `MONGO_URI`       | MongoDB connection URI     | `mongodb://localhost:27017/agri_care`  |
| `JWT_SECRET`      | Secret key for JWT tokens  | *(change in production!)*             |
| `CLIENT_URL`      | Frontend origin for CORS   | `http://localhost:5173`               |
| `ADMIN_NAME`      | Default admin name         | `Admin`                               |
| `ADMIN_EMAIL`     | Default admin email        | `admin@agricare.com`                  |
| `ADMIN_PASSWORD`  | Default admin password     | `admin123`                            |
| `DATA_GOV_API_KEY`| data.gov.in API key        | *(required for mandi prices)*         |

---

## 📡 API Endpoints

### Auth
| Method | Endpoint             | Auth | Description                    |
|--------|----------------------|------|--------------------------------|
| POST   | `/api/auth/register` | ✗    | Create farmer account          |
| POST   | `/api/auth/login`    | ✗    | Sign in                        |
| POST   | `/api/auth/logout`   | ✗    | Clear auth cookie              |
| GET    | `/api/auth/me`       | ✓    | Get current user               |

### Admin
| Method | Endpoint                       | Description             |
|--------|--------------------------------|-------------------------|
| GET    | `/api/admin/users`             | List users (filterable) |
| PATCH  | `/api/admin/users/:id/approve` | Approve a user          |
| PATCH  | `/api/admin/users/:id/reject`  | Reject a user           |
| DELETE | `/api/admin/users/:id`         | Delete a user           |

### Dashboard
| Method | Endpoint                | Role   | Description         |
|--------|-------------------------|--------|---------------------|
| GET    | `/api/dashboard/admin`  | admin  | Admin stats         |
| GET    | `/api/dashboard/farmer` | farmer | Farm data & tasks   |

### Farm Profile
| Method | Endpoint     | Description              |
|--------|--------------|--------------------------|
| GET    | `/api/farm`  | Get user's farm profile  |
| POST   | `/api/farm`  | Create farm profile      |
| PUT    | `/api/farm`  | Update farm profile      |

### Farm Management
| Method | Endpoint                                  | Description            |
|--------|-------------------------------------------|------------------------|
| GET    | `/api/farm-management/transactions`       | List transactions      |
| POST   | `/api/farm-management/transactions`       | Add transaction        |
| DELETE | `/api/farm-management/transactions/:id`   | Delete transaction     |
| GET    | `/api/farm-management/inventory`          | List inventory         |
| POST   | `/api/farm-management/inventory`          | Add inventory item     |
| DELETE | `/api/farm-management/inventory/:id`      | Delete inventory item  |

### Other APIs
| Method | Endpoint                | Description                    |
|--------|-------------------------|--------------------------------|
| GET    | `/api/mandi-price`      | Live commodity prices          |
| GET    | `/api/weather`          | Weather forecast               |
| GET    | `/api/farm-news`        | Agriculture news               |
| GET    | `/api/crop-calendar`    | Crop stage timelines           |
| GET    | `/api/schemes`          | Government schemes             |
| POST   | `/api/soil-test/book`   | Book soil test                 |
| POST   | `/api/soil-test/upload` | Upload soil report PDF         |
| GET    | `/api/health`           | Health check                   |

---

## 📄 License

MIT
