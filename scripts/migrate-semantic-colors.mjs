import fs from 'node:fs';
import path from 'node:path';

const ROOT_DIR = process.cwd();
const TARGET_DIRS = ['app', 'components', 'scenes'];
const SCAN_EXTENSIONS = new Set(['.tsx', '.ts']);

const rules = [
  // Blue -> Info
  { pattern: /(?<=(?:^|[^a-zA-Z0-9_\-]))text-blue-(?:500|600|700)(?=(?:[^a-zA-Z0-9_\-]|$))/g, replacement: 'text-info' },
  { pattern: /(?<=(?:^|[^a-zA-Z0-9_\-]))bg-blue-(?:50|100)(?=(?:[^a-zA-Z0-9_\-]|$))/g, replacement: 'bg-info-subtle' },
  { pattern: /(?<=(?:^|[^a-zA-Z0-9_\-]))border-blue-(?:100|200)(?=(?:[^a-zA-Z0-9_\-]|$))/g, replacement: 'border-info/30' },
  { pattern: /(?<=(?:^|[^a-zA-Z0-9_\-]))hover:bg-blue-(?:50|100)(?=(?:[^a-zA-Z0-9_\-]|$))/g, replacement: 'hover:bg-info-subtle' },
  { pattern: /(?<=(?:^|[^a-zA-Z0-9_\-]))text-blue-(?:900|950)(?=(?:[^a-zA-Z0-9_\-]|$))/g, replacement: 'text-foreground' },

  // Emerald / Green -> Success
  { pattern: /(?<=(?:^|[^a-zA-Z0-9_\-]))text-(?:emerald|green)-(?:600|700|800)(?=(?:[^a-zA-Z0-9_\-]|$))/g, replacement: 'text-success' },
  { pattern: /(?<=(?:^|[^a-zA-Z0-9_\-]))bg-(?:emerald|green)-(?:50|100)(?=(?:[^a-zA-Z0-9_\-]|$))/g, replacement: 'bg-success-subtle' },
  { pattern: /(?<=(?:^|[^a-zA-Z0-9_\-]))border-(?:emerald|green)-(?:100|200)(?=(?:[^a-zA-Z0-9_\-]|$))/g, replacement: 'border-success/30' },
  { pattern: /(?<=(?:^|[^a-zA-Z0-9_\-]))hover:bg-(?:emerald|green)-(?:50|100)(?=(?:[^a-zA-Z0-9_\-]|$))/g, replacement: 'hover:bg-success-subtle' },

  // Amber / Yellow -> Warning
  { pattern: /(?<=(?:^|[^a-zA-Z0-9_\-]))text-(?:amber|yellow)-(?:600|700|800)(?=(?:[^a-zA-Z0-9_\-]|$))/g, replacement: 'text-warning' },
  { pattern: /(?<=(?:^|[^a-zA-Z0-9_\-]))bg-(?:amber|yellow)-(?:50|100)(?=(?:[^a-zA-Z0-9_\-]|$))/g, replacement: 'bg-warning-subtle' },
  { pattern: /(?<=(?:^|[^a-zA-Z0-9_\-]))border-(?:amber|yellow)-(?:100|200)(?=(?:[^a-zA-Z0-9_\-]|$))/g, replacement: 'border-warning/30' },
  { pattern: /(?<=(?:^|[^a-zA-Z0-9_\-]))hover:bg-(?:amber|yellow)-(?:50|100)(?=(?:[^a-zA-Z0-9_\-]|$))/g, replacement: 'hover:bg-warning-subtle' },

  // Red / Rose -> Error
  { pattern: /(?<=(?:^|[^a-zA-Z0-9_\-]))text-(?:red|rose)-(?:500|600|700|800)(?=(?:[^a-zA-Z0-9_\-]|$))/g, replacement: 'text-error' },
  { pattern: /(?<=(?:^|[^a-zA-Z0-9_\-]))bg-(?:red|rose)-(?:50|100)(?=(?:[^a-zA-Z0-9_\-]|$))/g, replacement: 'bg-error-subtle' },
  { pattern: /(?<=(?:^|[^a-zA-Z0-9_\-]))border-(?:red|rose)-(?:100|200)(?=(?:[^a-zA-Z0-9_\-]|$))/g, replacement: 'border-error/30' },
  { pattern: /(?<=(?:^|[^a-zA-Z0-9_\-]))hover:bg-(?:red|rose)-(?:50|100)(?=(?:[^a-zA-Z0-9_\-]|$))/g, replacement: 'hover:bg-error-subtle' },
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

  for (const rule of rules) {
    content = content.replace(rule.pattern, () => {
      fileReplacements++;
      return rule.replacement;
    });
  }

  if (fileReplacements > 0) {
    fs.writeFileSync(filePath, content, 'utf8');
    const relPath = path.relative(ROOT_DIR, filePath);
    console.log(`[MIGRATED] ${relPath}: ${fileReplacements} semantic replacements`);
    totalModified++;
    totalReplacements += fileReplacements;
  }
}

console.log('=== MIGRATING STATIC FEEDBACK COLORS TO SEMANTIC DESIGN TOKENS ===\n');
for (const dir of TARGET_DIRS) {
  const fullDir = path.resolve(ROOT_DIR, dir);
  if (fs.existsSync(fullDir)) {
    processDirectory(fullDir);
  }
}

console.log('\n----------------------------------------------------');
console.log(`Semantic Migration Complete: ${totalReplacements} occurrences migrated across ${totalModified} files.`);
