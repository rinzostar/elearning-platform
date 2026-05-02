'use client';

import { useState, useRef, useEffect } from 'react';
import styles from './community.module.css';
import { FiImage, FiVideo, FiPaperclip, FiX, FiFileText, FiThumbsUp, FiMessageSquare, FiShare2, FiSend, FiDownload, FiMoreHorizontal, FiBookmark, FiFlag, FiTrash2, FiHeart } from 'react-icons/fi';

const URL_REGEX = /(https?:\/\/[^\s]+)/g;
const YOUTUBE_REGEX = /(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/watch\?v=|youtu\.be\/)([\w-]+)/;
const FACEBOOK_VIDEO_REGEX = /(?:https?:\/\/)?(?:www\.)?facebook\.com\/(?:video\.php\?v=\d+|.*?\/videos\/\d+)/;

function renderTextWithLinks(text: string) {
  if (!text) return { content: null, videoEmbeds: [] };

  const parts = text.split(URL_REGEX);
  const videoEmbeds: any[] = [];
  
  const content = parts.map((part, i) => {
    if (part.match(URL_REGEX)) {
      const ytMatch = part.match(YOUTUBE_REGEX);
      if (ytMatch) {
        videoEmbeds.push({
          type: 'youtube',
          url: `https://www.youtube.com/embed/${ytMatch[1]}`
        });
      } else if (part.match(FACEBOOK_VIDEO_REGEX)) {
        videoEmbeds.push({
          type: 'facebook',
          url: `https://www.facebook.com/plugins/video.php?href=${encodeURIComponent(part)}&show_text=false&width=560`
        });
      }
      
      return (
        <a key={i} href={part} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--color-primary)' }}>
          {part}
        </a>
      );
    }
    return <span key={i}>{part}</span>;
  });

  return { content, videoEmbeds };
}

function PostItem({ post, currentUser, onImageClick, onDelete }: { post: any, currentUser: any, onImageClick: (url: string) => void, onDelete: (id: number) => void }) {
  const [isLiked, setIsLiked] = useState(post.isLiked || false);
  const [likesCount, setLikesCount] = useState(post.likesCount || 0);
  const [showComments, setShowComments] = useState(false);
  const [showOptions, setShowOptions] = useState(false);
  const [comments, setComments] = useState<any[]>(post.comments || []);
  const [commentInput, setCommentInput] = useState('');
  const [isFavorited, setIsFavorited] = useState(false);

  useEffect(() => {
    if (currentUser?.email) {
      const favKey = `lumina_favorite_posts_${currentUser.email}`;
      const saved = localStorage.getItem(favKey);
      if (saved) {
        const favs = JSON.parse(saved);
        setIsFavorited(favs.some((f: any) => f.id === post.id));
      }
    }
  }, [currentUser, post.id]);

  const handleFavoriteClick = () => {
    if (!currentUser?.email) return;
    const favKey = `lumina_favorite_posts_${currentUser.email}`;
    const saved = localStorage.getItem(favKey);
    let favs = saved ? JSON.parse(saved) : [];
    
    if (isFavorited) {
      favs = favs.filter((f: any) => f.id !== post.id);
      setIsFavorited(false);
    } else {
      favs.push(post);
      setIsFavorited(true);
    }
    localStorage.setItem(favKey, JSON.stringify(favs));
  };

  const handleLikeClick = () => {
    setIsLiked(!isLiked);
    setLikesCount((prev: number) => isLiked ? prev - 1 : prev + 1);
  };

  const handleCommentSubmit = () => {
    if (!commentInput.trim()) return;
    const newComment = {
      id: Date.now(),
      author: 'Admin User',
      avatar: 'A',
      text: commentInput
    };
    setComments(prev => [...prev, newComment]);
    setCommentInput('');
  };

  const mediaAttachments = post.attachments.filter((a: any) => a.isMedia);
  const docAttachments = post.attachments.filter((a: any) => !a.isMedia);
  
  const { content: parsedText, videoEmbeds } = renderTextWithLinks(post.text);

  return (
    <div className={styles.postCard} id={`post-${post.id}`} style={{ scrollMarginTop: '100px', transition: 'box-shadow 0.3s ease-in-out' }}>
      <div className={styles.postHeader}>
        <div className={styles.avatar}>{post.avatar}</div>
        <div className={styles.postAuthorInfo}>
          <span className={styles.postAuthorName}>{post.author}</span>
          <span className={styles.postTimestamp}>{post.timestamp}</span>
        </div>
        
        <div className={styles.postOptionsWrapper}>
          <button 
            className={styles.postOptionsBtn} 
            onClick={() => setShowOptions(!showOptions)}
          >
            <FiMoreHorizontal size={20} />
          </button>
          
          {showOptions && (
            <div className={styles.postDropdownMenu}>
              <button className={styles.postDropdownItem} onClick={() => { alert('Post saved to your bookmarks!'); setShowOptions(false); }}>
                <FiBookmark size={16} /> Save this post
              </button>
              <button className={styles.postDropdownItem} onClick={() => { alert('Post reported. Admins will review it.'); setShowOptions(false); }}>
                <FiFlag size={16} /> Report
              </button>
              {(currentUser.role === 'Admin' || currentUser.name === post.author) && (
                <button className={`${styles.postDropdownItem} ${styles.danger}`} onClick={() => { onDelete(post.id); setShowOptions(false); }}>
                  <FiTrash2 size={16} /> Delete post
                </button>
              )}
            </div>
          )}
        </div>
      </div>
      
      {post.text && <div className={styles.postText} style={{ whiteSpace: 'pre-wrap' }}>{parsedText}</div>}

      {videoEmbeds.length > 0 && (
        <div className={styles.postMediaGrid}>
          {videoEmbeds.map((vid: any, idx: number) => (
            <div key={`embed-${idx}`} className={styles.postMediaItem} style={{ paddingBottom: '56.25%', position: 'relative', height: 0 }}>
              <iframe 
                src={vid.url}
                style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', border: 'none' }}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                allowFullScreen 
              />
            </div>
          ))}
        </div>
      )}

      {mediaAttachments.length > 0 && (
        <div className={styles.postMediaGrid}>
          {mediaAttachments.map((media: any, idx: number) => (
            <div key={idx} className={styles.postMediaItem}>
              {media.type.startsWith('image/') ? (
                <img 
                  src={media.url} 
                  alt={media.name} 
                  className={styles.postImage} 
                  onClick={() => onImageClick(media.url)}
                />
              ) : (
                <video src={media.url} controls className={styles.postVideo} />
              )}
            </div>
          ))}
        </div>
      )}

      {docAttachments.length > 0 && (
        <div className={styles.postDocsList}>
          {docAttachments.map((doc: any, idx: number) => (
            <a key={idx} href={doc.url} download={doc.name} className={styles.postDocItem}>
              <FiFileText size={18} />
              {doc.name}
              <span style={{ marginLeft: 'auto', fontSize: '12px', color: 'var(--color-text-muted)' }}>
                Download ↓
              </span>
            </a>
          ))}
        </div>
      )}

      <div style={{ padding: '8px 0', fontSize: '13px', color: 'var(--color-text-secondary)', display: 'flex', justifyContent: 'space-between' }}>
        <span>{likesCount} {likesCount === 1 ? 'Like' : 'Likes'}</span>
        <span>{comments.length} {comments.length === 1 ? 'Comment' : 'Comments'}</span>
      </div>

      <div className={styles.postInteractionBar}>
        <button 
          className={`${styles.interactionBtn} ${isLiked ? styles.liked : ''}`}
          onClick={handleLikeClick}
        >
          <FiThumbsUp size={18} fill={isLiked ? 'currentColor' : 'none'} />
          Like
        </button>
        <button 
          className={styles.interactionBtn}
          onClick={() => setShowComments(!showComments)}
        >
          <FiMessageSquare size={18} />
          Comment
        </button>
        <button 
          className={`${styles.interactionBtn} ${isFavorited ? styles.liked : ''}`}
          onClick={handleFavoriteClick}
          style={{ color: isFavorited ? 'var(--color-danger)' : 'inherit' }}
        >
          <FiHeart size={18} fill={isFavorited ? 'var(--color-danger)' : 'none'} color={isFavorited ? 'var(--color-danger)' : 'currentColor'} />
          {isFavorited ? 'Favourited' : 'Favourite'}
        </button>
        <button className={styles.interactionBtn} onClick={() => alert('Share link copied to clipboard!')}>
          <FiShare2 size={18} />
          Share
        </button>
      </div>

      {showComments && (
        <div className={styles.commentsSection}>
          {comments.length > 0 && (
            <div className={styles.commentList}>
              {comments.map(comment => (
                <div key={comment.id} className={styles.commentItem}>
                  <div className={styles.commentAvatar}>{comment.avatar}</div>
                  <div className={styles.commentBubble}>
                    <div className={styles.commentAuthor}>{comment.author}</div>
                    <div className={styles.commentText}>{comment.text}</div>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className={styles.commentInputWrapper}>
            <div className={styles.commentAvatar}>A</div>
            <input 
              type="text" 
              className={styles.commentInput} 
              placeholder="Write a comment..."
              value={commentInput}
              onChange={(e) => setCommentInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleCommentSubmit()}
            />
            <button 
              className={styles.commentSubmitBtn}
              onClick={handleCommentSubmit}
              disabled={!commentInput.trim()}
            >
              <FiSend size={16} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function CommunityPage() {
  const [postText, setPostText] = useState('');
  const [attachments, setAttachments] = useState<File[]>([]);
  const [posts, setPosts] = useState<any[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [currentUser, setCurrentUser] = useState({ name: 'Admin User', role: 'Admin', avatar: 'A' });

  useEffect(() => {
    const savedUser = localStorage.getItem('lumina_current_user');
    if (savedUser) {
      setCurrentUser(JSON.parse(savedUser));
    }
  }, []);

  useEffect(() => {
    const saved = localStorage.getItem('lumina_posts');
    if (saved) {
      setPosts(JSON.parse(saved));
    }
    setIsLoaded(true);
  }, []);

  useEffect(() => {
    if (isLoaded) {
      localStorage.setItem('lumina_posts', JSON.stringify(posts));
      
      // Handle scrolling to a specific post if accessed via a hash link
      if (window.location.hash) {
        const id = window.location.hash.substring(1);
        setTimeout(() => {
          const element = document.getElementById(id);
          if (element) {
            element.scrollIntoView({ behavior: 'smooth', block: 'center' });
            element.style.boxShadow = '0 0 0 2px var(--color-primary), 0 8px 24px rgba(0,0,0,0.1)';
            setTimeout(() => {
              element.style.boxShadow = '';
            }, 3000);
          }
        }, 100);
      }
    }
  }, [posts, isLoaded]);
  
  const mediaInputRef = useRef<HTMLInputElement>(null);
  const docInputRef = useRef<HTMLInputElement>(null);

  const handleMediaClick = () => mediaInputRef.current?.click();
  const handleDocClick = () => docInputRef.current?.click();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files);
      setAttachments(prev => [...prev, ...newFiles]);
    }
    e.target.value = '';
  };

  const removeAttachment = (indexToRemove: number) => {
    setAttachments(prev => prev.filter((_, idx) => idx !== indexToRemove));
  };

  const handlePost = async () => {
    const processedAttachments = await Promise.all(attachments.map(async file => {
      const isMedia = file.type.startsWith('image/') || file.type.startsWith('video/');
      
      const base64Url = await new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.readAsDataURL(file);
      });

      return {
        name: file.name,
        type: file.type,
        isMedia,
        url: base64Url
      };
    }));

    const newPost = {
      id: Date.now(),
      author: currentUser.name,
      avatar: currentUser.avatar,
      timestamp: new Date().toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' }),
      text: postText,
      attachments: processedAttachments,
      likesCount: 0,
      isLiked: false,
      comments: []
    };

    setPosts(prev => [newPost, ...prev]);
    setPostText('');
    setAttachments([]);
  };

  const handleDeletePost = (id: number) => {
    if (confirm('Are you sure you want to delete this post?')) {
      setPosts(prev => prev.filter(p => p.id !== id));
    }
  };

  const isPostDisabled = postText.trim().length === 0 && attachments.length === 0;

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.pageTitle}>Community Hub</h1>
        <p className={styles.pageSubtitle}>
          Engage with students and professors, share resources, and discuss topics.
        </p>
      </div>

      <div className={styles.createPostCard}>
        <div className={styles.userInfo}>
          <div className={styles.avatar}>{currentUser.avatar}</div>
          <div style={{ fontWeight: 600 }}>{currentUser.name}</div>
        </div>

        <textarea
          className={styles.textArea}
          placeholder="What's on your mind? Share a thought, a document, or a question..."
          value={postText}
          onChange={(e) => setPostText(e.target.value)}
        />

        {attachments.length > 0 && (
          <div className={styles.attachmentPreview}>
            {attachments.map((file, idx) => (
              <div key={idx} className={styles.fileChip}>
                <FiFileText size={14} />
                <span style={{ maxWidth: '150px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {file.name}
                </span>
                <button className={styles.removeFileBtn} onClick={() => removeAttachment(idx)}>
                  <FiX size={14} />
                </button>
              </div>
            ))}
          </div>
        )}

        <div className={styles.postActions}>
          <div className={styles.mediaButtons}>
            <button className={styles.iconBtn} onClick={handleMediaClick}>
              <FiImage size={18} />
              Photo / Video
            </button>
            <button className={styles.iconBtn} onClick={handleDocClick}>
              <FiPaperclip size={18} />
              Attach Document
            </button>
          </div>
          
          <button 
            className={styles.postBtn} 
            disabled={isPostDisabled}
            onClick={handlePost}
          >
            Post
          </button>
        </div>

        <input 
          type="file" 
          ref={mediaInputRef} 
          className={styles.hiddenInput} 
          accept="image/*,video/*"
          multiple
          onChange={handleFileChange}
        />
        <input 
          type="file" 
          ref={docInputRef} 
          className={styles.hiddenInput} 
          accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt"
          multiple
          onChange={handleFileChange}
        />
      </div>

      {/* Feed */}
      <div>
        {posts.length === 0 ? (
          <div style={{ textAlign: 'center', color: 'var(--color-text-muted)', marginTop: 'var(--space-2xl)' }}>
            <p>No posts yet. Be the first to start a discussion!</p>
          </div>
        ) : (
          posts.map(post => <PostItem key={post.id} post={post} currentUser={currentUser} onImageClick={setSelectedImage} onDelete={handleDeletePost} />)
        )}
      </div>

      {/* Lightbox Modal */}
      {selectedImage && (
        <div className={styles.lightboxOverlay} onClick={() => setSelectedImage(null)}>
          <button className={styles.lightboxCloseBtn} onClick={() => setSelectedImage(null)}>
            <FiX size={24} />
          </button>
          <a 
            href={selectedImage} 
            download="community-image.jpg" 
            className={styles.lightboxDownloadBtn} 
            onClick={(e) => e.stopPropagation()}
            title="Download Image"
          >
            <FiDownload size={20} />
          </a>
          <img 
            src={selectedImage} 
            alt="Expanded view" 
            className={styles.lightboxImage} 
            onClick={(e) => e.stopPropagation()} 
          />
        </div>
      )}
    </div>
  );
}
