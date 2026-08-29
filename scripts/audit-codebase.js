const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const IGNORE_DIRS = ['node_modules', '.git', 'cache', 'artifacts', 'typechain-types', 'dist', 'build', '.gemini'];

const SUSPICIOUS_PATTERNS = [
  /mock/i,
  /fake/i,
  /placeholder/i,
  /dummy/i,
  /fabricated/i,
  /TODO/i,
  /FIXME/i,
  /localhost:8545/i
];

let findings = [];

function scanDir(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    if (IGNORE_DIRS.includes(file)) continue;
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    if (stat.isDirectory()) {
      scanDir(fullPath);
    } else if (/\.(ts|js|sol|json|html|md)$/.test(file)) {
      if (file === 'audit-codebase.js' || file === 'walkthrough.md' || file === 'implementation_plan.md' || file === 'package-lock.json') continue;
      const content = fs.readFileSync(fullPath, 'utf8');
      const lines = content.split('\n');
      lines.forEach((line, idx) => {
        for (const pattern of SUSPICIOUS_PATTERNS) {
          if (pattern.test(line)) {
            // Ignore benign references (e.g. in test comments, documentation disclaimers about eliminating mocks, etc.)
            findings.push({
              file: path.relative(ROOT, fullPath),
              line: idx + 1,
              content: line.trim()
            });
            break;
          }
        }
      });
    }
  }
}

scanDir(ROOT);
console.log(`[Audit] Scanned codebase. Found ${findings.length} pattern occurrences.`);
findings.slice(0, 20).forEach(f => {
  console.log(`  ${f.file}:${f.line} -> ${f.content}`);
});
