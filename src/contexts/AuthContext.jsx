import { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';

const AuthContext = createContext(null);

// Wraps Supabase Auth for the admin area. `profile` is the row from
// `profiles` (id, email, role) — NOT just the auth user — because role-based
// UI decisions (admin vs editor) need the `role` column. RLS on the server
// is still what actually enforces permissions; this is only for UI.
export function AuthProvider({ children }) {
  const [session, setSession] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    supabase.auth.getSession().then(({ data }) => {
      if (!mounted) return;
      setSession(data.session);
      setLoading(false);
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession);
    });

    return () => {
      mounted = false;
      listener.subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    async function loadProfile() {
      if (!session?.user) {
        setProfile(null);
        return;
      }
      const { data, error } = await supabase
        .from('profiles')
        .select('id, email, role')
        .eq('id', session.user.id)
        .single();
      if (!cancelled) {
        if (error) {
          // eslint-disable-next-line no-console
          console.error('Failed to load profile', error);
          setProfile(null);
        } else {
          setProfile(data);
        }
      }
    }
    loadProfile();
    return () => {
      cancelled = true;
    };
  }, [session]);

  const signIn = (email, password) => supabase.auth.signInWithPassword({ email, password });
  const signOut = () => supabase.auth.signOut();

  return (
    <AuthContext.Provider
      value={{
        session,
        user: session?.user ?? null,
        profile,
        role: profile?.role ?? null,
        isAdmin: profile?.role === 'admin',
        isEditor: profile?.role === 'editor' || profile?.role === 'admin',
        loading,
        signIn,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
}
