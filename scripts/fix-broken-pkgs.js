const https = require('https');
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

async function fixPackage(name, version) {
  const shortName = name.startsWith('@') ? name.split('/')[1] : name;
  const pkgDir = path.join(__dirname, '..', 'node_modules', name);
  const url = `https://registry.npmjs.org/${name}/-/${shortName}-${version}.tgz`;
  const tmpTar = path.join(__dirname, '..', `tmp-${name.replace(/[/@]/g, '_')}.tgz`);

  console.log(`Fixing ${name}@${version}...`);
  if (fs.existsSync(pkgDir)) {
    fs.rmSync(pkgDir, { recursive: true, force: true });
  }
  fs.mkdirSync(pkgDir, { recursive: true });

  const file = fs.createWriteStream(tmpTar);
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

  execSync(`tar -xzf "${tmpTar}" --strip-components=1 -C "${pkgDir}"`, { stdio: 'ignore' });
  if (fs.existsSync(tmpTar)) fs.unlinkSync(tmpTar);
  console.log(`Fixed ${name}`);
}

async function main() {
  const pkgs = [
    ['tweetnacl', '1.0.3'],
    ['tweetnacl-util', '0.15.1']
  ];

  for (const [name, ver] of pkgs) {
    await fixPackage(name, ver);
  }
  console.log('Fixed tweetnacl!');
}

main().catch(console.error);
