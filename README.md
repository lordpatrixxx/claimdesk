# Student Reimbursement and Advance Settlement System

Academic mini project — Object-Oriented Programming in Java.

| | |
|---|---|
| Student | Pratik Deepak Phapale |
| PRN | 125B1F210 |
| College | Pimpri Chinchwad College of Engineering, Pune |
| Department | Information Technology |
| Year / Semester / Division | Second Year · Semester III · Division B |
| Faculty | Tanuja Patankar |

This is a student project. It is not an official college system and is not endorsed or deployed by the college. All bank details are fictional demo values; no real money is transferred.

## Architecture

```text
Browser ──▶ Web server function (login + role check, loads records from DB)
               │
               ├──▶ Java Spring Boot service (validation, workflow, money rules)  [java-service/]
               │◀── decision
               └──▶ Saves result atomically with a version check (apply_claim_transition)
```

- Web app: TanStack Start (React) on Lovable, with Lovable Cloud for auth, database and storage.
- Java service: `java-service/` — see its README for tests, Docker/Render deployment and the API contract.
- OOP mapping: `docs/OOP_MAPPING.md`.

## Server secrets (web app)

See `.env.example`. Set them as project secrets, never in code:
- `JAVA_SERVICE_URL` — e.g. `https://your-service.onrender.com`
- `JAVA_SERVICE_API_KEY` — same value as the Java service's `SERVICE_API_KEY`

If the Java service is down, submitting shows a clear "Java business service unavailable" message and nothing is saved. There is no JavaScript fallback for business rules.

## Roles

New sign-ups are students. Faculty and finance roles are granted by an administrator in the database (`user_roles`); users cannot assign roles to themselves.

## Stages

1. Data model, access control, Java API contract, one end-to-end claim operation (submit). ← current
2. Upload, AI extraction, human review.
3. Faculty approval, advances, settlement, emails.
4. Testing, documentation, deployment preparation.
