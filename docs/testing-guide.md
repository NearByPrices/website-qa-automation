# Testing Guide

## Test Categories

| Category | Description |
|---|---|
| `FUNCTIONAL` | Browser-based Playwright tests for user journeys |
| `SEO` | Technical SEO: metadata, canonical, structured data |
| `MARKETING` | CTA presence, value proposition, price clarity |
| `PERFORMANCE` | Lighthouse scores and Core Web Vitals |
| `ACCESSIBILITY` | WCAG 2.1 checks via axe-core |
| `RESPONSIVE` | Multi-viewport layout and overflow checks |
| `LINKS` | Internal link resolution |
| `SECURITY` | HTTPS, security headers, sensitive data |
| `CRAWL` | URL discovery outcomes |

## Test Statuses

| Status | Meaning |
|---|---|
| `PASS` | Check passed — no issue found |
| `FAIL` | A verified rule violation or failed assertion |
| `WARNING` | Advisory issue — worth reviewing but not a hard failure |
| `SKIPPED` | Test not executed because required config is missing |
| `ERROR` | Test execution failed due to environment or code error |
| `REVIEW_REQUIRED` | Subjective check that needs human judgment |

**Important**: `SKIPPED` is never counted as `PASS`. A skipped test means the check was not performed.

## Severities

| Severity | Meaning |
|---|---|
| `CRITICAL` | Serious defect — immediate action required |
| `HIGH` | Important issue affecting UX or SEO significantly |
| `MEDIUM` | Should be fixed but not blocking |
| `LOW` | Minor advisory finding |
| `INFO` | Informational — no action required |

## Running Tests

### Local smoke test (no credentials needed)
```bash
NBP_BASE_URL=https://near-by-pricesfrontend.vercel.app npm run qa:smoke
```

### Full Playwright suite
```bash
NBP_BASE_URL=https://near-by-pricesfrontend.vercel.app npm run qa:functional
```

### SEO audit only
```bash
NBP_BASE_URL=https://... npm run qa:seo
```

## Evidence and Artifacts

Every test run produces:
- JSON report in `audit-results/`
- Playwright HTML report in `playwright-report/`
- Screenshots on failure in `test-results/`

## Interpreting Failures

Not every failure indicates a bug in the website. Distinguish:

| Failure type | How to identify |
|---|---|
| Website defect | Multiple pages affected, reproducible in browser |
| Test assertion defect | Only one test fails, behaviour is actually correct |
| Environment problem | `ERROR` status, network errors, proxy errors |
| Third-party issue | Analytics, CDN or third-party script errors |
| Configuration problem | Missing env vars, wrong base URL |

## Adding New Tests

1. Add a Playwright spec to `tests/nbp/` for browser-based checks
2. Add a new audit rule to `config/audit-rules.ts`
3. Implement the check in the relevant auditor in `src/audits/`

Prefer stable selectors (`[data-testid]`, ARIA roles) over fragile CSS selectors.

## Automated vs Manual Accessibility Review

axe-core automated checks catch about 30-40% of WCAG issues. Results marked `REVIEW_REQUIRED` in the accessibility category need manual testing to verify. Automated checks are a starting point, not a complete accessibility audit.
