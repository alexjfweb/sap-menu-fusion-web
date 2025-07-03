
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Tables } from '@/integrations/supabase/types';

type Profile = Tables<'profiles'>;

export const useUserRoles = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Función para determinar el rol correcto basado en el email
  const determineRoleByEmail = (email: string): 'empleado' | 'admin' | 'superadmin' => {
    if (email === 'alexjfweb@gmail.com' || email === 'alex10@gmail.com') {
      return 'superadmin';
    } else if (email === 'karen@gmail.com') {
      return 'admin';
    }
    return 'empleado';
  };

  // Mutación para actualizar rol de usuario
  const updateUserRole = useMutation({
    mutationFn: async ({ userId, newRole }: { userId: string; newRole: 'empleado' | 'admin' | 'superadmin' }) => {
      const { data, error } = await supabase
        .from('profiles')
        .update({ role: newRole })
        .eq('id', userId)
        .select()
        .single();

      if (error) {
        console.error('Error updating user role:', error);
        throw error;
      }

      return data;
    },
    onSuccess: (data) => {
      toast({
        title: "Rol actualizado",
        description: `El rol del usuario ha sido actualizado a ${data.role}`,
      });
      queryClient.invalidateQueries({ queryKey: ['profiles'] });
    },
    onError: (error) => {
      console.error('Error updating role:', error);
      toast({
        title: "Error",
        description: "No se pudo actualizar el rol del usuario",
        variant: "destructive",
      });
    },
  });

  // Mutación para sincronizar roles basados en emails especiales
  const syncUserRoles = useMutation({
    mutationFn: async () => {
      console.log('Sincronizando roles de usuarios...');
      
      // Obtener todos los perfiles
      const { data: profiles, error } = await supabase
        .from('profiles')
        .select('*');

      if (error) {
        throw error;
      }

      const updates: Promise<any>[] = [];

      for (const profile of profiles) {
        const expectedRole = determineRoleByEmail(profile.email);
        
        if (profile.role !== expectedRole) {
          console.log(`Actualizando rol de ${profile.email}: ${profile.role} → ${expectedRole}`);
          
          // Execute the query and add the promise to the array
          const updatePromise = supabase
            .from('profiles')
            .update({ role: expectedRole })
            .eq('id', profile.id);
            
          updates.push(updatePromise);
        }
      }

      if (updates.length > 0) {
        await Promise.all(updates);
        console.log(`${updates.length} roles actualizados`);
      }

      return updates.length;
    },
    onSuccess: (updatedCount) => {
      if (updatedCount > 0) {
        toast({
          title: "Roles sincronizados",
          description: `${updatedCount} roles de usuario fueron actualizados`,
        });
      } else {
        toast({
          title: "Roles en orden",
          description: "Todos los roles están correctamente asignados",
        });
      }
      queryClient.invalidateQueries({ queryKey: ['profiles'] });
    },
    onError: (error) => {
      console.error('Error syncing roles:', error);
      toast({
        title: "Error",
        description: "No se pudieron sincronizar los roles",
        variant: "destructive",
      });
    },
  });

  return {
    updateUserRole,
    syncUserRoles,
    determineRoleByEmail,
  };
};
