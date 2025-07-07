
import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface UserRoleConfig {
  email: string;
  role: 'empleado' | 'admin' | 'superadmin';
}

// Configuración de roles por email
const USER_ROLE_CONFIG: UserRoleConfig[] = [
  { email: 'admin@restaurant.com', role: 'superadmin' },
  { email: 'manager@restaurant.com', role: 'admin' },
  { email: 'staff@restaurant.com', role: 'empleado' }
];

export const useUserRoles = () => {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const getUserRoleByEmail = (email: string): 'empleado' | 'admin' | 'superadmin' => {
    const config = USER_ROLE_CONFIG.find(config => config.email === email);
    return config?.role || 'admin';
  };

  const syncUserRoles = async () => {
    setIsLoading(true);
    console.log('Iniciando sincronización de roles de usuario...');

    try {
      // Obtener todos los perfiles
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('id, email, role');

      if (profilesError) {
        console.error('Error al obtener perfiles:', profilesError);
        throw profilesError;
      }

      if (!profiles || profiles.length === 0) {
        console.log('No se encontraron perfiles para sincronizar');
        return;
      }

      console.log(`Encontrados ${profiles.length} perfiles para revisar`);

      // Revisar cada perfil y actualizar roles si es necesario
      const updatePromises: Promise<any>[] = [];

      for (const profile of profiles) {
        const expectedRole = getUserRoleByEmail(profile.email);
        
        if (profile.role !== expectedRole) {
          console.log(`Actualizando rol de ${profile.email}: ${profile.role} → ${expectedRole}`);
          
          // Crear una función async autoejecutable que devuelve Promise<any>
          const updatePromise = (async (): Promise<any> => {
            const { error } = await supabase
              .from('profiles')
              .update({ role: expectedRole })
              .eq('id', profile.id);

            if (error) {
              console.error(`Error actualizando rol para ${profile.email}:`, error);
              throw error;
            }
            
            console.log(`✅ Rol actualizado para ${profile.email}: ${expectedRole}`);
            return { email: profile.email, role: expectedRole };
          })();

          updatePromises.push(updatePromise);
        } else {
          console.log(`✅ ${profile.email} ya tiene el rol correcto: ${profile.role}`);
        }
      }

      // Ejecutar todas las actualizaciones
      if (updatePromises.length > 0) {
        console.log(`Ejecutando ${updatePromises.length} actualizaciones de roles...`);
        await Promise.all(updatePromises);
        
        toast({
          title: "Roles sincronizados",
          description: `Se actualizaron ${updatePromises.length} roles de usuario correctamente`,
        });
      } else {
        console.log('No se requieren actualizaciones de roles');
        toast({
          title: "Roles verificados",
          description: "Todos los roles de usuario están actualizados",
        });
      }

    } catch (error: any) {
      console.error('Error en sincronización de roles:', error);
      toast({
        title: "Error",
        description: error.message || "Error al sincronizar roles de usuario",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const createUserWithRole = async (email: string, userData: any) => {
    console.log('Creando usuario con rol basado en email:', email);
    
    const expectedRole = getUserRoleByEmail(email);
    console.log(`Rol esperado para ${email}: ${expectedRole}`);

    try {
      // Crear el perfil con el rol correcto
      const { data, error } = await supabase
        .from('profiles')
        .insert({
          ...userData,
          email,
          role: expectedRole
        })
        .select()
        .single();

      if (error) {
        console.error('Error creando perfil con rol:', error);
        throw error;
      }

      console.log(`✅ Usuario creado con rol ${expectedRole}:`, data);
      
      toast({
        title: "Usuario creado",
        description: `Usuario creado exitosamente con rol: ${expectedRole}`,
      });

      return data;
    } catch (error: any) {
      console.error('Error en createUserWithRole:', error);
      toast({
        title: "Error",
        description: error.message || "Error al crear usuario con rol",
        variant: "destructive"
      });
      throw error;
    }
  };

  const updateUserRole = async (userId: string, email: string) => {
    console.log('Actualizando rol para usuario:', userId, email);
    
    const expectedRole = getUserRoleByEmail(email);
    console.log(`Rol esperado para ${email}: ${expectedRole}`);

    try {
      const { data, error } = await supabase
        .from('profiles')
        .update({ role: expectedRole })
        .eq('id', userId)
        .select()
        .single();

      if (error) {
        console.error('Error actualizando rol:', error);
        throw error;
      }

      console.log(`✅ Rol actualizado para ${email}: ${expectedRole}`, data);
      
      toast({
        title: "Rol actualizado",
        description: `Rol actualizado a: ${expectedRole}`,
      });

      return data;
    } catch (error: any) {
      console.error('Error en updateUserRole:', error);
      toast({
        title: "Error",
        description: error.message || "Error al actualizar rol",
        variant: "destructive"
      });
      throw error;
    }
  };

  // NOTA: syncUserRoles ahora debe ejecutarse manualmente desde el panel de Super Admin
  // Removido useEffect automático para evitar sobrescribir roles por defecto de Supabase

  return {
    isLoading,
    syncUserRoles,
    createUserWithRole,
    updateUserRole,
    getUserRoleByEmail
  };
};
