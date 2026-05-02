'use client';

import { useState, useEffect } from 'react';
import styles from './settings.module.css';
import { FiSun, FiMoon, FiMonitor } from 'react-icons/fi';

export default function SettingsPage() {
  const [theme, setTheme] = useState('system');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    // Initialize theme from localStorage or default to system
    const savedTheme = localStorage.getItem('theme') || 'system';
    setTheme(savedTheme);
  }, []);

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
    </div>
  );
}
