'use client';

import { useState, useEffect, useRef } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import styles from './subject.module.css';
import { FiX, FiTrash2, FiPlayCircle, FiFileText, FiBookOpen, FiEdit2, FiHeart } from 'react-icons/fi';

export default function SubjectCoursesPage() {
  const params = useParams();
  const { facultyId, degreeId, yearId, semesterId, subjectId } = params as { facultyId: string, degreeId: string, yearId: string, semesterId: string, subjectId: string };
  const normalizedDegreeId = (degreeId || '').toLowerCase();
  
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [subjectDetails, setSubjectDetails] = useState<any>(null);
  const [courses, setCourses] = useState<any[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);
  const supabase = createClient();
  
  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editCourseId, setEditCourseId] = useState<string | null>(null);
  
  const [newTitle, setNewTitle] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [courseType, setCourseType] = useState('video'); // video, document, reading, live
  
  // Specific content states
  const [videoDevices, setVideoDevices] = useState<MediaDeviceInfo[]>([]);
  const [selectedDevice, setSelectedDevice] = useState<string>('');
  const [videoSourceType, setVideoSourceType] = useState('link'); // link, upload
  const [videoLink, setVideoLink] = useState('');
  const [readingContent, setReadingContent] = useState('');
  const [attachment, setAttachment] = useState<File | null>(null);
  const [existingAttachmentName, setExistingAttachmentName] = useState<string | null>(null);
  const [existingAttachmentUrl, setExistingAttachmentUrl] = useState<string | null>(null);

  const [favorites, setFavorites] = useState<any[]>([]);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const subjectsStorageKey = `lumina_subjects_${facultyId}_${normalizedDegreeId}_${yearId}_${semesterId}`;
  const coursesStorageKey = `lumina_courses_${subjectId}`;

  const fetchCourses = async () => {
    const { data, error } = await supabase
      .from('courses')
      .select('*')
      .eq('subjectId', subjectId)
      .order('created_at', { ascending: true });
      
    if (!error && data) {
      setCourses(data);
    }
  };

  useEffect(() => {
    const user = localStorage.getItem('lumina_current_user');
    if (user) setCurrentUser(JSON.parse(user));

    // Fetch subject details (from local storage for now, ideally should also come from DB if needed, 
    // but subjects page handles its own state. If needed, we could fetch from DB too)
    const savedSubjects = localStorage.getItem(subjectsStorageKey);
    if (savedSubjects) {
      const allSubjects = JSON.parse(savedSubjects);
      const subj = allSubjects.find((s: any) => s.id === subjectId);
      if (subj) setSubjectDetails(subj);
    }

    fetchCourses();
    setIsLoaded(true);
  }, [subjectId]);

  useEffect(() => {
    if (currentUser?.email) {
      const favKey = `lumina_favorites_${currentUser.email}`;
      const savedFavs = localStorage.getItem(favKey);
      if (savedFavs) {
        setFavorites(JSON.parse(savedFavs));
      }
    }
  }, [currentUser]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setAttachment(e.target.files[0]);
    }
  };

  useEffect(() => {
    if (courseType === 'live' && navigator.mediaDevices) {
      navigator.mediaDevices.enumerateDevices().then(devices => {
        const videoInputs = devices.filter(d => d.kind === 'videoinput');
        setVideoDevices(videoInputs);
        if (videoInputs.length > 0 && !selectedDevice) {
          setSelectedDevice(videoInputs[0].deviceId);
        }
      });
    }
  }, [courseType]);

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
    setSelectedDevice('');
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
    setAttachment(null); // Clear new file selection
    setExistingAttachmentName(course.attachmentName || null);
    setExistingAttachmentUrl(course.attachmentUrl || null);
    setSelectedDevice(course.deviceId || '');
    setIsModalOpen(true);
  };

  const handleAddCourse = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle) return;

    let finalAttachmentUrl = existingAttachmentUrl;
    let finalFileName = existingAttachmentName;

    // If they uploaded a NEW file, overwrite the existing one
    if (attachment) {
      finalFileName = attachment.name;
      finalAttachmentUrl = await new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.readAsDataURL(attachment);
      });
    }

    const courseData = {
      title: newTitle,
      description: newDesc,
      type: courseType,
      videoSourceType: courseType === 'video' ? videoSourceType : null,
      videoLink: courseType === 'video' && videoSourceType === 'link' ? videoLink : null,
      readingContent: readingContent,
      attachmentUrl: (courseType === 'video' && videoSourceType === 'upload') || courseType === 'document' ? finalAttachmentUrl : null,
      attachmentName: (courseType === 'video' && videoSourceType === 'upload') || courseType === 'document' ? finalFileName : null,
      deviceId: courseType === 'live' ? selectedDevice : null,
      subjectId
    };

    if (editCourseId) {
      const { data, error } = await supabase.from('courses').update(courseData).eq('id', editCourseId).select();
      if (error) {
        alert(`Error updating module: ${error.message}`);
      } else if (data) {
        setCourses(prev => prev.map(c => c.id === editCourseId ? data[0] : c));
        setIsModalOpen(false);
      }
    } else {
      const { data, error } = await supabase.from('courses').insert([courseData]).select();
      if (error) {
        alert(`Error adding module: ${error.message}`);
      } else if (data) {
        setCourses(prev => [...prev, data[0]]);
        setIsModalOpen(false);
      }
    }
  };

  const handleRemoveCourse = async (e: React.MouseEvent, id: string) => {
    e.preventDefault(); 
    if (confirm('Are you sure you want to remove this course/module?')) {
      const { error } = await supabase.from('courses').delete().eq('id', id);
      if (error) {
        alert(`Error deleting module: ${error.message}`);
      } else {
        setCourses(prev => prev.filter(c => c.id !== id));
      }
    }
  };

  const toggleFavorite = (course: any) => {
    if (!currentUser?.email) return;
    const favKey = `lumina_favorites_${currentUser.email}`;
    
    let newFavs;
    if (favorites.some(f => f.id === course.id)) {
      newFavs = favorites.filter(f => f.id !== course.id);
    } else {
      newFavs = [...favorites, {
        id: course.id,
        title: course.title,
        subjectTitle: subjectDetails?.title || 'Unknown Subject',
        type: course.type,
        url: `/courses/${facultyId}/${degreeId}/${yearId}/${semesterId}/${subjectId}/${course.id}`
      }];
    }
    
    setFavorites(newFavs);
    localStorage.setItem(favKey, JSON.stringify(newFavs));
  };

  if (!isLoaded) return <div style={{ padding: '20px' }}>Loading...</div>;

  const isAdmin = currentUser?.role === 'Admin';
  const isLeader = subjectDetails && currentUser?.email === subjectDetails.professorEmail;
  const canManage = isAdmin || isLeader;

  const getIconForType = (type: string) => {
    if (type === 'video') return <FiPlayCircle size={24} color="var(--color-primary)" />;
    if (type === 'reading') return <FiBookOpen size={24} color="var(--color-accent-orange)" />;
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
          <p className={styles.pageSubtitle}>
            {subjectDetails?.description || 'Browse modules and materials.'}
          </p>
          <div style={{ marginTop: '12px', display: 'inline-block', backgroundColor: 'var(--color-bg)', padding: '4px 12px', borderRadius: '12px', fontSize: '13px', fontWeight: 600 }}>
            Subject Leader: {subjectDetails?.professorName || 'Unknown'}
          </div>
        </div>
        {canManage && (
          <button className={styles.manageBtn} onClick={openAddModal}>
            ⚙️ Add Course Module
          </button>
        )}
      </div>

      {courses.length === 0 ? (
        <p style={{ color: 'var(--color-text-muted)' }}>No courses/modules found for this subject.</p>
      ) : (
        <div className={styles.coursesList}>
          {courses.map(course => (
            <div key={course.id} className={styles.courseCard}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '16px' }}>
                <div style={{ marginTop: '4px' }}>
                  {getIconForType(course.type)}
                </div>
                <div className={styles.courseInfo}>
                  <h3>{course.title}</h3>
                  <p>{course.description}</p>
                  
                  <div style={{ marginTop: '8px', fontSize: '12px', color: 'var(--color-text-muted)', fontWeight: 500 }}>
                    {course.type === 'video' && course.videoSourceType === 'link' && `🔗 Link attached`}
                    {course.type === 'video' && course.videoSourceType === 'upload' && `📎 Video attached`}
                    {course.type === 'document' && `📄 ${course.attachmentName || 'Document attached'}`}
                    {course.type === 'reading' && `📖 Reading material available`}
                    {course.type === 'live' && `🔴 Live Stream`}
                  </div>
                </div>
              </div>
              
              <div className={styles.courseAction}>
                <button 
                  onClick={() => toggleFavorite(course)}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: favorites.some(f => f.id === course.id) ? 'var(--color-danger)' : 'var(--color-text-muted)', display: 'flex', alignItems: 'center', padding: '8px' }}
                  title={favorites.some(f => f.id === course.id) ? "Remove from Favourites" : "Add to Favourites"}
                >
                  <FiHeart size={20} fill={favorites.some(f => f.id === course.id) ? 'var(--color-danger)' : 'none'} />
                </button>
                {canManage && (
                  <>
                    <button 
                      className={styles.manageBtn} 
                      style={{ padding: '6px 10px', fontSize: '12px', border: 'none', backgroundColor: 'transparent' }}
                      onClick={() => openEditModal(course)}
                      title="Edit Module"
                    >
                      <FiEdit2 size={18} />
                    </button>
                    <button 
                      className={styles.dangerBtn} 
                      onClick={(e) => handleRemoveCourse(e, course.id)}
                      title="Delete Module"
                    >
                      <FiTrash2 size={18} />
                    </button>
                  </>
                )}
                <Link 
                  href={`/courses/${facultyId}/${normalizedDegreeId}/${yearId}/${semesterId}/${subjectId}/${course.id}`} 
                  className={styles.enterBtn}
                  style={{ 
                    textDecoration: 'none', 
                    display: 'inline-block',
                    ...(course.type === 'live' ? { backgroundColor: 'var(--color-danger)' } : {})
                  }}
                >
                  {course.type === 'live' ? 'Watch Live' : 'View Module'}
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      {isModalOpen && (
        <div className={styles.modalOverlay} onClick={() => setIsModalOpen(false)}>
          <div className={styles.modalContent} onClick={e => e.stopPropagation()} style={{ maxHeight: '90vh', overflowY: 'auto' }}>
            <div className={styles.modalHeader}>
              <h2 className={styles.modalTitle}>{editCourseId ? 'Edit' : 'Add'} Course/Module</h2>
              <button className={styles.closeModalBtn} onClick={() => setIsModalOpen(false)}>
                <FiX size={24} />
              </button>
            </div>
            
            <form onSubmit={handleAddCourse}>
              <div className={styles.formGroup}>
                <label className={styles.label}>Module Title</label>
                <input 
                  type="text" 
                  className={styles.input} 
                  placeholder="e.g. Week 1: Basics"
                  value={newTitle}
                  onChange={e => setNewTitle(e.target.value)}
                  required 
                />
              </div>

              <div className={styles.formGroup}>
                <label className={styles.label}>Description</label>
                <textarea 
                  className={styles.textarea} 
                  rows={2}
                  placeholder="What will be covered?"
                  value={newDesc}
                  onChange={e => setNewDesc(e.target.value)}
                />
              </div>

              <div className={styles.formGroup}>
                <label className={styles.label}>Content Type</label>
                <select 
                  className={styles.input}
                  value={courseType}
                  onChange={e => {
                    setCourseType(e.target.value);
                    setAttachment(null);
                  }}
                >
                  <option value="video">Video Lecture (Link or Upload)</option>
                  <option value="document">Document (PDF/Word/Excel/PPT)</option>
                  <option value="reading">Reading (Text Format)</option>
                  <option value="live">Go Live (Livestream)</option>
                </select>
              </div>

              <div style={{ backgroundColor: 'var(--color-bg)', padding: '16px', borderRadius: 'var(--radius-md)', marginBottom: '16px', border: '1px solid var(--color-surface-hover)' }}>
                
                {courseType === 'video' && (
                  <div>
                    <label className={styles.label} style={{ marginBottom: '12px' }}>Video Source</label>
                    <div style={{ display: 'flex', gap: '16px', marginBottom: '12px' }}>
                      <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                        <input type="radio" checked={videoSourceType === 'link'} onChange={() => setVideoSourceType('link')} />
                        External Link (YouTube, Vimeo)
                      </label>
                      <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                        <input type="radio" checked={videoSourceType === 'upload'} onChange={() => setVideoSourceType('upload')} />
                        Upload Video File
                      </label>
                    </div>

                    {videoSourceType === 'link' ? (
                      <input 
                        type="url" 
                        className={styles.input} 
                        placeholder="https://youtube.com/..." 
                        value={videoLink}
                        onChange={e => setVideoLink(e.target.value)}
                        required={courseType === 'video' && videoSourceType === 'link'}
                      />
                    ) : (
                      <div>
                        <input 
                          type="file" 
                          accept="video/*" 
                          ref={fileInputRef}
                          onChange={handleFileChange}
                          style={{ fontSize: '14px' }}
                          required={courseType === 'video' && videoSourceType === 'upload' && !attachment && !existingAttachmentUrl}
                        />
                        {existingAttachmentName && !attachment && <p style={{ fontSize: '12px', marginTop: '8px', color: 'var(--color-text-secondary)' }}>Currently uploaded: {existingAttachmentName}</p>}
                        {attachment && <p style={{ fontSize: '12px', marginTop: '8px', color: 'var(--color-primary)' }}>New file selected: {attachment.name}</p>}
                      </div>
                    )}
                  </div>
                )}

                {courseType === 'document' && (
                  <div>
                    <label className={styles.label}>Upload Document</label>
                    <input 
                      type="file" 
                      accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx" 
                      ref={fileInputRef}
                      onChange={handleFileChange}
                      style={{ fontSize: '14px', marginTop: '8px' }}
                      required={!attachment && !existingAttachmentUrl}
                    />
                    <p style={{ fontSize: '12px', marginTop: '8px', color: 'var(--color-text-muted)' }}>
                      Supports: PDF, Word, Excel, PowerPoint
                    </p>
                    {existingAttachmentName && !attachment && <p style={{ fontSize: '12px', marginTop: '8px', color: 'var(--color-text-secondary)' }}>Currently uploaded: {existingAttachmentName}</p>}
                    {attachment && <p style={{ fontSize: '12px', marginTop: '8px', color: 'var(--color-primary)' }}>New file selected: {attachment.name}</p>}
                  </div>
                )}

                <div style={{ marginTop: '16px', borderTop: '1px solid var(--color-surface-hover)', paddingTop: '16px' }}>
                  <label className={styles.label}>
                    {courseType === 'reading' ? 'Reading Material Content' : 'Additional Notes / Content (Optional)'}
                  </label>
                  <textarea 
                    className={styles.textarea} 
                    rows={6}
                    placeholder={courseType === 'reading' ? "Write your article, notes, or reading material here..." : "Add any supplementary notes, instructions, or text..."}
                    value={readingContent}
                    onChange={e => setReadingContent(e.target.value)}
                    required={courseType === 'reading'}
                  />
                </div>
                
                {courseType === 'live' && (
                  <div style={{ marginTop: '16px', borderTop: '1px solid var(--color-surface-hover)', paddingTop: '16px' }}>
                    <label className={styles.label}>Select Camera Device</label>
                    <select 
                      className={styles.input}
                      value={selectedDevice}
                      onChange={e => setSelectedDevice(e.target.value)}
                      required={courseType === 'live'}
                    >
                      <option value="" disabled>Select a camera...</option>
                      {videoDevices.map((device, idx) => (
                        <option key={device.deviceId} value={device.deviceId}>
                          {device.label || `Camera ${idx + 1}`}
                        </option>
                      ))}
                      {videoDevices.length === 0 && (
                        <option value="default">Default Camera</option>
                      )}
                    </select>
                    <p style={{ fontSize: '12px', marginTop: '8px', color: 'var(--color-text-muted)' }}>
                      Note: You must grant camera permissions for this to work.
                    </p>
                  </div>
                )}
                
              </div>

              <button type="submit" className={styles.submitBtn}>
                {editCourseId ? 'Save Changes' : (courseType === 'live' ? 'Go Live' : 'Add to Subject')}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
