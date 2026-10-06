import type { LectureSummary } from './lecture-summaries';

export const weeklyCatalog = [
  {
    "number": 1,
    "title": "명제논리와 응용",
    "summary": "Lecture 1 · 연산자·함축·진리표",
    "lectureIds": [
      "discrete-propositions"
    ],
    "noteScopes": [
      "lec1"
    ],
    "materials": [
      "1주차/class_overview.pdf",
      "1주차/DM_lec_1.pdf"
    ],
    "evidence": "기존 1주차 실습과 Claude 명제논리 학습 정리를 유지합니다."
  },
  {
    "number": 2,
    "title": "논리적 동치·술어·한정기호",
    "summary": "Lecture 2 · 동치와 논의영역",
    "lectureIds": [
      "discrete-equivalence"
    ],
    "noteScopes": [
      "lec2"
    ],
    "materials": [
      "2주차/DM_lec_2.pdf"
    ],
    "evidence": "2주차 폴더 및 2-1·2-2 전사본에 연결합니다."
  },
  {
    "number": 3,
    "title": "중첩 한정기호·추론규칙",
    "summary": "Lecture 3~4 · 논증의 타당성",
    "lectureIds": [
      "discrete-nested",
      "discrete-inference"
    ],
    "noteScopes": [
      "lec3",
      "lec4"
    ],
    "materials": [
      "3주차/DM_lec_3.pdf",
      "3주차/DM_lec_4.pdf"
    ],
    "evidence": "Lecture 번호를 주차로 치환하지 않습니다. 실제 3주차 폴더에는 Lecture3과 Lecture4 두 자료가 함께 있습니다."
  },
  {
    "number": 4,
    "title": "증명 방법과 전략",
    "summary": "Lecture 5 · 직접·대우·모순·경우",
    "lectureIds": [
      "discrete-proof"
    ],
    "noteScopes": [
      "lec5"
    ],
    "materials": [
      "4주차/DM_lec_5.pdf"
    ],
    "evidence": "4주차 폴더의 Lecture5와 해당 학습 대화를 연결합니다. 이 폴더에는 전사본이 없어 녹음 대조 완료로 표시하지 않습니다."
  },
  {
    "number": 5,
    "title": "집합과 함수 · 증명 복습",
    "summary": "Lecture 5~7 · 집합 연산·단사·전사·합성",
    "lectureIds": [
      "discrete-proof",
      "discrete-sets",
      "discrete-functions"
    ],
    "noteScopes": [
      "lec5",
      "lec6",
      "lec7"
    ],
    "materials": [
      "5주차/DM_lec_5.pdf",
      "5주차/DM_lec_6.pdf",
      "5주차/DM_lec_7.pdf"
    ],
    "evidence": "5주차 폴더에 세 자료가 있고 5-1은 집합, 5-2는 집합 연산·함수 흐름입니다. 업로드된 장 전체의 복습 정리와 실제 녹음 진도를 구분합니다."
  }
];

export const weeklyLectureSummaries: LectureSummary[] = [];

