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
  password: string;
  phone_mobile?: string;
  phone_landline?: string;
  address?: string;
  is_active: boolean;
}

export const useEmployeeManagement = (onEmployeeCreated?: (data: { employee: Employee; password: string }) => void) => {
  const { toast } = useToast();
  const { profile } = useAuth();
  const queryClient = useQueryClient();

  // Función para verificar si un email ya existe
  const checkEmailExists = async (email: string): Promise<boolean> => {
    const { data, error } = await supabase
      .from('profiles')
      .select('id')
      .eq('email', email.toLowerCase().trim())
      .maybeSingle();

    if (error && error.code !== 'PGRST116') {
      throw error;
    }

    return !!data;
  };

  // Obtener empleados creados por el email del admin actual
  const { data: employees, isLoading: isLoadingEmployees, error } = useQuery({
    queryKey: ['employees', profile?.email],
    queryFn: async () => {
      if (!profile?.email) throw new Error('No user email found');
      
      console.log('🔍 [EMPLOYEE MANAGEMENT] Fetching employees for admin email:', profile.email);
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('created_by_email', profile.email)
        .order('created_at', { ascending: false });

      if (data) {
        console.log('🔎 [EMPLOYEE MANAGEMENT] created_by_email de empleados encontrados:', data.map(e => e.created_by_email));
      }

      if (error) {
        console.error('❌ [EMPLOYEE MANAGEMENT] Error fetching employees:', error);
        throw error;
      }

      console.log(`✅ [EMPLOYEE MANAGEMENT] Fetched ${data?.length || 0} employees`);
      return data as Employee[];
    },
    enabled: !!profile?.email && (profile.role === 'admin' || profile.role === 'superadmin'),
  });

  // Crear empleado usando edge function para manejar auth.users correctamente
  const createEmployeeMutation = useMutation({
    mutationFn: async (employeeData: EmployeeFormData) => {
      console.log('👤 [EMPLOYEE MANAGEMENT] Creating employee via edge function:', employeeData);
      
      if (!profile?.id || !profile?.email || (profile.role !== 'admin' && profile.role !== 'superadmin')) {
        throw new Error('No tienes permisos para crear empleados');
      }

      // Validar datos obligatorios
      if (!employeeData.email || !employeeData.full_name || !employeeData.password) {
        throw new Error('Email, nombre completo y contraseña son obligatorios');
      }

      // Validar contraseña mínima (ahora 6 caracteres para coincidir con Edge Function)
      if (employeeData.password.length < 6) {
        throw new Error('La contraseña debe tener al menos 6 caracteres');
      }

      // Verificar si el email ya existe (validación preventiva en frontend)
      const emailExists = await checkEmailExists(employeeData.email);
      if (emailExists) {
        throw new Error('Ya existe una cuenta con este correo.');
      }

      // Llamar a la edge function para crear el empleado
      const { data, error } = await supabase.functions.invoke('create-employee', {
        body: {
          employeeData: {
            email: employeeData.email,
            full_name: employeeData.full_name,
            password: employeeData.password,
            phone_mobile: employeeData.phone_mobile,
            phone_landline: employeeData.phone_landline,
            address: employeeData.address,
            is_active: employeeData.is_active
          },
          currentAdminId: profile.id,
          currentAdminEmail: profile.email
        }
      });

      if (error) {
        console.error('❌ [EMPLOYEE MANAGEMENT] Edge function error:', error);
        throw new Error(error.message || 'Error al comunicarse con el servidor');
      }

      if (!data.success) {
        console.error('❌ [EMPLOYEE MANAGEMENT] Employee creation failed:', data.error);
        throw new Error(data.error || 'Error al crear el empleado');
      }

      console.log('✅ [EMPLOYEE MANAGEMENT] Employee created successfully:', data.data);
      return { employee: data.data, password: data.password };
    },
    onSuccess: (data) => {
      console.log('✅ [EMPLOYEE MANAGEMENT] Employee created successfully:', data.employee.id);
      queryClient.invalidateQueries({ queryKey: ['employees'] });
      toast({
        title: 'Empleado creado',
        description: `El empleado ${data.employee.full_name} ha sido creado exitosamente.`,
      });
      // Call the callback if provided
      if (onEmployeeCreated) {
        onEmployeeCreated(data);
      }
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
      
      // Validar permisos
      if (!profile?.id || (profile.role !== 'admin' && profile.role !== 'superadmin')) {
        throw new Error('No tienes permisos para actualizar empleados');
      }
      
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
        .select()
        .maybeSingle();

      if (error) {
        console.error('❌ [EMPLOYEE MANAGEMENT] Update error:', error);
        throw new Error(error.message || 'Error al actualizar el empleado');
      }

      if (!data) {
        throw new Error('Empleado no encontrado o sin permisos para actualizar');
      }

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

  const toggleEmployeeStatusMutation = useMutation({
    mutationFn: async ({ id, is_active }: { id: string; is_active: boolean }) => {
      console.log(`🔄 [EMPLOYEE MANAGEMENT] ${is_active ? 'Activating' : 'Deactivating'} employee:`, id);
      
      const { data, error } = await supabase
        .from('profiles')
        .update({ is_active, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .maybeSingle();

      if (error) {
        console.error('❌ [EMPLOYEE MANAGEMENT] Toggle status error:', error);
        throw new Error(error.message || 'Error al cambiar el estado del empleado');
      }

      if (!data) {
        throw new Error('Empleado no encontrado o sin permisos para modificar');
      }

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
        .maybeSingle();
      
      const { data, error } = await supabase
        .from('profiles')
        .update({ 
          is_active: false, 
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .select()
        .maybeSingle();

      if (error) {
        console.error('❌ [EMPLOYEE MANAGEMENT] Delete error:', error);
        throw new Error(error.message || 'Error al eliminar el empleado');
      }

      if (!data) {
        throw new Error('Empleado no encontrado o sin permisos para eliminar');
      }

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
