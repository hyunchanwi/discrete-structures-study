import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

void test('모바일 너비에서 드로어 탐색·닫기·진도 초기화 진입점을 제공한다', async () => {
  const page = await readFile(new URL('../app/page.tsx', import.meta.url), 'utf8');
  assert.match(page, /SheetContent[\s\S]*side="left"/);
  assert.match(page, /lg:hidden/);
  assert.match(page, /모바일 개념 검색/);
  assert.match(page, /setNavOpen\(false\)/);
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
