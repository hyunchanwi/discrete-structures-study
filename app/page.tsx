'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  Binary,
  BookOpen,
  Check,
  CheckCircle2,
  ChevronRight,
  Circle,
  Clock3,
  Code2,
  Lightbulb,
  Menu,
  RotateCcw,
  Search,
  Sigma,
  Lock,
  Sparkles,
  Target,
  X,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Progress, ProgressLabel } from '@/components/ui/progress';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { operators, quizzes, weeks, type StudySection } from '@/src/course-data';
import {
  type BinaryOperator,
  buildCompoundTruthRows,
  buildImplicationRows,
  completedWeekNumbers,
  evaluateBinary,
  explainBinary,
  gradeQuiz,
  parseWeeklyProgress,
  resolveStudyLocation,
  searchStudySections,
} from '@/src/logic-utils';

const STORAGE_KEY = 'discrete-structures-progress-v2';
const LEGACY_STORAGE_KEY = 'discrete-structures-progress-v1';
const firstReadyWeek = weeks.find((week) => week.status === 'ready' && week.sections.length > 0) ?? weeks[0];
const sections = firstReadyWeek.sections;
const operatorLabels: { id: BinaryOperator; label: string; symbol: string }[] = [
  { id: 'and', label: 'AND', symbol: '∧' },
  { id: 'or', label: 'OR', symbol: '∨' },
  { id: 'xor', label: 'XOR', symbol: '⊕' },
  { id: 'implies', label: '함축', symbol: '→' },
  { id: 'iff', label: 'IFF', symbol: '↔' },
];
const implicationRows = buildImplicationRows();
const implicationMeanings = [
  'p와 q가 모두 참이므로 조건을 만족한다.',
  'p는 참이지만 q가 거짓이라 약속을 위반한다.',
  'p가 거짓이므로 ¬p ∨ q가 참이다.',
  'p가 거짓이므로 ¬p ∨ q가 참이다.',
] as const;
const compoundTruthRows = buildCompoundTruthRows();

type PendingNavigation = {
  week: number;
  section: string;
  focus: boolean;
  behavior: ScrollBehavior;
};

function TruthValueButton({ label, value, onChange }: { label: string; value: boolean; onChange: (value: boolean) => void }) {
  return (
    <fieldset className="flex items-center gap-2 rounded-xl border bg-background p-2">
      <legend className="sr-only">{label} 진릿값</legend>
      <span className="w-5 text-center font-mono text-sm font-black" aria-hidden="true">{label}</span>
      {[true, false].map((choice) => (
        <Button
          key={String(choice)}
          type="button"
          size="sm"
          variant={value === choice ? 'default' : 'ghost'}
          aria-pressed={value === choice}
          aria-label={`${label}를 ${choice ? '참' : '거짓'}으로 설정`}
          onClick={() => onChange(choice)}
          className="min-w-9"
        >
          {choice ? 'T' : 'F'}
        </Button>
      ))}
    </fieldset>
  );
}

function SectionList({ items, activeId, completed, onSelect }: { items: StudySection[]; activeId: string; completed: Set<string>; onSelect: (id: string) => void }) {
  return (
    <nav aria-label="현재 주차 학습 목차" className="space-y-1.5">
      {items.map((section, index) => {
        const active = section.id === activeId;
        return (
          <button
            key={section.id}
            type="button"
            onClick={() => onSelect(section.id)}
            aria-current={active ? 'location' : undefined}
            className={`group flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm transition ${active ? 'bg-primary text-primary-foreground shadow-sm' : 'text-muted-foreground hover:bg-muted hover:text-foreground'}`}
          >
            {completed.has(section.id) ? (
              <CheckCircle2 className={`size-4 shrink-0 ${active ? 'text-white' : 'text-primary'}`} aria-hidden="true" />
            ) : (
              <span className={`grid size-5 shrink-0 place-items-center rounded-full border text-[10px] font-bold ${active ? 'border-white/40' : 'border-border'}`}>{index + 1}</span>
            )}
            <span className="min-w-0 flex-1 truncate">{section.title}</span>
            {active && <ChevronRight className="size-4" aria-hidden="true" />}
          </button>
        );
      })}
    </nav>
  );
}

function WeekList({ activeWeek, completedWeeks, onSelect }: { activeWeek: number; completedWeeks: Set<number>; onSelect: (week: number) => void }) {
  return (
    <nav aria-label="전체 주차 목록" className="space-y-1.5">
      {weeks.map((week) => {
        const ready = week.status === 'ready' && week.sections.length > 0;
        const active = week.number === activeWeek;
        return (
          <button
            key={week.number}
            type="button"
            disabled={!ready}
            onClick={() => ready && onSelect(week.number)}
            aria-current={active ? 'page' : undefined}
            aria-label={`${week.number}주차 ${week.title}${ready ? '' : ', 자료 준비 중'}`}
            className={`flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left transition ${active ? 'bg-primary text-primary-foreground shadow-sm' : ready ? 'text-foreground hover:bg-muted' : 'cursor-not-allowed text-muted-foreground opacity-70'}`}
          >
            <span className={`grid size-8 shrink-0 place-items-center rounded-xl border text-xs font-black ${active ? 'border-white/35' : 'border-border bg-background'}`}>
              {completedWeeks.has(week.number) ? <Check className="size-4" aria-hidden="true" /> : String(week.number).padStart(2, '0')}
            </span>
            <span className="min-w-0 flex-1">
              <strong className="block truncate text-sm">{week.title}</strong>
              <small className={`mt-0.5 block truncate text-[11px] ${active ? 'text-white/75' : 'text-muted-foreground'}`}>{ready ? week.summary : '자료 준비 중'}</small>
            </span>
            {!ready && <Lock className="size-3.5 shrink-0" aria-hidden="true" />}
          </button>
        );
      })}
    </nav>
  );
}

export default function Home() {
  const [activeWeek, setActiveWeek] = useState(firstReadyWeek.number);
  const [activeId, setActiveId] = useState('overview');
  const [completedByWeek, setCompletedByWeek] = useState<Record<string, string[]>>({});
  const [query, setQuery] = useState('');
  const [mobileQueryOpen, setMobileQueryOpen] = useState(false);
  const [navOpen, setNavOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchIndex, setSearchIndex] = useState(0);
  const [operator, setOperator] = useState<BinaryOperator>('implies');
  const [p, setP] = useState(true);
  const [q, setQ] = useState(false);
  const [answers, setAnswers] = useState<Record<string, number | null>>({});
  const [feedback, setFeedback] = useState<Record<string, 'unanswered' | 'correct' | 'incorrect'>>({});
  const [hydrated, setHydrated] = useState(false);
  const [pendingNavigation, setPendingNavigation] = useState<PendingNavigation | null>(null);
  const searchRootRef = useRef<HTMLDivElement>(null);

  const activeWeekData = weeks.find((week) => week.number === activeWeek) ?? firstReadyWeek;
  const currentSections = activeWeekData.sections;
  const currentSectionIds = currentSections.map((section) => section.id);
  const completed = useMemo(() => new Set(completedByWeek[String(activeWeek)] ?? []), [activeWeek, completedByWeek]);
  const progressState = useMemo(() => ({ version: 2 as const, completedByWeek, lastWeek: activeWeek, lastSection: activeId }), [activeId, activeWeek, completedByWeek]);
  const completedWeeks = useMemo(() => new Set(completedWeekNumbers(progressState, weeks)), [progressState]);
  const currentWeekComplete = currentSections.length > 0 && currentSectionIds.every((id) => completed.has(id));
  const searchResults = searchStudySections(currentSections, query);
  const progressValue = Math.round((completed.size / Math.max(1, currentSections.length)) * 100);
  const activeIndex = Math.max(0, currentSections.findIndex((section) => section.id === activeId));
  const truthResult = evaluateBinary(operator, p, q);
  const truthRows = [[true, true], [true, false], [false, true], [false, false]] as const;

  useEffect(() => {
    let saved = parseWeeklyProgress(null, weeks);
    try {
      const currentRaw = window.localStorage.getItem(STORAGE_KEY);
      const legacyRaw = window.localStorage.getItem(LEGACY_STORAGE_KEY);
      saved = parseWeeklyProgress(currentRaw, weeks, legacyRaw);
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(saved));
    } catch {
      // Private browsing or a storage policy can block access; in-memory study still works.
    }
    const params = new URLSearchParams(window.location.search);
    const location = resolveStudyLocation(
      params.get('week'),
      window.location.hash,
      weeks,
      saved,
      params.get('section'),
    );
    if (location.shouldNormalize) replaceStudyUrl(location.week, location.section);
    window.requestAnimationFrame(() => {
      setPendingNavigation({ week: location.week, section: location.section, focus: false, behavior: 'auto' });
      setCompletedByWeek(saved.completedByWeek);
      setActiveWeek(location.week);
      setActiveId(location.section);
      setHydrated(true);
    });

    const onStorage = (event: StorageEvent) => {
      if (event.key !== STORAGE_KEY && event.key !== LEGACY_STORAGE_KEY) return;
      let currentRaw = event.key === STORAGE_KEY ? event.newValue : null;
      let legacyRaw = event.key === LEGACY_STORAGE_KEY ? event.newValue : null;
      try {
        if (event.key !== STORAGE_KEY) currentRaw = window.localStorage.getItem(STORAGE_KEY);
        if (event.key !== LEGACY_STORAGE_KEY) legacyRaw = window.localStorage.getItem(LEGACY_STORAGE_KEY);
      } catch {
        // The storage event's own value is still usable when the other key cannot be read.
      }
      const next = parseWeeklyProgress(currentRaw, weeks, legacyRaw);
      setPendingNavigation({ week: next.lastWeek, section: next.lastSection, focus: false, behavior: 'auto' });
      setCompletedByWeek(next.completedByWeek);
      setActiveWeek(next.lastWeek);
      setActiveId(next.lastSection);
      replaceStudyUrl(next.lastWeek, next.lastSection);
    };
    const onPopState = () => {
      let nextProgress = parseWeeklyProgress(null, weeks);
      try {
        nextProgress = parseWeeklyProgress(window.localStorage.getItem(STORAGE_KEY), weeks, window.localStorage.getItem(LEGACY_STORAGE_KEY));
      } catch {
        // Fall back to the first available week when storage cannot be read.
      }
      const params = new URLSearchParams(window.location.search);
      const next = resolveStudyLocation(params.get('week'), window.location.hash, weeks, nextProgress, params.get('section'));
      if (next.shouldNormalize) replaceStudyUrl(next.week, next.section);
      setPendingNavigation({ week: next.week, section: next.section, focus: false, behavior: preferredScrollBehavior() });
      setActiveWeek(next.week);
      setActiveId(next.section);
    };
    window.addEventListener('storage', onStorage);
    window.addEventListener('popstate', onPopState);
    return () => {
      window.removeEventListener('storage', onStorage);
      window.removeEventListener('popstate', onPopState);
    };
  }, []);

  useEffect(() => {
    if (!pendingNavigation || pendingNavigation.week !== activeWeek || pendingNavigation.section !== activeId) return;
    const frame = window.requestAnimationFrame(() => {
      const target = document.getElementById(pendingNavigation.section);
      target?.scrollIntoView({ behavior: pendingNavigation.behavior, block: 'start' });
      if (pendingNavigation.focus) target?.focus({ preventScroll: true });
      setPendingNavigation(null);
    });
    return () => window.cancelAnimationFrame(frame);
  }, [activeId, activeWeek, pendingNavigation]);

  useEffect(() => {
    const validIds = new Set(currentSections.map((section) => section.id));
    const observer = new IntersectionObserver((entries) => {
      const visible = entries.filter((entry) => entry.isIntersecting).sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
      const id = visible?.target.id;
      if (!id || !validIds.has(id)) return;
      setActiveId(id);
      replaceStudyUrl(activeWeek, id);
      try {
        const current = parseWeeklyProgress(window.localStorage.getItem(STORAGE_KEY), weeks, window.localStorage.getItem(LEGACY_STORAGE_KEY));
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...current, lastWeek: activeWeek, lastSection: id }));
      } catch {
        // Scrolling and URL navigation remain usable without persistent storage.
      }
    }, { rootMargin: '-20% 0px -65% 0px', threshold: [0.1, 0.5] });
    document.querySelectorAll('.section-anchor').forEach((element) => observer.observe(element));
    return () => observer.disconnect();
  }, [activeWeek, currentSections]);

  function persist(nextCompletedByWeek: Record<string, string[]>, lastWeek: number, lastSection: string) {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify({ version: 2, completedByWeek: nextCompletedByWeek, lastWeek, lastSection }));
    } catch {
      // Keep the current session usable when storage is unavailable or full.
    }
  }

  function navigateTo(id: string, focusContent = false) {
    if (!currentSectionIds.includes(id)) return;
    setActiveId(id);
    const url = new URL(window.location.href);
    url.searchParams.set('week', String(activeWeek));
    url.hash = id;
    window.history.pushState({}, '', url);
    persist(completedByWeek, activeWeek, id);
    const target = document.getElementById(id);
    target?.scrollIntoView({ behavior: preferredScrollBehavior(), block: 'start' });
    if (focusContent) window.requestAnimationFrame(() => target?.focus({ preventScroll: true }));
  }

  function toggleComplete(id: string) {
    const next = new Set(completed);
    if (next.has(id)) next.delete(id); else next.add(id);
    const nextByWeek = { ...completedByWeek, [String(activeWeek)]: [...next] };
    setCompletedByWeek(nextByWeek);
    persist(nextByWeek, activeWeek, activeId);
  }

  function toggleWeekComplete() {
    const next = currentWeekComplete ? [] : currentSectionIds;
    const nextByWeek = { ...completedByWeek, [String(activeWeek)]: next };
    setCompletedByWeek(nextByWeek);
    persist(nextByWeek, activeWeek, activeId);
  }

  function selectWeek(weekNumber: number) {
    const week = weeks.find((item) => item.number === weekNumber && item.status === 'ready' && item.sections.length > 0);
    if (!week) return;
    const id = week.sections[0].id;
    setActiveWeek(week.number);
    setActiveId(id);
    const url = new URL(window.location.href);
    url.searchParams.set('week', String(week.number));
    url.hash = id;
    window.history.pushState({}, '', url);
    persist(completedByWeek, week.number, id);
    setPendingNavigation({ week: week.number, section: id, focus: true, behavior: preferredScrollBehavior() });
  }

  function resetProgress() {
    setCompletedByWeek({});
    setFeedback({});
    setAnswers({});
    try {
      window.localStorage.removeItem(STORAGE_KEY);
      window.localStorage.removeItem(LEGACY_STORAGE_KEY);
    } catch {
      // The in-memory reset still succeeds when storage removal is blocked.
    }
    const firstSection = firstReadyWeek.sections[0].id;
    setPendingNavigation({ week: firstReadyWeek.number, section: firstSection, focus: false, behavior: preferredScrollBehavior() });
    setActiveId(firstSection);
    setActiveWeek(firstReadyWeek.number);
    replaceStudyUrl(firstReadyWeek.number, firstSection);
  }

  function submitQuiz(id: string, answer: number) {
    setFeedback((current) => ({ ...current, [id]: gradeQuiz(answers[id] ?? null, answer).status }));
  }

  function selectSearchResult(id: string) {
    navigateTo(id);
    setQuery('');
    setSearchOpen(false);
    setMobileQueryOpen(false);
  }

  function onSearchKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    if (!searchResults.length) {
      if (event.key === 'Escape') { setSearchOpen(false); setQuery(''); }
      return;
    }
    if (event.key === 'ArrowDown') { event.preventDefault(); setSearchIndex((index) => (index + 1) % searchResults.length); setSearchOpen(true); }
    if (event.key === 'ArrowUp') { event.preventDefault(); setSearchIndex((index) => (index - 1 + searchResults.length) % searchResults.length); setSearchOpen(true); }
    if (event.key === 'Enter' && searchOpen) { event.preventDefault(); selectSearchResult(searchResults[searchIndex]?.id ?? searchResults[0].id); }
    if (event.key === 'Escape') { setSearchOpen(false); setQuery(''); }
  }

  const searchBox = (mobile = false) => (
    <div ref={searchRootRef} className="relative w-full" onBlur={(event) => { if (!event.currentTarget.contains(event.relatedTarget)) setSearchOpen(false); }}>
      <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
      <Input
        value={query}
        onChange={(event) => { setQuery(event.target.value); setSearchIndex(0); setSearchOpen(true); }}
        onFocus={() => query && setSearchOpen(true)}
        onKeyDown={onSearchKeyDown}
        placeholder="명제, 대우, XOR 검색"
        aria-label={mobile ? '모바일 개념 검색' : '개념 검색'}
        aria-expanded={Boolean(query && searchOpen)}
        aria-controls="concept-search-results"
        aria-activedescendant={searchResults[searchIndex] ? `search-option-${searchResults[searchIndex].id}` : undefined}
        className="h-10 rounded-xl bg-card pl-9 pr-9 shadow-sm"
      />
      {query && (
        <button type="button" onClick={() => setQuery('')} className="absolute right-2 top-1/2 grid size-7 -translate-y-1/2 place-items-center rounded-lg text-muted-foreground hover:bg-muted" aria-label="검색어 지우기">
          <X className="size-4" />
        </button>
      )}
      {query && searchOpen && (
        <ul id="concept-search-results" className="absolute left-0 right-0 top-12 z-40 overflow-hidden rounded-2xl border bg-popover p-2 shadow-xl">
          {searchResults.length ? searchResults.map((result, index) => (
            <li key={result.id}><button id={`search-option-${result.id}`} aria-current={searchIndex === index ? 'true' : undefined} type="button" onMouseEnter={() => setSearchIndex(index)} onClick={() => selectSearchResult(result.id)} className={`block w-full rounded-xl px-3 py-2.5 text-left ${searchIndex === index ? 'bg-muted' : 'hover:bg-muted'}`}>
              <span className="block text-sm font-bold">{result.title}</span>
              <span className="mt-0.5 block text-xs text-muted-foreground">{result.summary}</span>
            </button></li>
          )) : (
            <li className="px-3 py-5 text-center text-sm text-muted-foreground">
              검색 결과가 없어. ‘명제’, ‘대우’, ‘XOR’를 찾아봐.
            </li>
          )}
        </ul>
      )}
    </div>
  );

  return (
    <main className="min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-30 border-b border-border/80 bg-background/92 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-[1440px] items-center gap-3 px-4 sm:px-7">
          <Sheet open={navOpen} onOpenChange={setNavOpen}>
            <SheetTrigger render={<Button variant="outline" size="icon" className="lg:hidden" aria-label="학습 목차 열기" />}>
              <Menu />
            </SheetTrigger>
            <SheetContent side="left" className="w-[88%] max-w-sm p-0">
              <SheetHeader className="border-b p-5">
                <SheetTitle>이산구조 학습 지도</SheetTitle>
                <SheetDescription>주차를 고른 뒤 그 안의 개념으로 이동해.</SheetDescription>
              </SheetHeader>
              <div className="overflow-y-auto p-4">
                <a href="https://hyunchanwi.github.io/study-hub/" className="mb-4 flex items-center gap-2 rounded-xl border px-3 py-2.5 text-sm font-bold hover:bg-muted"><ArrowLeft className="size-4" /> Study Hub로 돌아가기</a>
                <p className="mb-2 px-2 text-xs font-black uppercase tracking-[0.16em] text-muted-foreground">전체 주차</p>
                <WeekList activeWeek={activeWeek} completedWeeks={completedWeeks} onSelect={(week) => { selectWeek(week); setNavOpen(false); }} />
                <div className="my-5 h-px bg-border" />
                <p className="mb-2 px-2 text-xs font-black uppercase tracking-[0.16em] text-muted-foreground">{activeWeek}주차 세부 목차</p>
                <SectionList items={currentSections} activeId={activeId} completed={completed} onSelect={(id) => { setNavOpen(false); navigateTo(id, true); }} />
                <Button variant="ghost" size="sm" onClick={() => { resetProgress(); setNavOpen(false); }} className="mt-5 w-full justify-start text-muted-foreground"><RotateCcw /> 진도 초기화</Button>
              </div>
            </SheetContent>
          </Sheet>

          <div className="flex min-w-0 items-center gap-3">
            <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-primary text-primary-foreground shadow-[0_8px_24px_-10px_var(--primary)]"><Sigma className="size-5" aria-hidden="true" /></span>
            <div className="min-w-0">
              <p className="truncate text-sm font-black tracking-tight">이산구조 공부방</p>
              <p className="truncate text-xs text-muted-foreground">CSE1312 · 2026-2</p>
            </div>
          </div>
          <div className="ml-auto hidden w-full max-w-md md:block">{searchBox()}</div>
          <Button variant="outline" size="icon" className="md:hidden" onClick={() => setMobileQueryOpen((value) => !value)} aria-expanded={mobileQueryOpen} aria-label="개념 검색 열기"><Search /></Button>
          <span className="hidden rounded-full border border-primary/20 bg-primary/8 px-3 py-1.5 text-xs font-bold text-primary sm:inline" aria-live="polite">전체 {hydrated ? completedWeeks.size : 0}/{weeks.length}주 완료</span>
        </div>
        {mobileQueryOpen && <div className="border-t px-4 py-3 md:hidden">{searchBox(true)}</div>}
      </header>

      <div className="mx-auto grid max-w-[1440px] grid-cols-1 lg:grid-cols-[250px_minmax(0,1fr)] xl:grid-cols-[250px_minmax(0,820px)_270px]">
        <aside className="sticky top-16 hidden h-[calc(100vh-64px)] overflow-y-auto border-r border-border/80 p-5 lg:block">
          <a href="https://hyunchanwi.github.io/study-hub/" className="mb-5 flex items-center gap-2 rounded-xl border px-3 py-2.5 text-sm font-bold hover:bg-muted"><ArrowLeft className="size-4" /> Study Hub로 돌아가기</a>
          <div className="mb-5 rounded-2xl border bg-card p-4 shadow-sm">
            <Progress value={hydrated ? (completedWeeks.size / weeks.length) * 100 : 0} className="gap-2">
              <ProgressLabel>전체 학습 진도</ProgressLabel>
              <span className="ml-auto text-sm font-black tabular-nums text-primary">{hydrated ? completedWeeks.size : 0}/{weeks.length}</span>
            </Progress>
            <p className="mt-2 text-xs text-muted-foreground">완료한 주차를 기준으로 계산해.</p>
          </div>
          <p className="mb-3 px-2 text-xs font-black uppercase tracking-[0.16em] text-muted-foreground">전체 주차</p>
          <WeekList activeWeek={activeWeek} completedWeeks={completedWeeks} onSelect={selectWeek} />
          <Button variant="ghost" size="sm" onClick={resetProgress} className="mt-5 w-full justify-start text-muted-foreground"><RotateCcw /> 진도 초기화</Button>
        </aside>

        <section className="logic-grid min-w-0 px-4 py-7 sm:px-8 sm:py-10">
          <div className="mx-auto max-w-[820px] space-y-6">
            <section className="rounded-[28px] border border-border bg-card/96 p-6 shadow-[0_22px_70px_-42px_rgba(33,42,102,.45)] sm:p-8">
              <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
                <div>
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-accent px-2.5 py-1 text-xs font-black text-accent-foreground"><BookOpen className="size-3.5" /> WEEK {String(activeWeek).padStart(2, '0')} · 학습 가능</span>
                  <h1 className="mt-4 text-3xl font-black tracking-[-0.04em] sm:text-4xl">명제논리, 참과 거짓의 언어</h1>
                  <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground sm:text-base">문장을 명제로 바꾸고, 논리 연산자의 규칙을 진리표로 직접 확인해 보자.</p>
                </div>
                <div className="flex flex-col items-end gap-2">
                  <div className="flex items-center gap-2 rounded-xl border bg-background px-3 py-2 text-xs font-medium text-muted-foreground"><Clock3 className="size-4 text-primary" /> 약 35분</div>
                  <Button type="button" size="sm" variant={currentWeekComplete ? 'secondary' : 'outline'} onClick={toggleWeekComplete} aria-pressed={currentWeekComplete}><Target /> {currentWeekComplete ? '주차 완료됨' : '주차 완료 표시'}</Button>
                </div>
              </div>
              <Progress value={hydrated ? progressValue : 0} className="rounded-xl bg-muted/65 p-3 lg:hidden">
                <ProgressLabel>{activeWeek}주차 진행률</ProgressLabel>
                <span className="ml-auto text-sm font-black tabular-nums text-primary">{hydrated ? progressValue : 0}%</span>
              </Progress>
              <div className="mt-6 flex flex-wrap gap-3">
                <Button size="lg" className="h-11 rounded-xl px-4" onClick={() => navigateTo(completed.size ? activeId : 'proposition')}>{completed.size ? '이어서 공부하기' : `${activeWeek}주차 시작하기`} <ArrowRight /></Button>
                <Button variant="outline" size="lg" className="h-11 rounded-xl px-4" onClick={() => navigateTo('truth-table')}><Binary /> 진리표 실습</Button>
              </div>
            </section>

            <article id="overview" tabIndex={-1} className="section-anchor section-card">
              <SectionHeader sectionId="overview" completed={completed} onToggle={toggleComplete} />
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-2xl border bg-background p-5">
                  <p className="text-xs font-black uppercase tracking-[.12em] text-primary">연속적인 값</p>
                  <p className="mt-4 font-mono text-sm">실수 구간 [0, 1]</p>
                  <p className="mt-3 text-sm leading-6 text-muted-foreground">실수 구간에는 끊김 없이 모든 중간값이 포함된다.</p>
                </div>
                <div className="rounded-2xl border bg-background p-5">
                  <p className="text-xs font-black uppercase tracking-[.12em] text-primary">이산적인 값</p>
                  <ol className="mt-4 flex gap-2 font-mono text-sm" aria-label="서로 구분되는 정수 0, 1, 2, 3">{[0, 1, 2, 3].map((value) => <li key={value} className="grid size-8 place-items-center rounded-full bg-muted">{value}</li>)}</ol>
                  <p className="mt-3 text-sm leading-6 text-muted-foreground">사람을 3.7명이라고 세지 않듯 각 대상을 하나씩 구분하고 셀 수 있다.</p>
                </div>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <ConceptCard icon={<Binary />} title="디지털 정보의 바닥">컴퓨터는 정보를 0과 1의 유한한 조합으로 저장하고 처리한다.</ConceptCard>
                <ConceptCard icon={<Target />} title="구조와 관계를 보는 법">비밀번호 개수, 최단 경로, 암호화처럼 서로 구분되는 대상과 관계를 연구한다.</ConceptCard>
              </div>
              <p className="source-note">출처: {sections[0].source}</p>
            </article>

            <article id="proposition" tabIndex={-1} className="section-anchor section-card">
              <SectionHeader sectionId="proposition" completed={completed} onToggle={toggleComplete} />
              <div className="definition-box"><span>정확한 정의</span><strong>명제는 참 또는 거짓 중 정확히 하나로 판정되는 선언문이다.</strong></div>
              <div className="grid gap-3 sm:grid-cols-2">
                <Example verdict="명제 · T" text="1 + 1 = 2" good />
                <Example verdict="명제 · F" text="2 + 2 = 3" good />
                <Example verdict="명제 아님" text="지금 몇 시인가?" />
                <Example verdict="명제 아님" text="x + 1 = 2" />
                <Example verdict="명제 아님" text="문을 닫아라!" />
                <Example verdict="명제 아님 · 판단 기준이 주관적" text="이 영화는 재미있다" />
              </div>
              <div className="tip-box"><Lightbulb /> <p><strong>모르는 것과 결정되지 않는 것은 다르다.</strong> 큰 수가 소수인지 당장 몰라도 원칙적으로 참·거짓이 정해지면 명제다.</p></div>
              <p className="source-note">출처: {sections[1].source}</p>
            </article>

            <article id="operators" tabIndex={-1} className="section-anchor section-card">
              <SectionHeader sectionId="operators" completed={completed} onToggle={toggleComplete} />
              <div className="overflow-x-auto rounded-2xl border">
                <table className="w-full min-w-[620px] text-left text-sm">
                  <thead className="bg-muted text-xs text-muted-foreground"><tr><th className="p-3">이름</th><th className="p-3">논리식</th><th className="p-3">읽는 법</th><th className="p-3">참 조건</th></tr></thead>
                  <tbody className="divide-y">{operators.map((item) => <tr key={item.name}><td className="p-3 font-bold">{item.name}</td><td className="p-3 font-mono text-lg text-primary">{item.symbol}</td><td className="p-3">{item.read}</td><td className="p-3 text-muted-foreground">{item.truth}</td></tr>)}</tbody>
                </table>
              </div>
              <div className="warning-box"><strong>OR와 XOR를 구분!</strong><span>p ∨ q는 둘 다 참이어도 참이지만, p ⊕ q는 정확히 하나만 참이어야 한다.</span></div>
              <div className="rounded-2xl border bg-background p-5">
                <p className="text-xs font-black uppercase tracking-[.12em] text-primary">학생증과 비밀번호로 읽기</p>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">p를 “사용자가 학생증을 가지고 있다”, q를 “사용자가 비밀번호를 알고 있다”로 두면 AND는 둘 다 필요하고, OR는 하나 이상, XOR은 정확히 하나만 만족해야 한다.</p>
              </div>
              <p className="source-note">출처: {sections[2].source}</p>
            </article>

            <article id="implication" tabIndex={-1} className="section-anchor section-card">
              <SectionHeader sectionId="implication" completed={completed} onToggle={toggleComplete} />
              <div className="formula-card"><span>p → q</span><strong>≡</strong><span>¬p ∨ q</span></div>
              <p className="leading-7 text-muted-foreground">조건문을 “p가 일어나면 q도 일어나야 한다”는 약속으로 생각하자. 약속이 깨지는 경우는 p가 참인데 q가 거짓인 단 한 경우다.</p>
              <div className="overflow-x-auto rounded-2xl border">
                <table className="w-full min-w-[650px] text-left text-sm">
                  <caption className="sr-only">조건문 p → q의 네 가지 진릿값과 해석</caption>
                  <thead className="bg-muted text-xs text-muted-foreground"><tr><th scope="col" className="p-3">p</th><th scope="col" className="p-3">q</th><th scope="col" className="p-3">p → q</th><th scope="col" className="p-3">논리식으로 읽기</th></tr></thead>
                  <tbody className="divide-y">{implicationRows.map((row, index) => <tr key={`${row.p}-${row.q}`}><td className="p-3 font-mono">{row.p ? 'T' : 'F'}</td><td className="p-3 font-mono">{row.q ? 'T' : 'F'}</td><td className={`p-3 font-black ${row.result ? 'text-emerald-700' : 'text-rose-700'}`}>{row.result ? 'T' : 'F'}</td><td className="p-3 text-muted-foreground">{implicationMeanings[index]}</td></tr>)}</tbody>
                </table>
              </div>
              <div className="tip-box"><Lightbulb /> <p><strong>p가 거짓이면 공허하게 참이다.</strong> 전제가 발생하지 않아 약속을 깬 상황이 아니기 때문이다. 논리적 함축은 진릿값의 관계이며 현실의 인과관계를 반드시 뜻하지는 않는다.</p></div>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="rounded-2xl border bg-background p-4"><p className="text-xs font-black text-primary">필요·충분조건</p><p className="mt-2 text-sm leading-6"><strong>p는 q의 충분조건</strong>이고, <strong>q는 p의 필요조건</strong>이다.</p><p className="mt-2 text-xs leading-5 text-muted-foreground"><code>P only if Q</code>, <code>Q if P</code>, <code>Q is necessary for P</code>는 모두 P → Q로 읽는다.</p></div>
                <div className="rounded-2xl border bg-background p-4"><p className="text-xs font-black text-primary">항상 기억할 동치</p><p className="mt-2 font-mono text-lg font-black">p → q ≡ ¬q → ¬p</p><p className="mt-1 text-xs text-muted-foreground">원래 명제와 대우는 항상 동치</p></div>
              </div>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">{[['역','q → p'],['이','¬p → ¬q'],['대우','¬q → ¬p'],['원문','p → q']].map(([name, formula]) => <div key={name} className="rounded-xl bg-muted p-3 text-center"><span className="block text-xs text-muted-foreground">{name}</span><strong className="mt-1 block font-mono">{formula}</strong></div>)}</div>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="rounded-2xl border bg-background p-4"><p className="text-xs font-black text-primary">동치 묶음</p><p className="mt-2 font-mono text-sm font-black">p → q ≡ ¬q → ¬p</p><p className="mt-1 font-mono text-sm font-black">q → p ≡ ¬p → ¬q</p><p className="mt-2 text-xs text-muted-foreground">원문≡대우, 역≡이. 원문과 역은 일반적으로 동치가 아니다.</p></div>
                <div className="rounded-2xl border bg-background p-4"><p className="text-xs font-black text-primary">방향을 반례로 확인</p><p className="mt-2 text-sm leading-6">“4의 배수이면 짝수”는 참이지만 “짝수이면 4의 배수”는 6 때문에 거짓이다.</p></div>
              </div>
              <div className="rounded-2xl border bg-accent/55 p-5">
                <p className="text-xs font-black uppercase tracking-[.12em] text-primary">상호조건문</p>
                <div className="mt-3 flex flex-wrap items-center gap-2 font-mono text-sm font-black"><span>p ↔ q</span><span>≡</span><span>(p → q) ∧ (q → p)</span><span>≡</span><span>¬(p ⊕ q)</span></div>
                <p className="mt-3 text-sm text-muted-foreground">양방향 조건이 모두 성립해야 하므로 p와 q의 진릿값이 같을 때 참이다.</p>
              </div>
              <p className="source-note">출처: {sections[3].source}</p>
            </article>

            <article id="truth-table" tabIndex={-1} className="section-anchor section-card">
              <SectionHeader sectionId="truth-table" completed={completed} onToggle={toggleComplete} />
              <ol className="grid gap-2 text-sm sm:grid-cols-2">{['변수마다 열을 만든다','2ⁿ개 조합을 빠짐없이 적는다','중간 계산 열을 만든다','괄호와 우선순위대로 계산한다'].map((step, index) => <li key={step} className="flex gap-3 rounded-xl bg-muted/70 p-3"><span className="font-mono font-black text-primary">0{index + 1}</span>{step}</li>)}</ol>
              <div className="rounded-2xl border bg-background p-5">
                <p className="text-xs font-black uppercase tracking-[.12em] text-primary">연산자 우선순위</p>
                <div className="mt-3 flex flex-wrap items-center gap-2 font-mono text-lg font-black"><span>¬</span><ChevronRight className="size-4 text-muted-foreground" /><span>∧</span><ChevronRight className="size-4 text-muted-foreground" /><span>∨</span><ChevronRight className="size-4 text-muted-foreground" /><span>→</span><ChevronRight className="size-4 text-muted-foreground" /><span>↔</span></div>
                <p className="mt-3 text-sm text-muted-foreground">복잡한 식에서는 우선순위만 믿지 말고 괄호로 연산 범위를 분명히 하자.</p>
              </div>
              <div className="rounded-3xl border bg-[#171a37] p-5 text-white sm:p-6">
                <div className="flex flex-wrap items-center justify-between gap-3"><div><p className="text-xs font-black uppercase tracking-[.14em] text-indigo-200">Interactive lab</p><h3 className="mt-1 text-xl font-black">진리표 실험실</h3></div><span className="rounded-full bg-white/10 px-3 py-1 font-mono text-sm">p {operatorLabels.find((item) => item.id === operator)?.symbol} q</span></div>
                <fieldset className="mt-5 flex flex-wrap gap-2"><legend className="sr-only">논리 연산자 선택</legend>{operatorLabels.map((item) => <Button key={item.id} type="button" aria-pressed={operator === item.id} size="sm" variant={operator === item.id ? 'secondary' : 'ghost'} onClick={() => setOperator(item.id)} className={operator !== item.id ? 'text-indigo-100 hover:bg-white/10 hover:text-white' : ''}>{item.symbol} {item.label}</Button>)}</fieldset>
                <div className="mt-4 flex flex-wrap items-center gap-3"><TruthValueButton label="p" value={p} onChange={setP} /><TruthValueButton label="q" value={q} onChange={setQ} /><ArrowRight className="hidden text-indigo-300 sm:block" /><div className={`grid size-16 place-items-center rounded-2xl text-2xl font-black ${truthResult ? 'bg-emerald-400 text-emerald-950' : 'bg-rose-400 text-rose-950'}`}>{truthResult ? 'T' : 'F'}</div></div>
                <p className="mt-4 min-h-10 rounded-xl bg-white/8 p-3 text-sm leading-5 text-indigo-100" aria-live="polite">{explainBinary(operator, p, q)}</p>
                <div className="mt-4 overflow-hidden rounded-xl border border-white/15">
                  <table className="w-full text-center text-xs"><caption className="sr-only">선택한 이항 논리 연산자의 진리표</caption><thead className="bg-white/10 text-indigo-100"><tr><th scope="col" className="p-2">p</th><th scope="col">q</th><th scope="col">{operatorLabels.find((item) => item.id === operator)?.symbol}</th></tr></thead><tbody className="divide-y divide-white/10">{truthRows.map(([rowP, rowQ]) => <tr key={`${rowP}-${rowQ}`}><td className="p-2">{rowP ? 'T' : 'F'}</td><td>{rowQ ? 'T' : 'F'}</td><td className="font-black text-amber-300">{evaluateBinary(operator, rowP, rowQ) ? 'T' : 'F'}</td></tr>)}</tbody></table>
                </div>
              </div>
              <div className="rounded-2xl border bg-background p-5">
                <div className="flex flex-wrap items-start justify-between gap-3"><div><p className="text-xs font-black uppercase tracking-[.12em] text-primary">3변수 종합 예제</p><h3 className="mt-2 font-bold">(P ∨ Q) → ¬R</h3></div><span className="rounded-full bg-muted px-3 py-1 text-xs font-bold">3변수 = 2³ = 8행</span></div>
                <div className="mt-3 grid gap-1 text-sm leading-6 text-muted-foreground"><p><strong className="text-foreground">P</strong>: Harry의 집에 간다.</p><p><strong className="text-foreground">Q</strong>: 시골에 간다.</p><p><strong className="text-foreground">R</strong>: 쇼핑하러 간다.</p></div>
                <p className="mt-3 text-sm leading-6 text-muted-foreground">포괄적 OR이므로 P와 Q 중 하나 이상이 참이면서 R도 참인 `(P ∨ Q) ∧ R`일 때만 전체 조건문이 거짓이다.</p>
                <div className="mt-4 overflow-x-auto rounded-xl border">
                  <table className="w-full min-w-[620px] text-center text-xs">
                    <caption className="sr-only">복합명제 (P ∨ Q) → ¬R의 여덟 가지 진릿값</caption>
                    <thead className="bg-muted text-muted-foreground"><tr><th scope="col" className="p-2">P</th><th scope="col">Q</th><th scope="col">R</th><th scope="col">P ∨ Q</th><th scope="col">¬R</th><th scope="col">(P ∨ Q) → ¬R</th></tr></thead>
                    <tbody className="divide-y">{compoundTruthRows.map((row) => <tr key={`${row.p}-${row.q}-${row.r}`}><td className="p-2">{row.p ? 'T' : 'F'}</td><td>{row.q ? 'T' : 'F'}</td><td>{row.r ? 'T' : 'F'}</td><td>{row.pOrQ ? 'T' : 'F'}</td><td>{row.notR ? 'T' : 'F'}</td><td className={`font-black ${row.result ? 'text-emerald-700' : 'text-rose-700'}`}>{row.result ? 'T' : 'F'}</td></tr>)}</tbody>
                  </table>
                </div>
              </div>
              <p className="source-note">출처: {sections[4].source}</p>
            </article>

            <article id="applications" tabIndex={-1} className="section-anchor section-card">
              <SectionHeader sectionId="applications" completed={completed} onToggle={toggleComplete} />
              <ol className="grid gap-2 text-sm sm:grid-cols-2">{['문장을 독립적인 사실로 나눈다','각 사실에 p, q, r을 붙인다','only if·필요조건 등 방향과 부정 범위를 판별한다','접속어를 기호로 바꾸고 괄호로 범위를 확정한다'].map((step, index) => <li key={step} className="flex gap-3 rounded-xl bg-muted/70 p-3"><span className="font-mono font-black text-primary">0{index + 1}</span>{step}</li>)}</ol>
              <div className="rounded-2xl border bg-background p-5"><p className="text-xs font-black uppercase tracking-[.12em] text-primary">자연어 → 논리식</p><p className="mt-3 text-sm leading-6">키가 4피트 미만이고 16세를 초과하지 않은 사람은 롤러코스터를 탈 수 없다.</p><div className="mt-3 grid gap-2 text-xs text-muted-foreground sm:grid-cols-3"><span><strong className="text-foreground">q</strong>: 탈 수 있다</span><span><strong className="text-foreground">r</strong>: 4피트 미만이다</span><span><strong className="text-foreground">s</strong>: 16세를 초과한다</span></div><div className="mt-4 formula-card"><span>(r ∧ ¬s)</span><strong>→</strong><span>¬q</span></div></div>
              <div className="rounded-2xl border bg-background p-5"><p className="text-xs font-black uppercase tracking-[.12em] text-primary">시스템 명세 일관성</p><div className="mt-3 grid gap-2 text-xs text-muted-foreground sm:grid-cols-2"><span><strong className="text-foreground">P</strong>: 진단 메시지가 버퍼에 저장된다.</span><span><strong className="text-foreground">Q</strong>: 진단 메시지가 재전송된다.</span></div><div className="mt-3 grid gap-2 text-sm sm:grid-cols-3"><span className="rounded-lg bg-muted p-2"><code>P ∨ Q</code><small className="mt-1 block text-muted-foreground">저장되거나 재전송된다.</small></span><span className="rounded-lg bg-muted p-2"><code>¬P</code><small className="mt-1 block text-muted-foreground">버퍼에 저장되지 않는다.</small></span><span className="rounded-lg bg-muted p-2"><code>P → Q</code><small className="mt-1 block text-muted-foreground">저장되면 재전송된다.</small></span></div><p className="mt-3 text-sm text-muted-foreground">P=F, Q=T라는 조합이 세 식을 모두 참으로 만들므로 일관적이다. 여기에 ¬Q를 더하면 가능한 조합이 사라진다.</p></div>
              <p className="source-note">출처: {sections[5].source}</p>
            </article>

            <article id="bits-circuits" tabIndex={-1} className="section-anchor section-card">
              <SectionHeader sectionId="bits-circuits" completed={completed} onToggle={toggleComplete} />
              <div className="grid gap-4 sm:grid-cols-2"><div className="rounded-2xl bg-[#171a37] p-5 font-mono text-sm text-indigo-100"><p className="text-white">F ↔ 0　T ↔ 1</p><p className="mt-4">1011 | 0110 = <strong className="text-amber-300">1111</strong></p><p>1011 & 0110 = <strong className="text-amber-300">0010</strong></p><p>1011 ^ 0110 = <strong className="text-amber-300">1101</strong></p></div><div className="rounded-2xl border bg-background p-5"><Code2 className="size-5 text-primary" /><p className="mt-3 text-sm leading-6"><code>!</code>, <code>&&</code>, <code>||</code>는 논리값 연산에, <code>~</code>, <code>&</code>, <code>|</code>, <code>^</code>는 비트 단위 연산에 사용한다.</p></div></div>
              <div className="formula-card"><span>(p ∧ ¬q)</span><strong>∨</strong><span>¬r</span></div>
              <ol className="grid gap-2 text-sm sm:grid-cols-2">{['논리식에서 q와 r의 NOT 출력을 찾는다','p와 ¬q가 만나는 AND 연결을 확인한다','¬r이 OR로 직접 들어가는 경로를 찾는다','두 경로의 출력을 OR에서 결합해 해석한다'].map((step, index) => <li key={step} className="flex gap-3 rounded-xl bg-muted/70 p-3"><span className="font-mono font-black text-primary">0{index + 1}</span>{step}</li>)}</ol>
              <p className="text-sm leading-6 text-muted-foreground">이 목록은 회로를 읽는 순서다. 실제 조합회로의 게이트들은 연결 구조에 따라 함께 반응하고, 전파 지연 뒤 최종 출력 <code>(p ∧ ¬q) ∨ ¬r</code>이 안정된다.</p>
              <p className="source-note">출처: {sections[6].source}</p>
            </article>

            <article id="review" tabIndex={-1} className="section-anchor section-card">
              <SectionHeader sectionId="review" completed={completed} onToggle={toggleComplete} />
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{[['∨ vs ⊕','OR는 둘 다 참도 포함. XOR은 하나만 참.'],['→','T → F일 때만 거짓.'],['대우','p → q ≡ ¬q → ¬p'],['only if','P only if Q는 P → Q.'],['우선순위','¬ > ∧ > ∨ > → > ↔'],['진리표 행 수','명제변수가 n개면 2ⁿ행.']].map(([title, body]) => <div key={title} className="rounded-2xl bg-accent/70 p-4"><strong className="font-mono text-primary">{title}</strong><p className="mt-2 text-sm leading-5">{body}</p></div>)}</div>
              <div className="rounded-2xl border bg-background p-5"><p className="text-xs font-black uppercase tracking-[.12em] text-primary">시험 체크리스트</p><ul className="mt-3 grid gap-2 text-sm sm:grid-cols-2">{['명제와 비명제를 이유와 함께 구분','여섯 연산자의 참 조건 작성','역·이·대우와 동치 관계 판별','자연어를 논리식으로 번역','시스템 명세의 만족 조합 찾기','논리회로를 식과 연산 순서로 해석'].map((item) => <li key={item} className="flex gap-2"><CheckCircle2 className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden="true" />{item}</li>)}</ul></div>
              <div className="space-y-4">{quizzes.map((quiz, quizIndex) => { const state = feedback[quiz.id]; return <div key={quiz.id} className="rounded-2xl border bg-background p-5"><p className="text-xs font-black text-primary">CHECK {quizIndex + 1}</p><h3 className="mt-2 font-bold" id={`${quiz.id}-prompt`}>{quiz.prompt}</h3><fieldset className="mt-3 grid gap-2"><legend className="sr-only">{quiz.prompt}</legend>{quiz.choices.map((choice, index) => <button key={choice} aria-pressed={answers[quiz.id] === index} type="button" onClick={() => { setAnswers((current) => ({ ...current, [quiz.id]: index })); setFeedback((current) => { const next = { ...current }; delete next[quiz.id]; return next; }); }} className={`flex items-center gap-3 rounded-xl border px-3 py-2.5 text-left text-sm ${answers[quiz.id] === index ? 'border-primary bg-primary/8' : 'hover:bg-muted'}`}><span className={`grid size-5 place-items-center rounded-full border ${answers[quiz.id] === index ? 'border-primary bg-primary text-primary-foreground' : ''}`}>{answers[quiz.id] === index && <Check className="size-3" />}</span>{choice}</button>)}</fieldset><Button type="button" size="sm" className="mt-3" onClick={() => submitQuiz(quiz.id, quiz.answer)}>정답 확인</Button>{state && <div aria-live="polite" className={`mt-3 rounded-xl p-3 text-sm ${state === 'correct' ? 'bg-emerald-100 text-emerald-900' : state === 'incorrect' ? 'bg-rose-100 text-rose-900' : 'bg-amber-100 text-amber-900'}`}>{state === 'unanswered' ? '답을 먼저 선택해 줘.' : <><strong>{state === 'correct' ? '정답!' : '다시 생각해 보자.'}</strong> {quiz.explanation}</>}</div>}</div>; })}</div>
              <p className="source-note">출처: {sections[7].source}</p>
            </article>

            <div className="flex items-center justify-between gap-3 rounded-2xl border bg-card p-4 shadow-sm">
              <Button variant="outline" disabled={activeIndex === 0} onClick={() => navigateTo(currentSections[Math.max(0, activeIndex - 1)].id)}>이전</Button>
              <p className="hidden text-sm text-muted-foreground sm:block">{currentWeekComplete ? `${activeWeek}주차 완료! 잘했어.` : `${currentSections.length - completed.size}개 개념이 남았어.`}</p>
              <Button onClick={() => navigateTo(currentSections[Math.min(currentSections.length - 1, activeIndex + 1)].id)} disabled={activeIndex === currentSections.length - 1}>다음 <ArrowRight /></Button>
            </div>
          </div>
        </section>

        <aside className="sticky top-16 hidden h-[calc(100vh-64px)] overflow-y-auto border-l border-border/80 p-6 xl:block">
          <div className="mb-6 rounded-2xl border bg-card p-4 shadow-sm">
            <Progress value={hydrated ? progressValue : 0} className="gap-2">
              <ProgressLabel>{activeWeek}주차 진도</ProgressLabel>
              <span className="ml-auto text-sm font-black tabular-nums text-primary">{completed.size}/{currentSections.length}</span>
            </Progress>
          </div>
          <p className="mb-3 px-2 text-xs font-black uppercase tracking-[0.16em] text-muted-foreground">현재 주차 목차</p>
          <SectionList items={currentSections} activeId={activeId} completed={completed} onSelect={navigateTo} />
          {activeWeekData.memory && <div className="mt-6 rounded-2xl bg-[#171a37] p-4 text-white"><Sparkles className="size-5 text-amber-300" /><p className="mt-3 text-sm font-bold">오늘의 기억 문장</p><p className="mt-2 text-xs leading-5 text-indigo-100">{activeWeekData.memory}</p></div>}
        </aside>
      </div>
    </main>
  );
}

function replaceStudyUrl(week: number, section: string) {
  const url = new URL(window.location.href);
  url.searchParams.delete('section');
  url.searchParams.set('week', String(week));
  url.hash = section;
  window.history.replaceState({}, '', url);
}

function preferredScrollBehavior(): ScrollBehavior {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth';
}

function SectionHeader({ sectionId, completed, onToggle }: { sectionId: string; completed: Set<string>; onToggle: (id: string) => void }) {
  const section = sections.find((item) => item.id === sectionId)!;
  return (
    <div className="flex flex-wrap items-start justify-between gap-4">
      <div className="min-w-0"><p className="text-xs font-black uppercase tracking-[0.14em] text-primary">{section.eyebrow}</p><h2 className="mt-2 text-2xl font-black tracking-[-0.03em]">{section.title}</h2><p className="mt-2 text-sm leading-6 text-muted-foreground">{section.summary}</p></div>
      <Button type="button" size="sm" variant={completed.has(sectionId) ? 'secondary' : 'outline'} onClick={() => onToggle(sectionId)} aria-pressed={completed.has(sectionId)}>{completed.has(sectionId) ? <CheckCircle2 /> : <Circle />} {completed.has(sectionId) ? '완료됨' : '학습 완료'}</Button>
    </div>
  );
}

function ConceptCard({ icon, title, children }: { icon: React.ReactNode; title: string; children: React.ReactNode }) {
  return <div className="rounded-2xl border bg-background p-5"><span className="grid size-10 place-items-center rounded-xl bg-primary/10 text-primary">{icon}</span><h3 className="mt-4 font-bold">{title}</h3><p className="mt-2 text-sm leading-6 text-muted-foreground">{children}</p></div>;
}

function Example({ verdict, text, good = false }: { verdict: string; text: string; good?: boolean }) {
  return <div className="rounded-xl border bg-background p-4"><span className={`text-xs font-black ${good ? 'text-emerald-700' : 'text-rose-700'}`}>{verdict}</span><p className="mt-2 font-mono text-sm">{text}</p></div>;
}
