import Link from 'next/link';
import styles from './degree.module.css';

export async function generateStaticParams() {
  return [];
}

const degreeLevels = [
  {
    id: 'licence',
    title: 'Licence (Bachelor)',
    duration: '3 Years',
    description: 'Build a strong foundation in your chosen field. Ideal for undergraduate students embarking on their academic journey.',
    icon: '🎓',
    color: '#3b82f6',
    bg: '#eff6ff'
  },
  {
    id: 'master',
    title: 'Master',
    duration: '2 Years',
    description: 'Deepen your expertise and specialize in advanced topics to accelerate your professional career.',
    icon: '🚀',
    color: '#8b5cf6',
    bg: '#f5f3ff'
  },
  {
    id: 'phd',
    title: 'PhD (Doctorat)',
    duration: '3-5 Years',
    description: 'Contribute to groundbreaking research and become a leading expert in your academic discipline.',
    icon: '🔬',
    color: '#f59e0b',
    bg: '#fffbeb'
  }
];



export default async function FacultyDegreesPage({ params }) {
  const { facultyId } = await params;
  
  // Format the faculty ID to a nice readable string
  const facultyName = facultyId
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
    
  return (
    <div style={{ padding: 'var(--space-md)' }}>
      <div className={styles.breadcrumb}>
        <Link href="/courses">← Back to Faculties</Link>
      </div>
      
      <div className={styles.headerArea}>
        <h1 className={styles.pageTitle}>Faculty of {facultyName}</h1>
        <p className={styles.pageSubtitle}>
          Choose your degree level to see available programs and courses.
        </p>
      </div>

      <div className={styles.degreeGrid}>
        {degreeLevels.map((degree) => (
          <Link 
            href={`/courses/${facultyId}/${degree.id}`} 
            key={degree.id} 
            className={styles.degreeCard}
          >
            <div 
              className={styles.iconCircle}
              style={{ backgroundColor: degree.bg, color: degree.color }}
            >
              {degree.icon}
            </div>
            <div className={styles.cardContent}>
              <div className={styles.titleRow}>
                <h2 className={styles.degreeTitle}>{degree.title}</h2>
                <span className={styles.durationBadge} style={{ color: degree.color, backgroundColor: degree.bg }}>
                  {degree.duration}
                </span>
              </div>
              <p className={styles.degreeDescription}>{degree.description}</p>
            </div>
            <div className={styles.arrow} style={{ color: degree.color }}>
              →
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
