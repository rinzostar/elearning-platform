'use client';

import { useState, useEffect, useRef } from 'react';
import styles from './settings.module.css';
import { FiSun, FiMoon, FiMonitor, FiCamera, FiMic } from 'react-icons/fi';
import { useDeviceStore } from '@/lib/store/useDeviceStore';

export default function SettingsPage() {
  const [theme, setTheme] = useState('system');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    // Initialize theme from localStorage or default to system
    const savedTheme = localStorage.getItem('theme') || 'system';
    setTheme(savedTheme);
  }, []);

  const { videoDeviceId, audioDeviceId, setVideoDeviceId, setAudioDeviceId } = useDeviceStore();
  const [devices, setDevices] = useState<MediaDeviceInfo[]>([]);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const getDevices = async () => {
      try {
        // Only request if not already granted? Actually enumerateDevices might return empty labels if not granted.
        // We can try to request just to be sure we get labels.
        await navigator.mediaDevices.getUserMedia({ audio: true, video: true })
          .then(stream => stream.getTracks().forEach(t => t.stop()))
          .catch(() => {}); // Ignore errors if already denied

        const deviceInfos = await navigator.mediaDevices.enumerateDevices();
        setDevices(deviceInfos);
      } catch (err) {
        console.error('Error fetching devices:', err);
      }
    };
    getDevices();
    
    // Listen for device changes
    navigator.mediaDevices.addEventListener('devicechange', getDevices);
    return () => navigator.mediaDevices.removeEventListener('devicechange', getDevices);
  }, []);

  useEffect(() => {
    let currentStream: MediaStream | null = null;
    
    const startPreview = async () => {
      if (videoDeviceId && videoRef.current) {
        try {
          const stream = await navigator.mediaDevices.getUserMedia({
            video: { deviceId: { exact: videoDeviceId } }
          });
          videoRef.current.srcObject = stream;
          currentStream = stream;
        } catch (err) {
          console.error('Preview error:', err);
        }
      }
    };

    startPreview();
    
    return () => {
      if (currentStream) {
        currentStream.getTracks().forEach(track => track.stop());
      }
    };
  }, [videoDeviceId]);

  const handleThemeChange = (newTheme) => {
    setTheme(newTheme);
    
    if (newTheme === 'system') {
      localStorage.removeItem('theme');
      if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
        document.documentElement.setAttribute('data-theme', 'dark');
      } else {
        document.documentElement.setAttribute('data-theme', 'light');
      }
    } else {
      localStorage.setItem('theme', newTheme);
      document.documentElement.setAttribute('data-theme', newTheme);
    }
  };

  // Prevent hydration mismatch by not rendering the interactive part until mounted
  if (!mounted) return null;

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.title}>Settings</h1>
        <p className={styles.subtitle}>Manage your account preferences and app appearance.</p>
      </div>

      <div className={styles.section}>
        <h2 className={styles.sectionTitle}>Appearance</h2>
        
        <div className={styles.settingRow}>
          <div className={styles.settingInfo}>
            <h3>Theme Preferences</h3>
            <p>Customize the look and feel of the platform.</p>
          </div>
          
          <div className={styles.themeOptions}>
            <button 
              className={`${styles.themeButton} ${theme === 'light' ? styles.active : ''}`}
              onClick={() => handleThemeChange('light')}
            >
              <FiSun size={18} />
              Light
            </button>
            <button 
              className={`${styles.themeButton} ${theme === 'dark' ? styles.active : ''}`}
              onClick={() => handleThemeChange('dark')}
            >
              <FiMoon size={18} />
              Dark
            </button>
            <button 
              className={`${styles.themeButton} ${theme === 'system' ? styles.active : ''}`}
              onClick={() => handleThemeChange('system')}
            >
              <FiMonitor size={18} />
              System
            </button>
          </div>
        </div>
      </div>

      <div className={styles.section}>
        <h2 className={styles.sectionTitle}>Audio & Video</h2>
        
        <div className={styles.settingRow}>
          <div className={styles.settingInfo}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-xs)' }}>
              <FiCamera size={18} color="var(--color-primary)" />
              <h3 style={{ margin: 0 }}>Camera</h3>
            </div>
            <p>Select your default camera for live sessions.</p>
          </div>
          
          <select 
            className={styles.deviceSelect}
            value={videoDeviceId || ''}
            onChange={(e) => setVideoDeviceId(e.target.value)}
          >
            <option value="">Default Camera</option>
            {devices.filter(d => d.kind === 'videoinput').map(device => (
              <option key={device.deviceId} value={device.deviceId}>
                {device.label || `Camera ${device.deviceId.slice(0, 5)}...`}
              </option>
            ))}
          </select>
        </div>

        {videoDeviceId && (
          <div className={styles.devicePreview}>
            <video ref={videoRef} autoPlay playsInline muted />
          </div>
        )}

        <div className={styles.settingRow} style={{ marginTop: 'var(--space-md)' }}>
          <div className={styles.settingInfo}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-xs)' }}>
              <FiMic size={18} color="var(--color-primary)" />
              <h3 style={{ margin: 0 }}>Microphone</h3>
            </div>
            <p>Select your default microphone.</p>
          </div>
          
          <select 
            className={styles.deviceSelect}
            value={audioDeviceId || ''}
            onChange={(e) => setAudioDeviceId(e.target.value)}
          >
            <option value="">Default Microphone</option>
            {devices.filter(d => d.kind === 'audioinput').map(device => (
              <option key={device.deviceId} value={device.deviceId}>
                {device.label || `Microphone ${device.deviceId.slice(0, 5)}...`}
              </option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
}
