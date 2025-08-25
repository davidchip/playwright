#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const child_process = require('child_process');

console.log('Running postinstall build for @playwright/test...');

// First, create necessary package.json files for packages that don't have them
const packagesDir = path.join(__dirname, 'packages');
if (fs.existsSync(packagesDir)) {
  const packages = fs.readdirSync(packagesDir).filter(name => 
    fs.statSync(path.join(packagesDir, name)).isDirectory()
  );
  
  for (const pkg of packages) {
    const packagePath = path.join(packagesDir, pkg);
    const packageJsonPath = path.join(packagePath, 'package.json');
    
    if (!fs.existsSync(packageJsonPath)) {
      console.log(`Creating minimal package.json for ${pkg}`);
      const minimalPackageJson = {
        name: `@playwright/${pkg}`,
        version: "1.56.0-next",
        description: `Playwright ${pkg} package`,
        main: "index.js",
        private: true
      };
      fs.writeFileSync(packageJsonPath, JSON.stringify(minimalPackageJson, null, 2));
    }
  }
}

// Now run the actual build
try {
  console.log('Running npm run build...');
  child_process.execSync('npm run build', { 
    stdio: 'inherit', 
    cwd: __dirname 
  });
  console.log('Build completed successfully!');
} catch (error) {
  console.error('Build failed:', error.message);
  process.exit(1);
}
