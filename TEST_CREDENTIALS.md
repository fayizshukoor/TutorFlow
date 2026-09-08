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

## Notes

- These accounts are created by the database seed script.
- These credentials are for evaluation only.
- Do not reuse these passwords for personal or production accounts.
- No API keys, database credentials, or deployment secrets are included in this file.
