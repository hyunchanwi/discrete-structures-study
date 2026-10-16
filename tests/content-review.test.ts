import assert from 'node:assert/strict';
import test from 'node:test';
import { studyNotes } from '../src/claude-study-data.ts';

void test('차집합은 교집합의 여집합과 다르며 소수 예제는 대우 증명이다', () => {
  const difference = studyNotes.find((n) => n.id === 'study-6')!;
  assert.match(difference.explanation.join(' '), /A∩Bᶜ/);
  const u=[1,2,3], a=[1,2], b=[2];
  assert.deepEqual(a.filter((x) => !b.includes(x)), [1]);
  assert.deepEqual(u.filter((x) => !(a.includes(x) && b.includes(x))), [1,3]);
  const proof=studyNotes.find((n) => n.id === 'study-5')!;
  assert.match(proof.question, /대우/);
  assert.match(proof.answer, /¬q→¬p/);
});
