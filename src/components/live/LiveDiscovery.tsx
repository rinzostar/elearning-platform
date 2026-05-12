'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { FiPlayCircle } from 'react-icons/fi';

export default function LiveDiscovery() {
  const [liveCourses, setLiveCourses] = useState<any[]>([]);
  const supabase = createClient();

  useEffect(() => {
    const fetchLive = async () => {
      // For now, we query courses with type 'live'
      // Ideally we check an 'is_live' boolean column
      const { data, error } = await supabase
        .from('courses')
        .select('*')
        .eq('type', 'live');
      
      if (!error && data) {
        setLiveCourses(data);
      }
    };

    fetchLive();
  }, []);

  if (liveCourses.length === 0) return null;

  return (
    <div style={{ marginBottom: 'var(--space-2xl)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: 'var(--space-md)' }}>
        <div style={{ width: '12px', height: '12px', borderRadius: '50%', backgroundColor: 'var(--color-danger)', animation: 'pulse 1.5s infinite' }} />
        <h2 style={{ fontSize: 'var(--font-size-xl)', fontWeight: 600 }}>Live Now</h2>
      </div>

      <style jsx>{`
        @keyframes pulse {
          0% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(239, 68, 68, 0.7); }
          70% { transform: scale(1); box-shadow: 0 0 0 10px rgba(239, 68, 68, 0); }
          100% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(239, 68, 68, 0); }
        }
      `}</style>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 'var(--space-md)' }}>
        {liveCourses.map((course) => (
          <Link 
            key={course.id}
            href={`/courses/${course.facultyId}/${course.degreeId}/${course.yearId}/${course.semesterId}/${course.subjectId}/${course.id}`}
            style={{ 
              textDecoration: 'none', color: 'inherit', backgroundColor: 'var(--color-surface)', 
              borderRadius: 'var(--radius-lg)', padding: 'var(--space-lg)',
              border: '2px solid var(--color-danger)',
              boxShadow: 'var(--shadow-md)', transition: 'transform 0.2s'
            }}
            onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.02)'}
            onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
              <span style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--color-danger)', textTransform: 'uppercase', letterSpacing: '1px' }}>
                LIVE STREAMING
              </span>
              <FiPlayCircle color="var(--color-danger)" size={20} />
            </div>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '8px' }}>{course.title}</h3>
            <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.9rem' }}>Join the professor for a live session.</p>
            <div style={{ marginTop: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
               <div style={{ width: '32px', height: '32px', borderRadius: '50%', backgroundColor: 'var(--color-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: '0.8rem' }}>
                  PR
               </div>
               <span style={{ fontSize: '0.9rem', fontWeight: 500 }}>Professor's Room</span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
