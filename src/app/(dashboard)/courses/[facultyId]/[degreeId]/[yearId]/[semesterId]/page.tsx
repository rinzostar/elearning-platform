'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import styles from './subjects.module.css';
import { FiX, FiTrash2, FiHeart } from 'react-icons/fi';

export default function SubjectsPage() {
  const params = useParams();
  const { facultyId, degreeId, yearId, semesterId } = params as { facultyId: string, degreeId: string, yearId: string, semesterId: string };
  const normalizedDegreeId = (degreeId || '').toLowerCase();
  
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [subjects, setSubjects] = useState<any[]>([]);
  const [professors, setProfessors] = useState<any[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);
  const [favoriteSubjects, setFavoriteSubjects] = useState<any[]>([]);
  const supabase = createClient();
  
  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [selectedProf, setSelectedProf] = useState('');

  const storageKey = `lumina_subjects_${facultyId}_${normalizedDegreeId}_${yearId}_${semesterId}`;

  const fetchSubjects = async () => {
    const { data, error } = await supabase
      .from('subjects')
      .select('*')
      .eq('facultyId', facultyId)
      .eq('degreeId', normalizedDegreeId)
      .eq('yearId', yearId)
      .eq('semesterId', semesterId)
      .order('created_at', { ascending: true });
      
    if (!error && data) {
      setSubjects(data);
    }
  };

  useEffect(() => {
    // Get user
    const userStr = localStorage.getItem('lumina_current_user');
    let parsedUser = null;
    if (userStr) {
      parsedUser = JSON.parse(userStr);
      setCurrentUser(parsedUser);
    }

    // Fetch subjects from Supabase
    fetchSubjects();

    // Get professors from members (leaving this as localStorage or fallback for now, 
    // ideally this should also query a profiles/users table in Supabase)
    const savedMembers = localStorage.getItem('lumina_members');
    if (savedMembers) {
      const allMembers = JSON.parse(savedMembers);
      setProfessors(allMembers.filter((m: any) => m.role === 'Professor'));
    }
    
    // Get favorite subjects
    if (parsedUser?.email) {
      const favKey = `lumina_favorite_subjects_${parsedUser.email}`;
      const savedFavs = localStorage.getItem(favKey);
      if (savedFavs) {
        setFavoriteSubjects(JSON.parse(savedFavs));
      }
    }

    setIsLoaded(true);
  }, [facultyId, normalizedDegreeId, yearId, semesterId]);

  const handleAddSubject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle) return;

    let profName = 'Unassigned';
    let profEmail = '';
    
    if (selectedProf) {
      const prof = professors.find(p => p.email === selectedProf);
      if (prof) {
        profName = prof.name;
        profEmail = prof.email;
      }
    }

    const newSubject = {
      title: newTitle,
      description: newDesc,
      professorName: profName,
      professorEmail: profEmail,
      facultyId,
      degreeId: normalizedDegreeId,
      yearId,
      semesterId
    };

    const { data, error } = await supabase.from('subjects').insert([newSubject]).select();

    if (error) {
      alert(`Error creating subject: ${error.message}`);
    } else if (data) {
      setSubjects(prev => [...prev, ...data]);
      setNewTitle('');
      setNewDesc('');
      setSelectedProf('');
      setIsModalOpen(false);
    }
  };

  const handleRemoveSubject = async (e: React.MouseEvent, id: string) => {
    e.preventDefault(); // Prevent navigating to the subject
    if (confirm('Are you sure you want to delete this subject?')) {
      const { error } = await supabase.from('subjects').delete().eq('id', id);
      if (error) {
        alert(`Error deleting subject: ${error.message}`);
      } else {
        setSubjects(prev => prev.filter(s => s.id !== id));
      }
    }
  };

  const toggleFavSubject = (e: React.MouseEvent, subject: any) => {
    e.preventDefault();
    e.stopPropagation();
    if (!currentUser?.email) return;
    const favKey = `lumina_favorite_subjects_${currentUser.email}`;
    let newFavs;
    if (favoriteSubjects.some(f => f.id === subject.id)) {
      newFavs = favoriteSubjects.filter(f => f.id !== subject.id);
    } else {
      newFavs = [...favoriteSubjects, {
        id: subject.id,
        title: subject.title,
        url: `/courses/${facultyId}/${degreeId}/${yearId}/${semesterId}/${subject.id}`
      }];
    }
    setFavoriteSubjects(newFavs);
    localStorage.setItem(favKey, JSON.stringify(newFavs));
  };

  if (!isLoaded) return <div style={{ padding: '20px' }}>Loading...</div>;

  const isAdmin = currentUser?.role === 'Admin';
  // Check if current user is the leader of a subject (Professor role checking)
  const isProfessor = currentUser?.role === 'Professor';

  const facultyName = facultyId.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
  const semesterName = semesterId.toUpperCase();

  return (
    <div className={styles.container}>
      <div className={styles.breadcrumb}>
        <Link href={`/courses/${facultyId}/${normalizedDegreeId}/${yearId}`}>← Back to Semesters</Link>
      </div>

      <div className={styles.headerArea}>
        <div>
          <h1 className={styles.pageTitle}>{semesterName} Subjects</h1>
          <p className={styles.pageSubtitle}>Manage and explore subjects for this semester in {facultyName}.</p>
        </div>
        {isAdmin && (
          <button className={styles.manageBtn} onClick={() => setIsModalOpen(true)}>
            ⚙️ Manage Subjects
          </button>
        )}
      </div>

      {subjects.length === 0 ? (
        <p style={{ color: 'var(--color-text-muted)' }}>No subjects found for this semester.</p>
      ) : (
        <div className={styles.subjectsGrid}>
          {subjects.map(subject => {
            const isLeader = isProfessor && currentUser?.email === subject.professorEmail;
            
            return (
              <Link 
                href={`/courses/${facultyId}/${normalizedDegreeId}/${yearId}/${semesterId}/${subject.id}`} 
                key={subject.id} 
                className={styles.subjectCard}
                style={isLeader ? { borderColor: 'var(--color-primary)', boxShadow: 'var(--shadow-sm)' } : {}}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <h2 className={styles.subjectTitle}>{subject.title}</h2>
                  <button 
                    onClick={(e) => toggleFavSubject(e, subject)}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', zIndex: 10 }}
                    title={favoriteSubjects.some(f => f.id === subject.id) ? "Remove from Favourites" : "Add to Favourites"}
                  >
                    <FiHeart size={22} color={favoriteSubjects.some(f => f.id === subject.id) ? 'var(--color-danger)' : 'var(--color-text-muted)'} fill={favoriteSubjects.some(f => f.id === subject.id) ? 'var(--color-danger)' : 'none'} />
                  </button>
                </div>
                <div className={styles.professorBadge}>
                  Leader: {subject.professorName} 
                  {isLeader && ' (You)'}
                </div>
                <p className={styles.subjectDesc}>{subject.description}</p>
                
                {isAdmin && (
                  <button 
                    className={styles.dangerBtn} 
                    onClick={(e) => handleRemoveSubject(e, subject.id)}
                    title="Delete Subject"
                  >
                    <FiTrash2 size={18} />
                  </button>
                )}
                
                {isLeader && (
                  <div style={{ marginTop: 'auto', fontSize: '12px', color: 'var(--color-primary)', fontWeight: 600 }}>
                    You manage courses here →
                  </div>
                )}
              </Link>
            );
          })}
        </div>
      )}

      {/* Modal */}
      {isModalOpen && (
        <div className={styles.modalOverlay} onClick={() => setIsModalOpen(false)}>
          <div className={styles.modalContent} onClick={e => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h2 className={styles.modalTitle}>Add New Subject</h2>
              <button className={styles.closeModalBtn} onClick={() => setIsModalOpen(false)}>
                <FiX size={24} />
              </button>
            </div>
            
            <form onSubmit={handleAddSubject}>
              <div className={styles.formGroup}>
                <label className={styles.label}>Subject Title</label>
                <input 
                  type="text" 
                  className={styles.input} 
                  placeholder="e.g. Advanced Calculus"
                  value={newTitle}
                  onChange={e => setNewTitle(e.target.value)}
                  required 
                />
              </div>

              <div className={styles.formGroup}>
                <label className={styles.label}>Description</label>
                <textarea 
                  className={styles.textarea} 
                  rows={3}
                  placeholder="Subject overview..."
                  value={newDesc}
                  onChange={e => setNewDesc(e.target.value)}
                />
              </div>

              <div className={styles.formGroup}>
                <label className={styles.label}>Assign Subject Leader (Professor)</label>
                <select 
                  className={styles.select}
                  value={selectedProf}
                  onChange={e => setSelectedProf(e.target.value)}
                  required
                >
                  <option value="" disabled>Select a Professor...</option>
                  {professors.map(p => (
                    <option key={p.id} value={p.email}>{p.name} ({p.email})</option>
                  ))}
                  {professors.length === 0 && (
                    <option value="" disabled>No professors found! Add them in the Members tab.</option>
                  )}
                </select>
              </div>

              <button type="submit" className={styles.submitBtn}>
                Create Subject
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
