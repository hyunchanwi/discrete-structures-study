export type BinaryOperator = 'and' | 'or' | 'xor' | 'implies' | 'iff';

export type StudyProgress = {
  completed: string[];
  lastSection: string;
};

export function evaluateBinary(operator: BinaryOperator, p: boolean, q: boolean) {
  switch (operator) {
    case 'and': return p && q;
    case 'or': return p || q;
    case 'xor': return p !== q;
    case 'implies': return !p || q;
    case 'iff': return p === q;
  }
}

export function explainBinary(operator: BinaryOperator, p: boolean, q: boolean) {
  const result = evaluateBinary(operator, p, q);
  if (operator === 'implies') {
    return p && !q
      ? '전제 p가 참인데 결론 q가 거짓이어서 약속을 위반했다.'
      : 'p가 거짓이거나 q가 참이므로 조건문을 위반하지 않았다.';
  }
  if (operator === 'xor') return result ? '두 값 중 정확히 하나만 참이다.' : '두 값이 서로 같아서 배타적 OR는 거짓이다.';
  if (operator === 'iff') return result ? '두 진릿값이 같아서 상호조건이 참이다.' : '두 진릿값이 달라서 상호조건이 거짓이다.';
  if (operator === 'and') return result ? '두 값이 모두 참이다.' : '적어도 하나가 거짓이다.';
  return result ? '적어도 하나가 참이다.' : '두 값이 모두 거짓이다.';
}

export function parseProgress(raw: string | null, validIds: string[]): StudyProgress {
  const fallback = { completed: [], lastSection: validIds[0] ?? '' };
  if (!raw) return fallback;
  try {
    const value = JSON.parse(raw) as Partial<StudyProgress>;
    const completed = Array.isArray(value.completed)
      ? value.completed.filter((id): id is string => typeof id === 'string' && validIds.includes(id))
      : [];
    const lastSection = typeof value.lastSection === 'string' && validIds.includes(value.lastSection)
      ? value.lastSection
      : fallback.lastSection;
    return { completed: [...new Set(completed)], lastSection };
  } catch {
    return fallback;
  }
}

export function searchStudySections<T extends { title: string; summary: string; searchText: string }>(sections: T[], query: string) {
  const normalize = (value: string) => value.normalize('NFC').toLocaleLowerCase('ko-KR');
  const terms = normalize(query.trim()).split(/\s+/).filter(Boolean);
  if (!terms.length) return [];
  return sections.filter((section) => {
    const haystack = normalize(`${section.title} ${section.summary} ${section.searchText}`);
    return terms.every((term) => haystack.includes(term));
  });
}

export function gradeQuiz(selected: number | null, answer: number) {
  if (selected === null) return { status: 'unanswered' as const, correct: false };
  if (!Number.isInteger(selected) || selected < 0 || !Number.isInteger(answer) || answer < 0) {
    return { status: 'unanswered' as const, correct: false };
  }
  return { status: selected === answer ? 'correct' as const : 'incorrect' as const, correct: selected === answer };
}
