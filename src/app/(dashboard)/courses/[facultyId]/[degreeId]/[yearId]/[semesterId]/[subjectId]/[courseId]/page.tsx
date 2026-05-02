'use client';

import { useState, useEffect, useRef } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import styles from './view-module.module.css';
import { FiPlayCircle, FiFileText, FiBookOpen, FiDownload } from 'react-icons/fi';

export default function ViewCourseModulePage() {
  const params = useParams();
  const rawParams = params as any;
  const facultyId = rawParams.facultyId;
  const degreeId = (rawParams.degreeId || '').toLowerCase();
  const yearId = rawParams.yearId;
  const semesterId = rawParams.semesterId;
  const subjectId = rawParams.subjectId;
  const courseId = rawParams.courseId;
  
  const [course, setCourse] = useState<any>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const supabase = createClient();

  // Live states
  const [isLiveActive, setIsLiveActive] = useState(true);
  const [chatMessages, setChatMessages] = useState<{sender: string, text: string, time: string}[]>([
    { sender: 'System', text: 'Welcome to the live chat!', time: new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) }
  ]);
  const [newMessage, setNewMessage] = useState('');
  const videoRef = useRef<HTMLVideoElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);

  useEffect(() => {
    const userStr = localStorage.getItem('lumina_current_user');
    if (userStr) {
      setCurrentUser(JSON.parse(userStr));
    }
  }, []);

  useEffect(() => {
    const fetchCourse = async () => {
      const { data, error } = await supabase.from('courses').select('*').eq('id', courseId).single();
      if (!error && data) {
        setCourse(data);
      }
      setIsLoaded(true);
    };
    fetchCourse();
  }, [courseId]);

  // Handle Live Camera
  useEffect(() => {
    if (course?.type === 'live' && isLiveActive) {
      navigator.mediaDevices.getUserMedia({ video: true, audio: true })
        .then(mediaStream => {
          setStream(mediaStream);
          setCameraError(null);
          if (videoRef.current) {
            videoRef.current.srcObject = mediaStream;
          }
        })
        .catch(err => {
          console.error("Camera access denied or unavailable", err);
          setCameraError(err.name === 'NotReadableError' 
            ? 'Camera is currently in use by another application or blocked.' 
            : 'Could not access the camera. Please check your permissions.');
        });
    }
    
    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [course, isLiveActive]);

  const handleStopLive = () => {
    if (confirm('Are you sure you want to stop this live session?')) {
      setIsLiveActive(false);
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
        setStream(null);
      }
    }
  };

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim()) return;
    
    setChatMessages(prev => [...prev, {
      sender: currentUser?.name || 'Student',
      text: newMessage,
      time: new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})
    }]);
    setNewMessage('');
  };

  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatMessages]);

  if (!isLoaded) return <div style={{ padding: '20px' }}>Loading module...</div>;

  if (!course) {
    return (
      <div className={styles.container} style={{ textAlign: 'center', paddingTop: '100px' }}>
        <h2>Module not found.</h2>
        <Link href={`/courses/${facultyId}/${degreeId}/${yearId}/${semesterId}/${subjectId}`}>
          Go back to subject
        </Link>
      </div>
    );
  }

  const getEmbedUrl = (url: string) => {
    if (!url) return '';
    // Basic youtube conversion for embed
    const ytMatch = url.match(/(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/watch\?v=|youtu\.be\/)([\w-]+)/);
    if (ytMatch) {
      return `https://www.youtube.com/embed/${ytMatch[1]}`;
    }
    // Basic vimeo conversion
    const vimeoMatch = url.match(/(?:https?:\/\/)?(?:www\.)?vimeo\.com\/(\d+)/);
    if (vimeoMatch) {
      return `https://player.vimeo.com/video/${vimeoMatch[1]}`;
    }
    return url;
  };

  return (
    <div className={styles.container}>
      <div className={styles.breadcrumb}>
        <Link href={`/courses/${facultyId}/${degreeId}/${yearId}/${semesterId}/${subjectId}`}>← Back to Modules</Link>
      </div>

      <div className={styles.headerArea}>
        <h1 className={styles.pageTitle}>
          {course.type === 'video' && <FiPlayCircle color="var(--color-primary)" />}
          {course.type === 'reading' && <FiBookOpen color="var(--color-accent-orange)" />}
          {course.type === 'document' && <FiFileText color="var(--color-accent-blue)" />}
          {course.type === 'live' && <div style={{ display: 'inline-block', width: '12px', height: '12px', borderRadius: '50%', backgroundColor: 'var(--color-danger)', marginRight: '12px', animation: isLiveActive ? 'pulse 2s infinite' : 'none' }} />}
          {course.title}
        </h1>
        {course.description && (
          <p className={styles.pageSubtitle}>{course.description}</p>
        )}
      </div>

      <div className={styles.contentWrapper}>
        {course.type === 'video' && course.videoSourceType === 'link' && course.videoLink && (
          <div className={styles.videoContainer}>
            <iframe 
              className={styles.videoIframe}
              src={getEmbedUrl(course.videoLink)}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
              allowFullScreen
            />
          </div>
        )}

        {course.type === 'video' && course.videoSourceType === 'upload' && course.attachmentUrl && (
          <video 
            src={course.attachmentUrl} 
            controls 
            className={styles.videoElement}
          />
        )}

        {course.readingContent && (
          <div className={styles.readingContent} style={{ marginTop: 'var(--space-xl)', paddingTop: course.type !== 'reading' ? 'var(--space-xl)' : '0', borderTop: course.type !== 'reading' ? '1px solid var(--color-surface-hover)' : 'none' }}>
            {course.readingContent}
          </div>
        )}

        {course.type === 'document' && course.attachmentUrl && (
          <div className={styles.documentDownload}>
            <FiFileText size={48} color="var(--color-accent-blue)" />
            <div>
              <h3 style={{ marginBottom: '8px', fontSize: '1.2rem' }}>{course.attachmentName || 'Document File'}</h3>
              <a 
                href={course.attachmentUrl} 
                download={course.attachmentName || 'document'}
                className={styles.downloadBtn}
              >
                <FiDownload size={18} /> Download File
              </a>
            </div>
          </div>
        )}
        
        {((course.type === 'document' && !course.attachmentUrl) || (course.type === 'video' && course.videoSourceType === 'upload' && !course.attachmentUrl)) && (
          <div style={{ padding: 'var(--space-xl)', textAlign: 'center', color: 'var(--color-text-muted)' }}>
            No file was attached to this module.
          </div>
        )}

        {course.type === 'live' && (
          <div style={{ display: 'flex', gap: 'var(--space-md)', marginTop: 'var(--space-md)', height: '600px' }}>
            <div style={{ flex: 1, backgroundColor: 'var(--color-surface)', borderRadius: 'var(--radius-lg)', overflow: 'hidden', display: 'flex', flexDirection: 'column', border: '1px solid var(--color-surface-hover)' }}>
              <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--color-surface-hover)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px' }}>
                  {isLiveActive ? (
                    <><span style={{ color: 'var(--color-danger)' }}>●</span> Live</>
                  ) : (
                    <><span style={{ color: 'var(--color-text-muted)' }}>●</span> Offline</>
                  )}
                </div>
                {(currentUser?.role === 'Admin' || currentUser?.role === 'Professor') && isLiveActive && (
                  <button 
                    onClick={handleStopLive}
                    style={{ backgroundColor: 'var(--color-danger)', color: 'white', border: 'none', padding: '6px 16px', borderRadius: 'var(--radius-sm)', cursor: 'pointer', fontWeight: 600, fontSize: '0.9rem' }}
                  >
                    Stop Live
                  </button>
                )}
              </div>
              
              <div style={{ flex: 1, backgroundColor: '#000', position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {isLiveActive ? (
                  cameraError ? (
                    <div style={{ color: 'white', textAlign: 'center', padding: '20px' }}>
                      <FiPlayCircle size={48} style={{ opacity: 0.5, marginBottom: '16px', color: 'var(--color-danger)' }} />
                      <h3 style={{ color: 'var(--color-danger)' }}>Camera Error</h3>
                      <p style={{ opacity: 0.7, fontSize: '0.9rem', maxWidth: '300px', margin: '0 auto' }}>
                        {cameraError}
                      </p>
                    </div>
                  ) : (
                    <video 
                      ref={videoRef} 
                      autoPlay 
                      playsInline 
                      muted 
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                  )
                ) : (
                  <div style={{ color: 'white', textAlign: 'center' }}>
                    <FiPlayCircle size={48} style={{ opacity: 0.5, marginBottom: '16px' }} />
                    <h3>Live Session Ended</h3>
                    <p style={{ opacity: 0.7, fontSize: '0.9rem' }}>The instructor has stopped the stream.</p>
                  </div>
                )}
              </div>
            </div>

            <div style={{ width: '350px', backgroundColor: 'var(--color-surface)', borderRadius: 'var(--radius-lg)', display: 'flex', flexDirection: 'column', border: '1px solid var(--color-surface-hover)' }}>
              <div style={{ padding: '16px', borderBottom: '1px solid var(--color-surface-hover)', fontWeight: 600 }}>
                Live Chat
              </div>
              
              <div style={{ flex: 1, overflowY: 'auto', padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {chatMessages.map((msg, i) => (
                  <div key={i} style={{ fontSize: '0.95rem' }}>
                    <span style={{ fontWeight: 600, color: msg.sender === 'System' ? 'var(--color-text-muted)' : (msg.sender === currentUser?.name ? 'var(--color-primary)' : 'var(--color-text-primary)') }}>
                      {msg.sender}
                    </span>
                    <span style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', marginLeft: '8px' }}>{msg.time}</span>
                    <p style={{ marginTop: '2px', color: msg.sender === 'System' ? 'var(--color-text-muted)' : 'inherit', fontStyle: msg.sender === 'System' ? 'italic' : 'normal' }}>
                      {msg.text}
                    </p>
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>

              <div style={{ padding: '16px', borderTop: '1px solid var(--color-surface-hover)' }}>
                <form onSubmit={handleSendMessage} style={{ display: 'flex', gap: '8px' }}>
                  <input 
                    type="text" 
                    placeholder="Type a message..." 
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    disabled={!isLiveActive}
                    style={{ flex: 1, padding: '10px 14px', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-surface-hover)', backgroundColor: 'var(--color-bg)' }}
                  />
                  <button 
                    type="submit"
                    disabled={!isLiveActive || !newMessage.trim()}
                    style={{ backgroundColor: 'var(--color-primary)', color: 'white', border: 'none', padding: '0 16px', borderRadius: 'var(--radius-md)', cursor: (!isLiveActive || !newMessage.trim()) ? 'not-allowed' : 'pointer', opacity: (!isLiveActive || !newMessage.trim()) ? 0.5 : 1 }}
                  >
                    Send
                  </button>
                </form>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
