// Script para crear el usuario superadministrador allseosoporte@gmail.com
import { supabase } from '@/integrations/supabase/client';

export const createSuperAdminUser = async () => {
  try {
    console.log('🚀 Creando usuario superadministrador: allseosoporte@gmail.com');
    
    // Crear el usuario en auth.users
    const { data, error } = await supabase.auth.signUp({
      email: 'allseosoporte@gmail.com',
      password: 'SuperAdmin123!',
      options: {
        emailRedirectTo: `${window.location.origin}/dashboard`,
        data: {
          full_name: 'All SEO Soporte',
        },
      },
    });

    if (error) {
      console.error('❌ Error creando usuario:', error);
      return { success: false, error: error.message };
    }

    if (data.user) {
      console.log('✅ Usuario creado en auth.users:', data.user.id);
      
      // Esperar un momento para que el trigger cree el perfil
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Promover a superadmin
      const { data: promoteResult, error: promoteError } = await supabase.rpc('promote_to_superadmin', {
        user_email: 'allseosoporte@gmail.com'
      });
      
      if (promoteError) {
        console.error('❌ Error promoviendo a superadmin:', promoteError);
        return { success: false, error: promoteError.message };
      }
      
      if (promoteResult) {
        console.log('✅ Usuario promovido a superadmin exitosamente');
        
        // Verificar el resultado
        const { data: profileData } = await supabase
          .from('profiles')
          .select('*')
          .eq('email', 'allseosoporte@gmail.com')
          .single();
          
        console.log('📋 Perfil creado:', profileData);
        
        return { success: true, user: data.user, profile: profileData };
      }
    }
    
    return { success: false, error: 'No se pudo crear el usuario' };
    
  } catch (error) {
    console.error('❌ Error inesperado:', error);
    return { success: false, error: 'Error inesperado' };
  }
};

// Ejecutar si se llama directamente
if (typeof window !== 'undefined') {
  (window as any).createSuperAdminUser = createSuperAdminUser;
  console.log('📝 Script cargado. Ejecuta createSuperAdminUser() en la consola para crear el usuario.');
}