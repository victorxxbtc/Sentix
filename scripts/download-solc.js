const https = require('https');
const fs = require('fs');
const path = require('path');
const os = require('os');

async function downloadFile(url, dest) {
  console.log(`Downloading ${url} -> ${dest}`);
  const file = fs.createWriteStream(dest);
  await new Promise((resolve, reject) => {
    https.get(url, (res) => {
      if (res.statusCode === 302 || res.statusCode === 301) {
        https.get(res.headers.location, (res2) => {
          res2.pipe(file);
          file.on('finish', () => file.close(resolve));
        }).on('error', reject);
      } else if (res.statusCode === 200) {
        res.pipe(file);
        file.on('finish', () => file.close(resolve));
      } else {
        reject(new Error(`Status ${res.statusCode} for ${url}`));
      }
    }).on('error', reject);
  });
}

async function main() {
  const localAppData = process.env.LOCALAPPDATA || path.join(os.homedir(), 'AppData', 'Local');
  const compilerDir = path.join(localAppData, 'hardhat-nodejs', 'Cache', 'compilers', 'windows-amd64');
  
  fs.mkdirSync(compilerDir, { recursive: true });

  const listUrl = 'https://binaries.soliditylang.org/windows-amd64/list.json';
  const solcUrl = 'https://binaries.soliditylang.org/windows-amd64/solc-windows-amd64-v0.8.24+commit.e11b9ed9.exe';

  await downloadFile(listUrl, path.join(compilerDir, 'list.json'));
  await downloadFile(solcUrl, path.join(compilerDir, 'solc-windows-amd64-v0.8.24+commit.e11b9ed9.exe'));

  console.log('Solidity compiler cached successfully in Hardhat cache directory!');
}

main().catch(console.error);
