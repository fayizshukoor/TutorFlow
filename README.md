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
│   │   ├── controllers/    # Request handling & HTTP orchestration
│   │   │   ├── authController.js       # Auth endpoints (/login, /me, /test)
│   │   │   ├── studentController.js    # Student CRUD & progress summary
│   │   │   └── sessionController.js    # Session CRUD, AI reviews & plans
│   │   ├── services/       # Domain business logic
│   │   │   ├── authService.js          # Authentication & JWT issuance
│   │   │   ├── studentService.js       # Student DB queries & progress orchestration
│   │   │   ├── sessionService.js       # Conflict checking & lifecycle validation
│   │   │   └── geminiService.js        # Gemini AI plans, reviews & summaries
│   │   ├── middleware/     # Auth & RBAC middleware (authenticate, requireTutor, requireStudent)
│   │   ├── models/         # Mongoose models (User, Student, Session)
│   │   ├── routes/         # Express route mappings
│   │   │   ├── auth.js
│   │   │   ├── students.js
│   │   │   └── sessions.js
│   │   ├── scripts/        # Operational and CLI scripts (seed, automated test suites)
│   │   ├── app.js          # Express app setup, middleware, routes & error handling
│   │   └── server.js       # Server entry point (MongoDB connection & app.listen)
│   ├── .env.example        # Server environment template
│   └── package.json
│
└── README.md               # Project documentation & setup guide
```

---

## 🗄️ Database Structure and Relationships

TutorFlow uses MongoDB with Mongoose to model relationships across three primary entities: **`User`**, **`Student`**, and **`Session`**.

```text
┌────────────────────────┐                   ┌───────────────────────────────────┐
│         User           │ 1 (tutorId)       │              Student              │
│ ────────────────────── │ ────────────────> │ ───────────────────────────────── │
│ _id: ObjectId          │                   │ _id: ObjectId                     │
│ name: String           │                   │ userId: ObjectId (Ref: User, 1:1) │
│ email: String (Unique) │ 1 (userId)        │ tutorId: ObjectId (Ref: User, M:1)│
│ passwordHash: String   │ ────────────────> │ name, email, subject, currentLevel│
│ role: 'tutor'|'student'│                   │ learningGoals: [String]           │
│ tutorId: ObjectId?     │                   │ weakAreas: [String]               │
└────────────────────────┘                   │ progressSummary: Object           │
            │                                └───────────────────────────────────┘
            │ 1 (tutorId)                                      │ 1 (studentId)
            │                                                  │
            ▼                                                  ▼
┌────────────────────────────────────────────────────────────────────────────────┐
│                                    Session                                     │
│ ────────────────────────────────────────────────────────────────────────────── │
│ _id: ObjectId                                                                  │
│ tutorId: ObjectId (Ref: User, Indexed)                                         │
│ studentId: ObjectId (Ref: Student, Indexed)                                    │
│ scheduledAt: Date (Indexed)                                                    │
│ durationMinutes: Number (15 - 240 mins, default: 60)                           │
│ topic: String                                                                  │
│ status: 'scheduled' | 'in_progress' | 'completed' | 'ai_reviewed'             │
│ notes: String (Autosaved live markdown/text notes)                             │
│ aiPlan: { learningObjectives, lessonOutline [4], practiceQuestions [3], ... }  │
│ aiReview: { summary, keyTopicsCovered, studentStrengths, areasForImprovement,  │
│             recommendedNextSteps, homework: { title, description, tasks } }    │
│ homeworkProgress: [ { taskIndex: Number, completed: Boolean, completedAt } ]  │
└────────────────────────────────────────────────────────────────────────────────┘
```

### 1. `User` Model (`server/src/models/User.js`)
Handles authentication, identity, and role assignment:
- **`_id`**: Unique MongoDB `ObjectId` representing the authenticated user.
- **`name`**: Full name of the user.
- **`email`**: Normalized lowercase email (`unique: true`, indexed).
- **`passwordHash`**: 60-character bcrypt hash (`saltRounds: 10`).
- **`role`**: Role enum (`'tutor'` or `'student'`).
- **`tutorId`**: Self-referencing `ObjectId` pointing to the user's assigned tutor when `role === 'student'`.

### 2. `Student` Model (`server/src/models/Student.js`)
Stores the rich academic profile and long-term learning trajectory:
- **`_id`**: Unique MongoDB `ObjectId` representing the student academic profile.
- **`userId`** (`Ref: User`, `unique: true`): 1-to-1 foreign reference linking the academic profile to the student's authentication identity.
- **`tutorId`** (`Ref: User`, `index: true`): Many-to-1 foreign reference linking the student profile to the owning tutor for strict multi-tenant data isolation.
- **`subject`**: Focus subject (e.g. `"AP Calculus BC"`).
- **`currentLevel`**: Current academic grade or level (e.g. `"Grade 12 / Advanced"`).
- **`learningGoals`**: Array of target conceptual and exam milestones.
- **`weakAreas`**: Array of diagnostic hurdle topics flagged for targeted practice.
- **`progressSummary`**: Embedded subdocument containing cumulative AI trajectory analysis (`summary`, `improvingAreas`, `strugglingAreas`, `recommendedFocus`).

### 3. `Session` Model (`server/src/models/Session.js`)
Represents 1-on-1 scheduled tutoring sessions with full lifecycle tracking:
- **`_id`**: Unique MongoDB `ObjectId` for the session.
- **`tutorId`** (`Ref: User`, `index: true`): References the tutor who owns and conducts the session.
- **`studentId`** (`Ref: Student`, `index: true`): References the student's academic profile.
- **`scheduledAt`**: Session start timestamp (used for double-booking collision prevention and chronological sorting).
- **`durationMinutes`**: Session duration (default: 60 minutes).
- **`topic`**: Target concept or chapter.
- **`status`**: State machine indicator (`'scheduled'` ➔ `'in_progress'` ➔ `'completed'` ➔ `'ai_reviewed'`).
- **`notes`**: Autosaved text notes updated in real-time by the tutor during the session.
- **`aiPlan`**: Pre-session structured lesson plan containing learning objectives, exactly 4 outline steps, and 3 practice problems.
- **`aiReview`**: Post-session structured summary, covered concepts, strengths, areas for improvement, and homework tasks.
- **`homeworkProgress`**: Array of database-persisted completion statuses and ISO timestamps for homework tasks.

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
| `POST` | `/api/students/:id/progress-summary` | Tutor Only | Generate multi-session Gemini AI progress trajectory summary | `{"success":true,"progressSummary":{...}}` |
| `GET` | `/api/sessions` | Tutor Only | List all sessions owned by tutor (sorted by scheduled date) | `{"success":true,"count":2,"sessions":[...]}` |
| `POST` | `/api/sessions` | Tutor Only | Schedule a 1-on-1 session with collision clash detection | `{"success":true,"message":"...","session":{...}}` |
| `GET` | `/api/sessions/my-sessions` | Student Only | Get authenticated student's own sessions | `{"success":true,"count":2,"sessions":[...]}` |
| `GET` | `/api/sessions/:id` | Tutor / Student | Get session details, notes, AI plan, & review (ownership verified) | `{"success":true,"session":{...}}` |
| `PATCH` | `/api/sessions/:id/status` | Tutor Only | Update status (`scheduled` ➔ `in_progress` ➔ `completed`) | `{"success":true,"message":"...","session":{...}}` |
| `PATCH` | `/api/sessions/:id/notes` | Tutor Only | Debounced autosave notes (only allowed when `in_progress`) | `{"success":true,"message":"...","session":{...}}` |
| `POST` | `/api/sessions/:id/ai-plan` | Tutor Only | Generate Gemini pre-session lesson plan (4 steps & 3 questions) | `{"success":true,"aiPlan":{...}}` |
| `POST` | `/api/sessions/:id/ai-review` | Tutor Only | Generate Gemini post-session review & homework assignment | `{"success":true,"session":{...}}` |
| `PATCH` | `/api/sessions/:id/homework-progress` | Student Only | Track homework task completion timestamps | `{"success":true,"homeworkProgress":[...]}` |

---

## 🤖 Gemini AI Features

TutorFlow incorporates Google Gemini AI across the tutoring lifecycle:

### 1. Pre-Session AI Lesson Planning (`POST /api/sessions/:id/ai-plan`)
- **When**: Before class starts (`scheduled` or `in_progress` sessions).
- **Prompt Context**: Ingests student learning goals, weak areas, current topic, and previous lesson review summaries.
- **Output Structure**:
  ```json
  {
    "learningObjectives": ["Objective 1", "Objective 2"],
    "lessonOutline": [
      "1. Warm-Up & Diagnostic Review: ...",
      "2. Core Concept Walkthrough: ...",
      "3. Scaffolded Practice: ...",
      "4. Synthesis & Wrap-Up: ..."
    ],
    "practiceQuestions": [
      "Question 1 (Foundational): ...",
      "Question 2 (Standard): ...",
      "Question 3 (Synthesis/Challenge): ..."
    ]
  }
  ```
- **UI Integration**: Accessible via "Generate AI Study Plan" in student profile and directly inside the session workspace (read-only for students).

### 2. Post-Session AI Review & Homework (`POST /api/sessions/:id/ai-review`)
- **When**: After session completion (`completed` ➔ `ai_reviewed`).
- **Prompt Context**: Live notes recorded during session, student subject, grade level, and weak areas.
- **Output Structure**: Executive summary, covered topics, student strengths, areas for improvement, recommended next steps, and customized homework assignments.

### 3. Persistent Homework Progress (`PATCH /api/sessions/:id/homework-progress`)
- **When**: As students complete homework tasks.
- **Rules**: Assigned student only, records `completedAt` timestamps, updates real-time progress bars and tutor read-only summary badges.

### 4. Long-Term AI Progress Trajectory (`POST /api/students/:id/progress-summary`)
- **When**: On-demand by tutors on the student profile page.
- **Prompt Context**: Aggregates all completed and AI-reviewed sessions for the student, including topics covered, strengths, areas for improvement, and tutor notes across multiple sessions.
- **Output Structure**:
  ```json
  {
    "summary": "Concise trajectory overview analyzing longitudinal growth and persistent hurdles...",
    "improvingAreas": ["Specific concepts showing solid mastery and upward trend"],
    "strugglingAreas": ["Persistent gaps requiring reinforcement"],
    "recommendedFocus": ["Targeted pedagogical next steps for future lessons"]
  }
  ```
- **UI Integration**: Rendered on the Student Profile with interactive Generate/Regenerate buttons, a progress trajectory card, narrative summary box, and a 3-column analysis grid.

---

## 🧠 AI Prompt Design

TutorFlow leverages structured prompt engineering in [`server/src/services/geminiService.js`](file:///home/user/Desktop/TutorFlow/server/src/services/geminiService.js) to guarantee deterministic, pedagogically sound, and machine-parseable JSON responses from Google Gemini.

### 1. Pre-Session AI Lesson Planning Prompt (`buildPlanPrompt`)

#### Actual Prompt Template:
```text
You are an expert pedagogical assistant for TutorFlow, an online 1-on-1 tutoring platform.
Design a highly tailored pre-session study plan and 3 targeted practice questions for an upcoming tutoring session.

STUDENT: ${studentName} | SUBJECT: ${subject} (${currentLevel})
STUDENT LEARNING GOALS: ${goals}
AREAS NEEDING REINFORCEMENT: ${weak}
UPCOMING SESSION TOPIC: ${topic} (${durationMinutes} minutes)
${historyContext}
INSTRUCTIONS:
Respond ONLY with a valid JSON object strictly matching this schema. Ensure EXACTLY 4 structured lesson outline steps and EXACTLY 3 practice questions:
{
  "learningObjectives": [
    "Clear, measurable learning objective #1",
    "Clear, measurable learning objective #2"
  ],
  "lessonOutline": [
    "1. Warm-Up & Diagnostic Review: Assess foundational understanding and prerequisite concepts",
    "2. Core Concept Walkthrough: Guided instruction on core theory, formulas, and representative examples",
    "3. Scaffolded Practice: Student solves targeted problems with tutor guidance and misconception correction",
    "4. Synthesis & Wrap-Up: Exit check problem and recap of key takeaways"
  ],
  "practiceQuestions": [
    "Practice Question 1 (Foundational concept check)",
    "Practice Question 2 (Standard application problem)",
    "Practice Question 3 (Challenging synthesis or multi-step problem addressing weak areas)"
  ]
}
```

#### Compact Fallback Prompt (Used on parse retry):
```text
You are an expert tutor for TutorFlow.
Create a compact pre-session plan for a ${durationMinutes}-min ${subject} (${currentLevel}) session with ${studentName}.
Topic: ${topic}
Weak Areas: ${weak}
Goals: ${goals}
${historyContext}
Respond ONLY with this JSON schema. EXACTLY 4 outline items and EXACTLY 3 questions:
{
  "learningObjectives": ["Objective 1", "Objective 2"],
  "lessonOutline": [
    "1. Warm-up & diagnostic review (10m)",
    "2. Guided core concept explanation (20m)",
    "3. Practice problem solving (20m)",
    "4. Wrap-up and synthesis (10m)"
  ],
  "practiceQuestions": [
    "Question 1: Foundational practice",
    "Question 2: Core concept exercise",
    "Question 3: Application challenge"
  ]
}
```

#### Context & Rationale:
- **Student Profile & Level (`subject`, `currentLevel`):** Ensures difficulty calibration matches the student's curriculum (e.g., AP Calculus BC requires formal proofs, whereas middle school algebra requires intuitive scaffolding).
- **Learning Goals & Weak Areas (`goals`, `weak`):** Directs the lesson outline to prioritize diagnosed misconceptions and prioritize targeted drills.
- **Current Topic & Duration (`topic`, `durationMinutes`):** Calibrates realistic pacing across the 4-step outline (Warm-up, Concept Walkthrough, Guided Practice, Synthesis).
- **Previous Session Context (`pastSessionsSummary`):** Prevents duplicate coverage and builds directly upon concepts mastered in prior classes.

---

### 2. Post-Session AI Review & Homework Prompt (`buildPrompt`)

#### Actual Prompt Template:
```text
You are an expert pedagogical assistant for TutorFlow, an online 1-on-1 tutoring platform.
Analyze this completed tutoring session and produce a structured, high-value lesson review and homework assignment.

STUDENT: ${studentName} | SUBJECT: ${subject} (${currentLevel})
GOALS: ${goals}
AREAS FOR PRACTICE: ${weak}
SESSION TOPIC: ${topic} (${durationMinutes} mins)
LIVE NOTES:
${notesText}

INSTRUCTIONS:
Respond ONLY with a valid, compact JSON object strictly matching this schema. Keep descriptions concise to ensure fast generation:
{
  "summary": "Concise 2-sentence synthesis of concepts covered and student performance.",
  "keyTopicsCovered": ["Key concept or problem type covered #1", "Key concept #2"],
  "studentStrengths": ["Demonstrated competency or breakthrough #1", "Positive pedagogical observation #2"],
  "areasForImprovement": ["Misconception or topic needing reinforcement #1", "Topic needing practice #2"],
  "recommendedNextSteps": ["Action item before next lesson #1", "Focus topic for upcoming lesson #2"],
  "homework": {
    "title": "Clear assignment title",
    "description": "Short explanation of purpose (~30-45 mins)",
    "tasks": ["Actionable problem/drill #1", "Actionable problem/drill #2", "Self-check task #3"]
  }
}
```

#### Compact Fallback Prompt (Used on parse retry):
```text
You are a tutoring assistant for TutorFlow.
Create a compact JSON review for a ${durationMinutes}-minute ${subject} (${currentLevel}) session with ${studentName}.
Topic: ${topic}
Notes: ${notesText}

Respond ONLY with this compact JSON schema. Keep all strings short (1 sentence each):
{
  "summary": "Brief 1-2 sentence overview of what was covered.",
  "keyTopicsCovered": ["Topic 1", "Topic 2"],
  "studentStrengths": ["Strength 1", "Strength 2"],
  "areasForImprovement": ["Focus area 1", "Focus area 2"],
  "recommendedNextSteps": ["Next step 1", "Next step 2"],
  "homework": {
    "title": "Short Homework Title",
    "description": "Short 1-sentence instruction.",
    "tasks": ["Task 1", "Task 2", "Task 3"]
  }
}
```

#### Context & Rationale:
- **Tutor Live Notes (`notesText`):** Provides ground-truth qualitative data on student performance, specific problem types attempted, and errors observed during class.
- **Session Topic & Diagnostic Goals:** Grounds the review in specific concepts rather than generic summaries.
- **Actionable Strengths & Weaknesses:** Segregates competencies from areas needing practice so both student and tutor have clarity on progress.
- **Tailored Homework Generation:** Creates custom, bite-sized tasks (~30-45 min total) directly targeting areas flagged for improvement.

---

### 3. Multi-Session Student Progress Summary Prompt (`buildProgressPrompt`)

#### Actual Prompt Template:
```text
You are an expert pedagogical analyst for TutorFlow, an online 1-on-1 tutoring platform.
Analyze this student's past session reviews, tutor notes, and learning trajectory to produce a clear, actionable progress summary.

STUDENT: ${studentName}
SUBJECT & LEVEL: ${subject} (${currentLevel})
INITIAL LEARNING GOALS: ${goals}
TARGETED WEAK AREAS: ${weak}

CHRONOLOGICAL PAST SESSION AI REVIEWS & LESSON DATA:
${pastReviewsText.slice(0, 1800)}

INSTRUCTIONS:
Respond ONLY with a valid, compact JSON object strictly matching this schema. Be specific, encouraging, and pedagogically concrete:
{
  "summary": "Concise 2-3 sentence executive synthesis explaining what the student is improving at, general pace, and current mastery trajectory.",
  "improvingAreas": [
    "Specific concept or skill where the student has shown clear progress or breakthrough #1",
    "Specific concept #2"
  ],
  "strugglingAreas": [
    "Specific concept, problem type, or persistent struggle where the student still requires focused practice #1",
    "Specific concept #2"
  ],
  "recommendedFocus": [
    "Actionable, high-impact recommendation for upcoming tutoring sessions #1",
    "Actionable recommendation #2"
  ]
}
```

#### Compact Fallback Prompt (Used on parse retry):
```text
You are a tutoring assistant for TutorFlow.
Create a compact student progress summary for ${studentName} (${subject}, ${currentLevel}).
Goals: ${goals}
Weak Areas: ${weak}

PAST SESSIONS & AI REVIEWS:
${pastReviewsText.slice(0, 1000)}

Respond ONLY with this compact JSON schema (1-2 sentences per field, 2-3 bullet items per array):
{
  "summary": "Brief 1-2 sentence overview of the student's progress and trajectory.",
  "improvingAreas": ["Concept or skill showing noticeable improvement #1", "Concept #2"],
  "strugglingAreas": ["Persistent bottleneck or difficulty needing reinforcement #1", "Concept #2"],
  "recommendedFocus": ["High-priority topic for upcoming sessions #1", "Topic #2"]
}
```

#### Context & Rationale:
- **Chronological Multi-Session History (`pastReviewsText`):** Aggregates topics, tutor observations, strengths, and weaknesses across past lessons to discern longitudinal trends.
- **Trajectory Comparison against Initial Goals:** Evaluates whether initial weak areas have transitioned into mastered concepts or remain ongoing hurdles.
- **Pedagogical Prescriptions (`recommendedFocus`):** Advises the tutor on high-leverage topics for subsequent lesson planning.

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

1. ✅ **Milestone 1: Project Setup & Health Check**: Vite + React frontend, Express backend, unified design system tokens, and `/api/health` monitoring endpoint.
2. ✅ **Milestone 2: JWT Authentication & Role-Based Access Control**: User Mongoose model, `bcryptjs` password hashing, JWT bearer tokens, role middleware (`tutor` vs `student`), idempotent database seeding, login interface with demo quick-fill, role dashboards, and 403 access denial guards.
3. ✅ **Milestone 3: Student Management & Profiles**: Student Mongoose model with `userId` and `tutorId` relations, tutor-only CRUD endpoints with server-side ownership gating, seeded profile, interactive student roster with search & stats, creation modal with dynamic tag editors, and student profile view/edit mode.
4. ✅ **Milestone 4: Session Lifecycle State Machine & Notes**: Session Mongoose model, tutor scheduling with double-booking collision prevention, strict server-side state transitions (`scheduled` ➔ `in_progress` ➔ `completed`), live notes editor with debounced autosaving and read-only lockdown on completion, student session timeline and notes viewer.
5. ✅ **Milestone 5: Gemini-Powered Lesson Planning, Reviews & Homework Tracking**:
   - **Pre-Session AI Lesson Plans**: `POST /api/sessions/:id/ai-plan` synthesizing tailored learning objectives, a 4-point structured lesson outline, and 3 concept-targeted practice questions.
   - **Post-Session AI Reviews & Homework**: `POST /api/sessions/:id/ai-review` extracting executive summaries, key topics covered, student strengths, areas for improvement, and homework assignments.
   - **Database-Backed Persistent Homework Tracking**: `PATCH /api/sessions/:id/homework-progress` allowing students to toggle task completion with `completedAt` timestamps and live progress visualization for tutors.
   - **Resilience & Fallback**: Multi-model Gemini fallback, strict 22s request timeouts, unescaped backslash/LaTeX sanitization, and compact JSON extraction.
6. ✅ **Milestone 6: Cloud Deployments & Production Live**:
   - Frontend deployed and live on **Vercel** (`https://tutor-flow-xn2k.vercel.app`).
   - Backend API deployed and live on **Render** (`https://tutorflow-i8gb.onrender.com`).
   - Production **MongoDB Atlas** database cluster connected with live environment configurations.

---

## 🔒 Gemini AI Configuration (`server/.env`)

The AI service requires `GEMINI_API_KEY` configured strictly on the backend (and in Render environment variables):

```env
GEMINI_API_KEY=your_gemini_api_key_here
# Optional custom model override (defaults to multi-model fallback: gemini-3.7-flash -> gemini-3.6-flash -> gemini-3.5-flash):
GEMINI_MODEL=gemini-3.6-flash
```

> 🔒 **Security Notice:** The Gemini API Key is kept strictly server-side. No client-side code touches or logs the Google AI key.


## What I Would Build Next

With another day, I would add the ability for tutors to edit or cancel scheduled sessions. I would add email reminders so students do not miss upcoming sessions. I would improve the mobile layout and make the forms easier to use. I would add more validation and clearer error messages for invalid inputs. I would also add more automated tests for important tutor and student workflows.