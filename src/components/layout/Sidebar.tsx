'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { FiMenu, FiHome, FiSettings, FiLogOut, FiUsers } from 'react-icons/fi';
import { MdOutlineLibraryBooks, MdPeopleOutline } from 'react-icons/md';
import styles from './Sidebar.module.css';

export default function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [currentUser, setCurrentUser] = useState({ name: 'Admin User', role: 'Admin', avatar: 'A' });
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    const savedUser = localStorage.getItem('lumina_current_user');
    if (savedUser) {
      setCurrentUser(JSON.parse(savedUser));
    }
  }, []);

  const navItems = [
    { name: 'Home', path: '/home', icon: <FiHome /> },
    { name: 'Courses', path: '/courses', icon: <MdOutlineLibraryBooks /> },
    { name: 'Community', path: '/community', icon: <MdPeopleOutline /> },
  ];

  if (currentUser.role === 'Admin') {
    navItems.push({ name: 'Members', path: '/members', icon: <FiUsers /> });
  }

  const handleLogout = () => {
    // Implement logout logic here
    console.log('Logging out...');
  };

  return (
    <aside className={`${styles.sidebar} ${collapsed ? styles.collapsed : ''}`}>
      <div className={styles.header}>
        <button onClick={() => setCollapsed(!collapsed)} className={styles.toggleBtn}>
          <FiMenu />
        </button>
        <span className={styles.logoText}>EduPlatform</span>
      </div>

      <nav className={styles.nav}>
        {navItems.map((item) => (
          <Link
            key={item.name}
            href={item.path}
            className={`${styles.navItem} ${pathname.startsWith(item.path) ? styles.active : ''}`}
          >
            <div className={styles.navIcon}>{item.icon}</div>
            <span className={styles.navLabel}>{item.name}</span>
          </Link>
        ))}
      </nav>

      <div className={styles.footer}>
        <div className={styles.profileWrapper}>
          <div className={styles.profileItem} onClick={() => setShowProfileMenu(!showProfileMenu)}>
            <div className={styles.avatar}>{currentUser.avatar}</div>
            <span className={styles.profileName}>{currentUser.name}</span>
          </div>
          
          {showProfileMenu && (
            <div className={styles.profileMenu}>
              <button 
                className={`${styles.profileMenuItem} ${styles.danger}`}
                onClick={() => {
                  setShowProfileMenu(false);
                  router.push('/login');
                }}
              >
                <FiLogOut size={16} /> Log out
              </button>
            </div>
          )}
        </div>
        <Link href="/settings" className={`${styles.navItem} ${pathname === '/settings' ? styles.active : ''}`}>
          <div className={styles.navIcon}><FiSettings /></div>
          <span className={styles.navLabel}>Settings</span>
        </Link>
      </div>
    </aside>
  );
}
