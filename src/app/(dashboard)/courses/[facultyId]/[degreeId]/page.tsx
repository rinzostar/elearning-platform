import Link from 'next/link';
import { notFound } from 'next/navigation';
import styles from './year.module.css';

const yearsData = {
  licence: [
    { id: '1', title: 'Licence 1', badge: 'L1', desc: 'First year foundational courses and core methodologies.' },
    { id: '2', title: 'Licence 2', badge: 'L2', desc: 'Second year intermediate courses with early specialization options.' },
    { id: '3', title: 'Licence 3', badge: 'L3', desc: 'Third year specialization courses leading to the final degree.' }
  ],
  master: [
    { id: '1', title: 'Master 1', badge: 'M1', desc: 'First year of advanced studies and research seminars.' },
    { id: '2', title: 'Master 2', badge: 'M2', desc: 'Second year focusing on thesis writing, internships, and final specialization.' }
  ],
  phd: [
    { id: '1', title: 'PhD Year 1', badge: 'D1', desc: 'Research proposal, methodology, and extensive literature review.' },
    { id: '2', title: 'PhD Year 2', badge: 'D2', desc: 'Active research, experiments, and data collection.' },
    { id: '3', title: 'PhD Year 3+', badge: 'D3', desc: 'Finalizing research, thesis writing, and preparation for defense.' }
  ]
};

export const dynamic = 'force-dynamic';

export default async function DegreeLevelPage({ params }) {
  const { facultyId, degreeId } = await params;
  const normalizedDegreeId = degreeId.toLowerCase();
  
  const years = yearsData[normalizedDegreeId];
  if (!years) {
    notFound();
  }

  const facultyName = facultyId.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
  const degreeName = degreeId.charAt(0).toUpperCase() + degreeId.slice(1);

  return (
    <div className={styles.container}>
      <div className={styles.breadcrumb}>
        <Link href={`/courses/${facultyId}`}>← Back to {facultyName} Degrees</Link>
      </div>
      
      <div className={styles.headerArea}>
        <h1 className={styles.pageTitle}>{degreeName} in {facultyName}</h1>
        <p className={styles.pageSubtitle}>Select your academic year to view specific modules and courses.</p>
      </div>

      <div className={styles.yearGrid}>
        {years.map(year => (
          <Link href={`/courses/${facultyId}/${normalizedDegreeId}/${year.id}`} key={year.id} className={styles.yearCard}>
             <div className={styles.yearBadge}>{year.badge}</div>
             <div className={styles.yearContent}>
               <h2>{year.title}</h2>
               <p>{year.desc}</p>
             </div>
             <div className={styles.arrow}>→</div>
          </Link>
        ))}
      </div>
    </div>
  );
}
