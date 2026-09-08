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

## Milestone 5: Gemini AI Lesson Plans, Reviews & Homework Testing

1. **Pre-Session AI Lesson Planning (`tutor@tutorflow.com`):**
   - Navigate to `/tutor/students` and select **Sam Chen**.
   - Click **"✨ Generate AI Study Plan"** on the student profile to launch the AI Plan generator.
   - Alternatively, open the scheduled upcoming session workspace (*"Taylor & Maclaurin Series - Power Series Convergence"*).
   - View the generated pre-session pedagogical plan: Learning Objectives, 4-Point Lesson Outline with time allocations, and 3 targeted practice problems.
   - Click **"Regenerate Plan"** to test live regeneration with Gemini.

2. **Tutor AI Review Generation (`tutor@tutorflow.com`):**
   - Navigate to `/tutor/sessions`.
   - Select the completed session (*"Integration Techniques & Trigonometric Substitution Drill"*).
   - Click **"✨ Generate AI Review"** to trigger live Gemini post-session synthesis.
   - Verify structured sections appear: Executive Summary, Key Topics, Student Strengths, Areas for Improvement, Recommended Next Steps, and Homework Assignment.

3. **Student Read-Only Review & Persistent Homework View (`student@tutorflow.com`):**
   - Log in as the student.
   - On the Student Dashboard, observe the *"✨ AI Review & Homework Ready"* status and homework completion counter.
   - Click **"View AI Review & Homework"** to open the lesson workspace.
   - Click the interactive checkboxes to toggle homework tasks complete/incomplete.
   - Notice the saving indicator, live completion timestamps, and persistent database storage across page refreshes.

## Notes

- These accounts are created by the database seed script (`npm run seed`).
- Gemini AI integration requires `GEMINI_API_KEY` set in the backend environment.
- These credentials are for evaluation only.
- Do not reuse these passwords for personal or production accounts.
- No API keys, database credentials, or deployment secrets are included in this file.
