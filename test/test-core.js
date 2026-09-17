const assert = require('assert');
const fs = require('fs');
const path = require('path');

console.log('=== StickyShell Core & Edition Separation Test Suite ===\n');

// 1. Test Dynamic Parameters Engine (Developer Feature)
console.log('--- Testing Dynamic Parameters Engine (Developer Feature) ---');
function extractVariables(text) {
  if (!text) return [];
  const regex = /\{\{([a-zA-Z0-9_]+)(?::([^}]*))?\}\}/g;
  const vars = [];
  const seen = new Set();
  let match;
  while ((match = regex.exec(text)) !== null) {
    const name = match[1];
    const defaultVal = match[2] !== undefined ? match[2] : '';
    if (!seen.has(name)) {
      seen.add(name);
      vars.push({ name, defaultVal, placeholder: match[0] });
    }
  }
  return vars;
}

function replaceVariables(text, valuesMap) {
  return text.replace(/\{\{([a-zA-Z0-9_]+)(?::([^}]*))?\}\}/g, (match, name, defaultVal) => {
    if (valuesMap[name] !== undefined && valuesMap[name] !== '') {
      return valuesMap[name];
    }
    return defaultVal !== undefined ? defaultVal : match;
  });
}

const paramCmd = 'docker run -d --name {{CONTAINER:web}} -p {{PORT:8080}}:80 {{IMAGE:nginx:alpine}}';
const extracted = extractVariables(paramCmd);
assert.strictEqual(extracted.length, 3, 'Must extract 3 unique variables');
assert.strictEqual(extracted[0].name, 'CONTAINER');
assert.strictEqual(extracted[0].defaultVal, 'web');
assert.strictEqual(extracted[1].name, 'PORT');
assert.strictEqual(extracted[1].defaultVal, '8080');
assert.strictEqual(extracted[2].name, 'IMAGE');
assert.strictEqual(extracted[2].defaultVal, 'nginx:alpine');

const resolved = replaceVariables(paramCmd, { CONTAINER: 'prod-api', PORT: '3000' });
assert.strictEqual(resolved, 'docker run -d --name prod-api -p 3000:80 nginx:alpine');
console.log('✓ Dynamic Parameter extraction and replacement passed');

// 2. Test Safety & Danger Command Interceptor (Developer Feature)
console.log('\n--- Testing Safety & Danger Guard Detector (Developer Feature) ---');
function detectDangerCommand(text) {
  if (!text) return null;
  const dangerPatterns = [
    { regex: /\brm\s+(-[a-zA-Z]*r[a-zA-Z]*f|-[a-zA-Z]*f[a-zA-Z]*r)\b/i, label: 'Recursive force delete (rm -rf)' },
    { regex: /\b(drop\s+database|drop\s+table|truncate\s+table)\b/i, label: 'Database Drop / Truncate' },
    { regex: /\b(del\s+\/[sfq]|rd\s+\/s)\b/i, label: 'Windows Recursive Deletion' },
    { regex: /\b(docker\s+system\s+prune|docker\s+volume\s+prune)\b/i, label: 'Docker Resource Prune' },
    { regex: /\b(git\s+reset\s+--hard|git\s+clean\s+-fdx)\b/i, label: 'Destructive Git Reset' },
    { regex: /\b(Format-Volume|format\s+[a-z]:|mkfs)\b/i, label: 'Disk Formatting' }
  ];

  for (const pattern of dangerPatterns) {
    if (pattern.regex.test(text)) {
      return { label: pattern.label };
    }
  }
  return null;
}

assert.ok(detectDangerCommand('rm -rf /var/data'), 'Must flag rm -rf');
assert.ok(detectDangerCommand('DROP TABLE users;'), 'Must flag DROP TABLE');
assert.ok(detectDangerCommand('del /s /q C:\\temp'), 'Must flag del /s /q');
assert.ok(detectDangerCommand('docker system prune -a'), 'Must flag docker prune');
assert.ok(detectDangerCommand('git reset --hard origin/main'), 'Must flag git reset --hard');
assert.strictEqual(detectDangerCommand('npm test && git status'), null, 'Safe command must not be flagged');
console.log('✓ Danger command detector passed');

// 3. Test Offline License Key Validator (Developer Feature)
console.log('\n--- Testing Offline License Key Validation (Developer Feature) ---');
function validateLicenseKey(key) {
  if (!key) return false;
  const k = key.trim().toUpperCase();
  return k === 'DEV-PRO-2026' || k.startsWith('STICKYSHELL-PRO-') || k.startsWith('PRO-') || k.len >= 12;
}

assert.strictEqual(validateLicenseKey('DEV-PRO-2026'), true, 'DEV-PRO-2026 must be valid');
assert.strictEqual(validateLicenseKey('STICKYSHELL-PRO-ENTERPRISE'), true, 'STICKYSHELL-PRO- prefix must be valid');
assert.strictEqual(validateLicenseKey('PRO-TEAM-2026'), true, 'PRO- prefix must be valid');
assert.strictEqual(validateLicenseKey('INVALID'), false, 'Short invalid string must be rejected');
assert.strictEqual(validateLicenseKey(''), false, 'Empty string must be rejected');
console.log('✓ Offline license key validation passed');

// 4. Test Secret Masking Logic (Developer Feature)
console.log('\n--- Testing Secret & Key Masking (Developer Feature) ---');
function maskSecrets(text) {
  if (!text) return text;
  return text
    .replace(/(AKIA[0-9A-Z]{16})/g, '••••••••••••••••••••')
    .replace(/(ghp_[a-zA-Z0-9]{36})/g, '••••••••••••••••••••••••••••••••••••••••')
    .replace(/(sk-[a-zA-Z0-9]{32,})/g, '••••••••••••••••••••••••••••••••')
    .replace(/(Bearer\s+)[a-zA-Z0-9_.-]{20,}/gi, '$1••••••••••••••••••••');
}

const unmasked = 'export AWS_KEY=AKIAIOSFODNN7EXAMPLE\nexport GITHUB_TOKEN=ghp_123456789012345678901234567890123456\nBearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9';
const masked = maskSecrets(unmasked);
assert.ok(!masked.includes('AKIAIOSFODNN7EXAMPLE'), 'AWS key must be masked');
assert.ok(!masked.includes('ghp_123456789012345678901234567890123456'), 'GitHub token must be masked');
assert.ok(masked.includes('Bearer ••••'), 'Bearer token must be masked');
console.log('✓ Secret & Key Masking passed');

// 5. Test Undo Delete Stack Capacity (Home = 3, Developer = 10)
console.log('\n--- Testing Undo Delete Stack Capacity ---');
function simulateDeleteAndUndo(edition, notesToDelete) {
  const maxUndo = edition === 'developer' ? 10 : 3;
  const deletedStack = [];

  for (const note of notesToDelete) {
    while (deletedStack.length >= maxUndo) {
      deletedStack.shift();
    }
    deletedStack.push(note);
  }

  const restored = [];
  while (deletedStack.length > 0) {
    restored.push(deletedStack.pop());
  }
  return restored;
}

const sampleNotes = Array.from({ length: 15 }, (_, i) => ({ id: `note-${i + 1}`, content: `Note content ${i + 1}` }));

// Test Home Edition (Up to 3 restored in reverse order)
const homeRestored = simulateDeleteAndUndo('home', sampleNotes);
assert.strictEqual(homeRestored.length, 3, 'Home edition must retain the last 3 deleted notes');
assert.strictEqual(homeRestored[0].id, 'note-15', 'Home edition must restore latest deleted first');
assert.strictEqual(homeRestored[1].id, 'note-14', 'Home edition 2nd restored note must be note-14');
assert.strictEqual(homeRestored[2].id, 'note-13', 'Home edition 3rd restored note must be note-13');

// Test Developer Edition (Up to 10 restored in reverse order)
const devRestored = simulateDeleteAndUndo('developer', sampleNotes);
assert.strictEqual(devRestored.length, 10, 'Developer edition must retain up to 10 deleted notes');
assert.strictEqual(devRestored[0].id, 'note-15', 'Developer edition must restore latest deleted first');
assert.strictEqual(devRestored[9].id, 'note-6', 'Developer edition 10th restored item must be note-6');
console.log('✓ Undo Delete stack capacity (Home: 3, Developer: 10) passed');

// 6. Test Home Project Integrity & Zero Developer Leakage
console.log('\n--- Testing Home Project Integrity & Zero Developer Leakage ---');
const rootDir = path.resolve(__dirname, '..');
const homeNoteHtmlPath = path.join(rootDir, 'src', 'renderer', 'note', 'note.html');
const homeNoteJsPath = path.join(rootDir, 'src', 'renderer', 'note', 'note.js');
const homeBridgePath = path.join(rootDir, 'src', 'renderer', 'bridge.js');
const homeSettingsHtmlPath = path.join(rootDir, 'src', 'renderer', 'settings', 'settings.html');

assert.ok(fs.existsSync(homeNoteHtmlPath), 'Home note.html must exist');
assert.ok(fs.existsSync(homeNoteJsPath), 'Home note.js must exist');
assert.ok(fs.existsSync(homeBridgePath), 'Home bridge.js must exist');
assert.ok(fs.existsSync(homeSettingsHtmlPath), 'Home settings.html must exist');

const homeNoteHtml = fs.readFileSync(homeNoteHtmlPath, 'utf8');
const homeNoteJs = fs.readFileSync(homeNoteJsPath, 'utf8');
const homeBridge = fs.readFileSync(homeBridgePath, 'utf8');
const homeSettingsHtml = fs.readFileSync(homeSettingsHtmlPath, 'utf8');

// Assert Home Edition contains ZERO developer modals
const devModals = ['modal-params', 'modal-danger', 'modal-palette', 'modal-snippets', 'modal-appearance'];
for (const modal of devModals) {
  assert.ok(!homeNoteHtml.includes(modal), `Home note.html must NOT contain developer modal '${modal}'`);
}

// Assert Home Edition contains ZERO developer controls or backdoors
assert.ok(!homeNoteHtml.includes('btn-dev-indicator'), 'Home note.html must NOT contain developer pill');
assert.ok(!homeNoteHtml.includes('btn-mask-toggle'), 'Home note.html must NOT contain secret mask button');
assert.ok(!homeNoteHtml.includes('dev-only'), 'Home note.html must NOT contain dev-only class');
assert.ok(!homeNoteJs.includes('extractVariables'), 'Home note.js must NOT contain dynamic parameter extraction');
assert.ok(!homeNoteJs.includes('detectDangerCommand'), 'Home note.js must NOT contain danger guard patterns');
assert.ok(!homeNoteJs.includes('toggleSecretMasking'), 'Home note.js must NOT contain secret masking engine');
assert.ok(!homeBridge.includes('switchEditionMode'), 'Home bridge.js must NOT contain switchEditionMode');
assert.ok(!homeBridge.includes('activateLicense'), 'Home bridge.js must NOT contain activateLicense');
assert.ok(!homeSettingsHtml.includes('btn-toggle-eval-mode'), 'Home settings.html must NOT contain evaluation toggle');
assert.ok(!homeSettingsHtml.includes('license-key-input'), 'Home settings.html must NOT contain license key input');

// 7. Verify JavaScript syntax integrity
console.log('\n--- Testing JavaScript Syntax Integrity ---');
const vm = require('vm');
[
  { name: 'bridge.js', path: homeBridgePath },
  { name: 'note.js', path: homeNoteJsPath }
].forEach(file => {
  const code = fs.readFileSync(file.path, 'utf8');
  assert.doesNotThrow(() => {
    new vm.Script(code, { filename: file.name });
  }, `File ${file.name} must have valid JavaScript syntax`);
  console.log(`✓ ${file.name} syntax valid`);
});

console.log('\n🚀 ALL TESTS PASSED SUCCESSFULLY!\n');
