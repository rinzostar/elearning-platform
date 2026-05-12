'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import styles from './view-module.module.css';
import { FiPlayCircle, FiFileText, FiBookOpen, FiDownload } from 'react-icons/fi';
import LiveRoom from '@/components/live/LiveRoom';

export default function CourseClient({ params }: { params: any }) {
  const { facultyId, degreeId, yearId, semesterId, subjectId, courseId } = params;
  const normalizedDegreeId = (degreeId || '').toLowerCase();
  
  const [course, setCourse] = useState<any>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const supabase = createClient();

  useEffect(() => {
    const userStr = localStorage.getItem('lumina_current_user');
    if (userStr) {
      setCurrentUser(JSON.parse(userStr));
    }
  }, []);

  useEffect(() => {
    const fetchCourse = async () => {
      // 1. Try Supabase
      const { data, error } = await supabase.from('courses').select('*').eq('id', courseId).single();
      if (!error && data) {
        setCourse(data);
      } else {
        // 2. Try Local Storage fallback
        const savedLocal = localStorage.getItem('lumina_local_courses');
        if (savedLocal) {
          const localList = JSON.parse(savedLocal);
          const found = localList.find((c: any) => c.id === courseId);
          if (found) setCourse(found);
        }
      }
      setIsLoaded(true);
    };
    fetchCourse();
  }, [courseId]);

  if (!isLoaded) return <div style={{ padding: '20px' }}>Loading module...</div>;

  if (!course) {
    return (
      <div className={styles.container} style={{ textAlign: 'center', paddingTop: '100px' }}>
        <h2>Module not found.</h2>
        <Link href={`/courses/${facultyId}/${normalizedDegreeId}/${yearId}/${semesterId}/${subjectId}`}>
          Go back to subject
        </Link>
      </div>
    );
  }

  const getEmbedUrl = (url: string) => {
    if (!url) return '';
    const ytMatch = url.match(/(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/watch\?v=|youtu\.be\/)([\w-]+)/);
    if (ytMatch) return `https://www.youtube.com/embed/${ytMatch[1]}`;
    const vimeoMatch = url.match(/(?:https?:\/\/)?(?:www\.)?vimeo\.com\/(\d+)/);
    if (vimeoMatch) return `https://player.vimeo.com/video/${vimeoMatch[1]}`;
    return url;
  };

  return (
    <div className={styles.container}>
      <div className={styles.breadcrumb}>
        <Link href={`/courses/${facultyId}/${normalizedDegreeId}/${yearId}/${semesterId}/${subjectId}`}>← Back to Modules</Link>
      </div>

      <div className={styles.headerArea}>
        <h1 className={styles.pageTitle}>
          {course.type === 'video' && <FiPlayCircle color="var(--color-primary)" />}
          {course.type === 'reading' && <FiBookOpen color="var(--color-accent-orange)" />}
          {course.type === 'document' && <FiFileText color="var(--color-accent-blue)" />}
          {course.type === 'live' && <div style={{ display: 'inline-block', width: '12px', height: '12px', borderRadius: '50%', backgroundColor: 'var(--color-danger)', marginRight: '12px' }} />}
          {course.title}
        </h1>
        {course.description && <p className={styles.pageSubtitle}>{course.description}</p>}
      </div>

      <div className={styles.contentWrapper}>
        {course.type === 'video' && course.videoSourceType === 'link' && course.videoLink && (
          <div className={styles.videoContainer}>
            <iframe className={styles.videoIframe} src={getEmbedUrl(course.videoLink)} allowFullScreen />
          </div>
        )}

        {course.type === 'video' && course.videoSourceType === 'upload' && course.attachmentUrl && (
          <video src={course.attachmentUrl} controls className={styles.videoElement} />
        )}

        {course.readingContent && (
          <div className={styles.readingContent}>
            {course.readingContent}
          </div>
        )}

        {course.type === 'document' && course.attachmentUrl && (
          <div className={styles.documentDownload}>
            <FiFileText size={48} color="var(--color-accent-blue)" />
            <div>
              <h3>{course.attachmentName || 'Document File'}</h3>
              <a href={course.attachmentUrl} download={course.attachmentName || 'document'} className={styles.downloadBtn}>
                <FiDownload size={18} /> Download File
              </a>
            </div>
          </div>
        )}
        
        {course.type === 'live' && (
          <div style={{ marginTop: 'var(--space-md)', height: '70vh', borderRadius: 'var(--radius-lg)', overflow: 'hidden', boxShadow: 'var(--shadow-lg)' }}>
            <LiveRoom 
              roomId={courseId} 
              username={currentUser?.name || 'Guest Student'} 
            />
          </div>
        )}
      </div>
    </div>
  );
}
