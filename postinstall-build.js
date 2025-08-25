#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('Running postinstall build for @playwright/test...');

// List of packages that need minimal package.json files
const packages = [
  'injected',
  'playwright-core', 
  'playwright-ct-core',
  'playwright-ct-react',
  'playwright-ct-react17', 
  'playwright-ct-svelte',
  'playwright-ct-vue',
  'protocol',
  'trace'
];

// List of bundles that need minimal package.json files
const bundles = [
  'packages/playwright/bundles/babel',
  'packages/playwright/bundles/expect', 
  'packages/playwright/bundles/mcp',
  'packages/playwright/bundles/utils',
  'packages/playwright-core/bundles/utils',
  'packages/playwright-core/bundles/zip'
];

// Create minimal package.json for missing packages
packages.forEach(pkg => {
  const packagePath = path.join('packages', pkg);
  const packageJsonPath = path.join(packagePath, 'package.json');
  
  if (!fs.existsSync(packageJsonPath)) {
    console.log(`Creating minimal package.json for ${pkg}`);
    fs.mkdirSync(packagePath, { recursive: true });
    fs.writeFileSync(packageJsonPath, JSON.stringify({
      name: `@playwright/${pkg}`,
      version: "1.56.0-next",
      private: true
    }, null, 2));
  }
});

// Create minimal package.json for missing bundles
bundles.forEach(bundlePath => {
  const packageJsonPath = path.join(bundlePath, 'package.json');
  
  if (!fs.existsSync(packageJsonPath)) {
    const bundleName = path.basename(bundlePath);
    console.log(`Creating minimal package.json for bundle ${bundleName}`);
    fs.mkdirSync(bundlePath, { recursive: true });
    fs.writeFileSync(packageJsonPath, JSON.stringify({
      name: `@playwright/${bundleName}-bundle`,
      version: "1.56.0-next", 
      private: true
    }, null, 2));
  }
});

// Now run the actual build
console.log('Running npm run build...');
try {
  execSync('npm run build', { stdio: 'inherit' });
  console.log('Build completed successfully!');
} catch (error) {
  console.error('Build failed:', error.message);
  process.exit(1);
}
