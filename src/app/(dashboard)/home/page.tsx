'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { FiPlayCircle, FiFileText, FiBookOpen, FiHeart, FiBook, FiMessageCircle } from 'react-icons/fi';

export default function Home() {
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [favorites, setFavorites] = useState<any[]>([]);
  const [favoriteSubjects, setFavoriteSubjects] = useState<any[]>([]);
  const [favoritePosts, setFavoritePosts] = useState<any[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const userStr = localStorage.getItem('lumina_current_user');
    if (userStr) {
      const user = JSON.parse(userStr);
      setCurrentUser(user);
      
      const favKey = `lumina_favorites_${user.email}`;
      const savedFavs = localStorage.getItem(favKey);
      if (savedFavs) setFavorites(JSON.parse(savedFavs));

      const subjKey = `lumina_favorite_subjects_${user.email}`;
      const savedSubj = localStorage.getItem(subjKey);
      if (savedSubj) setFavoriteSubjects(JSON.parse(savedSubj));

      const postsKey = `lumina_favorite_posts_${user.email}`;
      const savedPosts = localStorage.getItem(postsKey);
      if (savedPosts) setFavoritePosts(JSON.parse(savedPosts));
    }
    setIsLoaded(true);
  }, []);

  const getIconForType = (type: string) => {
    if (type === 'video') return <FiPlayCircle size={24} color="white" />;
    if (type === 'reading') return <FiBookOpen size={24} color="white" />;
    return <FiFileText size={24} color="white" />;
  };

  const getBgForType = (type: string) => {
    if (type === 'video') return 'var(--color-primary)';
    if (type === 'reading') return 'var(--color-accent-orange)';
    return 'var(--color-accent-blue)';
  };

  if (!isLoaded) return <div style={{ padding: '20px' }}>Loading Dashboard...</div>;

  return (
    <div style={{ padding: 'var(--space-md)' }}>
      <h1 style={{ fontSize: 'var(--font-size-hero)', fontWeight: 700, marginBottom: 'var(--space-md)' }}>
        Welcome, {currentUser?.name?.split(' ')[0] || 'Guest'}!
      </h1>
      <p style={{ color: 'var(--color-text-secondary)', fontSize: 'var(--font-size-lg)', marginBottom: 'var(--space-2xl)' }}>
        Get started by exploring courses and joining the community.
      </p>

      {/* Favourite Subjects */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: 'var(--space-md)' }}>
        <FiHeart color="var(--color-danger)" size={24} fill="var(--color-danger)" />
        <h2 style={{ fontSize: 'var(--font-size-xl)', fontWeight: 600 }}>Favourite Subjects</h2>
      </div>

      {favoriteSubjects.length === 0 ? (
        <div style={{ padding: 'var(--space-xl)', backgroundColor: 'var(--color-surface)', borderRadius: 'var(--radius-lg)', textAlign: 'center', color: 'var(--color-text-muted)', border: '1px dashed var(--color-surface-hover)', marginBottom: 'var(--space-2xl)' }}>
          You haven't favourited any subjects yet.
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 'var(--space-md)', marginBottom: 'var(--space-2xl)' }}>
          {favoriteSubjects.map((fav, i) => (
            <Link 
              href={fav.url} 
              key={fav.id || i}
              style={{ 
                textDecoration: 'none', color: 'inherit', backgroundColor: 'var(--color-surface)', 
                borderRadius: 'var(--radius-lg)', padding: 'var(--space-lg)',
                display: 'flex', alignItems: 'center', gap: '16px',
                border: '1px solid var(--color-surface-hover)',
                boxShadow: 'var(--shadow-sm)', transition: 'transform 0.2s, box-shadow 0.2s'
              }}
              onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.boxShadow = 'var(--shadow-md)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = 'var(--shadow-sm)'; }}
            >
              <div style={{ backgroundColor: 'var(--color-accent-purple)', width: '48px', height: '48px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <FiBook size={24} color="white" />
              </div>
              <div>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 600, lineHeight: 1.2 }}>{fav.title}</h3>
                <span style={{ fontSize: '0.85rem', color: 'var(--color-primary)', fontWeight: 600 }}>Go to Subject →</span>
              </div>
            </Link>
          ))}
        </div>
      )}

      {/* Favourite Modules */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: 'var(--space-md)' }}>
        <FiHeart color="var(--color-danger)" size={24} fill="var(--color-danger)" />
        <h2 style={{ fontSize: 'var(--font-size-xl)', fontWeight: 600 }}>Favourite Modules</h2>
      </div>

      {favorites.length === 0 ? (
        <div style={{ padding: 'var(--space-xl)', backgroundColor: 'var(--color-surface)', borderRadius: 'var(--radius-lg)', textAlign: 'center', color: 'var(--color-text-muted)', border: '1px dashed var(--color-surface-hover)', marginBottom: 'var(--space-2xl)' }}>
          You haven't favourited any modules yet.
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 'var(--space-md)', marginBottom: 'var(--space-2xl)' }}>
          {favorites.map((fav, i) => (
            <Link 
              href={fav.url} 
              key={fav.id || i}
              style={{ 
                textDecoration: 'none', color: 'inherit', backgroundColor: 'var(--color-surface)', 
                borderRadius: 'var(--radius-lg)', boxShadow: 'var(--shadow-sm)', padding: 'var(--space-lg)',
                display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
                border: '1px solid var(--color-surface-hover)', transition: 'transform 0.2s, box-shadow 0.2s'
              }}
              onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.boxShadow = 'var(--shadow-md)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = 'var(--shadow-sm)'; }}
            >
              <div>
                <div style={{ backgroundColor: getBgForType(fav.type), width: '40px', height: '40px', borderRadius: '50%', marginBottom: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {getIconForType(fav.type)}
                </div>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '4px', lineHeight: 1.3 }}>{fav.title}</h3>
                <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.85rem' }}>{fav.subjectTitle}</p>
              </div>
              <div style={{ marginTop: '16px', color: 'var(--color-primary)', fontSize: '0.9rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}>
                View Module →
              </div>
            </Link>
          ))}
        </div>
      )}

      {/* Favourite Posts */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: 'var(--space-md)' }}>
        <FiHeart color="var(--color-danger)" size={24} fill="var(--color-danger)" />
        <h2 style={{ fontSize: 'var(--font-size-xl)', fontWeight: 600 }}>Favourite Posts</h2>
      </div>

      {favoritePosts.length === 0 ? (
        <div style={{ padding: 'var(--space-xl)', backgroundColor: 'var(--color-surface)', borderRadius: 'var(--radius-lg)', textAlign: 'center', color: 'var(--color-text-muted)', border: '1px dashed var(--color-surface-hover)' }}>
          You haven't favourited any community posts yet.
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 'var(--space-md)' }}>
          {favoritePosts.map((post, i) => (
            <Link 
              href={`/community#post-${post.id}`} 
              key={post.id || i}
              style={{ 
                textDecoration: 'none', color: 'inherit', backgroundColor: 'var(--color-surface)', 
                borderRadius: 'var(--radius-lg)', padding: 'var(--space-lg)',
                border: '1px solid var(--color-surface-hover)',
                boxShadow: 'var(--shadow-sm)', transition: 'transform 0.2s, box-shadow 0.2s'
              }}
              onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.boxShadow = 'var(--shadow-md)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = 'var(--shadow-sm)'; }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
                <div style={{ width: '36px', height: '36px', borderRadius: '50%', backgroundColor: 'var(--color-accent-pink)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 'bold' }}>
                  {post.avatar}
                </div>
                <div>
                  <div style={{ fontWeight: 600, fontSize: '0.95rem' }}>{post.author}</div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>{post.timestamp}</div>
                </div>
              </div>
              <p style={{ fontSize: '0.95rem', color: 'var(--color-text-primary)', display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                {post.text || 'Attached media/document'}
              </p>
              <div style={{ marginTop: '16px', color: 'var(--color-primary)', fontSize: '0.9rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}>
                <FiMessageCircle size={16} /> Jump to Community
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
