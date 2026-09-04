export type BinaryOperator = 'and' | 'or' | 'xor' | 'implies' | 'iff';

export type StudyProgress = {
  completed: string[];
  lastSection: string;
};

export type StudyWeekLike = {
  number: number;
  status: 'ready' | 'upcoming';
  sections: { id: string }[];
};

export type WeeklyStudyProgress = {
  version: 2;
  completedByWeek: Record<string, string[]>;
  lastWeek: number;
  lastSection: string;
};

export type StudyLocation = {
  week: number;
  section: string;
  shouldNormalize: boolean;
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

export function buildImplicationRows() {
  const inputs = [[true, true], [true, false], [false, true], [false, false]] as const;
  return inputs.map(([p, q]) => ({ p, q, result: evaluateBinary('implies', p, q) }));
}

export function buildImplicationEquivalenceRows() {
  return buildImplicationRows().map(({ p, q, result }) => {
    const notP = !p;
    return { p, q, implication: result, notP, notPOrQ: evaluateBinary('or', notP, q) };
  });
}

export function buildConditionalRelationRows() {
  return buildImplicationRows().map(({ p, q, result }) => ({
    p,
    q,
    original: result,
    converse: evaluateBinary('implies', q, p),
    inverse: evaluateBinary('implies', !p, !q),
    contrapositive: evaluateBinary('implies', !q, !p),
  }));
}

export function buildXorDecompositionRows() {
  const inputs = [[true, true], [true, false], [false, true], [false, false]] as const;
  return inputs.map(([p, q]) => {
    const pAndNotQ = evaluateBinary('and', p, !q);
    const notPAndQ = evaluateBinary('and', !p, q);
    return {
      p,
      q,
      pAndNotQ,
      notPAndQ,
      decomposed: evaluateBinary('or', pAndNotQ, notPAndQ),
      xor: evaluateBinary('xor', p, q),
    };
  });
}

export function buildCompoundTruthRows() {
  const inputs = [
    [false, false, false], [false, false, true], [false, true, false], [false, true, true],
    [true, false, false], [true, false, true], [true, true, false], [true, true, true],
  ] as const;
  return inputs.map(([p, q, r]) => {
    const pOrQ = evaluateBinary('or', p, q);
    const notR = !r;
    return { p, q, r, pOrQ, notR, result: evaluateBinary('implies', pOrQ, notR) };
  });
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

function firstReadyWeek(weeks: StudyWeekLike[]) {
  return weeks.find((week) => week.status === 'ready' && week.sections.length > 0);
}

function validSectionIds(week: StudyWeekLike) {
  return week.sections.map((section) => section.id);
}

/**
 * v2 진도를 복구한다. v2 값이 없을 때만 별도 v1 값을 1주차로 이전한다.
 * 손상된 주차/섹션은 버리고 사용할 수 있는 항목만 남긴다.
 */
export function parseWeeklyProgress(
  raw: string | null,
  weeks: StudyWeekLike[],
  legacyRaw: string | null = null,
): WeeklyStudyProgress {
  const fallbackWeek = firstReadyWeek(weeks);
  const fallbackWeekNumber = fallbackWeek?.number ?? 1;
  const fallbackSection = fallbackWeek?.sections[0]?.id ?? '';
  const fallback: WeeklyStudyProgress = {
    version: 2,
    completedByWeek: {},
    lastWeek: fallbackWeekNumber,
    lastSection: fallbackSection,
  };

  let parsed: unknown;
  try {
    parsed = raw ? JSON.parse(raw) : null;
  } catch {
    parsed = null;
  }

  if (parsed && typeof parsed === 'object' && 'completedByWeek' in parsed) {
    const value = parsed as Partial<WeeklyStudyProgress>;
    const completedByWeek: Record<string, string[]> = {};
    const stored = value.completedByWeek;
    for (const week of weeks) {
      const candidates = stored && typeof stored === 'object'
        ? (stored as Record<string, unknown>)[String(week.number)]
        : undefined;
      if (!Array.isArray(candidates)) continue;
      const ids = validSectionIds(week);
      const completed = candidates.filter(
        (id): id is string => typeof id === 'string' && ids.includes(id),
      );
      if (completed.length) completedByWeek[String(week.number)] = [...new Set(completed)];
    }

    const selectedWeek = weeks.find(
      (week) => week.number === value.lastWeek && week.status === 'ready' && week.sections.length > 0,
    ) ?? fallbackWeek;
    const selectedIds = selectedWeek ? validSectionIds(selectedWeek) : [];
    const lastSection = typeof value.lastSection === 'string' && selectedIds.includes(value.lastSection)
      ? value.lastSection
      : selectedIds[0] ?? fallbackSection;
    return {
      version: 2,
      completedByWeek,
      lastWeek: selectedWeek?.number ?? fallbackWeekNumber,
      lastSection,
    };
  }

  let legacy: unknown;
  try {
    legacy = legacyRaw ? JSON.parse(legacyRaw) : parsed;
  } catch {
    legacy = null;
  }
  if (!fallbackWeek || !legacy || typeof legacy !== 'object') return fallback;
  const migrated = parseProgress(JSON.stringify(legacy), validSectionIds(fallbackWeek));
  return {
    version: 2,
    completedByWeek: migrated.completed.length
      ? { [String(fallbackWeek.number)]: migrated.completed }
      : {},
    lastWeek: fallbackWeek.number,
    lastSection: migrated.lastSection,
  };
}

export function isWeekComplete(progress: WeeklyStudyProgress, week: StudyWeekLike) {
  if (week.status !== 'ready' || week.sections.length === 0) return false;
  const completed = new Set(progress.completedByWeek[String(week.number)] ?? []);
  return week.sections.every((section) => completed.has(section.id));
}

export function completedWeekNumbers(progress: WeeklyStudyProgress, weeks: StudyWeekLike[]) {
  return weeks.filter((week) => isWeekComplete(progress, week)).map((week) => week.number);
}

export function resolveStudyLocation(
  weekParam: string | null,
  hash: string,
  weeks: StudyWeekLike[],
  progress: WeeklyStudyProgress,
  legacySectionParam: string | null = null,
): StudyLocation {
  const fallbackWeek = firstReadyWeek(weeks);
  const fallback = {
    week: fallbackWeek?.number ?? 1,
    section: fallbackWeek?.sections[0]?.id ?? '',
  };

  if (weekParam === null && !hash && legacySectionParam === null) {
    const savedWeek = weeks.find(
      (week) => week.number === progress.lastWeek && week.status === 'ready' && week.sections.length > 0,
    );
    const savedIds = savedWeek ? validSectionIds(savedWeek) : [];
    if (savedWeek && savedIds.includes(progress.lastSection)) {
      return { week: savedWeek.number, section: progress.lastSection, shouldNormalize: true };
    }
    return { ...fallback, shouldNormalize: true };
  }

  const requestedNumber = weekParam === null && legacySectionParam !== null
    ? fallback.week
    : Number(weekParam);
  const requestedWeek = weeks.find(
    (week) => week.number === requestedNumber && week.status === 'ready' && week.sections.length > 0,
  );
  let requestedSection = hash.replace(/^#/, '') || legacySectionParam || '';
  try {
    requestedSection = decodeURIComponent(requestedSection);
  } catch {
    return { ...fallback, shouldNormalize: true };
  }
  if (!requestedWeek) {
    return { ...fallback, shouldNormalize: true };
  }
  if (!validSectionIds(requestedWeek).includes(requestedSection)) {
    return { week: requestedWeek.number, section: requestedWeek.sections[0].id, shouldNormalize: true };
  }
  return {
    week: requestedWeek.number,
    section: requestedSection,
    shouldNormalize: legacySectionParam !== null,
  };
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
