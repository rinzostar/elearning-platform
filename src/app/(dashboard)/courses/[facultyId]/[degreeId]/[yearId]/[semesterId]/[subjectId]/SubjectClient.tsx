'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import styles from './subject.module.css';
import { FiX, FiTrash2, FiPlayCircle, FiFileText, FiBookOpen, FiEdit2, FiHeart } from 'react-icons/fi';

export default function SubjectClient({ params }: { params: any }) {
  const { facultyId, degreeId, yearId, semesterId, subjectId } = params;
  const normalizedDegreeId = (degreeId || '').toLowerCase();
  
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [subjectDetails, setSubjectDetails] = useState<any>(null);
  const [courses, setCourses] = useState<any[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);
  const supabase = createClient();
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editCourseId, setEditCourseId] = useState<string | null>(null);
  const [newTitle, setNewTitle] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [courseType, setCourseType] = useState('video');
  const [videoSourceType, setVideoSourceType] = useState('link');
  const [videoLink, setVideoLink] = useState('');
  const [readingContent, setReadingContent] = useState('');
  const [attachment, setAttachment] = useState<File | null>(null);
  const [existingAttachmentName, setExistingAttachmentName] = useState<string | null>(null);
  const [existingAttachmentUrl, setExistingAttachmentUrl] = useState<string | null>(null);
  const [favorites, setFavorites] = useState<any[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const subjectsStorageKey = `lumina_subjects_${facultyId}_${normalizedDegreeId}_${yearId}_${semesterId}`;

  const fetchFavorites = async () => {
    if (!currentUser?.email) return;
    const { data, error } = await supabase.from('favorites').select('*').eq('userEmail', currentUser.email);
    if (!error && data) setFavorites(data);
  };

  const fetchCourses = async () => {
    // 1. Fetch from Supabase
    const { data, error } = await supabase.from('courses').select('*').eq('subjectId', subjectId).order('created_at', { ascending: true });
    let combinedCourses = data || [];

    // 2. Fetch from Local Storage
    const savedLocal = localStorage.getItem('lumina_local_courses');
    if (savedLocal) {
      const localList = JSON.parse(savedLocal);
      const relevantLocal = localList.filter((c: any) => c.subjectId === subjectId);
      
      const supabaseIds = new Set(combinedCourses.map(c => c.id));
      const uniqueLocal = relevantLocal.filter((c: any) => !supabaseIds.has(c.id));
      combinedCourses = [...combinedCourses, ...uniqueLocal];
    }

    setCourses(combinedCourses);
  };

  const fetchSubjectDetails = async () => {
    const { data, error } = await supabase.from('subjects').select('*').eq('id', subjectId).single();
    if (!error && data) {
      setSubjectDetails(data);
    } else {
      // Fallback to local storage if supabase fails
      const savedSubjects = localStorage.getItem('lumina_local_subjects');
      if (savedSubjects) {
        const subj = JSON.parse(savedSubjects).find((s: any) => s.id === subjectId);
        if (subj) setSubjectDetails(subj);
      }
    }
  };

  useEffect(() => {
    const user = localStorage.getItem('lumina_current_user');
    if (user) setCurrentUser(JSON.parse(user));

    fetchSubjectDetails();
    fetchCourses();
    setIsLoaded(true);
  }, [subjectId]);

  useEffect(() => {
    if (currentUser?.email) fetchFavorites();
  }, [currentUser]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) setAttachment(e.target.files[0]);
  };

  const openAddModal = () => {
    setEditCourseId(null);
    setNewTitle('');
    setNewDesc('');
    setCourseType('video');
    setVideoSourceType('link');
    setVideoLink('');
    setReadingContent('');
    setAttachment(null);
    setExistingAttachmentName(null);
    setExistingAttachmentUrl(null);
    setIsModalOpen(true);
  };

  const openEditModal = (course: any) => {
    setEditCourseId(course.id);
    setNewTitle(course.title || '');
    setNewDesc(course.description || '');
    setCourseType(course.type || 'video');
    setVideoSourceType(course.videoSourceType || 'link');
    setVideoLink(course.videoLink || '');
    setReadingContent(course.readingContent || '');
    setAttachment(null);
    setExistingAttachmentName(course.attachmentName || null);
    setExistingAttachmentUrl(course.attachmentUrl || null);
    setIsModalOpen(true);
  };

  const handleAddCourse = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log('--- Starting Module Save ---');
    if (!newTitle) {
      console.warn('Save aborted: Title is empty');
      return;
    }

    try {
      let finalAttachmentUrl = existingAttachmentUrl;
      let finalFileName = existingAttachmentName;

      if (attachment) {
        console.log('Handling file attachment...');
        finalFileName = attachment.name;
        finalAttachmentUrl = await new Promise<string>((resolve) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result as string);
          reader.readAsDataURL(attachment);
        });
      }

      const courseData: any = {
        title: newTitle,
        description: newDesc,
        type: courseType,
        videoSourceType: courseType === 'video' ? videoSourceType : null,
        videoLink: courseType === 'video' && videoSourceType === 'link' ? videoLink : null,
        readingContent: readingContent,
        attachmentUrl: (courseType === 'video' && videoSourceType === 'upload') || courseType === 'document' ? finalAttachmentUrl : null,
        attachmentName: (courseType === 'video' && videoSourceType === 'upload') || courseType === 'document' ? finalFileName : null,
        subjectId
      };
      console.log('Data prepared:', courseData);

      const isLocalSubject = typeof subjectId === 'string' && subjectId.startsWith('local-');

      if (isLocalSubject) {
        console.log('Parent subject is local. Saving module to local storage...');
        const localId = 'course-local-' + Date.now();
        const courseWithId = { ...courseData, id: localId, created_at: new Date().toISOString() };
        
        const savedCourses = localStorage.getItem('lumina_local_courses') || '[]';
        const coursesList = JSON.parse(savedCourses);
        coursesList.push(courseWithId);
        localStorage.setItem('lumina_local_courses', JSON.stringify(coursesList));
        
        setCourses(prev => [...prev, courseWithId]);
        setIsModalOpen(false);
        return;
      }

      if (editCourseId) {
        console.log('Updating existing module:', editCourseId);
        const { data, error } = await supabase.from('courses').update(courseData).eq('id', editCourseId).select();
        if (!error && data) {
          console.log('Supabase Update Success');
          setCourses(prev => prev.map(c => c.id === editCourseId ? data[0] : c));
          setIsModalOpen(false);
        } else if (error) {
          console.error('Supabase Update Error:', error);
          alert('Failed to update: ' + error.message);
        }
      } else {
        console.log('Inserting new module into Supabase...');
        const { data, error } = await supabase.from('courses').insert([courseData]).select();
        if (!error && data) {
          console.log('Supabase Insert Success');
          setCourses(prev => [...prev, data[0]]);
          setIsModalOpen(false);
        } else if (error) {
          console.error('Supabase Insert Error, falling back to local...');
          const localId = 'course-local-' + Date.now();
          const courseWithId = { ...courseData, id: localId, created_at: new Date().toISOString() };
          const savedCourses = localStorage.getItem('lumina_local_courses') || '[]';
          const coursesList = JSON.parse(savedCourses);
          coursesList.push(courseWithId);
          localStorage.setItem('lumina_local_courses', JSON.stringify(coursesList));
          setCourses(prev => [...prev, courseWithId]);
          setIsModalOpen(false);
        }
      }
    } catch (err) {
      console.error('CRITICAL MODULE SAVE ERROR:', err);
      alert('A critical error occurred while saving the module. Check console.');
    }
  };

  const handleRemoveCourse = async (e: React.MouseEvent, id: string) => {
    e.preventDefault(); 
    if (confirm('Are you sure you want to remove this course/module?')) {
      const { error } = await supabase.from('courses').delete().eq('id', id);
      if (!error) setCourses(prev => prev.filter(c => c.id !== id));
    }
  };

  const toggleFavorite = async (course: any) => {
    if (!currentUser?.email) return;
    const isFav = favorites.some(f => f.courseId === course.id);
    if (isFav) {
      const { error } = await supabase.from('favorites').delete().eq('userEmail', currentUser.email).eq('courseId', course.id);
      if (!error) setFavorites(prev => prev.filter(f => f.courseId !== course.id));
    } else {
      const newFav = {
        userEmail: currentUser.email,
        courseId: course.id,
        title: course.title,
        subjectTitle: subjectDetails?.title || 'Unknown Subject',
        type: course.type,
        url: `/courses/${facultyId}/${normalizedDegreeId}/${yearId}/${semesterId}/${subjectId}/${course.id}`
      };
      const { data, error } = await supabase.from('favorites').insert([newFav]).select();
      if (!error && data) setFavorites(prev => [...prev, data[0]]);
    }
  };

  if (!isLoaded) return <div>Loading...</div>;

  const isAdmin = currentUser?.role === 'Admin';
  const isLeader = subjectDetails && currentUser?.email === subjectDetails.professorEmail;
  const canManage = isAdmin || isLeader;

  const getIconForType = (type: string) => {
    if (type === 'video') return <FiPlayCircle size={24} color="var(--color-primary)" />;
    if (type === 'reading') return <FiBookOpen size={24} color="var(--color-accent-orange)" />;
    if (type === 'live') return <div style={{ width: '24px', height: '24px', borderRadius: '50%', backgroundColor: 'var(--color-danger)', border: '4px solid rgba(239, 68, 68, 0.2)' }} />;
    return <FiFileText size={24} color="var(--color-accent-blue)" />;
  };

  return (
    <div className={styles.container}>
      <div className={styles.breadcrumb}>
        <Link href={`/courses/${facultyId}/${normalizedDegreeId}/${yearId}/${semesterId}`}>← Back to Subjects</Link>
      </div>

      <div className={styles.headerArea}>
        <div>
          <h1 className={styles.pageTitle}>{subjectDetails?.title || 'Subject Courses'}</h1>
          <p className={styles.pageSubtitle}>{subjectDetails?.description || 'Browse modules and materials.'}</p>
          <div style={{ marginTop: '12px', display: 'inline-block', backgroundColor: 'var(--color-bg)', padding: '4px 12px', borderRadius: '12px', fontSize: '13px', fontWeight: 600 }}>
            Subject Leader: {subjectDetails?.professorName || 'Unknown'}
          </div>
        </div>
        {canManage && <button className={styles.manageBtn} onClick={openAddModal}>⚙️ Add Course Module</button>}
      </div>

      <div className={styles.coursesList}>
        {courses.map(course => (
          <div key={course.id} className={styles.courseCard}>
            <div style={{ display: 'flex', gap: '16px' }}>
              {getIconForType(course.type)}
              <div className={styles.courseInfo}>
                <h3>{course.title}</h3>
                <p>{course.description}</p>
              </div>
            </div>
            <div className={styles.courseAction}>
              <button onClick={() => toggleFavorite(course)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
                <FiHeart size={20} fill={favorites.some(f => f.courseId === course.id) ? 'var(--color-danger)' : 'none'} color={favorites.some(f => f.courseId === course.id) ? 'var(--color-danger)' : 'var(--color-text-muted)'} />
              </button>
              {canManage && <button className={styles.dangerBtn} onClick={(e) => handleRemoveCourse(e, course.id)}><FiTrash2 size={18} /></button>}
              <Link href={`/courses/${facultyId}/${normalizedDegreeId}/${yearId}/${semesterId}/${subjectId}/${course.id}`} className={styles.enterBtn}>
                {course.type === 'live' ? 'Watch Live' : 'View Module'}
              </Link>
            </div>
          </div>
        ))}
      </div>

      {isModalOpen && (
        <div className={styles.modalOverlay} onClick={() => setIsModalOpen(false)}>
          <div className={styles.modalContent} onClick={e => e.stopPropagation()}>
             <div className={styles.modalHeader}>
               <h2 className={styles.modalTitle}>{editCourseId ? 'Edit' : 'Add'} Module</h2>
               <button className={styles.closeModalBtn} onClick={() => setIsModalOpen(false)}><FiX size={24} /></button>
             </div>
             
             <form onSubmit={handleAddCourse}>
                <div className={styles.formGroup}>
                  <label className={styles.label}>Title</label>
                  <input type="text" className={styles.input} value={newTitle} onChange={e => setNewTitle(e.target.value)} placeholder="e.g. Introduction to Calculus" required />
                </div>
                
                <div className={styles.formGroup}>
                  <label className={styles.label}>Description</label>
                  <textarea className={styles.textarea} value={newDesc} onChange={e => setNewDesc(e.target.value)} placeholder="Brief summary of this module..." rows={2} />
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.label}>Module Type</label>
                  <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
                    <button type="button" onClick={() => setCourseType('video')} style={{ flex: 1, padding: '12px', borderRadius: '8px', border: courseType === 'video' ? '2px solid var(--color-primary)' : '1px solid var(--color-surface-hover)', backgroundColor: courseType === 'video' ? 'var(--color-primary-light)' : 'var(--color-bg)', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
                      <FiPlayCircle size={20} color={courseType === 'video' ? 'var(--color-primary)' : 'var(--color-text-muted)'} />
                      <span style={{ fontSize: '12px', fontWeight: 600 }}>Video</span>
                    </button>
                    <button type="button" onClick={() => setCourseType('reading')} style={{ flex: 1, padding: '12px', borderRadius: '8px', border: courseType === 'reading' ? '2px solid var(--color-accent-orange)' : '1px solid var(--color-surface-hover)', backgroundColor: courseType === 'reading' ? 'rgba(245, 158, 11, 0.1)' : 'var(--color-bg)', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
                      <FiBookOpen size={20} color={courseType === 'reading' ? 'var(--color-accent-orange)' : 'var(--color-text-muted)'} />
                      <span style={{ fontSize: '12px', fontWeight: 600 }}>Reading</span>
                    </button>
                    <button type="button" onClick={() => setCourseType('document')} style={{ flex: 1, padding: '12px', borderRadius: '8px', border: courseType === 'document' ? '2px solid var(--color-accent-blue)' : '1px solid var(--color-surface-hover)', backgroundColor: courseType === 'document' ? 'rgba(59, 130, 246, 0.1)' : 'var(--color-bg)', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
                      <FiFileText size={20} color={courseType === 'document' ? 'var(--color-accent-blue)' : 'var(--color-text-muted)'} />
                      <span style={{ fontSize: '12px', fontWeight: 600 }}>File</span>
                    </button>
                    <button type="button" onClick={() => setCourseType('live')} style={{ flex: 1, padding: '12px', borderRadius: '8px', border: courseType === 'live' ? '2px solid var(--color-danger)' : '1px solid var(--color-surface-hover)', backgroundColor: courseType === 'live' ? 'rgba(239, 68, 68, 0.1)' : 'var(--color-bg)', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
                      <div style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: 'var(--color-danger)' }} />
                      <span style={{ fontSize: '12px', fontWeight: 600 }}>Live</span>
                    </button>
                  </div>
                </div>

                {/* Conditional Fields */}
                {courseType === 'video' && (
                  <div className={styles.formGroup} style={{ background: 'var(--color-bg)', padding: '16px', borderRadius: '8px' }}>
                    <div style={{ display: 'flex', gap: '16px', marginBottom: '12px' }}>
                      <label><input type="radio" checked={videoSourceType === 'link'} onChange={() => setVideoSourceType('link')} /> YouTube/Vimeo Link</label>
                      <label><input type="radio" checked={videoSourceType === 'upload'} onChange={() => setVideoSourceType('upload')} /> Upload Video</label>
                    </div>
                    {videoSourceType === 'link' ? (
                      <input type="url" className={styles.input} value={videoLink} onChange={e => setVideoLink(e.target.value)} placeholder="https://youtube.com/..." />
                    ) : (
                      <input type="file" accept="video/*" onChange={handleFileChange} className={styles.input} />
                    )}
                  </div>
                )}

                {courseType === 'live' && (
                  <div className={styles.formGroup} style={{ background: 'var(--color-bg)', padding: '16px', borderRadius: '8px', textAlign: 'center' }}>
                    <p style={{ color: 'var(--color-text-secondary)', marginBottom: '8px' }}>
                      You are creating a Live Streaming Session.
                    </p>
                    <p style={{ fontSize: '13px', color: 'var(--color-text-muted)' }}>
                      When you enter this module, your camera and microphone will be automatically connected via LiveKit.
                    </p>
                  </div>
                )}

                {courseType === 'reading' && (
                  <textarea className={styles.textarea} value={readingContent} onChange={e => setReadingContent(e.target.value)} placeholder="Type or paste your reading material here..." rows={6} />
                )}

                {courseType === 'document' && (
                  <div className={styles.formGroup}>
                    <label className={styles.label}>Upload Document (PDF, DOCX)</label>
                    <input type="file" accept=".pdf,.docx,.doc,.txt" onChange={handleFileChange} className={styles.input} />
                  </div>
                )}

                <button type="submit" className={styles.submitBtn} style={{ marginTop: '16px' }}>Save Module</button>
             </form>
          </div>
        </div>
      )}
    </div>
  );
}
