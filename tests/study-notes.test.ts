import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';
import { scopeOptions, studyNotes } from '../src/claude-study-data.ts';

test('학습 대화는 확인된 Lecture 1~7 범위에만 연결한다', () => {
  const scopeIds = scopeOptions.map((scope) => scope.id);
  assert.deepEqual(scopeIds, ['lec1', 'lec2', 'lec3', 'lec4', 'lec5', 'lec6', 'lec7']);
  for (const note of studyNotes) {
    assert.ok(note.scopes.length > 0);
    assert.ok(note.scopes.every((scope) => scopeIds.includes(scope)));
  }
  assert.deepEqual(studyNotes.filter((note) => note.scopes.includes('lec1')).map((note) => note.id), ['study-1']);
  assert.deepEqual(studyNotes.filter((note) => note.scopes.includes('lec7')).map((note) => note.id), ['study-7']);
});

test('강의별 노트는 모달이 아니라 검색 가능한 본문으로 제공한다', () => {
  const component = readFileSync(new URL('../app/claude-study-notes.tsx', import.meta.url), 'utf8');
  assert.ok(component.includes('note.scopes.includes(currentScope)'));
  assert.ok(component.includes('note.location'));
  assert.ok(component.includes('id="study-conversation-notes"'));
  assert.ok(component.includes('강의 번호를 주차 번호로 임의 변환하지 않았습니다'));
  assert.ok(!component.includes('<dialog'));
  assert.ok(!component.includes('showModal'));
});
