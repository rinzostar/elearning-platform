'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createBrowserClient } from '@supabase/ssr'
import styles from './login.module.css'
import { FaGoogle, FaGithub } from 'react-icons/fa'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState(null)
  const [isLoading, setIsLoading] = useState(false)

  const [isSignUp, setIsSignUp] = useState(false)
  const [successMsg, setSuccessMsg] = useState(null)

  // Use a conditional initialization just in case env vars aren't perfectly set
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://example.supabase.co'
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'public-anon-key'
  
  const supabase = createBrowserClient(supabaseUrl, supabaseKey)

  const handleAuth = async (e) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)
    setSuccessMsg(null)
    
    try {
      // DEV BYPASS: Admin login
      if (email === 'admin@admin.com' || email === 'admin') {
        document.cookie = "dev_bypass_auth=true; path=/";
        document.cookie = "sb-iqzhyvggnulolrwpdfxr-auth-token=admin-bypass; path=/"; 
        
        localStorage.setItem('lumina_current_user', JSON.stringify({ name: 'Admin User', role: 'Admin', avatar: 'A', email: 'admin@admin.com' }));
        
        router.push('/home');
        router.refresh();
        return;
      }

      // Check if user exists in local storage members
      const savedMembersStr = localStorage.getItem('lumina_members');
      if (savedMembersStr) {
        const members = JSON.parse(savedMembersStr);
        const member = members.find(m => m.email === email);
        
        if (member) {
          let expectedPassword = 'password123'; // fallback if no DOB
          if (member.dob) {
            const [yyyy, mm, dd] = member.dob.split('-');
            const suffix = member.role === 'Student' ? 'std' : 'prof';
            expectedPassword = `${dd}/${mm}/${yyyy}${suffix}`;
          }

          if (password === expectedPassword) {
            document.cookie = "dev_bypass_auth=true; path=/";
            document.cookie = "sb-iqzhyvggnulolrwpdfxr-auth-token=member-bypass; path=/"; 
            
            localStorage.setItem('lumina_current_user', JSON.stringify({
              name: member.name,
              email: member.email,
              role: member.role,
              avatar: member.name.charAt(0).toUpperCase()
            }));

            router.push('/home');
            router.refresh();
            return;
          } else {
            throw new Error('Invalid password for this member.');
          }
        }
      }

      if (process.env.NEXT_PUBLIC_SUPABASE_URL && !process.env.NEXT_PUBLIC_SUPABASE_URL.includes('your-project')) {
        
        let authError;
        let authUser = null;
        
        if (isSignUp) {
          // SIGN UP
          const { data, error } = await supabase.auth.signUp({
            email,
            password,
          })
          authError = error;
          
          if (!error && data?.user?.identities?.length === 0) {
            authError = { message: "An account with this email already exists. Try signing in!" }
          } else if (!error && data.session === null) {
            setSuccessMsg("Check your email inbox to confirm your account!")
            setIsLoading(false)
            return; // don't push to dashboard yet
          } else if (!error && data.user) {
            authUser = data.user;
          }
        } else {
          // SIGN IN
          const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password,
          })
          authError = error;
          if (!error && data.user) {
            authUser = data.user;
          }
        }

        if (authError) throw authError;

        if (authUser) {
          // Bridge Supabase auth to the app's local storage state
          localStorage.setItem('lumina_current_user', JSON.stringify({
            name: authUser.user_metadata?.name || email.split('@')[0],
            email: authUser.email,
            role: authUser.user_metadata?.role || 'Professor', // Default to Professor for testing
            avatar: (authUser.user_metadata?.name || email).charAt(0).toUpperCase()
          }));
        }

      } else {
        // Mock successful login state
        console.warn('Supabase URL is a dummy value, proceeding with mocked login.')
        document.cookie = "dev_bypass_auth=true; path=/";
      }
      
      // Navigate to dashboard on success
      router.push('/home')
      router.refresh()
    } catch (err) {
      setError(err.message || 'Failed to authenticate')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className={styles.container}>
      <div className={styles.blob1}></div>
      <div className={styles.blob2}></div>
      
      <div className={styles.contentWrapper}>
        <div className={styles.leftSide}>
          <h1 className={styles.brand}>Lumina Learning</h1>
          <p className={styles.tagline}>
            Elevate your journey with our next-generation e-learning platform. Real-time collaboration, rich insights, and engaging content.
          </p>
        </div>
        
        <div className={styles.rightSide}>
          <div className={styles.glassCard}>
            <div className={styles.header}>
              <h2>{isSignUp ? 'Create an Account' : 'Welcome Back'}</h2>
              <p>{isSignUp ? 'Sign up to get started.' : 'Please enter your details to sign in.'}</p>
            </div>
            
            {error && <div className={styles.error} style={{ color: 'var(--color-danger)', marginBottom: '16px', fontSize: '14px', backgroundColor: 'var(--color-accent-pink)', padding: '10px', borderRadius: '8px' }}>{error}</div>}
            {successMsg && <div className={styles.success} style={{ color: 'var(--color-success)', marginBottom: '16px', fontSize: '14px', backgroundColor: 'var(--color-accent-green)', padding: '10px', borderRadius: '8px' }}>{successMsg}</div>}
            
            <form className={styles.form} onSubmit={handleAuth}>
              <div className={styles.inputGroup}>
                <label>Email</label>
                <input 
                  type="email" 
                  className={styles.input} 
                  placeholder="name@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required 
                />
              </div>
              
              <div className={styles.inputGroup}>
                <label>Password</label>
                <input 
                  type="password" 
                  className={styles.input} 
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required 
                />
              </div>
              
              {!isSignUp && <a href="#" className={styles.forgotPassword}>Forgot password?</a>}
              
              <button 
                type="submit" 
                className={styles.submitBtn}
                disabled={isLoading}
              >
                {isLoading ? 'Processing...' : (isSignUp ? 'Sign Up' : 'Sign In')}
              </button>
            </form>
            
            <div className={styles.divider}>or continue with</div>
            
            <div className={styles.socialAuth}>
              <button className={styles.socialBtn} type="button">
                <FaGoogle />
                Google
              </button>
              <button className={styles.socialBtn} type="button">
                <FaGithub />
                GitHub
              </button>
            </div>
            
            <p className={styles.footerText}>
              {isSignUp ? 'Already have an account? ' : "Don't have an account? "}
              <button 
                onClick={() => { setIsSignUp(!isSignUp); setError(null); setSuccessMsg(null); }} 
                style={{ background: 'none', border: 'none', color: 'var(--color-primary)', fontWeight: 500, cursor: 'pointer', fontSize: 'inherit' }}
              >
                {isSignUp ? 'Sign in' : 'Sign up'}
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
