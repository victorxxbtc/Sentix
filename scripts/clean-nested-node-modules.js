const fs = require('fs');
const path = require('path');

const rootNm = path.join(__dirname, '..', 'node_modules');

function cleanNested(dir) {
  if (!fs.existsSync(dir)) return;
  const items = fs.readdirSync(dir, { withFileTypes: true });

  for (const item of items) {
    const fullPath = path.join(dir, item.name);
    if (item.isDirectory()) {
      if (item.name === 'node_modules' && dir !== path.join(__dirname, '..')) {
        console.log(`Removing nested node_modules: ${fullPath}`);
        fs.rmSync(fullPath, { recursive: true, force: true });
      } else {
        cleanNested(fullPath);
      }
    }
  }
}

cleanNested(rootNm);
console.log('Cleaned all nested node_modules!');
