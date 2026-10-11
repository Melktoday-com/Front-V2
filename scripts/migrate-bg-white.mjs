import fs from 'node:fs';
import path from 'node:path';

const ROOT_DIR = process.cwd();
const TARGET_DIRS = ['app', 'components', 'scenes'];
const SCAN_EXTENSIONS = new Set(['.tsx', '.ts', '.css']);

const regex = /(?<=(?:^|[^a-zA-Z0-9_\-]))bg-white(?=(?:[^a-zA-Z0-9_\-]|$))/g;

let totalFilesModified = 0;
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
  const content = fs.readFileSync(filePath, 'utf8');
  let count = 0;
  const newContent = content.replace(regex, () => {
    count++;
    return 'bg-surface';
  });

  if (count > 0) {
    fs.writeFileSync(filePath, newContent, 'utf8');
    const relPath = path.relative(ROOT_DIR, filePath);
    console.log(`[UPDATED] ${relPath}: ${count} replacements`);
    totalFilesModified++;
    totalReplacements += count;
  }
}

console.log('=== MIGRATING bg-white HARDCODED USAGES TO bg-surface ===\n');
for (const dir of TARGET_DIRS) {
  const fullDir = path.resolve(ROOT_DIR, dir);
  if (fs.existsSync(fullDir)) {
    processDirectory(fullDir);
  }
}

console.log('\n----------------------------------------------------');
console.log(`Migration Complete: ${totalReplacements} occurrences replaced across ${totalFilesModified} files.`);
