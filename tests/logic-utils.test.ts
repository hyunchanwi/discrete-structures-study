import assert from 'node:assert/strict';
import test from 'node:test';

import {
  buildConditionalRelationRows,
  buildCompoundTruthRows,
  buildImplicationEquivalenceRows,
  buildImplicationRows,
  buildXorDecompositionRows,
  completedWeekNumbers,
  evaluateBinary,
  explainBinary,
  gradeQuiz,
  isWeekComplete,
  parseProgress,
  parseWeeklyProgress,
  resolveStudyLocation,
  searchStudySections,
} from '../src/logic-utils.ts';
import { weeks } from '../src/course-data.ts';

const ids = ['overview', 'proposition', 'truth-table'];

void test('첫 방문은 0% 진도와 기본 섹션으로 시작한다', () => {
  assert.deepEqual(parseProgress(null, ids), { completed: [], lastSection: 'overview' });
  assert.deepEqual(parseWeeklyProgress(null, weeks), {
    version: 2,
    completedByWeek: {},
    lastWeek: 1,
    lastSection: 'overview',
  });
});

void test('저장된 진도는 복원하고 손상된 값은 안전하게 무시한다', () => {
  assert.deepEqual(
    parseProgress('{"completed":["proposition","unknown"],"lastSection":"truth-table"}', ids),
    { completed: ['proposition'], lastSection: 'truth-table' },
  );
  assert.deepEqual(parseProgress('{broken', ids), { completed: [], lastSection: 'overview' });
});

void test('기존 v1 섹션 진도를 1주차 v2 상태로 이전한다', () => {
  const migrated = parseWeeklyProgress(
    null,
    weeks,
    '{"completed":["proposition","unknown","proposition"],"lastSection":"truth-table"}',
  );
  assert.deepEqual(migrated, {
    version: 2,
    completedByWeek: { 1: ['proposition'] },
    lastWeek: 1,
    lastSection: 'truth-table',
  });
});

void test('v2와 v1 저장값이 함께 있으면 v2를 우선한다', () => {
  const current = parseWeeklyProgress(
    '{"version":2,"completedByWeek":{"1":["overview"]},"lastWeek":1,"lastSection":"overview"}',
    weeks,
    '{"completed":["truth-table"],"lastSection":"truth-table"}',
  );
  assert.deepEqual(current, {
    version: 2,
    completedByWeek: { 1: ['overview'] },
    lastWeek: 1,
    lastSection: 'overview',
  });
});

void test('v2 진도는 주차별 유효 섹션만 복원하고 손상된 위치는 기본값으로 돌린다', () => {
  const restored = parseWeeklyProgress(
    '{"version":2,"completedByWeek":{"1":["overview","bad"],"2":["made-up"]},"lastWeek":2,"lastSection":"made-up"}',
    weeks,
  );
  assert.deepEqual(restored, {
    version: 2,
    completedByWeek: { 1: ['overview'] },
    lastWeek: 1,
    lastSection: 'overview',
  });
});

void test('모든 섹션을 완료한 준비 주차만 전체 진도에 포함한다', () => {
  const weekOneIds = weeks[0].sections.map((section) => section.id);
  const partial = parseWeeklyProgress(`{"version":2,"completedByWeek":{"1":["${weekOneIds[0]}"]},"lastWeek":1,"lastSection":"overview"}`, weeks);
  const complete = parseWeeklyProgress(JSON.stringify({ version: 2, completedByWeek: { 1: weekOneIds }, lastWeek: 1, lastSection: 'review' }), weeks);
  assert.equal(isWeekComplete(partial, weeks[0]), false);
  assert.equal(isWeekComplete(complete, weeks[0]), true);
  assert.deepEqual(completedWeekNumbers(complete, weeks), [1]);

  const sameLengthButMissingId = {
    version: 2 as const,
    completedByWeek: { 1: [...weekOneIds.slice(0, -1), 'foreign-section'] },
    lastWeek: 1,
    lastSection: 'overview',
  };
  assert.equal(sameLengthButMissingId.completedByWeek[1].length, weekOneIds.length);
  assert.equal(isWeekComplete(sameLengthButMissingId, weeks[0]), false);
});

void test('직접 링크와 저장 위치를 해석하고 잘못된 주차·해시는 1주차 개요로 정규화한다', () => {
  const saved = parseWeeklyProgress('{"version":2,"completedByWeek":{},"lastWeek":1,"lastSection":"truth-table"}', weeks);
  assert.deepEqual(resolveStudyLocation('1', '#truth-table', weeks, saved), { week: 1, section: 'truth-table', shouldNormalize: false });
  assert.deepEqual(resolveStudyLocation(null, '', weeks, saved), { week: 1, section: 'truth-table', shouldNormalize: true });
  assert.deepEqual(resolveStudyLocation('2', '#made-up', weeks, saved), { week: 1, section: 'overview', shouldNormalize: true });
  assert.deepEqual(resolveStudyLocation('1', '#missing', weeks, saved), { week: 1, section: 'overview', shouldNormalize: true });
  assert.deepEqual(resolveStudyLocation('1', '', weeks, saved), { week: 1, section: 'overview', shouldNormalize: true });
  assert.deepEqual(resolveStudyLocation(null, '', weeks, saved, 'truth-table'), { week: 1, section: 'truth-table', shouldNormalize: true });
});

void test('유효한 준비 주차는 해시가 비거나 잘못돼도 같은 주차 첫 섹션을 유지한다', () => {
  const multiWeek = [
    { number: 1, status: 'ready' as const, sections: [{ id: 'overview' }] },
    { number: 2, status: 'ready' as const, sections: [{ id: 'intro' }, { id: 'practice' }] },
    { number: 3, status: 'ready' as const, sections: [] },
  ];
  const saved = parseWeeklyProgress(null, multiWeek);
  assert.deepEqual(resolveStudyLocation('2', '', multiWeek, saved), { week: 2, section: 'intro', shouldNormalize: true });
  assert.deepEqual(resolveStudyLocation('2', '#missing', multiWeek, saved), { week: 2, section: 'intro', shouldNormalize: true });
  assert.deepEqual(resolveStudyLocation('3', '#anything', multiWeek, saved), { week: 1, section: 'overview', shouldNormalize: true });
});

void test('전체 7주차 모델에서 자료 없는 미래 주차는 메타데이터만 가진다', () => {
  assert.equal(weeks.length, 7);
  assert.equal(weeks[0].status, 'ready');
  assert.ok(weeks[0].sections.length > 0);
  for (const week of weeks.slice(1)) {
    assert.equal(week.status, 'upcoming');
    assert.deepEqual(week.sections, []);
  }
});

void test('검색은 관련 섹션을 찾고 결과 없음 상태를 구분한다', () => {
  const sections = [{ title: '함축과 대우', summary: '조건문', searchText: '대우 contrapositive' }];
  assert.equal(searchStudySections(sections, '대우').length, 1);
  assert.equal(searchStudySections(sections, '그래프').length, 0);
  assert.equal(searchStudySections([{ title: '명제', summary: '', searchText: '' }], '명제').length, 1);
});

void test('업데이트된 1주차 핵심 용어는 관련 섹션으로 검색된다', () => {
  const weekOneSections = weeks.find((week) => week.number === 1)?.sections ?? [];
  const cases = [
    ['연속', ['overview']],
    ['영화', ['proposition']],
    ['학생증', ['operators']],
    ['biconditional', ['implication']],
    ['공허하게 참', ['implication']],
    ['출발 꼬리', ['implication']],
    ['Harry 쇼핑', ['truth-table']],
    ['사실 분리', ['applications']],
    ['신호 흐름', ['bits-circuits']],
    ['곱의 합', ['bits-circuits', 'review']],
    ['부울대수', ['bits-circuits']],
    ['시험 포인트 행 수', ['review']],
  ] as const;
  for (const [query, expectedIds] of cases) {
    assert.deepEqual(searchStudySections(weekOneSections, query).map((section) => section.id), expectedIds);
  }
});

void test('함축 동치와 역·이·대우 관계를 식에서 계산한다', () => {
  assert.deepEqual(buildImplicationEquivalenceRows(), [
    { p: true, q: true, implication: true, notP: false, notPOrQ: true },
    { p: true, q: false, implication: false, notP: false, notPOrQ: false },
    { p: false, q: true, implication: true, notP: true, notPOrQ: true },
    { p: false, q: false, implication: true, notP: true, notPOrQ: true },
  ]);
  assert.deepEqual(buildConditionalRelationRows(), [
    { p: true, q: true, original: true, converse: true, inverse: true, contrapositive: true },
    { p: true, q: false, original: false, converse: true, inverse: true, contrapositive: false },
    { p: false, q: true, original: true, converse: false, inverse: false, contrapositive: true },
    { p: false, q: false, original: true, converse: true, inverse: true, contrapositive: true },
  ]);
});

void test('XOR의 AND·OR·NOT 분해식이 XOR 결과와 일치한다', () => {
  const rows = buildXorDecompositionRows();
  assert.deepEqual(rows, [
    { p: true, q: true, pAndNotQ: false, notPAndQ: false, decomposed: false, xor: false },
    { p: true, q: false, pAndNotQ: true, notPAndQ: false, decomposed: true, xor: true },
    { p: false, q: true, pAndNotQ: false, notPAndQ: true, decomposed: true, xor: true },
    { p: false, q: false, pAndNotQ: false, notPAndQ: false, decomposed: false, xor: false },
  ]);
  assert.ok(rows.every((row) => row.decomposed === row.xor));
});

void test('사이트에 표시하는 함축과 3변수 복합 진리표를 식에서 계산한다', () => {
  assert.deepEqual(buildImplicationRows(), [
    { p: true, q: true, result: true },
    { p: true, q: false, result: false },
    { p: false, q: true, result: true },
    { p: false, q: false, result: true },
  ]);
  assert.deepEqual(buildCompoundTruthRows(), [
    { p: false, q: false, r: false, pOrQ: false, notR: true, result: true },
    { p: false, q: false, r: true, pOrQ: false, notR: false, result: true },
    { p: false, q: true, r: false, pOrQ: true, notR: true, result: true },
    { p: false, q: true, r: true, pOrQ: true, notR: false, result: false },
    { p: true, q: false, r: false, pOrQ: true, notR: true, result: true },
    { p: true, q: false, r: true, pOrQ: true, notR: false, result: false },
    { p: true, q: true, r: false, pOrQ: true, notR: true, result: true },
    { p: true, q: true, r: true, pOrQ: true, notR: false, result: false },
  ]);
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
