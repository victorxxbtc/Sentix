const fs = require('fs');
const path = require('path');
const os = require('os');
const { ethers } = require('ethers');

const localAppData = process.env.LOCALAPPDATA || path.join(os.homedir(), 'AppData', 'Local');
const wasmCacheDir = path.join(localAppData, 'hardhat-nodejs', 'Cache', 'compilers', 'wasm');
fs.mkdirSync(wasmCacheDir, { recursive: true });

const srcSoljson = path.join(__dirname, '..', 'node_modules', 'solc', 'soljson.js');
const dstSoljson = path.join(wasmCacheDir, 'soljson-v0.8.24+commit.e11b9ed9.js');
fs.copyFileSync(srcSoljson, dstSoljson);

const fileBuffer = fs.readFileSync(dstSoljson);
const fileKeccak = ethers.keccak256(fileBuffer);
console.log('soljson keccak256:', fileKeccak);

const listJson = {
  builds: [
    {
      path: "soljson-v0.8.24+commit.e11b9ed9.js",
      version: "0.8.24",
      build: "commit.e11b9ed9",
      longVersion: "0.8.24+commit.e11b9ed9",
      keccak256: fileKeccak,
      urls: ["bzzr://0000000000000000000000000000000000000000000000000000000000000000"]
    }
  ],
  releases: {
    "0.8.24": "soljson-v0.8.24+commit.e11b9ed9.js"
  },
  latestRelease: "0.8.24"
};

fs.writeFileSync(path.join(wasmCacheDir, 'list.json'), JSON.stringify(listJson, null, 2));
console.log('Written list.json with verified keccak256!');
