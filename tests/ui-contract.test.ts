import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

import { weeks } from '../src/course-data.ts';

void test('모바일 너비에서 드로어 탐색·닫기·진도 초기화 진입점을 제공한다', async () => {
  const page = await readFile(new URL('../app/page.tsx', import.meta.url), 'utf8');
  assert.match(page, /SheetContent[\s\S]*side="left"/);
  assert.match(page, /lg:hidden/);
  assert.match(page, /모바일 개념 검색/);
  assert.match(page, /setNavOpen\(false\)/);
  assert.match(page, /Study Hub로 돌아가기/);
  assert.match(page, /전체 주차/);
  assert.match(page, /현재 주차 목차|세부 목차/);
  assert.match(page, /navigateTo\(id, true\)/);
  assert.match(page, /진도 초기화/);
});

void test('페이지가 검색·진리표·퀴즈의 빈 상태와 접근성 상태를 포함한다', async () => {
  const page = await readFile(new URL('../app/page.tsx', import.meta.url), 'utf8');
  assert.match(page, /검색 결과가 없어/);
  assert.match(page, /답을 먼저 선택/);
  assert.match(page, /evaluateBinary/);
  assert.match(page, /aria-expanded/);
  assert.match(page, /aria-controls/);
  assert.match(page, /aria-pressed/);
});

void test('데스크톱 셸은 왼쪽 주차 지도와 오른쪽 현재 주차 목차를 분리한다', async () => {
  const page = await readFile(new URL('../app/page.tsx', import.meta.url), 'utf8');
  assert.match(page, /function WeekList/);
  assert.match(page, /SectionList items=\{currentSections\}/);
  assert.match(page, /searchStudySections\(currentSections, query\)/);
  assert.match(page, /aria-label="전체 주차 목록"/);
  assert.match(page, /전체 학습 진도/);
  assert.match(page, /현재 주차 목차/);
  assert.match(page, /discrete-structures-progress-v2/);
  assert.match(page, /discrete-structures-progress-v1/);
  assert.match(page, /url\.searchParams\.set\('week'/);
  assert.match(page, /url\.hash = id/);
});

void test('예정 주차는 비활성 상태와 준비 중 안내를 제공한다', async () => {
  const page = await readFile(new URL('../app/page.tsx', import.meta.url), 'utf8');
  assert.match(page, /week\.status === 'ready' && week\.sections\.length > 0/);
  assert.match(page, /disabled=!\{ready\}|disabled=\{!ready\}/);
  assert.match(page, /자료 준비 중/);
});

void test('이전 북마크·storage 복원·교차 주차 이동은 URL과 본문을 동기화한다', async () => {
  const page = await readFile(new URL('../app/page.tsx', import.meta.url), 'utf8');
  assert.match(page, /params\.get\('section'\)/);
  assert.match(page, /url\.searchParams\.delete\('section'\)/);
  assert.match(page, /setPendingNavigation\(\{ week: next\.lastWeek, section: next\.lastSection/);
  assert.match(page, /pendingNavigation\.week !== activeWeek/);
  assert.match(page, /requestAnimationFrame[\s\S]*scrollIntoView[\s\S]*pendingNavigation\.focus/);
});

void test('관찰자·완료 판정·초기화·기억 카드는 현재 주차 데이터만 사용한다', async () => {
  const page = await readFile(new URL('../app/page.tsx', import.meta.url), 'utf8');
  assert.match(page, /validIds = new Set\(currentSections/);
  assert.match(page, /replaceStudyUrl\(activeWeek, id\)/);
  assert.match(page, /\[activeWeek, currentSections\]/);
  assert.match(page, /currentSectionIds\.every\(\(id\) => completed\.has\(id\)\)/);
  assert.match(page, /firstReadyWeek\.sections\[0\]\.id/);
  assert.match(page, /activeWeekData\.memory &&/);
});

void test('1주차 사이트용 노트의 새 추론 과정과 예제를 포함한다', async () => {
  const page = await readFile(new URL('../app/page.tsx', import.meta.url), 'utf8');
  assert.match(page, /연속적인 값/);
  assert.match(page, /p가 거짓이면 공허하게 참/);
  assert.match(page, /P only if Q/);
  assert.match(page, /q → p ≡ ¬p → ¬q/);
  assert.match(page, /\(p → q\) ∧ \(q → p\)/);
  assert.match(page, /연산자 우선순위/);
  assert.match(page, /3변수 = 2³ = 8행/);
  assert.match(page, /\(P ∨ Q\) → ¬R/);
  assert.match(page, /진단 메시지가 버퍼에 저장/);
  assert.match(page, /논리식에서 q와 r의 NOT 출력을 찾는다/);
  assert.match(page, /<caption className="sr-only">/);
  assert.match(page, /scope="col"/);
});

void test('콘텐츠 갱신 후에도 기존 8개 섹션 ID와 순서를 유지한다', async () => {
  const expected = ['overview', 'proposition', 'operators', 'implication', 'truth-table', 'applications', 'bits-circuits', 'review'];
  const weekOne = weeks.find((week) => week.number === 1);
  assert.deepEqual(weekOne?.sections.map((section) => section.id), expected);
  const page = await readFile(new URL('../app/page.tsx', import.meta.url), 'utf8');
  assert.deepEqual([...page.matchAll(/<article id="([^"]+)"/g)].map((match) => match[1]), expected);
});
