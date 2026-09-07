# TutorFlow

TutorFlow is a web platform for one-to-one online tutors and students. Tutors can manage student accounts and sessions, while students can access their own learning information.

## Project Status

### Implemented

- React/Vite frontend
- Express/Node.js backend
- MongoDB Atlas database
- JWT authentication
- Tutor and student roles
- Server-side role-based authorization
- Protected React Router routes
- Tutor and student test accounts
- Production deployment

### In Progress

- Student profile management
- Session scheduling
- Session lifecycle state machine
- Debounced session-note autosave
- Gemini AI lesson planning and session reviews

## Live Application

- Frontend: https://tutor-flow-xn2k.vercel.app
- Backend API: https://tutorflow-i8gb.onrender.com
- Health check: https://tutorflow-i8gb.onrender.com/api/health
- GitHub: https://github.com/fayizshukoor/TutorFlow

## Test Accounts

| Role | Email | Password |
|---|---|---|
| Tutor | `tutor@tutorflow.com` | `TutorPass123!` |
| Student | `student@tutorflow.com` | `StudentPass123!` |

The student account is linked to the seeded tutor account.

## Technology Stack

| Layer | Technology |
|---|---|
| Frontend | React 18, Vite, React Router |
| Backend | Node.js, Express.js |
| Database | MongoDB Atlas with Mongoose |
| Authentication | JWT |
| Password hashing | bcryptjs |
| AI | Google Gemini API |
| Frontend deployment | Vercel |
| Backend deployment | Render |

## Project Structure

```text
TutorFlow/
├── client/
│   ├── src/
│   │   ├── components/
│   │   ├── context/
│   │   ├── App.jsx
│   │   ├── index.css
│   │   └── main.jsx
│   ├── .env.example
│   ├── package.json
│   └── vite.config.js
│
├── server/
│   ├── src/
│   │   ├── middleware/
│   │   ├── models/
│   │   ├── routes/
│   │   ├── db.js
│   │   ├── index.js
│   │   └── seed.js
│   ├── .env.example
│   └── package.json
│
└── README.md
