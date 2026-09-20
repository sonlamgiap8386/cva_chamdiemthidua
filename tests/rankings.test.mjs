// Chạy bằng Node >= 22.18 (đọc trực tiếp file .ts).
import assert from 'node:assert/strict';
import test from 'node:test';
import { buildRankingDoc, rankingDocToRecords, rankingDocId } from '../src/utils/rankings.ts';

const rec = (o = {}) => ({
  id: 's', staffId: 'u1', staffName: 'A', staffCode: 'C1', departmentId: 'd1', departmentName: 'Tổ 1',
  position: 'GV', month: 9, year: '2026-2027', baseScore: 230,
  bonusItems: [{ id: 'b', title: 'nội dung nhạy cảm', points: 5, quantity: 1, note: 'ghi chú riêng' }],
  penaltyItems: [{ id: 'p', title: 'vi phạm chi tiết', points: 3, quantity: 1 }],
  totalBonus: 5, totalPenalty: 3, totalScore: 232, status: 'approved', feedback: 'ý kiến riêng', bghNotes: 'ghi chú BGH', ...o,
});

test('only approved/locked records of the requested month and year are published', () => {
  const doc = buildRankingDoc([
    rec({ staffId: 'a', status: 'approved' }),
    rec({ staffId: 'b', status: 'locked' }),
    rec({ staffId: 'c', status: 'submitted' }),
    rec({ staffId: 'd', status: 'draft' }),
    rec({ staffId: 'e', month: 10 }),
    rec({ staffId: 'f', year: '2025-2026' }),
  ], '2026-2027', 9);
  assert.deepEqual(doc.entries.map(e => e.staffId).sort(), ['a', 'b']);
});

test('no detailed items, notes or feedback ever reach the public document', () => {
  const doc = buildRankingDoc([rec()], '2026-2027', 9);
  const json = JSON.stringify(doc);
  for (const secret of ['nội dung nhạy cảm', 'ghi chú riêng', 'vi phạm chi tiết', 'ý kiến riêng', 'ghi chú BGH', 'bonusItems', 'penaltyItems', 'feedback']) {
    assert.ok(!json.includes(secret), `leaked: ${secret}`);
  }
});

test('BGH approved score wins over the proposed total, and entries are sorted high to low', () => {
  const doc = buildRankingDoc([
    rec({ staffId: 'a', totalScore: 240, bghApprovedScore: 235, staffCode: 'A' }),
    rec({ staffId: 'b', totalScore: 250, staffCode: 'B' }),
  ], '2026-2027', 9);
  assert.deepEqual(doc.entries.map(e => [e.staffId, e.score]), [['b', 250], ['a', 235]]);
});

test('round trip gives records the leaderboard can use, without private detail', () => {
  const records = rankingDocToRecords(buildRankingDoc([rec()], '2026-2027', 9));
  assert.equal(records.length, 1);
  assert.equal(records[0].bghApprovedScore, 232);
  assert.deepEqual(records[0].bonusItems, []);
  assert.deepEqual(records[0].penaltyItems, []);
  assert.equal(records[0].month, 9);
});

test('malformed documents are ignored instead of crashing the leaderboard', () => {
  assert.deepEqual(rankingDocToRecords(null), []);
  assert.deepEqual(rankingDocToRecords({ year: '2026-2027', month: 9, entries: [{ staffId: 'x' }, null, 5] }), []);
  assert.equal(rankingDocId('2026-2027', 9), '2026-2027_9');
});
