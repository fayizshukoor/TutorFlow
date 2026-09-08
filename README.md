# TutorFlow 🚀
> An intelligent 1-on-1 session management platform for online tutors and students.

TutorFlow helps tutors schedule sessions, manage student profiles, autosave live session notes, and leverage **Google Gemini AI** to generate structured lesson plans and post-session review summaries with homework assignments.

---

## 🌐 Live Application Deployments

| Resource | URL |
| :--- | :--- |
| **Frontend (Vercel)** | https://tutor-flow-xn2k.vercel.app |
| **Backend API (Render)** | https://tutorflow-i8gb.onrender.com |
| **Health Check** | https://tutorflow-i8gb.onrender.com/api/health |
| **GitHub Repository** | https://github.com/fayizshukoor/TutorFlow |

---

## 🔑 Test Credentials (Development & Demo)

| Role | Name | Email | Password | Linked Student Profile | Permissions |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **👨‍🏫 Tutor** | Alex Rivera (Tutor) | `tutor@tutorflow.com` | `TutorPass123!` | — | Full tutor administration, student roster management, profile CRUD |
| **👨‍🎓 Student** | Sam Chen (Student) | `student@tutorflow.com` | `StudentPass123!` | AP Calculus BC (Grade 12 / Advanced) | Assigned to Alex Rivera (`tutorId`), student profile access (Read-Only) |

> 💡 *The student account is linked to the seeded tutor account.*

---

## 🛠️ Technology Stack

| Layer | Technology |
| :--- | :--- |
| **Frontend** | React 18, Vite, React Router 7, Vanilla CSS, Lucide Icons |
| **Backend** | Node.js, Express.js (ES Modules, Port 5000) |
| **Database** | MongoDB Atlas with Mongoose ODM |
| **Authentication** | JWT (JSON Web Tokens) with `bcryptjs` password hashing |
| **Authorization** | Strict Server-Side Role-Based Access Control (`tutor` & `student`) with Ownership Enforcement |
| **AI Engine** | Google Gemini API (`@google/genai` / REST) |
| **Deployment** | Vercel (Frontend) & Render (Backend) |

---

## 📁 Project Structure

```text
TutorFlow/
├── client/                 # Frontend React application (Vite)
│   ├── src/
│   │   ├── app/            # Application orchestration & routing
│   │   │   ├── App.jsx                 # Provider shell (AuthProvider & RouterProvider)
│   │   │   └── router.jsx              # Declarative routes & role protection
│   │   ├── components/     # Reusable layout & common components
│   │   │   ├── auth/
│   │   │   │   ├── AccessDenied.jsx    # 403 Forbidden safeguard page
│   │   │   │   ├── LoginPage.jsx       # Sign in view with demo quick-fill
│   │   │   │   └── ProtectedRoute.jsx  # Client-side role route guard
│   │   │   ├── common/
│   │   │   │   └── HomePage.jsx        # Public landing page with stack summary
│   │   │   └── layout/
│   │   │       ├── Navbar.jsx          # Responsive header navigation & role indicators
│   │   │       └── RootLayout.jsx      # Root application layout wrapper
│   │   ├── context/        # React Context
│   │   │   └── AuthContext.jsx         # JWT session management & auth API state
│   │   ├── features/       # Feature modules
│   │   │   ├── dashboard/
│   │   │   │   ├── RoleTester.jsx      # Live interactive RBAC endpoint verifier
│   │   │   │   ├── StudentDashboard.jsx# Student view with enrolled academic profile
│   │   │   │   ├── TutorConsole.jsx    # Protected tutor verification console
│   │   │   │   └── TutorDashboard.jsx  # Tutor administration overview
│   │   │   └── students/
│   │   │       ├── StudentCreateModal.jsx # Student enrollment modal with dynamic tag editors
│   │   │       ├── StudentList.jsx     # Student roster, search filter & stats counters
│   │   │       └── StudentProfile.jsx  # Student detail view & inline edit form
│   │   ├── services/       # Client API service layer
│   │   │   └── api.js                  # Centralized fetch wrapper (authApi, studentApi)
│   │   ├── styles/         # Modular CSS architecture
│   │   │   ├── tokens.css              # Design tokens (colors, gradients, typography)
│   │   │   ├── base.css                # Global CSS reset & foundational styles
│   │   │   ├── layout.css              # Containers, headers, footers & hero sections
│   │   │   ├── navigation.css          # Top navigation bar & menus
│   │   │   ├── forms.css               # Form controls, inputs & login cards
│   │   │   ├── dashboards.css          # Dashboard metrics, grids & cards
│   │   │   ├── students.css            # Roster grid, student cards & profile styles
│   │   │   └── responsive.css          # Tablet & mobile media queries
│   │   └── main.jsx        # React root entry point
│   ├── .env.example        # Client environment template
│   ├── package.json
│   └── vite.config.js      # Vite proxy to backend on port 5000
│
├── server/                 # Backend Node.js / Express API (Port 5000)
│   ├── src/
│   │   ├── config/         # Server configuration
│   │   │   └── db.js                   # MongoDB connection handler
│   │   ├── middleware/     # Auth & RBAC middleware (authenticate, requireTutor, requireStudent)
│   │   ├── models/         # Mongoose models
│   │   │   ├── Student.js              # Student schema (userId, tutorId, goals, weakAreas)
│   │   │   └── User.js                 # User schema (roles: tutor, student)
│   │   ├── routes/         # Express routers
│   │   │   ├── auth.js                 # Auth endpoints (/login, /me, /test)
│   │   │   └── students.js             # Tutor student CRUD & ownership checks
│   │   ├── scripts/        # Operational and CLI scripts
│   │   │   └── seed.js                 # Idempotent database seed script (Users & Student Profile)
│   │   └── index.js        # Express app entry & health endpoint
│   ├── .env.example        # Server environment template
│   └── package.json
│
└── README.md               # Project documentation & setup guide
```

---

## 🔒 Security Architecture & Ownership Enforcement

1. **Authentication (JWT & Bcrypt)**:
   - Passwords are encrypted using `bcryptjs` (salt rounds: 10).
   - JWT tokens carry `{ userId, role }` and are verified on each API call.
2. **Student Model Schema & Data Relations**:
   - `userId`: Reference to `User` model (`required: true`, `unique: true`).
   - `tutorId`: Reference to `User` model (`required: true`, `index: true`).
   - `name`: Student name (`required: true`, `trim: true`).
   - `email`: Normalized lowercase email with regex format validation.
   - `subject`: Primary subject (`required: true`, `trim: true`).
   - `currentLevel`: Academic level string (`required: true`, `trim: true`).
   - `learningGoals`: Array of string goals (`[String]`).
   - `weakAreas`: Array of string focus/weakness topics (`[String]`).
   - Schema transforms (`toJSON`/`toObject`) strip `__v` and format `id`.
3. **Server-Side Ownership Enforcement**:
   - **Tutor Scoping**: `GET /api/students`, `GET /api/students/:id`, and `PUT /api/students/:id` filter queries strictly by `tutorId: req.user._id`.
   - **Immutable Fields**: `PUT /api/students/:id` restricts updates to whitelisted fields (`name`, `email`, `subject`, `currentLevel`, `learningGoals`, `weakAreas`). Any attempt to alter `userId`, `tutorId`, or `_id` is blocked.
   - **Student RBAC**: Students attempting to access `/api/students` receive `403 Forbidden`. Students can fetch their own profile via `GET /api/students/profile/me` using their `req.user._id`.

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
| `GET` | `/api/students` | Tutor Only | List all student profiles owned by tutor | `{"success":true,"count":1,"students":[...]}` |
| `POST` | `/api/students` | Tutor Only | Enroll a new student and provision user link | `{"success":true,"message":"...","student":{...}}` |
| `GET` | `/api/students/:id` | Tutor Only | Retrieve single student profile (ownership verified) | `{"success":true,"student":{"name":"Sam Chen",...}}` |
| `PUT` | `/api/students/:id` | Tutor Only | Update student profile (whitelisted fields) | `{"success":true,"message":"...","student":{...}}` |
| `GET` | `/api/students/profile/me` | Student Only | Get student's own enrolled profile | `{"success":true,"student":{"subject":"AP Calculus BC",...}}` |
| `GET` | `/api/sessions` | Tutor Only | List all sessions owned by tutor (sorted by scheduled date) | `{"success":true,"count":2,"sessions":[...]}` |
| `POST` | `/api/sessions` | Tutor Only | Schedule a 1-on-1 session with collision clash detection | `{"success":true,"message":"...","session":{...}}` |
| `GET` | `/api/sessions/my-sessions` | Student Only | Get authenticated student's own sessions | `{"success":true,"count":2,"sessions":[...]}` |
| `GET` | `/api/sessions/:id` | Tutor / Student | Get session details & notes (ownership verified) | `{"success":true,"session":{...}}` |
| `PATCH` | `/api/sessions/:id/status` | Tutor Only | Update status (`scheduled` ➔ `in_progress` ➔ `completed`) | `{"success":true,"message":"...","session":{...}}` |
| `PATCH` | `/api/sessions/:id/notes` | Tutor Only | Debounced autosave notes (only allowed when `in_progress`) | `{"success":true,"message":"...","session":{...}}` |

---

## ⚙️ Local Setup Instructions

### Prerequisites
- [Node.js](https://nodejs.org/) (v18 or higher recommended)
- [npm](https://www.npmjs.com/) (v9 or higher)
- [MongoDB](https://www.mongodb.com/) (local instance or MongoDB Atlas URI)

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
     JWT_SECRET=your_jwt_secret_here
     GEMINI_API_KEY=your_gemini_api_key_here
     ```

4. **Seed Development Test Accounts, Student Profile & Sessions:**
   ```bash
   npm run seed
   ```
   > 💡 *The seed script is safe and idempotent to run repeatedly without creating duplicates. Dates are generated dynamically relative to current execution time.*

5. Start the backend server:
   - **Development mode (with auto-reload):**
     ```bash
     npm run dev
     ```
   - **Production mode:**
     ```bash
     npm start
     ```
   Backend runs at: `http://localhost:5000`

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

4. Build client production bundle:
   ```bash
   npm run build
   ```

5. Start the development server:
   ```bash
   npm run dev
   ```
   The client runs at: `http://localhost:5173`

---

## 📋 Milestones Roadmap

1. ✅ **Milestone 1: Project Setup & Health Check**: Vite + React frontend, Express backend, live health check.
2. ✅ **Milestone 2: JWT Authentication & Role-Based Access**: User Mongoose model, bcryptjs hashing, JWT bearer tokens, role middleware (`tutor` vs `student`), idempotent seeding, login page, role dashboards, and 403 access denial guards.
3. ✅ **Milestone 3: Student Management & Profiles**: Student Mongoose model with `userId` and `tutorId` relations, tutor-only CRUD endpoints with server-side ownership gating, seeded profile, interactive student roster with search & stats, creation modal with dynamic tag editors, and student profile view/edit mode.
4. ✅ **Milestone 4: Session Lifecycle State Machine**: Session Mongoose model, tutor scheduling with double-booking collision prevention, strict server-side state transitions (`scheduled` ➔ `in_progress` ➔ `completed`), live notes editor with debounced autosaving and read-only lockdown on completion, student session timeline and notes viewer.
5. ✅ **Milestone 5: Gemini-Powered Lesson Summaries & Homework**: Secure server-side Gemini integration (`gemini-3.6-flash`), structured post-session AI reviews (`POST /api/sessions/:id/ai-review`), automated synthesis of executive summaries, student strengths, areas for improvement, next steps, and personalized homework assignments with interactive task checklists.
6. ⏳ **Milestone 6: Deployments**: Vercel (Frontend) & Render (Backend).

---

## 🤖 Gemini AI Configuration (`server/.env`)

The AI review service requires `GEMINI_API_KEY` configured strictly on the backend (and in Render environment variables):

```env
GEMINI_API_KEY=your_gemini_api_key_here
# Optional custom model override (defaults to gemini-3.6-flash):
GEMINI_MODEL=gemini-3.6-flash
```

> 🔒 **Security Notice:** The Gemini API Key is kept strictly server-side. No client-side code touches or logs the Google AI key.
