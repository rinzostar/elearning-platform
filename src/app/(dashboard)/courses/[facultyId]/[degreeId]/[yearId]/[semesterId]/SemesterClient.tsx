'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import styles from './subjects.module.css';
import { FiX, FiTrash2, FiHeart } from 'react-icons/fi';

export default function SemesterClient({ params }: { params: any }) {
  const { facultyId, degreeId, yearId, semesterId } = params;
  const normalizedDegreeId = (degreeId || '').toLowerCase();
  
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [subjects, setSubjects] = useState<any[]>([]);
  const [professors, setProfessors] = useState<any[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);
  const [favoriteSubjects, setFavoriteSubjects] = useState<any[]>([]);
  const supabase = createClient();
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [selectedProf, setSelectedProf] = useState('');

  const fetchSubjects = async () => {
    // 1. Fetch from Supabase
    const { data, error } = await supabase
      .from('subjects')
      .select('*')
      .eq('facultyId', facultyId)
      .eq('degreeId', normalizedDegreeId)
      .eq('yearId', yearId)
      .eq('semesterId', semesterId)
      .order('created_at', { ascending: true });
      
    let combinedSubjects = data || [];

    // 2. Fetch from Local Storage (Fallback/Hybrid)
    const savedLocal = localStorage.getItem('lumina_local_subjects');
    if (savedLocal) {
      const localList = JSON.parse(savedLocal);
      const relevantLocal = localList.filter((s: any) => 
        s.facultyId === facultyId && 
        s.degreeId === normalizedDegreeId && 
        s.yearId === yearId && 
        s.semesterId === semesterId
      );
      
      // Combine and filter out duplicates if any
      const supabaseIds = new Set(combinedSubjects.map(s => s.id));
      const uniqueLocal = relevantLocal.filter((s: any) => !supabaseIds.has(s.id));
      combinedSubjects = [...combinedSubjects, ...uniqueLocal];
    }

    setSubjects(combinedSubjects);
  };

  const fetchProfessors = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('name, email')
        .eq('role', 'Professor');
        
      if (!error && data && data.length > 0) {
        setProfessors(data);
      } else {
        // Fallback to local storage
        const savedMembers = localStorage.getItem('lumina_members');
        if (savedMembers) {
          const members = JSON.parse(savedMembers);
          setProfessors(members.filter((m: any) => m.role === 'Professor'));
        }
      }
    } catch (e) {
      console.error('Error fetching professors:', e);
    }
  };

  useEffect(() => {
    const fetchFavorites = async (email: string) => {
      const { data, error } = await supabase.from('favorites').select('*').eq('userEmail', email).eq('type', 'subject');
      if (!error && data) setFavoriteSubjects(data.map(f => ({ id: f.courseId, title: f.title, url: f.url })));
    };

    const userStr = localStorage.getItem('lumina_current_user');
    let pUser = null;
    if (userStr) {
      pUser = JSON.parse(userStr);
      setCurrentUser(pUser);
    }

    fetchSubjects();
    fetchProfessors();
    if (pUser?.email) fetchFavorites(pUser.email);
    setIsLoaded(true);
  }, [facultyId, normalizedDegreeId, yearId, semesterId]);

  const handleAddSubject = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log('--- Starting Subject Save ---');
    if (!newTitle) {
      console.warn('Save aborted: Title is empty');
      return;
    }
    
    try {
      const prof = professors.find(p => p.email === selectedProf);
      const newSubject = {
        title: newTitle, 
        description: newDesc, 
        professorName: prof?.name || 'Unassigned', 
        professorEmail: prof?.email || '',
        facultyId, 
        degreeId: normalizedDegreeId, 
        yearId, 
        semesterId
      };
      console.log('Data prepared:', newSubject);

      console.log('Sending to Supabase...');
      const { data, error } = await supabase.from('subjects').insert([newSubject]).select();
      
      if (!error && data) {
        console.log('Supabase Save Success:', data);
        setSubjects(prev => [...prev, ...data]);
        setNewTitle('');
        setNewDesc('');
        setSelectedProf('');
        setIsModalOpen(false);
      } else {
        if (error) {
          console.error('Supabase Error:', error.message);
          console.error('Error Code:', error.code);
          console.error('Error Details:', error.details);
        }
        
        // Fallback: Save to Local Storage if Supabase fails
        console.log('Attempting Local Storage fallback...');
        const localId = 'local-' + Date.now();
        const subjectWithId = { ...newSubject, id: localId, created_at: new Date().toISOString() };
        
        const savedSubjects = localStorage.getItem('lumina_local_subjects') || '[]';
        const subjectsList = JSON.parse(savedSubjects);
        subjectsList.push(subjectWithId);
        localStorage.setItem('lumina_local_subjects', JSON.stringify(subjectsList));
        
        setSubjects(prev => [...prev, subjectWithId]);
        console.log('Local Save Success:', subjectWithId);
        
        alert('Cloud sync unavailable. Subject saved locally on this device.');
        
        setNewTitle('');
        setNewDesc('');
        setSelectedProf('');
        setIsModalOpen(false);
      }
    } catch (err) {
      console.error('CRITICAL SAVE ERROR:', err);
      alert('A critical error occurred while saving. Check console for details.');
    }
  };

  const handleRemoveSubject = async (e: React.MouseEvent, id: string) => {
    e.preventDefault();
    if (confirm('Are you sure you want to delete this subject and all its content?')) {
      const { error } = await supabase.from('subjects').delete().eq('id', id);
      if (!error) setSubjects(prev => prev.filter(s => s.id !== id));
    }
  };

  const toggleFavSubject = async (e: React.MouseEvent, subject: any) => {
    e.preventDefault(); e.stopPropagation();
    if (!currentUser?.email) return;
    const isFav = favoriteSubjects.some(f => f.id === subject.id);
    if (isFav) {
      await supabase.from('favorites').delete().eq('userEmail', currentUser.email).eq('courseId', subject.id).eq('type', 'subject');
      setFavoriteSubjects(prev => prev.filter(f => f.id !== subject.id));
    } else {
      const newFav = { userEmail: currentUser.email, courseId: subject.id, title: subject.title, type: 'subject', url: `/courses/${facultyId}/${normalizedDegreeId}/${yearId}/${semesterId}/${subject.id}` };
      const { data } = await supabase.from('favorites').insert([newFav]).select();
      if (data) setFavoriteSubjects(prev => [...prev, { id: data[0].courseId, title: data[0].title, url: data[0].url }]);
    }
  };

  if (!isLoaded) return <div style={{ padding: '20px' }}>Loading subjects...</div>;

  return (
    <div className={styles.container}>
      <div className={styles.breadcrumb}>
        <Link href={`/courses/${facultyId}/${normalizedDegreeId}/${yearId}`}>← Back to Semester</Link>
      </div>

      <div className={styles.headerArea}>
        <div>
          <h1 className={styles.pageTitle}>{semesterId.toUpperCase()} Subjects</h1>
          <p className={styles.pageSubtitle}>Manage and browse curriculum for this semester.</p>
        </div>
        {currentUser?.role === 'Admin' && (
          <button className={styles.manageBtn} onClick={() => setIsModalOpen(true)}>
            ⚙️ Manage Subjects
          </button>
        )}
      </div>

      <div className={styles.subjectsGrid}>
        {subjects.map(subject => (
          <Link href={`/courses/${facultyId}/${normalizedDegreeId}/${yearId}/${semesterId}/${subject.id}`} key={subject.id} className={styles.subjectCard}>
             <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
               <h2 className={styles.subjectTitle}>{subject.title}</h2>
               <button onClick={e => toggleFavSubject(e, subject)} className={styles.favBtn}>
                 <FiHeart size={22} fill={favoriteSubjects.some(f => f.id === subject.id) ? 'var(--color-danger)' : 'none'} color={favoriteSubjects.some(f => f.id === subject.id) ? 'var(--color-danger)' : 'var(--color-text-muted)'} />
               </button>
             </div>
             {subject.professorName && <span className={styles.professorBadge}>{subject.professorName}</span>}
             <p className={styles.subjectDesc}>{subject.description || 'No description provided.'}</p>
             <div style={{ marginTop: 'auto', color: 'var(--color-primary)', fontSize: '0.9rem', fontWeight: 600 }}>
               View Modules →
             </div>
          </Link>
        ))}
        {subjects.length === 0 && (
          <div style={{ gridColumn: '1/-1', padding: '60px', textAlign: 'center', color: 'var(--color-text-muted)', border: '1px dashed var(--color-surface-hover)', borderRadius: 'var(--radius-lg)' }}>
            No subjects found for this semester.
          </div>
        )}
      </div>

      {isModalOpen && (
        <div className={styles.modalOverlay} onClick={() => setIsModalOpen(false)}>
          <div className={styles.modalContent} onClick={e => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h2 className={styles.modalTitle}>Manage Subjects</h2>
              <button className={styles.closeModalBtn} onClick={() => setIsModalOpen(false)}>
                <FiX size={24} />
              </button>
            </div>

            <div style={{ maxHeight: '70vh', overflowY: 'auto', paddingRight: '4px' }}>
              {/* Existing Subjects List */}
              <div style={{ marginBottom: '24px' }}>
                <h3 style={{ fontSize: '0.9rem', color: 'var(--color-text-muted)', textTransform: 'uppercase', marginBottom: '12px' }}>Existing Subjects</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {subjects.map(s => (
                    <div key={s.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 12px', background: 'var(--color-bg)', borderRadius: 'var(--radius-md)' }}>
                      <span style={{ fontSize: '0.95rem' }}>{s.title}</span>
                      <button onClick={(e) => handleRemoveSubject(e, s.id)} className={styles.dangerBtn} title="Delete Subject">
                        <FiTrash2 size={16} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Add New Subject Form */}
              <form onSubmit={handleAddSubject} style={{ borderTop: '1px solid var(--color-surface-hover)', paddingTop: '24px' }}>
                <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '16px' }}>Add New Subject</h3>
                <div className={styles.formGroup}>
                  <label className={styles.label}>Subject Title</label>
                  <input type="text" className={styles.input} value={newTitle} onChange={e => setNewTitle(e.target.value)} placeholder="e.g. Data Structures" required />
                </div>
                <div className={styles.formGroup}>
                  <label className={styles.label}>Description</label>
                  <textarea className={styles.textarea} value={newDesc} onChange={e => setNewDesc(e.target.value)} placeholder="Brief overview of the subject..." rows={3} />
                </div>
                <div className={styles.formGroup}>
                  <label className={styles.label}>Assign Professor</label>
                  <select className={styles.select} value={selectedProf} onChange={e => setSelectedProf(e.target.value)}>
                    <option value="">Unassigned</option>
                    {professors.map(prof => (
                      <option key={prof.email} value={prof.email}>{prof.name}</option>
                    ))}
                  </select>
                </div>
                <button type="submit" className={styles.submitBtn}>Create Subject</button>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
