
import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Session, User } from '@supabase/supabase-js';
import { Tables } from '@/integrations/supabase/types';

type Profile = Tables<'profiles'>;

export const useAuth = () => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      console.log('Initial session check:', session?.user?.email || 'No session');
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchProfile(session.user.id);
      } else {
        setLoading(false);
      }
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      console.log('Auth state change event:', _event, session?.user?.email || 'No session');
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchProfile(session.user.id);
      } else {
        setProfile(null);
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchProfile = async (userId: string) => {
    try {
      console.log('Fetching profile for user:', userId);
      
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) {
        console.error('Error fetching profile:', error);
        // If profile doesn't exist, this might be a new user
        if (error.code === 'PGRST116') {
          console.log('Profile not found, user might need profile creation');
          setProfile(null);
        } else {
          console.error('Database error:', error.message);
        }
      } else {
        console.log('Profile fetched successfully:', data);
        setProfile(data);
      }
    } catch (error) {
      console.error('Unexpected error fetching profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    try {
      console.log('Signing out user');
      await supabase.auth.signOut();
      setSession(null);
      setUser(null);
      setProfile(null);
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  return {
    session,
    user,
    profile,
    loading,
    signOut,
    isAuthenticated: !!session,
    role: profile?.role || 'empleado',
  };
};
