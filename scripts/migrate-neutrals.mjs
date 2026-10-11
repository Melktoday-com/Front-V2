import fs from 'node:fs';
import path from 'node:path';

const ROOT_DIR = process.cwd();
const TARGET_DIRS = ['app', 'components', 'scenes'];
const SCAN_EXTENSIONS = new Set(['.tsx', '.ts']);

const neutralRules = [
  // Text neutrals
  { pattern: /(?<=(?:^|[^a-zA-Z0-9_\-]))text-(?:slate|gray|zinc|neutral|stone)-(?:400|500)(?=(?:[^a-zA-Z0-9_\-]|$))/g, replacement: 'text-foreground-muted' },
  { pattern: /(?<=(?:^|[^a-zA-Z0-9_\-]))text-(?:slate|gray|zinc|neutral|stone)-(?:600|700)(?=(?:[^a-zA-Z0-9_\-]|$))/g, replacement: 'text-foreground-secondary' },
  { pattern: /(?<=(?:^|[^a-zA-Z0-9_\-]))text-(?:slate|gray|zinc|neutral|stone)-(?:800|900|950)(?=(?:[^a-zA-Z0-9_\-]|$))/g, replacement: 'text-foreground' },

  // Background neutrals
  { pattern: /(?<=(?:^|[^a-zA-Z0-9_\-]))bg-(?:slate|gray|zinc|neutral|stone)-(?:50|100)(?=(?:[^a-zA-Z0-9_\-]|$))/g, replacement: 'bg-surface-secondary' },
  { pattern: /(?<=(?:^|[^a-zA-Z0-9_\-]))hover:bg-(?:slate|gray|zinc|neutral|stone)-(?:50|100)(?=(?:[^a-zA-Z0-9_\-]|$))/g, replacement: 'hover:bg-surface-secondary' },

  // Border neutrals
  { pattern: /(?<=(?:^|[^a-zA-Z0-9_\-]))border-(?:slate|gray|zinc|neutral|stone)-(?:100|200)(?=(?:[^a-zA-Z0-9_\-]|$))/g, replacement: 'border-border-subtle' },
  { pattern: /(?<=(?:^|[^a-zA-Z0-9_\-]))border-(?:slate|gray|zinc|neutral|stone)-(?:300|400)(?=(?:[^a-zA-Z0-9_\-]|$))/g, replacement: 'border-border' },
];

let totalModified = 0;
let totalReplacements = 0;

function processDirectory(dirPath) {
  const entries = fs.readdirSync(dirPath, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dirPath, entry.name);
    if (entry.isDirectory()) {
      processDirectory(fullPath);
    } else if (entry.isFile()) {
      const ext = path.extname(entry.name);
      if (SCAN_EXTENSIONS.has(ext)) {
        processFile(fullPath);
      }
    }
  }
}

function processFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  let fileReplacements = 0;

  for (const rule of neutralRules) {
    content = content.replace(rule.pattern, () => {
      fileReplacements++;
      return rule.replacement;
    });
  }

  if (fileReplacements > 0) {
    fs.writeFileSync(filePath, content, 'utf8');
    const relPath = path.relative(ROOT_DIR, filePath);
    console.log(`[MIGRATED] ${relPath}: ${fileReplacements} neutral replacements`);
    totalModified++;
    totalReplacements += fileReplacements;
  }
}

console.log('=== MIGRATING STATIC NEUTRAL UTILITIES TO SEMANTIC DESIGN TOKENS ===\n');
for (const dir of TARGET_DIRS) {
  const fullDir = path.resolve(ROOT_DIR, dir);
  if (fs.existsSync(fullDir)) {
    processDirectory(fullDir);
  }
}

console.log('\n----------------------------------------------------');
console.log(`Neutral Migration Complete: ${totalReplacements} occurrences migrated across ${totalModified} files.`);
