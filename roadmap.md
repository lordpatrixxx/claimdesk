# Roadmap

## Stage 1 — done in code
- [x] Roles, students, versioned beneficiary profiles, advances, claims, items, events (with access rules)
- [x] Java Spring Boot service: workflow + validation, service-key auth, 12 JUnit tests passing
- [x] Submit claim end-to-end (web server → Java → atomic version-checked save)
- [ ] Deploy Java service on Render and add JAVA_SERVICE_URL / JAVA_SERVICE_API_KEY (waiting on user)
- [ ] Verify a real submit reaches the running Java service

## Stage 2
- [ ] Receipt/UPI upload (private storage), AI extraction, side-by-side review, evidence classes in Java

## Stage 3
- [ ] Faculty review queue, partial approval, advances & settlement (Java), payments, emails (no domain yet → "Email not configured")

## Stage 4
- [ ] Remaining tests, reports, notification history, deployment docs
