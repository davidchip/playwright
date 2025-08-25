# @animake/playwright-patch

A patch package for Playwright that adds:

1. **--after flag** to the `codegen` command for running test dependencies before recording
2. **Test interdependency support** for importing test functions from other test files

## Installation

```bash
npm install @animake/playwright-patch
```

This package should be installed alongside standard `@playwright/test`:

```bash
npm install @playwright/test @animake/playwright-patch
```

## Features

### 1. Codegen --after Flag

Run existing tests before starting codegen to continue from their final state:

```bash
npx playwright codegen --after test-login.spec.ts http://localhost:3000/dashboard
```

This will:
- Run `test-login.spec.ts` first 
- Wait for it to complete
- Start recording from the browser state left by the login test
- Generate code for the dashboard interactions

### 2. Test Interdependencies

Import and use test functions from other test files:

```typescript
// In test-dashboard.spec.ts
import { run_test_login } from './test-login.spec.ts';

test('dashboard test', async ({ page }) => {
  // Run login test first to set up authenticated state
  await run_test_login({ page });
  
  // Continue with dashboard-specific tests
  await page.click('[data-testid="dashboard-button"]');
  // ...
});
```

## How It Works

The package applies patches to:
- `playwright-core/lib/cli/program.js` - Adds --after flag to codegen command
- `playwright/lib/runner/loadUtils.js` - Enables test file imports

Patches are applied automatically via postinstall script when the package is installed.

## Usage in Your Project

1. Install both packages:
   ```bash
   npm install @playwright/test @animake/playwright-patch
   ```

2. Use standard Playwright imports (the patch is transparent):
   ```typescript
   import { test, expect } from '@playwright/test';
   ```

3. Use the enhanced CLI:
   ```bash
   npx playwright codegen --after test-login.spec.ts http://localhost:3000/dashboard
   ```

## Compatibility

- Compatible with Playwright 1.55.0+
- Works with existing Playwright test suites
- Non-breaking - all existing functionality remains unchanged

## License

MIT
