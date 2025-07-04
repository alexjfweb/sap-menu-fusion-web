
import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Session, User } from '@supabase/supabase-js';
import { Tables } from '@/integrations/supabase/types';
import { cleanupAuthState } from '@/integrations/supabase/authUtils';

type Profile = Tables<'profiles'>;

interface AuthContextType {
  session: Session | null;
  user: User | null;
  profile: Profile | null;
  loading: boolean;
  signOut: () => Promise<void>;
  isAuthenticated: boolean;
  role: string;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    
    // Set up auth state listener FIRST
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!mounted) return;
      
      console.log('🔐 Auth state change event:', event, session?.user?.email || 'No session');
      
      // Update state synchronously to prevent race conditions
      setSession(session);
      setUser(session?.user ?? null);
      
      if (event === 'SIGNED_IN' && session?.user) {
        // Log detalles del usuario para usuarios especiales
        if (session.user.email === 'alexjfweb@gmail.com' || session.user.email === 'superadmin@gmail.com') {
          console.log('👑 Usuario especial detectado:', {
            email: session.user.email,
            id: session.user.id,
            created_at: session.user.created_at,
            last_sign_in_at: session.user.last_sign_in_at,
            user_metadata: session.user.user_metadata
          });
        }
        
        // Defer profile fetching to prevent deadlocks
        setTimeout(() => {
          if (mounted) {
            fetchOrCreateProfile(session.user);
          }
        }, 100);
      } else if (event === 'SIGNED_OUT' || !session) {
        if (mounted) {
          setProfile(null);
          setLoading(false);
        }
      }
    });

    // THEN check for existing session using safe method
    const initializeAuth = async () => {
      try {
        const { data, error } = await supabase.auth.getSession();
        
        if (!mounted) return;
        
        if (error) {
          console.error('❌ Error getting session:', error);
          setLoading(false);
          return;
        }

        console.log('🔍 Initial session check:', data.session?.user?.email || 'No session');
        setSession(data.session);
        setUser(data.session?.user ?? null);
        
        if (data.session?.user) {
          await fetchOrCreateProfile(data.session.user);
        } else {
          setLoading(false);
        }
      } catch (error) {
        console.error('❌ Error initializing auth:', error);
        if (mounted) {
          setLoading(false);
        }
      }
    };

    initializeAuth();

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const fetchOrCreateProfile = async (user: User) => {
    try {
      console.log('👤 Fetching profile for user:', user.id, user.email);
      
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') {
        console.error('❌ Error fetching profile:', error);
        setProfile(null);
        setLoading(false);
        return;
      }

      if (!data) {
        console.log('📝 Profile not found, creating new profile for user:', user.email);
        await createProfile(user);
      } else {
        console.log('✅ Profile found:', {
          email: data.email,
          role: data.role,
          is_active: data.is_active,
          created_at: data.created_at
        });
        
        // Check if we need to update the role for special emails
        await updateRoleIfNeeded(user, data);
      }
    } catch (error) {
      console.error('❌ Unexpected error fetching profile:', error);
      setProfile(null);
      setLoading(false);
    }
  };

  const updateRoleIfNeeded = async (user: User, existingProfile: Profile) => {
    try {
      // Determine the correct role based on email - ACTUALIZADO PARA alexjfweb@gmail.com
      let expectedRole: 'empleado' | 'admin' | 'superadmin' = 'empleado';
      if (user.email === 'alexjfweb@gmail.com' || user.email === 'superadmin@gmail.com') {
        expectedRole = 'superadmin';
      } else if (user.email === 'karen@gmail.com') {
        expectedRole = 'admin';
      }

      // If the role needs to be updated
      if (existingProfile.role !== expectedRole) {
        console.log(`🔄 Updating role for ${user.email} from ${existingProfile.role} to ${expectedRole}`);
        
        const { data, error } = await supabase
          .from('profiles')
          .update({ role: expectedRole })
          .eq('id', user.id)
          .select()
          .single();

        if (error) {
          console.error('❌ Error updating profile role:', error);
          setProfile(existingProfile);
        } else {
          console.log('✅ Role updated successfully:', data);
          setProfile(data);
        }
      } else {
        console.log('✅ Role is already correct:', existingProfile.role);
        
        // Log información adicional para usuarios especiales
        if (user.email === 'alexjfweb@gmail.com' || user.email === 'superadmin@gmail.com') {
          console.log('👑 Usuario especial - Estado del perfil:', {
            email: existingProfile.email,
            role: existingProfile.role,
            is_active: existingProfile.is_active,
            full_name: existingProfile.full_name,
            created_at: existingProfile.created_at,
            updated_at: existingProfile.updated_at
          });
        }
        
        setProfile(existingProfile);
      }
    } catch (error) {
      console.error('❌ Error updating role:', error);
      setProfile(existingProfile);
    } finally {
      setLoading(false);
    }
  };

  const createProfile = async (user: User) => {
    try {
      console.log('📝 Creating profile for user:', user.email);
      
      // Extract name from user metadata or use email
      const fullName = user.user_metadata?.full_name || 
                      user.user_metadata?.name || 
                      user.email?.split('@')[0] || 
                      'Usuario';

      // Set role based on email - ACTUALIZADO PARA alexjfweb@gmail.com
      let role: 'empleado' | 'admin' | 'superadmin' = 'empleado';
      if (user.email === 'alexjfweb@gmail.com' || user.email === 'superadmin@gmail.com') {
        role = 'superadmin';
      } else if (user.email === 'karen@gmail.com') {
        role = 'admin';
      }
      
      console.log('👑 Assigning role:', role, 'to user:', user.email);

      const { data, error } = await supabase
        .from('profiles')
        .insert({
          id: user.id,
          email: user.email!,
          full_name: fullName,
          role: role,
          is_active: true
        })
        .select()
        .single();

      if (error) {
        console.error('❌ Error creating profile:', error);
        setProfile(null);
      } else {
        console.log('✅ Profile created successfully:', data);
        setProfile(data);
      }
    } catch (error) {
      console.error('❌ Unexpected error creating profile:', error);
      setProfile(null);
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    try {
      console.log('🚪 Signing out user');
      
      // Clean up auth state first
      cleanupAuthState();
      
      // Sign out from Supabase with error handling
      try {
        await supabase.auth.signOut({ scope: 'global' });
      } catch (signOutError) {
        console.log('⚠️ Error during sign out:', signOutError);
        // Continue with cleanup even if sign out fails
      }
      
      // Reset state
      setSession(null);
      setUser(null);
      setProfile(null);
      
      // Force page reload for clean state
      setTimeout(() => {
        window.location.href = '/auth';
      }, 100);
    } catch (error) {
      console.error('❌ Error signing out:', error);
      // Force reload anyway
      setTimeout(() => {
        window.location.href = '/auth';
      }, 100);
    }
  };

  const value: AuthContextType = {
    session,
    user,
    profile,
    loading,
    signOut,
    isAuthenticated: !!session,
    role: profile?.role || 'empleado',
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
