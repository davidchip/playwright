// @animake/playwright-patch
// 
// This package patches standard @playwright/test to add:
// 1. --after flag to codegen command
// 2. Test interdependency support (importing test functions from other test files)
//
// The patches are applied automatically via postinstall script.

module.exports = {
  // Re-export everything from @playwright/test
  ...require('@playwright/test'),
  
  // Indicate that patches are applied
  __patched: true,
  __version: '1.0.0'
};
