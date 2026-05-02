'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';

export default function ManageFacultiesBtn() {
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    const savedUser = localStorage.getItem('lumina_current_user');
    if (savedUser) {
      try {
        const user = JSON.parse(savedUser);
        if (user.role === 'Admin') {
          setIsAdmin(true);
        }
      } catch (e) {
        console.error('Failed to parse user role', e);
      }
    }
  }, []);

  if (!isAdmin) return null;

  return (
    <Link href="/admin/faculties" style={{ 
      padding: '10px 16px', 
      backgroundColor: 'var(--color-surface)', 
      border: '1px solid var(--color-primary)', 
      color: 'var(--color-primary)',
      borderRadius: 'var(--radius-md)',
      fontWeight: 600,
      transition: 'all var(--transition-fast)'
    }}>
      ⚙️ Manage Faculties
    </Link>
  );
}
