import assert from 'node:assert/strict';
import test from 'node:test';
import { weeks } from '../src/course-data.ts';
import { weeklyCatalog, weeklyLectureSummaries } from '../src/weekly-catalog.ts';
import { searchStudySections } from '../src/logic-utils.ts';
import { completedWeekNumbers, parseWeeklyProgress, resolveStudyLocation } from '../src/logic-utils.ts';

void test('7주차 Lec9의 실제 본문 ID와 검색 데이터가 연결되고 6주차는 대기한다', () => {
  const seven = weeks.find((week) => week.number === 7)!;
  assert.equal(seven.status, 'ready');
  assert.ok(seven.sections.some((section) => section.id === 'learning-gpt-cardinality'));
  assert.ok(seven.sections.some((section) => section.id === 'learning-gpt-matrices'));
  assert.ok(!seven.sections.some((section) => section.id === 'proposition'));
  assert.equal(weeks.find((week) => week.number === 6)?.status, 'upcoming');
  assert.equal(searchStudySections(seven.sections, 'baaba')[0]?.id, 'learning-gpt-cardinality');
  assert.equal(searchStudySections(seven.sections, 'Boolean')[0]?.id, 'learning-gpt-matrices');
  assert.equal(weeklyCatalog.find((week) => week.number === 7)?.lectureIds.length, 2);
});

void test('새 본문의 출처·전사 한계·기호 정의·확인문제를 제공한다', () => {
  const cardinality = weeklyLectureSummaries.find((lecture) => lecture.id === 'gpt-cardinality')!;
  const matrices = weeklyLectureSummaries.find((lecture) => lecture.id === 'gpt-matrices')!;
  assert.match(cardinality.recordingStatus, /정수의 가산성까지/);
  assert.match(matrices.recordingStatus, /교수 구두 진도 미확인/);
  assert.ok([...cardinality.sections, ...matrices.sections].every((section) => section.check?.question && section.check.answer));
  const content = JSON.stringify(weeklyLectureSummaries);
  for (const text of ['ℕ={0,1,…}', 'ℤ⁺={1,2,…}', 'τ(49)=baaba', 'y=−7', '3과 4', '정점 반복을 허용']) assert.ok(content.includes(text), text);
});

void test('정수 원상과 문자열 인덱스의 독립 검산', () => {
  const f = (n: number) => n % 2 === 0 ? n/2 : -(n-1)/2;
  const seen = new Set(Array.from({ length: 101 }, (_, index) => f(index+1)));
  assert.equal(seen.size, 101);
  for (let y=-50; y<=50; y++) assert.equal(f(y > 0 ? 2*y : 1-2*y) + 0, y);
  assert.equal(f(15), -7);
  const alphabet = ['a', 'b'];
  const strings = [''];
  let layer = [''];
  while (strings.length < 64) { layer = layer.flatMap((prefix) => alphabet.map((letter) => prefix+letter)); strings.push(...layer); }
  assert.equal(strings[49], 'baaba');
});

void test('표시한 일반·Boolean 행렬 계산을 독립 검산한다', () => {
  const product = (a: number[][], b: number[][]) => a.map((row) => b[0].map((_, j) => row.reduce((sum, value, k) => sum + value * b[k][j],0)));
  const a = [[1,2],[0,1]], b = [[1,0],[3,1]];
  assert.deepEqual(product(a,b), [[7,2],[3,1]]);
  assert.deepEqual(product(b,a), [[1,2],[3,7]]);
  const c = [[1,1],[0,1]], d = [[1,0],[1,1]];
  const ordinary = product(c,d);
  assert.deepEqual(ordinary, [[2,1],[1,1]]);
  assert.deepEqual(ordinary.map((row) => row.map((value) => Number(value > 0))), [[1,1],[1,1]]);
});

void test('기호와 개인 질문 검색은 실제 카드에 연결되고 기존 필수 진도는 유지한다', () => {
  const one = weeks.find((week) => week.number === 1)!;
  const symbols = searchStudySections([...one.sections, ...(one.searchSections ?? [])], '∃!');
  assert.deepEqual(symbols.map((result) => result.id), ['learning-gpt-symbols-logic']);
  const seven = weeks.find((week) => week.number === 7)!;
  const notes = searchStudySections(seven.searchSections ?? [], '정의역과 원상');
  assert.equal(notes[0]?.id, 'conversation-gpt-integer-domain');
  assert.ok(searchStudySections(seven.searchSections ?? [], '15다').some((result) => result.id === 'conversation-gpt-integer-domain'));
  const progress = { version: 2 as const, completedByWeek: Object.fromEntries(weeks.filter((week) => week.number >= 2 && week.number <= 5).map((week) => [String(week.number), week.sections.map((section) => section.id)])), lastWeek: 1, lastSection: 'overview' };
  assert.deepEqual(completedWeekNumbers(progress,weeks),[2,3,4,5]);
  const restored = parseWeeklyProgress(JSON.stringify(progress),weeks);
  assert.deepEqual(completedWeekNumbers(restored,weeks),[2,3,4,5]);
  assert.ok(weeks.filter((week) => week.number <= 5).every((week) => week.sections.every((section) => !section.id.startsWith('learning-gpt-symbols-'))));
  assert.equal(resolveStudyLocation('1','#learning-gpt-symbols-logic',weeks,restored).section,'learning-gpt-symbols-logic');
  const withSupplement = { ...progress, completedByWeek: { ...progress.completedByWeek, '1': [...one.sections.map((section) => section.id), 'learning-gpt-symbols-logic'] }, lastSection: 'learning-gpt-symbols-logic' };
  const supplementalRestore = parseWeeklyProgress(JSON.stringify(withSupplement), weeks);
  assert.deepEqual(supplementalRestore.completedByWeek['1'], one.sections.map((section) => section.id));
  assert.equal(supplementalRestore.lastSection, 'learning-gpt-symbols-logic');
});
