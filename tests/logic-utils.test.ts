import assert from 'node:assert/strict';
import test from 'node:test';

import {
  evaluateBinary,
  explainBinary,
  gradeQuiz,
  parseProgress,
  searchStudySections,
} from '../src/logic-utils.ts';

const ids = ['overview', 'proposition', 'truth-table'];

void test('첫 방문은 0% 진도와 기본 섹션으로 시작한다', () => {
  assert.deepEqual(parseProgress(null, ids), { completed: [], lastSection: 'overview' });
});

void test('저장된 진도는 복원하고 손상된 값은 안전하게 무시한다', () => {
  assert.deepEqual(
    parseProgress('{"completed":["proposition","unknown"],"lastSection":"truth-table"}', ids),
    { completed: ['proposition'], lastSection: 'truth-table' },
  );
  assert.deepEqual(parseProgress('{broken', ids), { completed: [], lastSection: 'overview' });
});

void test('검색은 관련 섹션을 찾고 결과 없음 상태를 구분한다', () => {
  const sections = [{ title: '함축과 대우', summary: '조건문', searchText: '대우 contrapositive' }];
  assert.equal(searchStudySections(sections, '대우').length, 1);
  assert.equal(searchStudySections(sections, '그래프').length, 0);
  assert.equal(searchStudySections([{ title: '명제', summary: '', searchText: '' }], '명제').length, 1);
});

void test('모든 이항 연산자의 네 진리표 행을 계산한다', () => {
  const rows = [[true, true], [true, false], [false, true], [false, false]] as const;
  const expected = {
    and: [true, false, false, false],
    or: [true, true, true, false],
    xor: [false, true, true, false],
    implies: [true, false, true, true],
    iff: [true, false, false, true],
  } as const;
  for (const [operator, values] of Object.entries(expected)) {
    assert.deepEqual(rows.map(([p, q]) => evaluateBinary(operator as keyof typeof expected, p, q)), values);
  }
});

void test('진릿값 설명은 연산 결과의 이유를 올바르게 안내한다', () => {
  assert.match(explainBinary('implies', true, false), /약속을 위반/);
  assert.match(explainBinary('xor', true, false), /정확히 하나/);
  assert.match(explainBinary('iff', false, false), /같아서/);
});

void test('퀴즈는 미선택·잘못된 인덱스·정오답을 구분한다', () => {
  assert.equal(gradeQuiz(null, 1).status, 'unanswered');
  assert.equal(gradeQuiz(-1, -1).status, 'unanswered');
  assert.equal(gradeQuiz(1, 1).status, 'correct');
  assert.equal(gradeQuiz(0, 1).status, 'incorrect');
});
