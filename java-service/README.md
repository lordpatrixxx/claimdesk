# Java Business Service

Spring Boot 3.3 · Java 17 · Maven. Owns the reimbursement business rules; the web app calls it server-to-server.

## Run and test locally

```bash
./mvnw test                         # JUnit tests
SERVICE_API_KEY=change-me-to-a-long-random-value ./mvnw spring-boot:run
curl http://localhost:8080/health
```

## Deploy on Render (Docker)

1. Push this repository to GitHub.
2. Render → New → Web Service → pick the repo.
3. Root directory: `java-service`. Runtime: **Docker** (uses the `Dockerfile` here).
4. Environment variable: `SERVICE_API_KEY` = a long random value (32+ characters).
5. Deploy, then open `https://<your-service>.onrender.com/health` — it should show `"status":"UP"`.
6. In the Lovable project secrets set:
   - `JAVA_SERVICE_URL` = `https://<your-service>.onrender.com`
   - `JAVA_SERVICE_API_KEY` = the same value as `SERVICE_API_KEY`.

Railway works the same way: new service from the repo, root `java-service`, add `SERVICE_API_KEY`.
Free tiers sleep when idle; the first request can take ~1 minute and the app will show "Java service unreachable" until it wakes.

## API contract (v1)

All `/api/**` calls need header `X-Service-Key: <SERVICE_API_KEY>`. Amounts are decimal strings.

### `GET /health` (public)
`{"status":"UP","service":"java-reimbursement-service","version":"1.0.0","java":"17..."}`

### `POST /api/v1/claims/evaluate-transition`

Request:
```json
{
  "action": "SUBMIT",
  "actor": { "userId": "uuid", "roles": ["STUDENT"], "claimOwner": true },
  "claim": {
    "id": "uuid", "title": "Tech fest", "purpose": "Stall materials", "status": "DRAFT", "version": 1,
    "items": [{ "id": "uuid", "description": "Chart paper", "category": "STATIONERY",
                "expenseDate": "2026-10-01", "claimedAmount": "650.00" }]
  }
}
```
Actions: `SUBMIT`, `START_REVIEW`, `REQUEST_CHANGES`, `REJECT`, `APPROVE`.

Responses:
- `200` `{"allowed":true,"fromStatus":"DRAFT","toStatus":"SUBMITTED","totalClaimed":"650.00","warnings":[],"trace":"..."}`
- `422` `{"error":"VALIDATION_FAILED","messages":["Item 1: amount must be greater than ₹0"]}`
- `409` `{"error":"INVALID_TRANSITION","messages":["Cannot SUBMIT a claim that is SUBMITTED"]}`
- `401` missing/invalid key · `503` key not configured on the service

The actor and claim are always built by the web server from the database and the verified session — never from browser input. The web server persists the result with a version check (`apply_claim_transition`).

## Planned endpoints (later stages)
- `POST /api/v1/settlements/calculate` — approved − advance applied = net (payable / returnable).
- `POST /api/v1/evidence/duplicates` — hash, transaction-reference and fuzzy match checks.
- `POST /api/v1/reports/{type}` — report calculations and CSV streams.
