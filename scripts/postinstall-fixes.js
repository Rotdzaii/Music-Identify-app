const fs = require('fs');
const path = require('path');

function removeIfExists(filePath) {
  if (!fs.existsSync(filePath)) {
    return false;
  }

  fs.unlinkSync(filePath);
  return true;
}

function ensureExpoAvTsconfigWarningIsPatched() {
  const rootDir = process.cwd();
  const expoAvTsconfig = path.join(rootDir, 'node_modules', 'expo-av', 'tsconfig.json');

  const removed = removeIfExists(expoAvTsconfig);
  if (removed) {
    console.log('[postinstall] Removed node_modules/expo-av/tsconfig.json to avoid TypeScript diagnostics noise.');
  } else {
    console.log('[postinstall] expo-av tsconfig patch not needed.');
  }
}

try {
  ensureExpoAvTsconfigWarningIsPatched();
} catch (error) {
  console.warn('[postinstall] Could not apply local fixes:', error instanceof Error ? error.message : error);
}
