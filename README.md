# TutorFlow 🚀
> An intelligent 1-on-1 session management platform for online tutors and students.

TutorFlow helps tutors schedule sessions, manage student profiles, autosave live session notes, and leverage **Google Gemini AI** to generate structured lesson plans and post-session review summaries with homework assignments.

---

## 🛠️ Technology Stack

| Layer | Technology |
| :--- | :--- |
| **Frontend** | React 18, Vite, Vanilla CSS |
| **Backend** | Node.js, Express.js (ES Modules, Port 5000) |
| **Database** | MongoDB with Mongoose ODM |
| **Authentication** | JWT (JSON Web Tokens) with `bcryptjs` password hashing |
| **Authorization** | Strict Server-Side Role-Based Access Control (`tutor` & `student`) |
| **AI Engine** | Google Gemini API (`@google/genai` / REST) |
| **Deployment** | Vercel (Frontend) & Render (Backend) |

---

## 📁 Project Structure

```text
internship/
├── client/                 # Frontend React application (Vite)
│   ├── src/
│   │   ├── components/     # UI Components (Navbar, LoginPage, TutorDashboard, StudentDashboard, RoleTester, AccessDenied)
│   │   ├── context/        # AuthContext (JWT session management, authFetch)
│   │   ├── App.jsx         # App view routing and state manager
│   │   ├── index.css       # Core styling & design tokens
│   │   └── main.jsx        # React root mount
│   ├── .env                # Client environment variables (VITE_API_URL=http://localhost:5000/api)
│   ├── .env.example        # Client environment template
│   ├── package.json
│   └── vite.config.js      # Vite proxy to backend on port 5000
│
├── server/                 # Backend Node.js / Express API (Port 5000)
│   ├── src/
│   │   ├── models/         # Mongoose models (User.js)
│   │   ├── middleware/     # Auth & RBAC middleware (auth.js)
│   │   ├── routes/         # Express routers (auth.js)
│   │   ├── db.js           # MongoDB connection handler
│   │   ├── seed.js         # Idempotent database seed script
│   │   └── index.js        # Express app entry & health endpoint
│   ├── .env                # Server environment variables (PORT=5000, JWT_SECRET, MONGODB_URI)
│   ├── .env.example        # Server environment template
│   └── package.json
│
└── README.md               # Project documentation & setup guide
```

---

## ⚙️ Local Setup Instructions

### Prerequisites
- [Node.js](https://nodejs.org/) (v18 or higher recommended)
- [npm](https://www.npmjs.com/) (v9 or higher)
- [MongoDB](https://www.mongodb.com/) (local instance running on `localhost:27017` or MongoDB Atlas URI)

---

### 1. Backend Setup (`server`)

1. Navigate to the server directory:
   ```bash
   cd server
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Configure environment variables:
   - Copy `.env.example` to `.env`:
     ```bash
     cp .env.example .env
     ```
   - Default `.env` content:
     ```env
     PORT=5000
     CLIENT_URL=http://localhost:5173
     MONGODB_URI=mongodb://localhost:27017/tutorflow
     JWT_SECRET=tutorflow_dev_secret_key_2026_jwt_auth_milestone2
     GEMINI_API_KEY=your_gemini_api_key_here
     ```

4. **Seed Development Test Accounts:**
   ```bash
   npm run seed
   ```
   > 💡 *The seed script is safe and idempotent to run repeatedly without creating duplicates.*

5. Start the backend server:
   - **Development mode (with auto-reload):**
     ```bash
     npm run dev
     ```
   - **Production mode:**
     ```bash
     npm start
     ```
   Backend will run at: `http://localhost:5000`

---

### 2. Frontend Setup (`client`)

1. Open a new terminal and navigate to the client directory:
   ```bash
   cd client
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Configure environment variables:
   - Copy `.env.example` to `.env`:
     ```bash
     cp .env.example .env
     ```
   - Default `.env` content:
     ```env
     VITE_API_URL=http://localhost:5000/api
     ```

4. Start the development server:
   ```bash
   npm run dev
   ```
   The client will run at: `http://localhost:5173`

5. Open [http://localhost:5173](http://localhost:5173) in your browser.

---

## 🔑 Test Credentials (Development)

| Role | Name | Email | Password | Permissions |
| :--- | :--- | :--- | :--- | :--- |
| **👨‍🏫 Tutor** | Alex Rivera (Tutor) | `tutor@tutorflow.com` | `TutorPass123!` | Full tutor management access |
| **👨‍🎓 Student** | Sam Chen (Student) | `student@tutorflow.com` | `StudentPass123!` | Assigned to Alex Rivera (`tutorId`) |

---

## 🔒 Server-Side Authorization & Security Architecture

1. **Authentication (JWT & Bcrypt)**:
   - Passwords are encrypted using `bcryptjs` (salt rounds: 10).
   - Upon login via `POST /api/auth/login`, the server signs a JWT containing `{ userId, role }` with `process.env.JWT_SECRET`.
   - The client stores the token in `localStorage` (`tutorflow_token`) and attaches it to request headers as `Authorization: Bearer <token>`.
2. **Schema Sanitization**:
   - The Mongoose `User` model strips `passwordHash` and `__v` via `toJSON` transform to ensure sensitive hash values are never leaked in API responses.
3. **Role-Based Access Control (RBAC)**:
   - `authenticate` middleware verifies the JWT, rejects malformed/expired tokens with `401 Unauthorized`, and attaches `req.user`.
   - `requireRole(...roles)` middleware verifies role permissions and rejects unauthorized users with `403 Forbidden`.
   - Public signup is disabled to prevent unauthorized account creation.

---

## 🔌 API Endpoints Reference

| Method | Endpoint | Access | Description | Sample Response |
| :--- | :--- | :--- | :--- | :--- |
| `GET` | `/` | Public | API status and endpoint map | `{"name":"TutorFlow API","status":"running",...}` |
| `GET` | `/api/health` | Public | Backend health check | `{"status":"ok"}` |
| `POST` | `/api/auth/login` | Public | User login & JWT issuance | `{"token":"eyJ...","user":{"name":"Alex Rivera",...}}` |
| `GET` | `/api/auth/me` | Authenticated | Current authenticated user profile | `{"user":{"id":"...","email":"tutor@tutorflow.com",...}}` |
| `GET` | `/api/auth/test` | Authenticated | Auth validation & role inspection | `{"status":"ok","message":"...","user":{"role":"tutor"}}` |
| `GET` | `/api/auth/tutor-test` | Tutor Only | Restricted tutor test endpoint (Students get 403) | `{"status":"ok","message":"Tutor access granted."}` |
| `GET` | `/api/auth/student-test` | Student Only | Restricted student test endpoint (Tutors get 403) | `{"status":"ok","message":"Student access granted."}` |

---

## 📋 Milestones Roadmap

1. ✅ **Milestone 1: Project Setup & Health Check**: Vite + React frontend, Express backend, live health check.
2. ✅ **Milestone 2: JWT Authentication & Role-Based Access**: User Mongoose model, bcryptjs hashing, JWT bearer tokens, role middleware (`tutor` vs `student`), idempotent seeding, login page, role dashboards, and 403 access denial guards.
3. ⏳ **Milestone 3: Student Management & Profiles**: Student rosters, subject tags, target goals, weak areas.
4. ⏳ **Milestone 4: Session Lifecycle State Machine**: `Scheduled` ➔ `In progress` ➔ `Completed` ➔ `AI reviewed` with schedule clash prevention.
5. ⏳ **Milestone 5: Live Notes & Gemini AI Assistant**: Debounced autosave notes, AI pre-session lesson plans, and post-session homework reviews.
6. ⏳ **Milestone 6: Deployments**: Vercel (Frontend) & Render (Backend).
