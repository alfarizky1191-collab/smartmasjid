# SmartMasjid Playwright Tests

## Setup

1. Install dependencies:

   ```bash
   npm install
   ```

2. Copy the example environment file:

   ```bash
   cp .env.playwright.example .env.playwright
   ```

3. Fill in the required credentials in `.env.playwright`.

## Required environment variables

- `E2E_BASE_URL` — base URL for the application under test.
- `E2E_SUPER_EMAIL` / `E2E_SUPER_PASSWORD`
- `E2E_ADMIN_EMAIL` / `E2E_ADMIN_PASSWORD`
- `E2E_BENDAHARA_EMAIL` / `E2E_BENDAHARA_PASSWORD`
- `E2E_OPERATOR_EMAIL` / `E2E_OPERATOR_PASSWORD`
- `E2E_SEKRETARIS_EMAIL` / `E2E_SEKRETARIS_PASSWORD`

Optional fallback variables:

- `E2E_EMAIL`
- `E2E_PASSWORD`

## Running tests

From the repository root:

```bash
npm run test:e2e
```

The existing smoke test in `tests/auth/login-dashboard-logout.spec.ts` will execute when credentials are provided.

## Reporting

- HTML report: `playwright-report/index.html`
- Screenshots on failure: `test-results/`
- Video on failure: `test-results/`
- Trace on failure: `test-results/`

## Fixtures and helpers

- `tests/fixtures/index.ts` provides Playwright fixtures:
  - `anonymousPage`
  - `authenticatedPage`
  - `adminPage`
  - `operatorPage`

- `tests/helpers/auth.ts` provides role-based login helpers.
- `tests/helpers/navigation.ts` provides helper navigation and storage helpers.

## Notes

- The configuration automatically loads `.env.playwright` if present.
- No application business logic is modified by this testing infrastructure.
