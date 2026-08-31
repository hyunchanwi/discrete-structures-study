export type StudySection = {
  id: string;
  title: string;
  eyebrow: string;
  summary: string;
  searchText: string;
  source: string;
};

export type StudyWeek = {
  number: number;
  title: string;
  summary: string;
  status: 'ready' | 'upcoming';
  sections: StudySection[];
  memory?: string;
};

const weekOneSections: StudySection[] = [
  {
    id: 'overview',
    title: '이산구조가 필요한 이유',
    eyebrow: '과목 지도',
    summary: '컴퓨터가 다루는 비트와 유한한 구조에서 이산수학의 출발점을 찾는다.',
    searchText: '이산구조 이산수학 이산 discrete 연속 continuous 셀 수 있는 사람 수 3.7 비트 디지털 정보 집합 알고리즘 그래프 최단경로 암호화 비밀번호',
    source: '1주차 과목 개요 슬라이드 2-4, 7',
  },
  {
    id: 'proposition',
    title: '명제와 진릿값',
    eyebrow: '1.1 Propositional Logic',
    summary: '참 또는 거짓으로 확정되는 선언문만 명제가 된다.',
    searchText: '명제 proposition 선언문 참 거짓 진릿값 질문 명령 변수 주관적 영화',
    source: '1주차 강의자료 슬라이드 4-5',
  },
  {
    id: 'operators',
    title: '여섯 논리 연산자',
    eyebrow: '논리의 문법',
    summary: '부정, AND, OR, XOR, 함축, 상호조건의 참 조건을 비교한다.',
    searchText: '부정 not 논리곱 and 논리합 or xor 배타적 함축 implication 상호조건 iff 학생증 비밀번호 적어도 하나 정확히 하나',
    source: '1주차 강의자료 슬라이드 6-10, 15',
  },
  {
    id: 'implication',
    title: '함축과 역·이·대우',
    eyebrow: '조건문의 핵심',
    summary: 'p → q를 약속으로 이해하고 필요·충분조건과 대우의 동치를 연결한다.',
    searchText: '함축 조건문 약속 공허한 참 공허하게 참 인과 충분조건 sufficient 필요조건 necessary only if converse inverse contrapositive 역 이 대우 동치 상호조건문 biconditional',
    source: '1주차 강의자료 슬라이드 11-15',
  },
  {
    id: 'truth-table',
    title: '진리표 작성과 실습',
    eyebrow: '직접 계산하기',
    summary: '2ⁿ개의 조합을 만들고 연산 우선순위에 따라 복합명제를 계산한다.',
    searchText: '진리표 truth table 복합명제 3변수 8행 Harry 쇼핑 연산 우선순위 괄호 2의 n승',
    source: '1주차 강의자료 슬라이드 16-17, 25-26',
  },
  {
    id: 'applications',
    title: '자연어와 시스템 명세',
    eyebrow: '1.2 Applications',
    summary: '모호한 문장을 논리식으로 바꾸고 여러 요구사항의 일관성을 검사한다.',
    searchText: '자연어 번역 사실 분리 변수 지정 접속어 괄호 롤러코스터 시스템 명세 일관성 consistent 버퍼 저장 재전송',
    source: '1주차 강의자료 슬라이드 20-22',
  },
  {
    id: 'bits-circuits',
    title: '비트 연산과 논리회로',
    eyebrow: '컴퓨터공학 연결',
    summary: '참·거짓을 1·0에 대응시켜 비트 연산과 논리 게이트를 해석한다.',
    searchText: '비트 bit boolean c java not and or xor 논리회로 게이트 조합회로 신호 흐름 중간 결과 출력',
    source: '1주차 강의자료 슬라이드 18, 23-24',
  },
  {
    id: 'review',
    title: '시험 직전 점검',
    eyebrow: '회상과 퀴즈',
    summary: '헷갈리는 지점을 다시 떠올리고 세 문제로 이해도를 확인한다.',
    searchText: '시험 포인트 퀴즈 복습 오답 함정 기억카드 only if 우선순위 행 수 번역 명세 회로',
    source: '1주차 강의자료 전체 종합',
  },
];

export const weeks: StudyWeek[] = [
  {
    number: 1,
    title: '명제논리와 논리적 추론',
    summary: '명제, 논리 연산자, 조건문과 복합 진리표',
    status: 'ready',
    sections: weekOneSections,
    memory: '조건문은 p가 참이고 q가 거짓일 때만 거짓이다.',
  },
  { number: 2, title: '증명 방법과 전략', summary: '강의자료 준비 중', status: 'upcoming', sections: [] },
  { number: 3, title: '집합과 함수', summary: '강의자료 준비 중', status: 'upcoming', sections: [] },
  { number: 4, title: '알고리즘과 복잡도', summary: '강의자료 준비 중', status: 'upcoming', sections: [] },
  { number: 5, title: '귀납법과 재귀', summary: '강의자료 준비 중', status: 'upcoming', sections: [] },
  { number: 6, title: '조합론과 점화식', summary: '강의자료 준비 중', status: 'upcoming', sections: [] },
  { number: 7, title: '관계와 그래프 이론', summary: '강의자료 준비 중', status: 'upcoming', sections: [] },
];

// 기존 콘텐츠 컴포넌트와 외부 소비자가 1주차 섹션을 계속 참조할 수 있게 한다.
export const sections = weeks[0].sections;

export const operators = [
  { name: '부정', symbol: '¬p', read: 'p가 아니다', truth: 'p가 거짓' },
  { name: '논리곱', symbol: 'p ∧ q', read: 'p이고 q이다', truth: '둘 다 참' },
  { name: '논리합', symbol: 'p ∨ q', read: 'p이거나 q이다', truth: '하나 이상 참' },
  { name: '배타적 OR', symbol: 'p ⊕ q', read: 'p 또는 q, 둘 다는 아님', truth: '정확히 하나만 참' },
  { name: '함축', symbol: 'p → q', read: 'p이면 q이다', truth: 'T → F만 거짓' },
  { name: '상호조건', symbol: 'p ↔ q', read: 'p일 필요충분조건은 q', truth: '두 값이 같음' },
];

export const quizzes = [
  {
    id: 'q1',
    prompt: '다음 중 명제가 아닌 것은?',
    choices: ['2 + 2 = 3', '서울은 한국의 수도이다', '지금 몇 시인가?', '2,411,513은 소수이다'],
    answer: 2,
    explanation: '질문은 참·거짓을 갖는 선언문이 아니므로 명제가 아니다.',
  },
  {
    id: 'q2',
    prompt: 'p → q와 항상 동치인 것은?',
    choices: ['q → p', '¬p → ¬q', '¬q → ¬p', 'p ∧ q'],
    answer: 2,
    explanation: '원래 조건문과 대우는 항상 같은 진릿값을 가진다.',
  },
  {
    id: 'q3',
    prompt: 'p=T, q=F일 때 p ⊕ q의 값은?',
    choices: ['T', 'F'],
    answer: 0,
    explanation: 'XOR은 두 값 중 정확히 하나만 참일 때 참이다.',
  },
];
