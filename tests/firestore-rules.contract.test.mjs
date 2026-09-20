import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

// Kiểm tra "hợp đồng" nhanh trên nội dung luật (không cần emulator).
// Kiểm thử hành vi thật nằm ở tests/firestore-rules.emulator.test.mjs (npm run test:rules).
const rules = await readFile(new URL('../firestore.rules', import.meta.url), 'utf8');

test('rules use custom claims rather than browser profile fields', () => {
  assert.match(rules, /request\.auth\.token\.get\(name, null\)/);
  for (const name of ['role', 'staffId', 'departmentId']) {
    assert.match(rules, new RegExp(`claim\\('${name}'\\)`));
  }
});

test('a leader is restricted to its own department and cannot approve or lock scores', () => {
  assert.match(rules, /sameDepartment\(resource\.data\)/);
  assert.match(rules, /sameDepartment\(request\.resource\.data\)/);
  assert.match(rules, /request\.resource\.data\.status in \['draft', 'submitted'\]/);
  assert.match(rules, /resource\.data\.status in \['draft', 'submitted'\]/);
  assert.match(rules, /affectedKeys\(\)\.hasOnly\(leaderEditableFields\(\)\)/);
});

test('only BGH can list every user; leaders are limited to their department', () => {
  assert.match(rules, /allow list: if signedIn\(\) && \(isAdmin\(\) \|\| sameDepartment\(resource\.data\)\);/);
  assert.match(rules, /allow create, update, delete: if isAdmin\(\);/);
});

test('score totals must be consistent and score documents are created/deleted only by BGH', () => {
  assert.match(rules, /math\.abs\(data\.totalScore/);
  assert.match(rules, /allow create, delete: if isAdmin\(\);/);
});

test('there is no catch-all rule that opens the database', () => {
  assert.doesNotMatch(rules, /match \/\{document=\*\*\}/);
  assert.doesNotMatch(rules, /allow (read|write)[^;]*: if true/);
});

test('public rankings are readable by any authorized account but writable only by BGH', () => {
  assert.match(rules, /match \/rankings\/\{docId\}/);
  assert.match(rules, /allow read: if signedIn\(\) && hasRole\(\);/);
  const block = rules.slice(rules.indexOf('match /rankings/'));
  assert.match(block.slice(0, block.indexOf('match /system_meta')), /allow write: if isAdmin\(\);/);
});
