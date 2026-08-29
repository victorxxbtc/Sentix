const https = require('https');
const fs = require('fs');
const path = require('path');
const zlib = require('zlib');
const { execSync } = require('child_process');

async function downloadAndExtract() {
  const url = 'https://registry.npmjs.org/hardhat/-/hardhat-2.22.2.tgz';
  const destDir = path.join(__dirname, '..', 'node_modules', 'hardhat');
  const tarPath = path.join(__dirname, '..', 'hardhat.tgz');

  console.log(`Downloading ${url}...`);
  const file = fs.createWriteStream(tarPath);

  await new Promise((resolve, reject) => {
    https.get(url, (res) => {
      res.pipe(file);
      file.on('finish', () => {
        file.close(resolve);
      });
    }).on('error', reject);
  });

  console.log(`Extracting hardhat tarball to ${destDir}...`);
  if (!fs.existsSync(destDir)) {
    fs.mkdirSync(destDir, { recursive: true });
  }

  // Use tar command (built-in on Windows 10/11)
  execSync(`tar -xzf "${tarPath}" --strip-components=1 -C "${destDir}"`, { stdio: 'inherit' });

  if (fs.existsSync(tarPath)) {
    fs.unlinkSync(tarPath);
  }

  console.log('Successfully installed hardhat directly!');
}

downloadAndExtract().catch(console.error);
