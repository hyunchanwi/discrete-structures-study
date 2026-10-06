'use client';

import { ClaudeStudyNotes } from './claude-study-notes';
import { weeklyCatalog } from '../src/weekly-catalog';

export function WeeklyStudy({ week }: { week: number }) {
  const entry = weeklyCatalog.find((item) => item.number === week);
  if (!entry) return null;
  return <div id={`week${week}-overview`} tabIndex={-1}>
    <section className="claude-notes-inline" aria-label={`${week}주차 자료와 진도`}>
      <header className="claude-notes-header"><p className="claude-notes-label">WEEK {String(week).padStart(2, '0')}</p><h2>{week}주차 · {entry.title}</h2></header>
      <div className="claude-notes-body"><p>{entry.summary}</p><p>{entry.evidence}</p><h3>연결한 자료</h3><ul>{entry.materials.map((material) => <li key={material}>{material}</li>)}</ul><p>원본·전사본은 비공개 저장소에 유지하고 이 사이트에는 재구성한 학습 설명만 공개합니다.</p></div>
    </section>
    <ClaudeStudyNotes key={week} locked lectureIds={entry.lectureIds} noteScopes={entry.noteScopes} scopeTitle={`${week}주차 · ${entry.title}`} />
  </div>;
}
