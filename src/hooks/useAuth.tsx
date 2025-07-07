
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
    console.log('🔄 AuthProvider: Inicializando sistema de autenticación');
    
    // Set up auth state listener FIRST
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!mounted) {
        console.log('⚠️ AuthProvider: Componente desmontado, ignorando evento');
        return;
      }
      
      console.log('🔐 Auth state change event:', event, session?.user?.email || 'No session');
      
      // Update state synchronously to prevent race conditions
      setSession(session);
      setUser(session?.user ?? null);
      
      if (event === 'SIGNED_IN' && session?.user) {
        console.log('✅ Usuario autenticado:', session.user.email);
        // Defer profile fetching to prevent deadlocks
        setTimeout(() => {
          if (mounted) {
            fetchProfile(session.user);
          }
        }, 100);
      } else if (event === 'SIGNED_OUT' || !session) {
        console.log('🚪 Usuario desconectado');
        if (mounted) {
          setProfile(null);
          setLoading(false);
        }
      }
    });

    // THEN check for existing session using safe method
    const initializeAuth = async () => {
      try {
        console.log('🔍 Verificando sesión existente...');
        const { data, error } = await supabase.auth.getSession();
        
        if (!mounted) return;
        
        if (error) {
          console.error('❌ Error getting session:', error);
          setLoading(false);
          return;
        }

        console.log('🔍 Sesión inicial:', data.session?.user?.email || 'No session');
        setSession(data.session);
        setUser(data.session?.user ?? null);
        
        if (data.session?.user) {
          await fetchProfile(data.session.user);
        } else {
          setLoading(false);
        }
      } catch (error) {
        console.error('❌ Error inicializando auth:', error);
        if (mounted) {
          setLoading(false);
        }
      }
    };

    initializeAuth();

    return () => {
      console.log('🧹 AuthProvider: Limpiando listeners');
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const fetchProfile = async (user: User) => {
    try {
      console.log('👤 Obteniendo perfil para usuario:', user.id, user.email);
      
      // Add timeout to prevent infinite loading
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Profile fetch timeout')), 10000);
      });

      const profilePromise = supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .maybeSingle();

      const { data, error } = await Promise.race([profilePromise, timeoutPromise]) as any;

      if (error && error.code !== 'PGRST116') {
        console.error('❌ Error fetching profile:', error);
        setProfile(null);
        setLoading(false);
        return;
      }

      if (data) {
        console.log('✅ Perfil encontrado:', {
          email: data.email,
          role: data.role,
          is_active: data.is_active
        });
        setProfile(data);
      } else {
        console.log('⚠️ No se encontró perfil para el usuario. El trigger debería haberlo creado.');
        setProfile(null);
      }
    } catch (error) {
      console.error('❌ Error inesperado obteniendo perfil:', error);
      setProfile(null);
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    try {
      console.log('🚪 Cerrando sesión de usuario');
      
      // Clean up auth state first
      cleanupAuthState();
      
      // Sign out from Supabase with error handling
      try {
        await supabase.auth.signOut({ scope: 'global' });
      } catch (signOutError) {
        console.log('⚠️ Error durante cierre de sesión:', signOutError);
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
      console.error('❌ Error cerrando sesión:', error);
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
