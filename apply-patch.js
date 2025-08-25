#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Find the Playwright installation directory
function findPlaywrightPath() {
  try {
    // Try to find @playwright/test in node_modules
    const playwrightTestPath = require.resolve('@playwright/test/package.json');
    return path.dirname(playwrightTestPath);
  } catch (error) {
    console.error('Could not find @playwright/test installation');
    process.exit(1);
  }
}

// Find the playwright core installation directory
function findPlaywrightCorePath() {
  try {
    // Try to find playwright-core in node_modules
    const playwrightCorePath = require.resolve('playwright-core/package.json');
    return path.dirname(playwrightCorePath);
  } catch (error) {
    console.error('Could not find playwright-core installation');
    process.exit(1);
  }
}

// Apply a patch to a file
function applyPatch(filePath, patchPath) {
  if (!fs.existsSync(filePath)) {
    console.log(`Target file not found: ${filePath}`);
    return false;
  }

  if (!fs.existsSync(patchPath)) {
    console.log(`Patch file not found: ${patchPath}`);
    return false;
  }

  try {
    const patchContent = fs.readFileSync(patchPath, 'utf8');
    fs.writeFileSync(filePath, patchContent);
    console.log(`✅ Applied patch to: ${filePath}`);
    return true;
  } catch (error) {
    console.error(`❌ Failed to apply patch to ${filePath}:`, error.message);
    return false;
  }
}

// Main patch application
function main() {
  console.log('🔧 Applying Playwright patches...');
  
  const playwrightCorePath = findPlaywrightCorePath();
  const playwrightPath = findPlaywrightPath();
  
  console.log(`Found Playwright Core at: ${playwrightCorePath}`);
  console.log(`Found Playwright Test at: ${playwrightPath}`);

  const patches = [
    {
      target: path.join(playwrightCorePath, 'lib', 'cli', 'program.js'),
      patch: path.join(__dirname, 'patches', 'program.js')
    },
    {
      target: path.join(playwrightPath, '../playwright/lib/runner/loadUtils.js'),
      patch: path.join(__dirname, 'patches', 'loadUtils.js')
    }
  ];

  let successCount = 0;
  for (const { target, patch } of patches) {
    if (applyPatch(target, patch)) {
      successCount++;
    }
  }

  console.log(`\n🎉 Successfully applied ${successCount}/${patches.length} patches`);
  
  if (successCount < patches.length) {
    console.log('⚠️  Some patches failed to apply. Playwright may not work as expected.');
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = { applyPatch, findPlaywrightPath, findPlaywrightCorePath };
