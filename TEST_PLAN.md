# ft_transcendence - End-to-End Test Plan

## 1. Objective

This plan validates three dimensions of quality:

1. Functionality: core features work as expected across frontend, backend, database, and realtime flows.
2. Responsiveness: UI adapts correctly to mobile, tablet, and desktop; no layout breakage or unusable interactions.
3. Security: common web vulnerabilities are mitigated (auth/session, access control, input validation, upload handling, rate limiting, WAF behavior, secret handling).

## 2. Scope

In scope:

- Authentication: email/password login, Google OAuth, TOTP 2FA.
- User profile flows: view/edit profile, avatar upload.
- Social features: posts, likes, comments, follow/block, notifications.
- Realtime: direct messages, typing indicators, websocket reconnection.
- Search/explore.
- i18n: EN/FR/AR.
- Infrastructure path: WAF -> nginx -> frontend/backend.
- Observability: health endpoint, Prometheus metrics visibility, Grafana dashboard availability.

Out of scope (unless needed by your evaluator):

- Large-scale performance benchmarking (e.g., stress test beyond normal project requirements).
- External SaaS failure simulation for Google provider outage.

## 3. Test Environment

## 3.1 Prerequisites

- Docker >= 24, Docker Compose >= 2.20, Make >= 4.0.
- Valid .env values (OAuth, JWT, DB, Vault secrets, ports).
- Browser set: Chrome + Firefox (minimum). Safari optional.

## 3.2 Startup and Sanity

1. Build/start all services:

```bash
make up
```

2. Verify containers are healthy:

```bash
make ps
```

3. Check backend health:

```bash
curl -k https://localhost:8443/api/health
```

Expected: HTTP 200 with health payload.

4. Open app entrypoint:

- https://localhost:8443

Expected: app loads over HTTPS through WAF.

5. Open monitoring:

- Prometheus: http://localhost:9090
- Grafana: http://localhost:3100

Expected: both services reachable.

## 3.3 Test Accounts and Data

Prepare at least these users:

- user_a: normal user.
- user_b: normal user.
- user_c: blocked by user_a (for permission checks).
- admin/tester account if your project supports elevated roles.

Seed baseline content:

- 5-10 posts with mixed text lengths.
- Posts with and without media.
- 1 conversation with existing messages.

## 4. Execution Strategy

Run tests in this order:

1. Smoke test (critical path only).
2. Full functionality suite.
3. Responsiveness suite.
4. Security suite.
5. Regression recheck for failed/fixed items.

Record all failures with:

- Steps to reproduce.
- Expected vs actual.
- Browser/device.
- Screenshots or request IDs/log snippets.

## 5. Step-by-Step Functional Test Cases

## 5.1 Smoke Tests (must pass first)

1. User can open landing/login page.
2. User can authenticate.
3. Feed page loads posts.
4. User can create one post.
5. User can send one direct message.
6. Notifications appear after interaction (like/comment/follow).
7. Logout works and protected pages are blocked afterward.

If any smoke test fails, stop and fix before continuing.

## 5.2 Authentication and Session

1. Register/login with valid credentials.
Expected: token/session established and redirected to authenticated route.

2. Login with invalid password.
Expected: clear error message, no session created.

3. Google OAuth login.
Expected: successful callback, user profile linked/created.

4. Enable TOTP 2FA and login with valid code.
Expected: challenge required and accepted.

5. Try expired/invalid TOTP code.
Expected: rejected with no session.

6. Logout from one tab, verify another tab becomes unauthorized on next API action.
Expected: session invalidated consistently.

7. Try accessing protected route while unauthenticated.
Expected: redirect to login or HTTP 401/403 as designed.

## 5.3 Profile, Follow, Block

1. Edit bio/display name/avatar.
Expected: persisted after refresh.

2. Upload avatar invalid type (e.g., .txt renamed as .png).
Expected: upload rejected.

3. user_a follows user_b.
Expected: follow state updates and notification created.

4. user_a blocks user_c.
Expected: blocked user cannot interact where restricted (message/follow/view depending on rules).

5. Unblock flow.
Expected: interactions restored per policy.

## 5.4 Feed, Posts, Likes, Comments

1. Create post (short and long content variants).
Expected: appears immediately in feed and persists after refresh.

2. Edit/delete own post.
Expected: operation succeeds only for owner.

3. Try edit/delete another user's post.
Expected: denied (UI + API enforcement).

4. Like/unlike post.
Expected: counter and status stay consistent after refresh.

5. Add/delete comment.
Expected: comment count and list update correctly.

6. Infinite scroll.
Expected: stable pagination without duplicates/gaps.

## 5.5 Chat and Realtime

1. Open conversation between user_a and user_b in two browsers/incognito windows.
Expected: both online.

2. Send/receive messages in both directions.
Expected: near-realtime delivery and persistence.

3. Typing indicator.
Expected: shown while typing, cleared when stopped/sent.

4. Simulate reconnect (disable network briefly).
Expected: socket reconnects, no duplicate message burst.

5. Unauthorized websocket connection attempt (no valid token).
Expected: connection rejected.

## 5.6 Notifications

1. Trigger follow/like/comment/message events.
Expected: matching notification generated once per event.

2. Mark notification read.
Expected: unread counter updates correctly.

3. Reload page.
Expected: read/unread state preserved.

## 5.7 Search and Explore

1. Search users by exact and partial names.
Expected: relevant ranked results.

2. Search content with mixed case and special characters.
Expected: no crash; reasonable matching.

3. Empty/no-results query.
Expected: graceful empty state.

## 5.8 i18n (EN/FR/AR)

1. Switch language across key pages (auth, feed, profile, messages, settings).
Expected: strings translated, no missing-key artifacts.

2. Validate RTL behavior for Arabic.
Expected: layout direction and alignment remain usable.

3. Refresh and relogin.
Expected: language preference persists if designed to persist.

## 6. Responsiveness Test Plan

## 6.1 Viewport Matrix

Test minimum these sizes:

- Mobile small: 360x640
- Mobile large: 414x896
- Tablet: 768x1024
- Laptop: 1366x768
- Desktop: 1920x1080

## 6.2 Responsive Steps (per major page)

Pages:

- Auth
- Feed
- Profile
- Explore/Search
- Messages
- Notifications
- Settings

For each page and viewport:

1. Load page fresh.
Expected: no horizontal overflow.

2. Navigate primary actions (buttons, inputs, menus).
Expected: tap targets usable, no overlapping controls.

3. Open modals/dropdowns/sheets.
Expected: correctly positioned and closable.

4. Test text scaling at 125% and 200% zoom (desktop).
Expected: content remains readable and functional.

5. Rotate mobile emulation portrait/landscape.
Expected: key actions still accessible.

6. Verify chat/feed scrolling performance.
Expected: smooth enough, no major stutter or jumpy scroll resets.

## 6.3 Accessibility-Related Responsive Checks

1. Keyboard-only navigation on desktop.
Expected: visible focus and reachable controls.

2. Color contrast quick pass on key text/buttons.
Expected: readable in normal use.

3. Form errors announced/visible clearly.
Expected: user can identify and fix invalid input.

## 7. Security Test Plan

## 7.1 Authentication and Authorization

1. Access protected API without token.
Expected: 401/403.

2. Access another user's resource by changing IDs (IDOR attempt).
Expected: denied by backend checks.

3. Use expired/malformed JWT.
Expected: rejected.

4. Attempt privilege escalation via client-side parameter tampering.
Expected: server ignores/denies unauthorized role/owner changes.

## 7.2 Input Validation and Injection

1. Submit XSS payload in post/comment/profile fields:

```text
<script>alert(1)</script>
<img src=x onerror=alert(1)>
```

Expected: payload sanitized/escaped; no script execution.

2. Submit SQL-like payload in search/login fields:

```text
' OR 1=1 --
```

Expected: no auth bypass, no SQL error leakage.

3. Send oversized payload/body.
Expected: request limited/rejected safely.

## 7.3 CSRF, CORS, Headers, Cookies

1. If cookie auth is used, attempt CSRF from external origin.
Expected: blocked by CSRF protection/SameSite policy.

2. Check CORS policy from unauthorized origin.
Expected: disallowed origin cannot read protected responses.

3. Verify security headers through HTTPS endpoint:

```bash
curl -k -I https://localhost:8443
```

Expected: includes strict transport and clickjacking/mime protections as configured.

4. Verify cookies (if present): HttpOnly, Secure, SameSite.
Expected: sensitive cookies are hardened.

## 7.4 Upload and File Handling

1. Upload disallowed file types and oversized files.
Expected: rejected with safe error.

2. Upload filename with path traversal patterns (`../`).
Expected: sanitized and blocked.

3. Request uploaded assets directly.
Expected: only allowed files accessible.

## 7.5 Rate Limiting, Abuse, and WAF

1. Send burst requests to auth/public API endpoints (quick script or load tool).
Expected: rate limiting triggers (429 or equivalent).

2. Send known suspicious patterns (basic SQLi/XSS probes) through WAF endpoint.
Expected: blocked/challenged by ModSecurity rule set.

3. Inspect WAF/nginx/backend logs for blocked events.
Expected: actionable logs, no backend crash.

## 7.6 Secrets and Configuration Hygiene

1. Ensure .env and secrets are not exposed via frontend bundles or public endpoints.
Expected: no secret leakage.

2. Verify Vault-backed secrets resolve and are not logged in plaintext.
Expected: secret values masked/absent in logs.

3. Confirm error responses do not leak stack traces in production mode.
Expected: generic safe error messages.

## 8. API-Level Validation (Optional but Recommended)

Use Postman/Insomnia or curl collection:

1. Validate every public endpoint success and failure responses.
2. Validate schema constraints (required fields, UUID format, pagination bounds).
3. Validate consistency: backend response aligns with frontend assumptions.

## 9. Monitoring and Reliability Checks

1. Trigger normal activity (logins, posts, messages).
2. Confirm metrics appear in Prometheus target data.
3. Open Grafana dashboards and verify panels update.
4. Stop and restart one service (e.g., backend), then verify recovery behavior.

Expected: observability works and user-facing degradation is controlled.

## 10. Exit Criteria

Release candidate is accepted when:

1. 100% smoke tests pass.
2. No critical/high security issue remains open.
3. No blocker/critical functional defect remains open.
4. Core pages pass responsive checks on all target viewports.
5. Known minor issues are documented with workaround/priority.

## 11. Defect Template

Use this template for each issue:

```md
Title: [Area] Short defect summary
Severity: Critical | High | Medium | Low
Environment: branch/commit, browser/device, date
Steps to Reproduce:
1.
2.
3.
Expected Result:
Actual Result:
Evidence: screenshot/log/request id
Notes:
```

## 12. Suggested Test Execution Checklist

```md
- [ ] Environment up and healthy
- [ ] Smoke tests complete
- [ ] Auth/session tests complete
- [ ] Feed/social tests complete
- [ ] Chat/realtime tests complete
- [ ] Notifications tests complete
- [ ] Search/explore tests complete
- [ ] i18n tests complete
- [ ] Responsive matrix complete
- [ ] Security suite complete
- [ ] Monitoring checks complete
- [ ] Regression pass after fixes complete
- [ ] Final report prepared
```

## 13. Final Report Structure

At the end of testing, produce:

1. Summary: pass rate by category (functionality/responsive/security).
2. Open defects by severity.
3. Security findings and mitigation status.
4. Recommendation: ready/not ready for evaluation.
