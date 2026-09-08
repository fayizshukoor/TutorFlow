# TutorFlow Test Credentials

Use these demo accounts to test the deployed TutorFlow application.

## Live URLs

- Frontend: https://tutor-flow-xn2k.vercel.app
- Backend API: https://tutorflow-i8gb.onrender.com
- Health check: https://tutorflow-i8gb.onrender.com/api/health

## Tutor Account

```text
Email: tutor@tutorflow.com
Password: TutorPass123!
Role: Tutor
```

Tutor access includes the tutor dashboard and tutor-only route testing.

## Student Account

```text
Email: student@tutorflow.com
Password: StudentPass123!
Role: Student
```

Student access is read-only and limited to student routes. Attempting to access tutor-only routes should return an access-denied response, with the protected API returning HTTP 403.

## Milestone 5: Gemini AI Review & Homework Testing

1. **Tutor AI Review Generation (`tutor@tutorflow.com`):**
   - Navigate to `/tutor/sessions`.
   - Select the completed session (*"Integration Techniques & Trigonometric Substitution Drill"*).
   - Click **"Generate AI Review"** to trigger live Gemini synthesis.
   - Verify structured sections appear: Executive Summary, Key Topics, Student Strengths, Areas for Improvement, Recommended Next Steps, and Homework Assignment.

2. **Student Read-Only Review & Homework View (`student@tutorflow.com`):**
   - Log in as the student.
   - On the Student Dashboard, observe the *"✨ AI Review & Homework Ready"* status.
   - Click **"View AI Review & Homework"** to open the lesson workspace.
   - Verify the student can read tutor notes and interactively check off completed homework tasks.

## Notes

- These accounts are created by the database seed script (`npm run seed`).
- Gemini AI integration requires `GEMINI_API_KEY` set in the backend environment.
- These credentials are for evaluation only.
- Do not reuse these passwords for personal or production accounts.
- No API keys, database credentials, or deployment secrets are included in this file.
