import Link from 'next/link';
import styles from './courses.module.css';
import { createClient } from '@/lib/supabase/server';
import ManageFacultiesBtn from '@/components/ui/ManageFacultiesBtn';

// Fallback faculties in case the database table is empty or not created yet
const fallbackFaculties = [
  {
    id: 'science',
    title: 'Faculty of Science',
    description: 'Explore the natural world from the microscopic to the cosmic scale through physics, chemistry, biology, and environmental sciences.',
    icon: '🔬',
    bg: 'var(--color-accent-green)',
    gradient: 'linear-gradient(90deg, #10b981 0%, #34d399 100%)'
  },
  {
    id: 'computer-science',
    title: 'Faculty of Computer Science',
    description: 'Advance the digital frontier through software engineering, artificial intelligence, cybersecurity, and data analytics.',
    icon: '💻',
    bg: 'var(--color-accent-blue)',
    gradient: 'linear-gradient(90deg, #3b82f6 0%, #60a5fa 100%)'
  },
  {
    id: 'mathematics',
    title: 'Faculty of Mathematics',
    description: 'Unlock the power of numbers, logic, and analytical thinking to solve complex, real-world problems.',
    icon: '➗',
    bg: 'var(--color-accent-purple)',
    gradient: 'linear-gradient(90deg, #8b5cf6 0%, #a78bfa 100%)'
  },
  {
    id: 'engineering',
    title: 'Faculty of Engineering',
    description: 'Build the modern world with innovative solutions in civil, mechanical, electrical, and aerospace engineering.',
    icon: '⚙️',
    bg: 'var(--color-accent-orange)',
    gradient: 'linear-gradient(90deg, #f97316 0%, #fb923c 100%)'
  },
  {
    id: 'business',
    title: 'Faculty of Business',
    description: "Foster tomorrow's leaders with cutting-edge insights into global markets, finance, and organizational success.",
    icon: '📈',
    bg: 'var(--color-accent-yellow)',
    gradient: 'linear-gradient(90deg, #eab308 0%, #facc15 100%)'
  },
  {
    id: 'arts',
    title: 'Faculty of Arts & Humanities',
    description: 'Understand the human experience through literature, philosophy, history, languages, and the creative arts.',
    icon: '🎨',
    bg: 'var(--color-accent-pink)',
    gradient: 'linear-gradient(90deg, #ec4899 0%, #f472b6 100%)'
  }
];

export default async function CoursesPage() {
  const supabase = await createClient();
  
  // Attempt to fetch dynamic faculties from Supabase
  const { data: dbFaculties, error } = await supabase.from('faculties').select('*').order('created_at', { ascending: true });
  
  // Use DB data if exists and no error, else fallback to hardcoded list temporarily
  // This allows the page to keep working while the user sets up the DB table
  const activeFaculties = (dbFaculties && dbFaculties.length > 0) ? dbFaculties : fallbackFaculties;

  return (
    <div style={{ padding: 'var(--space-md)' }}>
      <div className={styles.headerArea}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h1 className={styles.pageTitle}>University Faculties</h1>
            <p className={styles.pageSubtitle}>
              Browse our extensive academic departments and find the perfect program to accelerate your future career.
            </p>
          </div>
          <ManageFacultiesBtn />
        </div>
      </div>

      <div className={styles.coursesGrid}>
        {activeFaculties.map((faculty) => (
          <Link 
            href={`/courses/${faculty.id}`}
            key={faculty.id} 
            className={styles.facultyCard}
            style={{
              '--card-bg': faculty.bg || faculty.bg_color,
              '--card-gradient': faculty.gradient
            } as React.CSSProperties}
          >
            <div className={styles.iconWrapper}>
              {faculty.icon}
            </div>
            <h2 className={styles.facultyTitle}>{faculty.title}</h2>
            <p className={styles.facultyDescription}>{faculty.description}</p>
            <div className={styles.exploreButton}>
              Explore Degrees <span>→</span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
