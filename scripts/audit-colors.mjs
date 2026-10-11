import fs from 'node:fs';
import path from 'node:path';

const ROOT_DIR = process.cwd();
const CENTRAL_TOKEN_SOURCE = path.resolve(ROOT_DIR, 'app/globals.css');

// Required Foundational Tokens
const REQUIRED_FOUNDATIONAL = [
  { name: '--brand-navy', hex: '#3E5879' },
  { name: '--brand-apricot', hex: '#E39F73' },
  { name: '--brand-beige', hex: '#D8C4B6' },
  { name: '--brand-off-white', hex: '#F5EFE7' },
];

console.log('=== NEXT.JS AUTOMATED HARDCODED-COLOR AUDIT ===');
console.log(`Central Token Source: ${CENTRAL_TOKEN_SOURCE}\n`);

// 1. Verify central token source
if (!fs.existsSync(CENTRAL_TOKEN_SOURCE)) {
  console.error(`[ERROR] Central token source not found at: ${CENTRAL_TOKEN_SOURCE}`);
  process.exit(1);
}

const centralCss = fs.readFileSync(CENTRAL_TOKEN_SOURCE, 'utf8');
let tokenErrors = 0;
for (const token of REQUIRED_FOUNDATIONAL) {
  const tokenRegex = new RegExp(`${token.name}\\s*:\\s*${token.hex}`, 'i');
  if (!tokenRegex.test(centralCss)) {
    console.error(`[ERROR] Missing or incorrect foundational token ${token.name} (${token.hex}) in globals.css`);
    tokenErrors++;
  } else {
    console.log(`[OK] Foundational token ${token.name} is properly defined.`);
  }
}

if (tokenErrors > 0) {
  process.exit(1);
}

// 2. Scan project files
const SCAN_EXTENSIONS = new Set(['.tsx', '.ts', '.css', '.svg', '.json', '.js', '.mjs']);
const IGNORED_DIRS = new Set(['.git', '.next', 'node_modules', 'playwright-report', 'test-results', 'docs', 'scratch']);

// Regex patterns for detecting hardcoded color violations outside the token source
const HEX_COLOR_REGEX = /#(?:[0-9a-fA-F]{8}|[0-9a-fA-F]{6}|[0-9a-fA-F]{3,4})\b/g;
const RGB_HSL_REGEX = /\b(?:rgb|rgba|hsl|hsla|hwb)\s*\([^)]+\)/g;
const ARBITRARY_TAILWIND_COLOR = /(?:bg|text|border|ring|fill|stroke|from|via|to)-\[(?:#[0-9a-fA-F]{3,8}|rgba?\([^)]+\)|hsla?\([^)]+\))\]/g;
const HARDCODED_BG_WHITE = /(?<=(?:^|[^a-zA-Z0-9_\-]))bg-white(?=(?:[^a-zA-Z0-9_\-]|$))/g;
const SVG_HARDCODED_FILL_STROKE = /(?:fill|stroke|stop-color)=["']#(?:[0-9a-fA-F]{3,8})["']/gi;

function isAllowedHex(match, line, filePath) {
  // Ignore React Minified error identifiers e.g. Minified React error #418
  if (line.includes('Minified React error') || line.includes('error #')) return true;
  // Ignore markdown anchors or test ids
  if (line.includes('eslint') || line.includes('//') && line.includes('anchor')) return true;
  // The central token source is the ONLY file allowed to have brand hexes
  if (path.resolve(filePath) === CENTRAL_TOKEN_SOURCE) return true;
  return false;
}

const violations = [];

function scanDirectory(dirPath) {
  const entries = fs.readdirSync(dirPath, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dirPath, entry.name);
    if (entry.isDirectory()) {
      if (!IGNORED_DIRS.has(entry.name)) {
        scanDirectory(fullPath);
      }
    } else if (entry.isFile()) {
      const ext = path.extname(entry.name);
      if (SCAN_EXTENSIONS.has(ext)) {
        scanFile(fullPath);
      }
    }
  }
}

function scanFile(filePath) {
  const relPath = path.relative(ROOT_DIR, filePath);
  // Central token source is permitted to define tokens
  if (path.resolve(filePath) === CENTRAL_TOKEN_SOURCE) {
    return;
  }
  // Ignore audit and migration helper scripts
  if (relPath.startsWith('scripts/audit-') || relPath.startsWith('scripts/migrate-')) {
    return;
  }

  const content = fs.readFileSync(filePath, 'utf8');
  const lines = content.split('\n');

  lines.forEach((line, index) => {
    const lineNum = index + 1;

    // 1. Hex Color Check
    const hexMatches = line.match(HEX_COLOR_REGEX);
    if (hexMatches) {
      for (const hex of hexMatches) {
        if (!isAllowedHex(hex, line, filePath)) {
          violations.push({
            file: relPath,
            line: lineNum,
            type: 'Hex Color Literal',
            match: hex,
            snippet: line.trim(),
          });
        }
      }
    }

    // 2. RGB/HSL Check
    const rgbMatches = line.match(RGB_HSL_REGEX);
    if (rgbMatches) {
      for (const rgb of rgbMatches) {
        violations.push({
          file: relPath,
          line: lineNum,
          type: 'RGB/HSL Literal',
          match: rgb,
          snippet: line.trim(),
        });
      }
    }

    // 3. Arbitrary Tailwind Color Class Check
    const arbMatches = line.match(ARBITRARY_TAILWIND_COLOR);
    if (arbMatches) {
      for (const arb of arbMatches) {
        violations.push({
          file: relPath,
          line: lineNum,
          type: 'Arbitrary Tailwind Color Utility',
          match: arb,
          snippet: line.trim(),
        });
      }
    }

    // 4. Hardcoded bg-white Check
    const bgWhiteMatches = line.match(HARDCODED_BG_WHITE);
    if (bgWhiteMatches) {
      for (const bgw of bgWhiteMatches) {
        violations.push({
          file: relPath,
          line: lineNum,
          type: 'Hardcoded bg-white Utility (must use bg-surface)',
          match: bgw,
          snippet: line.trim(),
        });
      }
    }

    // 5. SVG fill/stroke Check
    if (filePath.endsWith('.svg')) {
      const svgMatches = line.match(SVG_HARDCODED_FILL_STROKE);
      if (svgMatches) {
        for (const svgm of svgMatches) {
          violations.push({
            file: relPath,
            line: lineNum,
            type: 'SVG Hardcoded Fill/Stroke',
            match: svgm,
            snippet: line.trim(),
          });
        }
      }
    }
  });
}

console.log('\nScanning codebase for unauthorized color usages...');
scanDirectory(ROOT_DIR);

console.log(`\nScan Complete. Total violations found: ${violations.length}\n`);

if (violations.length > 0) {
  console.log('--- VIOLATIONS REPORT ---');
  for (const v of violations) {
    console.log(`[${v.type}] ${v.file}:${v.line}`);
    console.log(`  Match:   ${v.match}`);
    console.log(`  Snippet: ${v.snippet.slice(0, 100)}\n`);
  }
  process.exit(1);
} else {
  console.log('[SUCCESS] ZERO unauthorized hardcoded colors found outside app/globals.css!');
  process.exit(0);
}
