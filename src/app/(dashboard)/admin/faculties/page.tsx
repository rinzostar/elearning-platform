'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import Link from 'next/link';

export default function AdminFacultiesPage() {
  const [faculties, setFaculties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState(null);
  
  const [formData, setFormData] = useState({
    id: '', title: '', description: '', icon: '🎓', bg_color: 'var(--color-accent-blue)', gradient: 'linear-gradient(90deg, #3b82f6 0%, #60a5fa 100%)'
  });

  const supabase = createClient();

  useEffect(() => {
    fetchFaculties();
  }, []);

  async function fetchFaculties() {
    setLoading(true);
    const { data, error } = await supabase.from('faculties').select('*').order('created_at', { ascending: true });
    
    if (error) {
      if (error.code === '42P01') {
        setErrorMsg('The "faculties" table does not exist in your Supabase database yet. Please run the SQL migration to create it.');
      } else if (error.message === 'Failed to fetch' || error.message.includes('fetch')) {
        setErrorMsg('Network error: Failed to fetch. Have you added your actual Supabase URL and ANON Key to your .env.local file? The default placeholder URL will fail to resolve.');
      } else {
        setErrorMsg(error.message);
      }
    } else {
      setFaculties(data || []);
      setErrorMsg(null);
    }
    setLoading(false);
  }

  async function handleAddFaculty(e) {
    e.preventDefault();
    if (!formData.id || !formData.title) return alert('ID and Title are required');
    
    const { data, error } = await supabase.from('faculties').insert([formData]);
    
    if (error) {
      alert(`Error adding faculty: ${error.message}`);
    } else {
      alert('Faculty added successfully!');
      setFormData({ id: '', title: '', description: '', icon: '🎓', bg_color: 'var(--color-accent-blue)', gradient: 'linear-gradient(90deg, #3b82f6 0%, #60a5fa 100%)' });
      fetchFaculties();
    }
  }

  async function handleDelete(id) {
    if (!confirm('Are you sure you want to remove this faculty?')) return;
    
    const { error } = await supabase.from('faculties').delete().eq('id', id);
    if (error) {
      alert(`Error removing faculty: ${error.message}`);
    } else {
      fetchFaculties();
    }
  }

  return (
    <div style={{ padding: 'var(--space-xl)', maxWidth: '1000px', margin: '0 auto' }}>
      <div style={{ marginBottom: 'var(--space-2xl)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontSize: 'var(--font-size-2xl)', fontWeight: 800, marginBottom: 'var(--space-xs)' }}>
            Admin: Manage Faculties
          </h1>
          <p style={{ color: 'var(--color-text-secondary)' }}>Add or remove academic faculties from the platform.</p>
        </div>
        <Link href="/courses" style={{ color: 'var(--color-primary)', fontWeight: 600 }}>
          ← Back to Courses
        </Link>
      </div>

      {errorMsg && (
        <div style={{ padding: 'var(--space-lg)', backgroundColor: 'var(--color-accent-pink)', color: 'var(--color-danger)', borderRadius: 'var(--radius-md)', marginBottom: 'var(--space-xl)' }}>
          <strong>Database Notice:</strong> {errorMsg}
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-xl)' }}>
        {/* ADD NEW FACULTY FORM */}
        <div style={{ backgroundColor: 'var(--color-surface)', padding: 'var(--space-xl)', borderRadius: 'var(--radius-lg)', boxShadow: 'var(--shadow-sm)' }}>
          <h2 style={{ fontSize: 'var(--font-size-xl)', fontWeight: 700, marginBottom: 'var(--space-lg)' }}>Add New Faculty</h2>
          <form onSubmit={handleAddFaculty} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
            
            <div>
              <label style={{ display: 'block', fontSize: 'var(--font-size-sm)', fontWeight: 600, marginBottom: '8px' }}>URL Slug / ID (e.g., medicine)</label>
              <input 
                type="text" 
                value={formData.id}
                onChange={e => setFormData({...formData, id: e.target.value})}
                style={{ width: '100%', padding: '12px', borderRadius: 'var(--radius-sm)', border: '1px solid #e2e8f0', backgroundColor: 'var(--color-bg)' }}
                required
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: 'var(--font-size-sm)', fontWeight: 600, marginBottom: '8px' }}>Display Title (e.g., Faculty of Medicine)</label>
              <input 
                type="text" 
                value={formData.title}
                onChange={e => setFormData({...formData, title: e.target.value})}
                style={{ width: '100%', padding: '12px', borderRadius: 'var(--radius-sm)', border: '1px solid #e2e8f0', backgroundColor: 'var(--color-bg)' }}
                required
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: 'var(--font-size-sm)', fontWeight: 600, marginBottom: '8px' }}>Description</label>
              <textarea 
                value={formData.description}
                onChange={e => setFormData({...formData, description: e.target.value})}
                style={{ width: '100%', padding: '12px', borderRadius: 'var(--radius-sm)', border: '1px solid #e2e8f0', backgroundColor: 'var(--color-bg)', minHeight: '80px' }}
                required
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-md)' }}>
              <div>
                <label style={{ display: 'block', fontSize: 'var(--font-size-sm)', fontWeight: 600, marginBottom: '8px' }}>Emoji Icon</label>
                <input 
                  type="text" 
                  value={formData.icon}
                  onChange={e => setFormData({...formData, icon: e.target.value})}
                  style={{ width: '100%', padding: '12px', borderRadius: 'var(--radius-sm)', border: '1px solid #e2e8f0', backgroundColor: 'var(--color-bg)' }}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 'var(--font-size-sm)', fontWeight: 600, marginBottom: '8px' }}>CSS Var Bg Color</label>
                <input 
                  type="text" 
                  value={formData.bg_color}
                  onChange={e => setFormData({...formData, bg_color: e.target.value})}
                  style={{ width: '100%', padding: '12px', borderRadius: 'var(--radius-sm)', border: '1px solid #e2e8f0', backgroundColor: 'var(--color-bg)' }}
                />
              </div>
            </div>

            <button type="submit" style={{ 
              marginTop: 'var(--space-sm)',
              padding: '12px', 
              backgroundColor: 'var(--color-primary)', 
              color: 'white', 
              fontWeight: 600, 
              border: 'none', 
              borderRadius: 'var(--radius-md)',
              cursor: 'pointer'
            }}>
              + Add Faculty
            </button>
          </form>
        </div>

        {/* LIST OF EXISITNG FACULTIES */}
        <div style={{ backgroundColor: 'var(--color-surface)', padding: 'var(--space-xl)', borderRadius: 'var(--radius-lg)', boxShadow: 'var(--shadow-sm)' }}>
          <h2 style={{ fontSize: 'var(--font-size-xl)', fontWeight: 700, marginBottom: 'var(--space-lg)' }}>Existing Faculties</h2>
          {loading ? (
            <p>Loading database...</p>
          ) : faculties.length === 0 ? (
            <div style={{ textAlign: 'center', padding: 'var(--space-xl)', color: 'var(--color-text-secondary)' }}>
              <p>No active faculties found in the database.</p>
              <p style={{ fontSize: '0.9rem', marginTop: '8px' }}>The "Courses" page is currently using hardcoded fallbacks.</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
              {faculties.map(fac => (
                <div key={fac.id} style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  alignItems: 'center',
                  padding: '12px',
                  border: '1px solid #e2e8f0',
                  borderRadius: 'var(--radius-md)'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{ fontSize: '1.5rem' }}>{fac.icon}</div>
                    <div>
                      <div style={{ fontWeight: 600, color: 'var(--color-text-primary)' }}>{fac.title}</div>
                      <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-secondary)' }}>/{fac.id}</div>
                    </div>
                  </div>
                  <button 
                    onClick={() => handleDelete(fac.id)}
                    style={{ 
                      padding: '6px 12px',
                      backgroundColor: 'var(--color-accent-pink)',
                      color: 'var(--color-danger)',
                      border: 'none',
                      borderRadius: 'var(--radius-sm)',
                      cursor: 'pointer',
                      fontWeight: 600,
                      fontSize: 'var(--font-size-xs)'
                    }}
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
