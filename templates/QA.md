# App QA

## Critical user journeys

1.
2.
3.

## Automated gates

- [ ] lint
- [ ] typecheck
- [ ] unit tests
- [ ] production build
- [ ] extension E2E

## Host integration cases

- [ ] expected DOM/API shape
- [ ] missing/changed selector
- [ ] SPA navigation/reload
- [ ] permission denied
- [ ] background worker restarted

## Destructive operation cases

If applicable:
- [ ] zero targets
- [ ] one target
- [ ] multiple targets
- [ ] exact target count shown
- [ ] explicit irreversible confirmation
- [ ] mid-batch failure
- [ ] retry/rate-limit behavior
- [ ] duplicate side-effect prevention
- [ ] safe stop on compatibility failure

## Manual release smoke

- [ ] production build loaded unpacked
- [ ] no manifest/service-worker startup errors
- [ ] primary flow works
- [ ] persistence survives reload/restart where required
- [ ] failure path tested
- [ ] no sensitive console logging
- [ ] no unexpected network destinations
- [ ] effective permissions match `PERMISSIONS.md`

## Result

- Date:
- Version/commit:
- Tester:
- Result: PASS / FAIL
- Blocking findings:
