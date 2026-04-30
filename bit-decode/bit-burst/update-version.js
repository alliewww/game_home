const fs = require('fs');
const path = require('path');

// 讀取 package.json
const packageJsonPath = path.join(__dirname, 'package.json');
const serviceWorkerPath = path.join(__dirname, 'public', 'service-worker.js');

try {
  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
  const version = packageJson.version;

  // 讀取 service-worker.js 的內容
  let serviceWorkerContent = fs.readFileSync(serviceWorkerPath, 'utf8');

  // 使用正則表達式替換版本號
  const versionRegex = /const CACHE_NAME = 'pf-cache-v[^']+'/;
  const newServiceWorkerContent = serviceWorkerContent.replace(
    versionRegex, 
    `const CACHE_NAME = 'pf-cache-v${version}'`
  );

  // 寫入更新後的 service-worker.js
  fs.writeFileSync(serviceWorkerPath, newServiceWorkerContent);

  console.log(`Updated service-worker.js cache version to: ${version}`);
} catch (error) {
  console.error('Error updating service-worker.js:', error);
  process.exit(1);
} 