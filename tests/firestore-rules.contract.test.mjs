import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const rules = await readFile(new URL('../firestore.rules', import.meta.url), 'utf8');

test('rules use custom claims rather than browser profile fields', () => {
  assert.match(rules, /request\.auth\.token\.role/);
  assert.match(rules, /request\.auth\.token\.staffId/);
  assert.match(rules, /request\.auth\.token\.departmentId/);
});

test('a leader is restricted to its own department and cannot approve or lock scores', () => {
  assert.match(rules, /sameDepartment\(resource\.data\)/);
  assert.match(rules, /sameDepartment\(request\.resource\.data\)/);
  assert.match(rules, /request\.resource\.data\.status in \['draft', 'submitted'\]/);
  assert.match(rules, /resource\.data\.status in \['draft', 'submitted'\]/);
});

test('user profile listing is not available to ordinary accounts', () => {
  assert.match(rules, /allow list: if isAdmin\(\);/);
});
