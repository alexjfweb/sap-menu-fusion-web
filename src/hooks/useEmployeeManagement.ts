
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';

export interface Employee {
  id: string;
  email: string;
  full_name: string | null;
  role: 'empleado' | 'admin' | 'superadmin';
  is_active: boolean;
  created_at: string;
  updated_at: string;
  created_by: string | null;
  phone_mobile: string | null;
  phone_landline: string | null;
  address: string | null;
  avatar_url: string | null;
}

export interface EmployeeFormData {
  email: string;
  full_name: string;
  role: 'empleado' | 'admin';
  phone_mobile?: string;
  phone_landline?: string;
  address?: string;
  is_active: boolean;
}

export const useEmployeeManagement = () => {
  const { toast } = useToast();
  const { profile } = useAuth();
  const queryClient = useQueryClient();

  // Obtener empleados del administrador actual
  const { data: employees, isLoading: isLoadingEmployees, error } = useQuery({
    queryKey: ['employees', profile?.id],
    queryFn: async () => {
      if (!profile?.id) throw new Error('No user profile found');
      
      console.log('🔍 [EMPLOYEE MANAGEMENT] Fetching employees for admin:', profile.id);
      
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('created_by', profile.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('❌ [EMPLOYEE MANAGEMENT] Error fetching employees:', error);
        throw error;
      }

      console.log(`✅ [EMPLOYEE MANAGEMENT] Fetched ${data?.length || 0} employees`);
      return data as Employee[];
    },
    enabled: !!profile?.id && (profile.role === 'admin' || profile.role === 'superadmin'),
  });

  // Crear empleado - Usando un UUID generado automáticamente
  const createEmployeeMutation = useMutation({
    mutationFn: async (employeeData: EmployeeFormData) => {
      console.log('👤 [EMPLOYEE MANAGEMENT] Creating employee:', employeeData);
      
      const { data, error } = await supabase
        .from('profiles')
        .insert({
          email: employeeData.email,
          full_name: employeeData.full_name,
          role: employeeData.role,
          phone_mobile: employeeData.phone_mobile || null,
          phone_landline: employeeData.phone_landline || null,
          address: employeeData.address || null,
          is_active: employeeData.is_active,
          created_by: profile?.id,
        })
        .select()
        .single();

      if (error) throw error;

      // Registrar actividad
      if (data && profile?.id) {
        await supabase.rpc('log_employee_activity', {
          p_employee_id: profile.id,
          p_activity_type: 'employee_created',
          p_description: `Empleado creado: ${employeeData.full_name}`,
          p_entity_type: 'employee',
          p_entity_id: data.id,
          p_metadata: { employee_email: employeeData.email, employee_role: employeeData.role }
        });
      }

      return data;
    },
    onSuccess: (data) => {
      console.log('✅ [EMPLOYEE MANAGEMENT] Employee created successfully:', data.id);
      queryClient.invalidateQueries({ queryKey: ['employees'] });
      toast({
        title: 'Empleado creado',
        description: `El empleado ${data.full_name} ha sido creado exitosamente.`,
      });
    },
    onError: (error: any) => {
      console.error('❌ [EMPLOYEE MANAGEMENT] Error creating employee:', error);
      toast({
        title: 'Error al crear empleado',
        description: error.message || 'Ocurrió un error inesperado',
        variant: 'destructive',
      });
    },
  });

  // Actualizar empleado
  const updateEmployeeMutation = useMutation({
    mutationFn: async ({ id, data: updateData }: { id: string; data: Partial<EmployeeFormData> }) => {
      console.log('✏️ [EMPLOYEE MANAGEMENT] Updating employee:', id, updateData);
      
      const { data, error } = await supabase
        .from('profiles')
        .update({
          full_name: updateData.full_name,
          role: updateData.role,
          phone_mobile: updateData.phone_mobile || null,
          phone_landline: updateData.phone_landline || null,
          address: updateData.address || null,
          is_active: updateData.is_active,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .eq('created_by', profile?.id) // Solo puede actualizar empleados que creó
        .select()
        .single();

      if (error) throw error;

      // Registrar actividad
      if (data && profile?.id) {
        await supabase.rpc('log_employee_activity', {
          p_employee_id: profile.id,
          p_activity_type: 'employee_updated',
          p_description: `Empleado actualizado: ${data.full_name}`,
          p_entity_type: 'employee',
          p_entity_id: data.id,
          p_metadata: updateData
        });
      }

      return data;
    },
    onSuccess: (data) => {
      console.log('✅ [EMPLOYEE MANAGEMENT] Employee updated successfully:', data.id);
      queryClient.invalidateQueries({ queryKey: ['employees'] });
      toast({
        title: 'Empleado actualizado',
        description: `Los datos de ${data.full_name} han sido actualizados.`,
      });
    },
    onError: (error: any) => {
      console.error('❌ [EMPLOYEE MANAGEMENT] Error updating employee:', error);
      toast({
        title: 'Error al actualizar empleado',
        description: error.message || 'Ocurrió un error inesperado',
        variant: 'destructive',
      });
    },
  });

  // Activar/Desactivar empleado
  const toggleEmployeeStatusMutation = useMutation({
    mutationFn: async ({ id, is_active }: { id: string; is_active: boolean }) => {
      console.log(`🔄 [EMPLOYEE MANAGEMENT] ${is_active ? 'Activating' : 'Deactivating'} employee:`, id);
      
      const { data, error } = await supabase
        .from('profiles')
        .update({ is_active, updated_at: new Date().toISOString() })
        .eq('id', id)
        .eq('created_by', profile?.id)
        .select()
        .single();

      if (error) throw error;

      // Registrar actividad
      if (data && profile?.id) {
        await supabase.rpc('log_employee_activity', {
          p_employee_id: profile.id,
          p_activity_type: is_active ? 'employee_activated' : 'employee_deactivated',
          p_description: `Empleado ${is_active ? 'activado' : 'desactivado'}: ${data.full_name}`,
          p_entity_type: 'employee',
          p_entity_id: data.id,
          p_metadata: { previous_status: !is_active, new_status: is_active }
        });
      }

      return data;
    },
    onSuccess: (data) => {
      const action = data.is_active ? 'activado' : 'desactivado';
      console.log(`✅ [EMPLOYEE MANAGEMENT] Employee ${action} successfully:`, data.id);
      queryClient.invalidateQueries({ queryKey: ['employees'] });
      toast({
        title: `Empleado ${action}`,
        description: `${data.full_name} ha sido ${action} exitosamente.`,
      });
    },
    onError: (error: any) => {
      console.error('❌ [EMPLOYEE MANAGEMENT] Error toggling employee status:', error);
      toast({
        title: 'Error al cambiar estado',
        description: error.message || 'Ocurrió un error inesperado',
        variant: 'destructive',
      });
    },
  });

  // Eliminar empleado (soft delete)
  const deleteEmployeeMutation = useMutation({
    mutationFn: async (id: string) => {
      console.log('🗑️ [EMPLOYEE MANAGEMENT] Soft deleting employee:', id);
      
      // Primero obtenemos los datos del empleado para el log
      const { data: employeeData } = await supabase
        .from('profiles')
        .select('full_name')
        .eq('id', id)
        .single();
      
      const { data, error } = await supabase
        .from('profiles')
        .update({ 
          is_active: false, 
          updated_at: new Date().toISOString(),
          // Marcar como eliminado en metadata o campo específico si es necesario
        })
        .eq('id', id)
        .eq('created_by', profile?.id)
        .select()
        .single();

      if (error) throw error;

      // Registrar actividad
      if (data && profile?.id) {
        await supabase.rpc('log_employee_activity', {
          p_employee_id: profile.id,
          p_activity_type: 'employee_deleted',
          p_description: `Empleado eliminado: ${employeeData?.full_name || 'Desconocido'}`,
          p_entity_type: 'employee',
          p_entity_id: data.id,
          p_metadata: { action: 'soft_delete' }
        });
      }

      return data;
    },
    onSuccess: (data) => {
      console.log('✅ [EMPLOYEE MANAGEMENT] Employee deleted successfully:', data.id);
      queryClient.invalidateQueries({ queryKey: ['employees'] });
      toast({
        title: 'Empleado eliminado',
        description: `${data.full_name} ha sido eliminado del sistema.`,
      });
    },
    onError: (error: any) => {
      console.error('❌ [EMPLOYEE MANAGEMENT] Error deleting employee:', error);
      toast({
        title: 'Error al eliminar empleado',
        description: error.message || 'Ocurrió un error inesperado',
        variant: 'destructive',
      });
    },
  });

  return {
    employees: employees || [],
    isLoadingEmployees,
    error,
    createEmployee: createEmployeeMutation.mutate,
    isCreatingEmployee: createEmployeeMutation.isPending,
    updateEmployee: updateEmployeeMutation.mutate,
    isUpdatingEmployee: updateEmployeeMutation.isPending,
    toggleEmployeeStatus: toggleEmployeeStatusMutation.mutate,
    isTogglingStatus: toggleEmployeeStatusMutation.isPending,
    deleteEmployee: deleteEmployeeMutation.mutate,
    isDeletingEmployee: deleteEmployeeMutation.isPending,
  };
};
