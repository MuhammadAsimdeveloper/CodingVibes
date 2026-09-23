# Release 3.0.0 — Launch Candidate

Coding Vibes 3.0.0 closes the main product and operational gaps left in the 2.x engineering foundation.

## Added

- first-class free/pro/team plan model with monthly run/token quotas
- Stripe Checkout session creation and signed webhook handling
- explicit dependency approval records before networked package installation
- dependency approval UI and re-verification flow
- production readiness endpoint at `/ready`
- launch-time infrastructure blockers/warnings instead of ambiguous health status
- isolated web dependency installation for approved local/container previews
- launch documentation and environment configuration for billing and quota enforcement
- release artifact cleanup so runtime databases, checkpoints and generated projects are not shipped

## Validation

- 58+ automated tests
- syntax/static checks
- end-to-end generated-app verification
- HTTP smoke test

## Production gate

The codebase is a launch candidate, but a production deployment is only ready after the `/ready` endpoint reports `ready: true` with real provider, runtime, secrets, database, TLS/edge and billing configuration.
