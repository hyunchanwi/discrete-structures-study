'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import {
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
import { futureUnits, operators, quizzes, sections } from '@/src/course-data';
import {
  type BinaryOperator,
  evaluateBinary,
  explainBinary,
  gradeQuiz,
  parseProgress,
  searchStudySections,
} from '@/src/logic-utils';

const STORAGE_KEY = 'discrete-structures-progress-v1';
const sectionIds = sections.map((section) => section.id);
const operatorLabels: { id: BinaryOperator; label: string; symbol: string }[] = [
  { id: 'and', label: 'AND', symbol: '∧' },
  { id: 'or', label: 'OR', symbol: '∨' },
  { id: 'xor', label: 'XOR', symbol: '⊕' },
  { id: 'implies', label: '함축', symbol: '→' },
  { id: 'iff', label: 'IFF', symbol: '↔' },
];

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

function SectionList({ activeId, completed, onSelect }: { activeId: string; completed: Set<string>; onSelect: (id: string) => void }) {
  return (
    <nav aria-label="1주차 학습 목차" className="space-y-1.5">
      {sections.map((section, index) => {
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

export default function Home() {
  const [activeId, setActiveId] = useState('overview');
  const [completed, setCompleted] = useState<Set<string>>(new Set());
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
  const searchRootRef = useRef<HTMLDivElement>(null);

  const searchResults = useMemo(() => searchStudySections(sections, query), [query]);
  const progressValue = Math.round((completed.size / sections.length) * 100);
  const activeIndex = Math.max(0, sections.findIndex((section) => section.id === activeId));
  const truthResult = evaluateBinary(operator, p, q);
  const truthRows = [[true, true], [true, false], [false, true], [false, false]] as const;

  useEffect(() => {
    let saved = parseProgress(null, sectionIds);
    try {
      saved = parseProgress(window.localStorage.getItem(STORAGE_KEY), sectionIds);
    } catch {
      // Private browsing or a storage policy can block access; in-memory study still works.
    }
    const params = new URLSearchParams(window.location.search);
    const requested = params.get('section');
    const initial = requested && sectionIds.includes(requested) ? requested : saved.lastSection;
    window.requestAnimationFrame(() => {
      setCompleted(new Set(saved.completed));
      setActiveId(initial);
      setHydrated(true);
      document.getElementById(initial)?.scrollIntoView({ block: 'start' });
    });

    const onStorage = (event: StorageEvent) => {
      if (event.key !== STORAGE_KEY) return;
      const next = parseProgress(event.newValue, sectionIds);
      setCompleted(new Set(next.completed));
      setActiveId(next.lastSection);
    };
    const onPopState = () => {
      const id = new URLSearchParams(window.location.search).get('section');
      if (!id || !sectionIds.includes(id)) return;
      setActiveId(id);
      document.getElementById(id)?.scrollIntoView({ behavior: preferredScrollBehavior(), block: 'start' });
    };
    const observer = new IntersectionObserver((entries) => {
      const visible = entries.filter((entry) => entry.isIntersecting).sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
      const id = visible?.target.id;
      if (!id || !sectionIds.includes(id)) return;
      setActiveId(id);
      const url = new URL(window.location.href);
      url.searchParams.set('section', id);
      window.history.replaceState({}, '', url);
    }, { rootMargin: '-20% 0px -65% 0px', threshold: [0.1, 0.5] });
    document.querySelectorAll('.section-anchor').forEach((element) => observer.observe(element));
    window.addEventListener('storage', onStorage);
    window.addEventListener('popstate', onPopState);
    return () => {
      observer.disconnect();
      window.removeEventListener('storage', onStorage);
      window.removeEventListener('popstate', onPopState);
    };
  }, []);

  function persist(nextCompleted: Set<string>, lastSection: string) {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify({ completed: [...nextCompleted], lastSection }));
    } catch {
      // Keep the current session usable when storage is unavailable or full.
    }
  }

  function navigateTo(id: string) {
    if (!sectionIds.includes(id)) return;
    setActiveId(id);
    const url = new URL(window.location.href);
    url.searchParams.set('section', id);
    window.history.pushState({}, '', url);
    persist(completed, id);
    document.getElementById(id)?.scrollIntoView({ behavior: preferredScrollBehavior(), block: 'start' });
  }

  function toggleComplete(id: string) {
    const next = new Set(completed);
    if (next.has(id)) next.delete(id); else next.add(id);
    setCompleted(next);
    persist(next, activeId);
  }

  function resetProgress() {
    const empty = new Set<string>();
    setCompleted(empty);
    setFeedback({});
    setAnswers({});
    try {
      window.localStorage.removeItem(STORAGE_KEY);
    } catch {
      // The in-memory reset still succeeds when storage removal is blocked.
    }
    setActiveId('overview');
    const url = new URL(window.location.href);
    url.searchParams.set('section', 'overview');
    window.history.replaceState({}, '', url);
    document.getElementById('overview')?.scrollIntoView({ behavior: preferredScrollBehavior(), block: 'start' });
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
                <SheetTitle>1주차 학습 목차</SheetTitle>
                <SheetDescription>완료한 개념에는 체크가 표시돼.</SheetDescription>
              </SheetHeader>
              <div className="overflow-y-auto p-4"><SectionList activeId={activeId} completed={completed} onSelect={(id) => { navigateTo(id); setNavOpen(false); }} /><Button variant="ghost" size="sm" onClick={() => { resetProgress(); setNavOpen(false); }} className="mt-5 w-full justify-start text-muted-foreground"><RotateCcw /> 진도 초기화</Button></div>
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
          <span className="hidden rounded-full border border-primary/20 bg-primary/8 px-3 py-1.5 text-xs font-bold text-primary sm:inline">1주차</span>
        </div>
        {mobileQueryOpen && <div className="border-t px-4 py-3 md:hidden">{searchBox(true)}</div>}
      </header>

      <div className="mx-auto grid max-w-[1440px] grid-cols-1 lg:grid-cols-[250px_minmax(0,1fr)] xl:grid-cols-[250px_minmax(0,820px)_270px]">
        <aside className="sticky top-16 hidden h-[calc(100vh-64px)] overflow-y-auto border-r border-border/80 p-5 lg:block">
          <div className="mb-5 rounded-2xl border bg-card p-4 shadow-sm">
            <Progress value={hydrated ? progressValue : 0} className="gap-2">
              <ProgressLabel>1주차 진도</ProgressLabel>
              <span className="ml-auto text-sm font-black tabular-nums text-primary">{hydrated ? progressValue : 0}%</span>
            </Progress>
            <p className="mt-2 text-xs text-muted-foreground">{completed.size}/{sections.length}개 개념 완료</p>
          </div>
          <p className="mb-3 px-2 text-xs font-black uppercase tracking-[0.16em] text-muted-foreground">학습 지도</p>
          <SectionList activeId={activeId} completed={completed} onSelect={navigateTo} />
          <Button variant="ghost" size="sm" onClick={resetProgress} className="mt-5 w-full justify-start text-muted-foreground"><RotateCcw /> 진도 초기화</Button>
        </aside>

        <section className="logic-grid min-w-0 px-4 py-7 sm:px-8 sm:py-10">
          <div className="mx-auto max-w-[820px] space-y-6">
            <section className="rounded-[28px] border border-border bg-card/96 p-6 shadow-[0_22px_70px_-42px_rgba(33,42,102,.45)] sm:p-8">
              <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
                <div>
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-accent px-2.5 py-1 text-xs font-black text-accent-foreground"><BookOpen className="size-3.5" /> 오늘의 학습</span>
                  <h1 className="mt-4 text-3xl font-black tracking-[-0.04em] sm:text-4xl">명제논리, 참과 거짓의 언어</h1>
                  <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground sm:text-base">문장을 명제로 바꾸고, 논리 연산자의 규칙을 진리표로 직접 확인해 보자.</p>
                </div>
                <div className="flex items-center gap-2 rounded-xl border bg-background px-3 py-2 text-xs font-medium text-muted-foreground"><Clock3 className="size-4 text-primary" /> 약 35분</div>
              </div>
              <Progress value={hydrated ? progressValue : 0} className="rounded-xl bg-muted/65 p-3 lg:hidden">
                <ProgressLabel>1주차 진행률</ProgressLabel>
                <span className="ml-auto text-sm font-black tabular-nums text-primary">{hydrated ? progressValue : 0}%</span>
              </Progress>
              <div className="mt-6 flex flex-wrap gap-3">
                <Button size="lg" className="h-11 rounded-xl px-4" onClick={() => navigateTo(completed.size ? activeId : 'proposition')}>{completed.size ? '이어서 공부하기' : '1주차 시작하기'} <ArrowRight /></Button>
                <Button variant="outline" size="lg" className="h-11 rounded-xl px-4" onClick={() => navigateTo('truth-table')}><Binary /> 진리표 실습</Button>
              </div>
            </section>

            <article id="overview" className="section-anchor section-card">
              <SectionHeader sectionId="overview" completed={completed} onToggle={toggleComplete} />
              <div className="grid gap-4 sm:grid-cols-2">
                <ConceptCard icon={<Binary />} title="디지털 정보의 바닥">컴퓨터는 정보를 0과 1의 유한한 조합으로 저장하고 처리한다.</ConceptCard>
                <ConceptCard icon={<Target />} title="구조와 관계를 보는 법">비밀번호 개수, 최단 경로, 암호화처럼 서로 구분되는 대상과 관계를 연구한다.</ConceptCard>
              </div>
              <p className="source-note">출처: {sections[0].source}</p>
            </article>

            <article id="proposition" className="section-anchor section-card">
              <SectionHeader sectionId="proposition" completed={completed} onToggle={toggleComplete} />
              <div className="definition-box"><span>정확한 정의</span><strong>명제는 참 또는 거짓 중 정확히 하나로 판정되는 선언문이다.</strong></div>
              <div className="grid gap-3 sm:grid-cols-2">
                <Example verdict="명제 · T" text="1 + 1 = 2" good />
                <Example verdict="명제 · F" text="2 + 2 = 3" good />
                <Example verdict="명제 아님" text="지금 몇 시인가?" />
                <Example verdict="명제 아님" text="x + 1 = 2" />
              </div>
              <div className="tip-box"><Lightbulb /> <p><strong>모르는 것과 결정되지 않는 것은 다르다.</strong> 큰 수가 소수인지 당장 몰라도 원칙적으로 참·거짓이 정해지면 명제다.</p></div>
              <p className="source-note">출처: {sections[1].source}</p>
            </article>

            <article id="operators" className="section-anchor section-card">
              <SectionHeader sectionId="operators" completed={completed} onToggle={toggleComplete} />
              <div className="overflow-x-auto rounded-2xl border">
                <table className="w-full min-w-[620px] text-left text-sm">
                  <thead className="bg-muted text-xs text-muted-foreground"><tr><th className="p-3">이름</th><th className="p-3">논리식</th><th className="p-3">읽는 법</th><th className="p-3">참 조건</th></tr></thead>
                  <tbody className="divide-y">{operators.map((item) => <tr key={item.name}><td className="p-3 font-bold">{item.name}</td><td className="p-3 font-mono text-lg text-primary">{item.symbol}</td><td className="p-3">{item.read}</td><td className="p-3 text-muted-foreground">{item.truth}</td></tr>)}</tbody>
                </table>
              </div>
              <div className="warning-box"><strong>OR와 XOR를 구분!</strong><span>p ∨ q는 둘 다 참이어도 참이지만, p ⊕ q는 정확히 하나만 참이어야 한다.</span></div>
              <p className="source-note">출처: {sections[2].source}</p>
            </article>

            <article id="implication" className="section-anchor section-card">
              <SectionHeader sectionId="implication" completed={completed} onToggle={toggleComplete} />
              <div className="formula-card"><span>p → q</span><strong>≡</strong><span>¬p ∨ q</span></div>
              <p className="leading-7 text-muted-foreground">조건문을 “p가 일어나면 q도 일어나야 한다”는 약속으로 생각하자. 약속이 깨지는 경우는 p가 참인데 q가 거짓인 단 한 경우다.</p>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="rounded-2xl border bg-background p-4"><p className="text-xs font-black text-primary">필요·충분조건</p><p className="mt-2 text-sm leading-6"><strong>p는 q의 충분조건</strong>이고, <strong>q는 p의 필요조건</strong>이다.</p></div>
                <div className="rounded-2xl border bg-background p-4"><p className="text-xs font-black text-primary">항상 기억할 동치</p><p className="mt-2 font-mono text-lg font-black">p → q ≡ ¬q → ¬p</p><p className="mt-1 text-xs text-muted-foreground">원래 명제와 대우는 항상 동치</p></div>
              </div>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">{[['역','q → p'],['이','¬p → ¬q'],['대우','¬q → ¬p'],['원문','p → q']].map(([name, formula]) => <div key={name} className="rounded-xl bg-muted p-3 text-center"><span className="block text-xs text-muted-foreground">{name}</span><strong className="mt-1 block font-mono">{formula}</strong></div>)}</div>
              <p className="source-note">출처: {sections[3].source}</p>
            </article>

            <article id="truth-table" className="section-anchor section-card">
              <SectionHeader sectionId="truth-table" completed={completed} onToggle={toggleComplete} />
              <ol className="grid gap-2 text-sm sm:grid-cols-2">{['변수마다 열을 만든다','2ⁿ개 조합을 빠짐없이 적는다','중간 계산 열을 만든다','괄호와 우선순위대로 계산한다'].map((step, index) => <li key={step} className="flex gap-3 rounded-xl bg-muted/70 p-3"><span className="font-mono font-black text-primary">0{index + 1}</span>{step}</li>)}</ol>
              <div className="rounded-3xl border bg-[#171a37] p-5 text-white sm:p-6">
                <div className="flex flex-wrap items-center justify-between gap-3"><div><p className="text-xs font-black uppercase tracking-[.14em] text-indigo-200">Interactive lab</p><h3 className="mt-1 text-xl font-black">진리표 실험실</h3></div><span className="rounded-full bg-white/10 px-3 py-1 font-mono text-sm">p {operatorLabels.find((item) => item.id === operator)?.symbol} q</span></div>
                <fieldset className="mt-5 flex flex-wrap gap-2"><legend className="sr-only">논리 연산자 선택</legend>{operatorLabels.map((item) => <Button key={item.id} type="button" aria-pressed={operator === item.id} size="sm" variant={operator === item.id ? 'secondary' : 'ghost'} onClick={() => setOperator(item.id)} className={operator !== item.id ? 'text-indigo-100 hover:bg-white/10 hover:text-white' : ''}>{item.symbol} {item.label}</Button>)}</fieldset>
                <div className="mt-4 flex flex-wrap items-center gap-3"><TruthValueButton label="p" value={p} onChange={setP} /><TruthValueButton label="q" value={q} onChange={setQ} /><ArrowRight className="hidden text-indigo-300 sm:block" /><div className={`grid size-16 place-items-center rounded-2xl text-2xl font-black ${truthResult ? 'bg-emerald-400 text-emerald-950' : 'bg-rose-400 text-rose-950'}`}>{truthResult ? 'T' : 'F'}</div></div>
                <p className="mt-4 min-h-10 rounded-xl bg-white/8 p-3 text-sm leading-5 text-indigo-100" aria-live="polite">{explainBinary(operator, p, q)}</p>
                <div className="mt-4 overflow-hidden rounded-xl border border-white/15">
                  <table className="w-full text-center text-xs"><thead className="bg-white/10 text-indigo-100"><tr><th className="p-2">p</th><th>q</th><th>{operatorLabels.find((item) => item.id === operator)?.symbol}</th></tr></thead><tbody className="divide-y divide-white/10">{truthRows.map(([rowP, rowQ]) => <tr key={`${rowP}-${rowQ}`}><td className="p-2">{rowP ? 'T' : 'F'}</td><td>{rowQ ? 'T' : 'F'}</td><td className="font-black text-amber-300">{evaluateBinary(operator, rowP, rowQ) ? 'T' : 'F'}</td></tr>)}</tbody></table>
                </div>
              </div>
              <p className="source-note">출처: {sections[4].source}</p>
            </article>

            <article id="applications" className="section-anchor section-card">
              <SectionHeader sectionId="applications" completed={completed} onToggle={toggleComplete} />
              <div className="rounded-2xl border bg-background p-5"><p className="text-xs font-black uppercase tracking-[.12em] text-primary">자연어 → 논리식</p><p className="mt-3 text-sm leading-6">키가 4피트 미만이고 16세를 초과하지 않은 사람은 롤러코스터를 탈 수 없다.</p><div className="mt-3 grid gap-2 text-xs text-muted-foreground sm:grid-cols-3"><span><strong className="text-foreground">q</strong>: 탈 수 있다</span><span><strong className="text-foreground">r</strong>: 4피트 미만이다</span><span><strong className="text-foreground">s</strong>: 16세를 초과한다</span></div><div className="mt-4 formula-card"><span>(r ∧ ¬s)</span><strong>→</strong><span>¬q</span></div></div>
              <div className="rounded-2xl border bg-background p-5"><p className="text-xs font-black uppercase tracking-[.12em] text-primary">시스템 명세 일관성</p><div className="mt-3 grid gap-2 font-mono text-sm sm:grid-cols-3"><span className="rounded-lg bg-muted p-2 text-center">P ∨ Q</span><span className="rounded-lg bg-muted p-2 text-center">¬P</span><span className="rounded-lg bg-muted p-2 text-center">P → Q</span></div><p className="mt-3 text-sm text-muted-foreground">P=F, Q=T라는 조합이 세 식을 모두 참으로 만들므로 일관적이다. 여기에 ¬Q를 더하면 가능한 조합이 사라진다.</p></div>
              <p className="source-note">출처: {sections[5].source}</p>
            </article>

            <article id="bits-circuits" className="section-anchor section-card">
              <SectionHeader sectionId="bits-circuits" completed={completed} onToggle={toggleComplete} />
              <div className="grid gap-4 sm:grid-cols-2"><div className="rounded-2xl bg-[#171a37] p-5 font-mono text-sm text-indigo-100"><p className="text-white">F ↔ 0　T ↔ 1</p><p className="mt-4">1011 | 0110 = <strong className="text-amber-300">1111</strong></p><p>1011 & 0110 = <strong className="text-amber-300">0010</strong></p><p>1011 ^ 0110 = <strong className="text-amber-300">1101</strong></p></div><div className="rounded-2xl border bg-background p-5"><Code2 className="size-5 text-primary" /><p className="mt-3 text-sm leading-6"><code>!</code>, <code>&&</code>, <code>||</code>는 논리값 연산에, <code>~</code>, <code>&</code>, <code>|</code>, <code>^</code>는 비트 단위 연산에 사용한다.</p></div></div>
              <div className="formula-card"><span>(p ∧ ¬q)</span><strong>∨</strong><span>¬r</span></div>
              <p className="text-sm leading-6 text-muted-foreground">강의자료의 조합회로는 q와 r을 각각 부정한 뒤 AND와 OR 게이트를 연결해 위 식을 계산한다.</p>
              <p className="source-note">출처: {sections[6].source}</p>
            </article>

            <article id="review" className="section-anchor section-card">
              <SectionHeader sectionId="review" completed={completed} onToggle={toggleComplete} />
              <div className="grid gap-3 sm:grid-cols-3">{[['∨ vs ⊕','OR는 둘 다 참도 포함. XOR은 하나만 참.'],['→','T → F일 때만 거짓.'],['대우','p → q ≡ ¬q → ¬p']].map(([title, body]) => <div key={title} className="rounded-2xl bg-accent/70 p-4"><strong className="font-mono text-primary">{title}</strong><p className="mt-2 text-sm leading-5">{body}</p></div>)}</div>
              <div className="space-y-4">{quizzes.map((quiz, quizIndex) => { const state = feedback[quiz.id]; return <div key={quiz.id} className="rounded-2xl border bg-background p-5"><p className="text-xs font-black text-primary">CHECK {quizIndex + 1}</p><h3 className="mt-2 font-bold" id={`${quiz.id}-prompt`}>{quiz.prompt}</h3><fieldset className="mt-3 grid gap-2"><legend className="sr-only">{quiz.prompt}</legend>{quiz.choices.map((choice, index) => <button key={choice} aria-pressed={answers[quiz.id] === index} type="button" onClick={() => { setAnswers((current) => ({ ...current, [quiz.id]: index })); setFeedback((current) => { const next = { ...current }; delete next[quiz.id]; return next; }); }} className={`flex items-center gap-3 rounded-xl border px-3 py-2.5 text-left text-sm ${answers[quiz.id] === index ? 'border-primary bg-primary/8' : 'hover:bg-muted'}`}><span className={`grid size-5 place-items-center rounded-full border ${answers[quiz.id] === index ? 'border-primary bg-primary text-primary-foreground' : ''}`}>{answers[quiz.id] === index && <Check className="size-3" />}</span>{choice}</button>)}</fieldset><Button type="button" size="sm" className="mt-3" onClick={() => submitQuiz(quiz.id, quiz.answer)}>정답 확인</Button>{state && <div aria-live="polite" className={`mt-3 rounded-xl p-3 text-sm ${state === 'correct' ? 'bg-emerald-100 text-emerald-900' : state === 'incorrect' ? 'bg-rose-100 text-rose-900' : 'bg-amber-100 text-amber-900'}`}>{state === 'unanswered' ? '답을 먼저 선택해 줘.' : <><strong>{state === 'correct' ? '정답!' : '다시 생각해 보자.'}</strong> {quiz.explanation}</>}</div>}</div>; })}</div>
              <p className="source-note">출처: {sections[7].source}</p>
            </article>

            <div className="flex items-center justify-between gap-3 rounded-2xl border bg-card p-4 shadow-sm">
              <Button variant="outline" disabled={activeIndex === 0} onClick={() => navigateTo(sections[Math.max(0, activeIndex - 1)].id)}>이전</Button>
              <p className="hidden text-sm text-muted-foreground sm:block">{completed.size === sections.length ? '1주차 완료! 잘했어.' : `${sections.length - completed.size}개 개념이 남았어.`}</p>
              <Button onClick={() => navigateTo(sections[Math.min(sections.length - 1, activeIndex + 1)].id)} disabled={activeIndex === sections.length - 1}>다음 <ArrowRight /></Button>
            </div>
          </div>
        </section>

        <aside className="sticky top-16 hidden h-[calc(100vh-64px)] overflow-y-auto border-l border-border/80 p-6 xl:block">
          <p className="text-xs font-black uppercase tracking-[0.16em] text-muted-foreground">이번 주 목표</p>
          <ol className="mt-4 space-y-4 text-sm leading-5">{['명제와 비명제를 구분한다','여섯 논리 연산자를 설명한다','함축의 대우를 작성한다','진리표를 단계적으로 만든다','자연어를 논리식으로 바꾼다'].map((goal, index) => <li key={goal} className="flex gap-3"><span className="font-mono text-primary">0{index + 1}</span><span>{goal}</span></li>)}</ol>
          <div className="my-6 h-px bg-border" />
          <p className="text-xs font-black uppercase tracking-[0.16em] text-muted-foreground">전체 과목 지도</p>
          <div className="mt-4 space-y-3"><div className="rounded-xl border border-primary/30 bg-primary/8 p-3 text-sm font-bold text-primary">1주차 · 논리와 증명</div>{futureUnits.map((unit) => <div key={unit} className="flex items-center gap-2 px-2 text-xs text-muted-foreground"><Circle className="size-3" />{unit}<span className="ml-auto text-[10px]">자료 준비 중</span></div>)}</div>
          <div className="mt-6 rounded-2xl bg-[#171a37] p-4 text-white"><Sparkles className="size-5 text-amber-300" /><p className="mt-3 text-sm font-bold">오늘의 기억 문장</p><p className="mt-2 text-xs leading-5 text-indigo-100">조건문은 p가 참이고 q가 거짓일 때만 거짓이다.</p></div>
        </aside>
      </div>
    </main>
  );
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
