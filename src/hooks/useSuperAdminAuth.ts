
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface UserStatus {
  exists: boolean;
  id?: string;
  email?: string;
  role?: string;
  created_at?: string;
  last_sign_in_at?: string;
  is_active?: boolean;
}

export const useSuperAdminAuth = () => {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const checkUserExists = async (email: string): Promise<UserStatus> => {
    try {
      console.log(`🔍 Verificando existencia del usuario: ${email}`);
      
      // Verificar en profiles primero (más confiable para nuestro caso)
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('id, email, role, is_active, created_at')
        .eq('email', email)
        .maybeSingle();

      if (profileError && profileError.code !== 'PGRST116') {
        console.error('❌ Error verificando perfil:', profileError);
        throw profileError;
      }

      if (profileData) {
        console.log('✅ Usuario encontrado en profiles:', {
          id: profileData.id,
          email: profileData.email,
          role: profileData.role,
          is_active: profileData.is_active
        });

        return {
          exists: true,
          id: profileData.id,
          email: profileData.email,
          role: profileData.role,
          is_active: profileData.is_active,
          created_at: profileData.created_at
        };
      }

      console.log('❌ Usuario no encontrado en profiles');
      return { exists: false };
    } catch (error) {
      console.error('❌ Error verificando usuario:', error);
      return { exists: false };
    }
  };

  const resetPassword = async (email: string): Promise<{ success: boolean; error?: string }> => {
    try {
      setLoading(true);
      console.log(`🔄 Enviando enlace de restablecimiento de contraseña a: ${email}`);

      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth?reset=true`,
      });

      if (error) {
        console.error('❌ Error enviando enlace de restablecimiento:', error);
        return { success: false, error: error.message };
      }

      console.log('✅ Enlace de restablecimiento enviado exitosamente');
      return { success: true };
    } catch (error) {
      console.error('❌ Error inesperado:', error);
      return { success: false, error: 'Error inesperado' };
    } finally {
      setLoading(false);
    }
  };

  const updatePassword = async (newPassword: string): Promise<{ success: boolean; error?: string }> => {
    try {
      setLoading(true);
      console.log('🔄 Actualizando contraseña...');

      const { error } = await supabase.auth.updateUser({
        password: newPassword
      });

      if (error) {
        console.error('❌ Error actualizando contraseña:', error);
        return { success: false, error: error.message };
      }

      console.log('✅ Contraseña actualizada exitosamente');
      return { success: true };
    } catch (error) {
      console.error('❌ Error inesperado actualizando contraseña:', error);
      return { success: false, error: 'Error inesperado' };
    } finally {
      setLoading(false);
    }
  };

  const createSuperAdmin = async (email: string, password: string, fullName: string): Promise<{ success: boolean; error?: string }> => {
    try {
      setLoading(true);
      console.log(`📝 Creando cuenta de super administrador: ${email}`);

      const redirectUrl = `${window.location.origin}/dashboard`;

      const { data, error } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: {
          emailRedirectTo: redirectUrl,
          data: {
            full_name: fullName,
          },
        },
      });

      if (error) {
        console.error('❌ Error creando super admin:', error);
        return { success: false, error: error.message };
      }

      if (data.user) {
        console.log('✅ Super admin creado exitosamente:', {
          id: data.user.id,
          email: data.user.email,
          created_at: data.user.created_at
        });
        
        // Mensaje especial para alexjfweb@gmail.com
        if (email === 'alexjfweb@gmail.com') {
          toast({
            title: '🎉 Super Administrador alexjfweb@gmail.com creado',
            description: 'Cuenta creada con acceso completo al panel de administración.',
          });
        }
        
        return { success: true };
      }

      return { success: false, error: 'No se pudo crear el usuario' };
    } catch (error) {
      console.error('❌ Error inesperado creando super admin:', error);
      return { success: false, error: 'Error inesperado' };
    } finally {
      setLoading(false);
    }
  };

  return {
    loading,
    checkUserExists,
    resetPassword,
    updatePassword,
    createSuperAdmin
  };
};
