import fs from 'node:fs';
import path from 'node:path';

// Parse hex string (#RGB, #RRGGBB) to [r, g, b] in 0..255
function parseHex(hex) {
  let c = hex.replace('#', '').trim();
  if (c.length === 3) {
    c = c.split('').map(ch => ch + ch).join('');
  }
  const num = parseInt(c, 16);
  return [(num >> 16) & 255, (num >> 8) & 255, num & 255];
}

// WCAG 2.2 Relative Luminance
function getLuminance([r, g, b]) {
  const [rs, gs, bs] = [r, g, b].map(val => {
    val /= 255;
    return val <= 0.03928 ? val / 12.92 : Math.pow((val + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
}

// Calculate WCAG contrast ratio between two hex colors
function getContrast(hex1, hex2) {
  const l1 = getLuminance(parseHex(hex1));
  const l2 = getLuminance(parseHex(hex2));
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  return (lighter + 0.05) / (darker + 0.05);
}

// Read app/globals.css
const globalsCssPath = path.resolve(process.cwd(), 'app/globals.css');
const cssContent = fs.readFileSync(globalsCssPath, 'utf8');

// Extract CSS variable definitions
const varRegex = /--([a-zA-Z0-9_\-]+)\s*:\s*([^;]+);/g;
const tokens = {};
let match;
while ((match = varRegex.exec(cssContent)) !== null) {
  tokens[match[1]] = match[2].trim();
}

// Resolve any var(--...) references
function resolveToken(name) {
  let val = tokens[name];
  if (!val) {
    throw new Error(`Token --${name} not found in app/globals.css`);
  }
  while (val.startsWith('var(--')) {
    const innerName = val.slice(6, -1).trim();
    val = tokens[innerName];
    if (!val) {
      throw new Error(`Referenced token --${innerName} not found`);
    }
  }
  return val;
}

console.log('=== NEXT.JS DESIGN SYSTEM CONTRAST AUDIT (WCAG 2.2 AA) ===');
console.log(`Source of Truth: ${globalsCssPath}\n`);

// Foundational Brand Tokens
const brandNavy = resolveToken('brand-navy');
const brandApricot = resolveToken('brand-apricot');
const brandBeige = resolveToken('brand-beige');
const brandOffWhite = resolveToken('brand-off-white');

console.log('Foundational Brand Tokens:');
console.log(`  --brand-navy:      ${brandNavy}`);
console.log(`  --brand-apricot:   ${brandApricot}`);
console.log(`  --brand-beige:     ${brandBeige}`);
console.log(`  --brand-off-white: ${brandOffWhite}\n`);

// Approved Semantic Test Suite
const testCases = [
  // 1. Primary Action & Inverse Surfaces
  {
    name: 'Primary Button / Inverse Surface (Navy background + Off-White text)',
    bgToken: 'primary',
    fgToken: 'primary-foreground',
    minTarget: 4.5,
    role: 'normal-text',
  },
  {
    name: 'Primary Action Hover (Navy hover background + Off-White text)',
    bgToken: 'primary-hover',
    fgToken: 'primary-foreground',
    minTarget: 4.5,
    role: 'normal-text',
  },
  {
    name: 'Primary Action Active (Navy active background + Off-White text)',
    bgToken: 'primary-active',
    fgToken: 'primary-foreground',
    minTarget: 4.5,
    role: 'normal-text',
  },

  // 2. Main Page Reading Surfaces
  {
    name: 'Main Page Content (Off-White background + Deep Navy reading text)',
    bgToken: 'background',
    fgToken: 'foreground',
    minTarget: 4.5,
    role: 'normal-text',
  },
  {
    name: 'Main Page Secondary Text (Off-White background + Muted Navy text)',
    bgToken: 'background',
    fgToken: 'foreground-muted',
    minTarget: 4.5,
    role: 'normal-text',
  },
  {
    name: 'Card Surface Content (Pure White surface + Deep Navy text)',
    bgToken: 'surface',
    fgToken: 'foreground',
    minTarget: 4.5,
    role: 'normal-text',
  },
  {
    name: 'Card Secondary Text (Pure White surface + Muted Navy text)',
    bgToken: 'surface',
    fgToken: 'foreground-muted',
    minTarget: 4.5,
    role: 'normal-text',
  },

  // 3. Accent Emphasis
  {
    name: 'Accent Pill / Badge (Apricot background + Deep Navy text)',
    bgToken: 'accent',
    fgToken: 'accent-foreground',
    minTarget: 4.5,
    role: 'normal-text',
  },
  {
    name: 'Accent Text on Light Surface (Off-White + High-contrast Terracotta-Apricot)',
    bgToken: 'background',
    fgToken: 'accent-text',
    minTarget: 4.5,
    role: 'normal-text',
  },
  {
    name: 'Accent Text on White Card (White + High-contrast Terracotta-Apricot)',
    bgToken: 'surface',
    fgToken: 'accent-text',
    minTarget: 4.5,
    role: 'normal-text',
  },
  {
    name: 'Accent Icon / Boundary on Navy (Navy background + Apricot icon)',
    bgToken: 'primary',
    fgToken: 'accent',
    minTarget: 3.0,
    role: 'non-text',
  },

  // 4. Muted Panels & Grouped Content
  {
    name: 'Warm Beige Panel (Beige background + Deep Navy text)',
    bgToken: 'brand-beige',
    fgToken: 'foreground',
    minTarget: 4.5,
    role: 'normal-text',
  },

  // 5. Component Boundaries & Non-text
  {
    name: 'Component Boundary against Off-White background',
    bgToken: 'background',
    fgToken: 'border-boundary',
    minTarget: 3.0,
    role: 'ui-boundary',
  },
  {
    name: 'Focus Ring against Off-White background',
    bgToken: 'background',
    fgToken: 'focus-ring',
    minTarget: 3.0,
    role: 'focus-indicator',
  },

  // 6. Centralized Feedback States
  {
    name: 'Success Button / Pill (Success background + White text)',
    bgToken: 'success',
    fgToken: 'success-foreground',
    minTarget: 4.5,
    role: 'normal-text',
  },
  {
    name: 'Success Alert / Badge (Success subtle background + Success text)',
    bgToken: 'success-subtle',
    fgToken: 'success',
    minTarget: 4.5,
    role: 'normal-text',
  },
  {
    name: 'Warning Button / Pill (Warning background + White text)',
    bgToken: 'warning',
    fgToken: 'warning-foreground',
    minTarget: 4.5,
    role: 'normal-text',
  },
  {
    name: 'Warning Alert / Badge (Warning subtle background + Warning text)',
    bgToken: 'warning-subtle',
    fgToken: 'warning',
    minTarget: 4.5,
    role: 'normal-text',
  },
  {
    name: 'Error Button / Pill (Error background + White text)',
    bgToken: 'error',
    fgToken: 'error-foreground',
    minTarget: 4.5,
    role: 'normal-text',
  },
  {
    name: 'Error Alert / Badge (Error subtle background + Error text)',
    bgToken: 'error-subtle',
    fgToken: 'error',
    minTarget: 4.5,
    role: 'normal-text',
  },
  {
    name: 'Info Button / Pill (Info background + White text)',
    bgToken: 'info',
    fgToken: 'info-foreground',
    minTarget: 4.5,
    role: 'normal-text',
  },
  {
    name: 'Info Alert / Badge (Info subtle background + Info text)',
    bgToken: 'info-subtle',
    fgToken: 'info',
    minTarget: 4.5,
    role: 'normal-text',
  },
];

let failed = 0;
let passed = 0;

for (const tc of testCases) {
  const bgHex = resolveToken(tc.bgToken);
  const fgHex = resolveToken(tc.fgToken);
  const ratio = getContrast(bgHex, fgHex);
  const passes = ratio >= tc.minTarget;

  const wcagLevel = ratio >= 7.0 ? 'AAA (>= 7:1)' : ratio >= 4.5 ? 'AA (>= 4.5:1)' : ratio >= 3.0 ? 'AA Large/Icon (>= 3:1)' : 'FAIL';

  if (passes) {
    passed++;
    console.log(`[PASS] ${tc.name}`);
    console.log(`       bg: ${bgHex} (--${tc.bgToken}), fg: ${fgHex} (--${tc.fgToken})`);
    console.log(`       Ratio: ${ratio.toFixed(2)}:1 (Min: ${tc.minTarget}:1) -> Level: ${wcagLevel}\n`);
  } else {
    failed++;
    console.error(`[FAIL] ${tc.name}`);
    console.error(`       bg: ${bgHex} (--${tc.bgToken}), fg: ${fgHex} (--${tc.fgToken})`);
    console.error(`       Ratio: ${ratio.toFixed(2)}:1 (Required: ${tc.minTarget}:1) -> Violation!\n`);
  }
}

console.log('----------------------------------------------------');
console.log(`Audit Complete: ${passed} passed, ${failed} failed out of ${testCases.length} tested combinations.`);

if (failed > 0) {
  process.exit(1);
} else {
  console.log('ALL APPROVED SEMANTIC PAIRINGS SATISFY WCAG 2.2 AA REQUIREMENTS!');
  process.exit(0);
}
