import Link from 'next/link';
import { notFound } from 'next/navigation';
import styles from './semester.module.css';

export async function generateStaticParams() {
  return [];
}

const semestersData = {
  licence: {
    '1': [
      { id: 's1', title: 'Semester 1', badge: 'S1', desc: 'Fall semester. Core concepts and introductory modules.' },
      { id: 's2', title: 'Semester 2', badge: 'S2', desc: 'Spring semester. Continuation of core topics and first electives.' }
    ],
    '2': [
      { id: 's3', title: 'Semester 3', badge: 'S3', desc: 'Fall semester. Intermediate modules and specialized theory.' },
      { id: 's4', title: 'Semester 4', badge: 'S4', desc: 'Spring semester. Advanced intermediate topics and projects.' }
    ],
    '3': [
      { id: 's5', title: 'Semester 5', badge: 'S5', desc: 'Fall semester. Advanced specialization and pre-graduation topics.' },
      { id: 's6', title: 'Semester 6', badge: 'S6', desc: 'Spring semester. Final project, internship, and graduation preparation.' }
    ]
  },
  master: {
    '1': [
      { id: 's1', title: 'Semester 1', badge: 'S1', desc: 'Fall semester. Advanced core subjects and research methodologies.' },
      { id: 's2', title: 'Semester 2', badge: 'S2', desc: 'Spring semester. Deep specialization and minor research projects.' }
    ],
    '2': [
      { id: 's3', title: 'Semester 3', badge: 'S3', desc: 'Fall semester. Final academic modules and thesis preparation.' },
      { id: 's4', title: 'Semester 4', badge: 'S4', desc: 'Spring semester. Full-time internship and master thesis defense.' }
    ]
  },
  phd: {
    '1': [
      { id: 'h1', title: 'Half-Year 1', badge: 'H1', desc: 'First half. Research proposal and literature review.' },
      { id: 'h2', title: 'Half-Year 2', badge: 'H2', desc: 'Second half. Initial experimentation and seminars.' }
    ],
    '2': [
      { id: 'h3', title: 'Half-Year 3', badge: 'H3', desc: 'First half. Core research and data collection.' },
      { id: 'h4', title: 'Half-Year 4', badge: 'H4', desc: 'Second half. Data analysis and publication drafting.' }
    ],
    '3': [
      { id: 'h5', title: 'Half-Year 5', badge: 'H5', desc: 'First half. Finalizing research and thesis structuring.' },
      { id: 'h6', title: 'Half-Year 6', badge: 'H6', desc: 'Second half. Thesis writing and final defense.' }
    ]
  }
};



export default async function YearLevelPage({ params }) {
  const { facultyId, degreeId, yearId } = await params;
  const normalizedDegreeId = degreeId.toLowerCase();
  
  const degreeLevels = semestersData[normalizedDegreeId];
  if (!degreeLevels) {
    notFound();
  }

  const semesters = degreeLevels[yearId];
  if (!semesters) {
    notFound();
  }

  const facultyName = facultyId.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
  const degreeName = degreeId.charAt(0).toUpperCase() + degreeId.slice(1);

  return (
    <div className={styles.container}>
      <div className={styles.breadcrumb}>
        <Link href={`/courses/${facultyId}/${normalizedDegreeId}`}>← Back to {degreeName} Years</Link>
      </div>
      
      <div className={styles.headerArea}>
        <h1 className={styles.pageTitle}>Year {yearId} Semesters</h1>
        <p className={styles.pageSubtitle}>Select your current semester in {degreeName} {yearId} ({facultyName}).</p>
      </div>

      <div className={styles.semesterGrid}>
        {semesters.map(semester => (
          <Link href={`/courses/${facultyId}/${normalizedDegreeId}/${yearId}/${semester.id}`} key={semester.id} className={styles.semesterCard}>
             <div className={styles.semesterBadge}>{semester.badge}</div>
             <div className={styles.semesterContent}>
               <h2>{semester.title}</h2>
               <p>{semester.desc}</p>
             </div>
             <div className={styles.arrow}>→</div>
          </Link>
        ))}
      </div>
    </div>
  );
}
