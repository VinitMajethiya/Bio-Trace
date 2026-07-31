import React, { createContext, useContext, useEffect, useState } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signInWithEmail: (email: string, password?: string) => Promise<{ data: any; error: any }>;
  signUpWithEmail: (email: string, password?: string, displayName?: string) => Promise<{ data: any; error: any }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  session: null,
  loading: true,
  signInWithEmail: async () => ({ data: null, error: null }),
  signUpWithEmail: async () => ({ data: null, error: null }),
  signOut: async () => {},
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    // Fetch initial session
    supabase.auth
      .getSession()
      .then(({ data: { session } }) => {
        console.log('[AuthContext] Initial session retrieved:', session?.user?.email || 'No active session');
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);
      })
      .catch((err) => {
        console.error('[AuthContext] Error getting initial session:', err);
        setLoading(false);
      });

    // Listen for auth state changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      console.log(`[AuthContext] Auth state change [${event}]:`, session?.user?.email || 'Logged out');
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const signInWithEmail = async (emailInput: string, password?: string) => {
    const cleanEmail = emailInput.trim().toLowerCase();
    console.log(`[AuthContext] Attempting signInWithEmail for: ${cleanEmail}`);
    setLoading(true);

    if (!password) {
      const res = await supabase.auth.signInWithOtp({ email: cleanEmail });
      if (res.error) {
        console.error('[AuthContext] signInWithOtp Error:', JSON.stringify(res.error, null, 2));
      } else {
        console.log('[AuthContext] signInWithOtp Success');
      }
      setLoading(false);
      return res;
    }

    const maskedPassword = password ? '*'.repeat(password.length) : 'EMPTY';
    console.log(`[AuthContext] Executing signInWithPassword -> email: "${cleanEmail}" (length: ${cleanEmail.length}), password: "${maskedPassword}" (length: ${password?.length || 0})`);

    const res = await supabase.auth.signInWithPassword({
      email: cleanEmail,
      password,
    });

    if (res.error) {
      console.error('[AuthContext] signInWithPassword ERROR:', {
        message: res.error.message,
        status: res.error.status,
        name: res.error.name,
        full: JSON.stringify(res.error, null, 2),
      });
    } else {
      console.log('[AuthContext] signInWithPassword SUCCESS for user:', res.data.user?.email);
    }

    setLoading(false);
    return res;
  };

  const signUpWithEmail = async (emailInput: string, password?: string, displayName?: string) => {
    const cleanEmail = emailInput.trim().toLowerCase();
    console.log(`[AuthContext] Attempting signUpWithEmail for: ${cleanEmail}`);
    setLoading(true);

    const res = await supabase.auth.signUp({
      email: cleanEmail,
      password: password || 'EcoQuestPass123!',
      options: {
        data: {
          display_name: displayName || cleanEmail.split('@')[0],
        },
      },
    });

    if (res.error) {
      console.error('[AuthContext] signUpWithEmail ERROR:', JSON.stringify(res.error, null, 2));
    } else {
      console.log('[AuthContext] signUpWithEmail SUCCESS:', {
        userId: res.data.user?.id,
        emailConfirmed: res.data.user?.email_confirmed_at != null,
        sessionCreated: res.data.session != null,
      });
    }

    setLoading(false);
    return res;
  };

  const signOut = async () => {
    console.log('[AuthContext] Signing out...');
    setLoading(true);
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
    setLoading(false);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        loading,
        signInWithEmail,
        signUpWithEmail,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
