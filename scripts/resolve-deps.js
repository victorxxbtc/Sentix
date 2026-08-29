const https = require('https');
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const deps = [
  'color-convert@2.0.1',
  'color-name@1.1.4',
  'ansi-styles@4.3.0',
  'supports-color@7.2.0',
  'has-flag@4.0.0',
  'ms@2.1.3',
  'source-map@0.6.1',
  'undici@5.28.4',
  '@openzeppelin/contracts@5.0.2',
  'ethers@6.11.1',
  'chai@4.3.10',
  'ts-node@10.9.2',
  'typescript@5.4.5',
  'dotenv@16.4.5',
  '@nomicfoundation/hardhat-toolbox@5.0.0',
  '@nomicfoundation/hardhat-ethers@3.0.5',
  '@nomicfoundation/hardhat-chai-matchers@2.0.6',
  '@nomicfoundation/hardhat-network-helpers@1.0.10',
  '@nomicfoundation/hardhat-verify@2.0.5',
  '@typechain/hardhat@9.1.0',
  '@typechain/ethers-v6@0.5.1',
  'typechain@8.3.2'
];

async function downloadPkg(pkgSpec) {
  let name, version;
  if (pkgSpec.startsWith('@')) {
    const parts = pkgSpec.slice(1).split('@');
    name = '@' + parts[0];
    version = parts[1];
  } else {
    [name, version] = pkgSpec.split('@');
  }

  const pkgDir = path.join(__dirname, '..', 'node_modules', name);
  if (fs.existsSync(pkgDir) && fs.existsSync(path.join(pkgDir, 'package.json'))) {
    return;
  }

  const shortName = name.startsWith('@') ? name.split('/')[1] : name;
  const url = `https://registry.npmjs.org/${name}/-/${shortName}-${version}.tgz`;
  const tmpTar = path.join(__dirname, '..', `tmp-${name.replace(/[/@]/g, '_')}.tgz`);

  console.log(`Downloading ${name}@${version}...`);
  const file = fs.createWriteStream(tmpTar);

  try {
    await new Promise((resolve, reject) => {
      https.get(url, (res) => {
        if (res.statusCode === 302 || res.statusCode === 301) {
          https.get(res.headers.location, (res2) => {
            res2.pipe(file);
            file.on('finish', () => file.close(resolve));
          }).on('error', reject);
        } else {
          res.pipe(file);
          file.on('finish', () => file.close(resolve));
        }
      }).on('error', reject);
    });

    if (!fs.existsSync(pkgDir)) {
      fs.mkdirSync(pkgDir, { recursive: true });
    }

    execSync(`tar -xzf "${tmpTar}" --strip-components=1 -C "${pkgDir}"`, { stdio: 'ignore' });
    if (fs.existsSync(tmpTar)) fs.unlinkSync(tmpTar);
    console.log(`Installed ${name}`);
  } catch (err) {
    console.error(`Failed ${name}:`, err.message);
  }
}

async function main() {
  for (const dep of deps) {
    await downloadPkg(dep);
  }
  console.log('Dependencies checked & resolved!');
}

main();
