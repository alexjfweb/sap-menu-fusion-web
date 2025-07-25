import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  ArrowLeft,
  Search,
  UserPlus,
  Edit,
  Trash2,
  Shield,
  Mail,
  Calendar,
  Filter,
  CheckCircle
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Tables } from '@/integrations/supabase/types';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import UserForm from './UserForm';
import DeleteUserModal from './DeleteUserModal';

type Profile = Tables<'profiles'>;

interface UserManagementProps {
  onBack: () => void;
}

const UserManagement = ({ onBack }: UserManagementProps) => {
  const { profile: currentUserProfile } = useAuth();
  const { toast } = useToast();
  const [users, setUsers] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRole, setSelectedRole] = useState<string>('all');
  const [showUserForm, setShowUserForm] = useState(false);
  const [editingUser, setEditingUser] = useState<Profile | null>(null);
  const [recentlyCreatedUser, setRecentlyCreatedUser] = useState<string | null>(null);
  const [deleteModal, setDeleteModal] = useState<{
    isOpen: boolean;
    user: Profile | null;
  }>({
    isOpen: false,
    user: null
  });

  // Función para verificar si el usuario actual puede ver cuentas Super Admin
  const canViewSuperAdmins = () => {
    return currentUserProfile?.role === 'superadmin';
  };

  // Función para verificar si el usuario actual puede gestionar una cuenta específica
  const canManageUser = (targetUser: Profile) => {
    if (!currentUserProfile) return false;
    
    // Super Admin puede gestionar cualquier cuenta
    if (currentUserProfile.role === 'superadmin') {
      return true;
    }
    
    // Admin y Empleado NO pueden gestionar cuentas Super Admin
    if (targetUser.role === 'superadmin') {
      return false;
    }
    
    // Admin puede gestionar empleados que haya creado
    if (currentUserProfile.role === 'admin' && targetUser.role === 'empleado') {
      return targetUser.created_by === currentUserProfile.id;
    }
    
    // Los usuarios pueden gestionar su propio perfil
    return currentUserProfile.id === targetUser.id;
  };

  // Función para filtrar usuarios según el rol del usuario actual y relación de creador
  const filterUsersByPermissions = (userList: Profile[]) => {
    if (!currentUserProfile) {
      console.log('❌ No current user profile found');
      return [];
    }
    
    console.log('🔍 Filtering users for current user:', {
      id: currentUserProfile.id,
      email: currentUserProfile.email,
      role: currentUserProfile.role
    });
    
    console.log(`📊 Total users to filter: ${userList.length}`);
    
    const filtered = userList.filter(user => {
      // Si el usuario actual es Super Admin, puede ver todos
      if (currentUserProfile.role === 'superadmin') {
        return true;
      }
      
      // Admin y Empleado NO pueden ver cuentas Super Admin
      if (user.role === 'superadmin') {
        return false;
      }
      
      // Admin puede ver:
      // 1. Su propio perfil
      // 2. Solo los empleados que ha creado (created_by = admin.id)
      if (currentUserProfile.role === 'admin') {
        const isOwnProfile = user.id === currentUserProfile.id;
        const isCreatedEmployee = user.role === 'empleado' && user.created_by === currentUserProfile.id;
        
        return isOwnProfile || isCreatedEmployee;
      }
      
      // Empleado solo puede ver su propio perfil
      return user.id === currentUserProfile.id;
    });
    
    console.log(`✨ Filtered users count: ${filtered.length}`);
    
    return filtered;
  };

  const fetchUsers = async () => {
    if (!currentUserProfile) {
      console.log('No current user profile, skipping fetch');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      console.log('🚀 Fetching users for:', currentUserProfile.email, currentUserProfile.role);
      
      const { data, error } = await supabase
        .from('profiles')
        .select(`
          id,
          email,
          full_name,
          role,
          created_by,
          created_by_email,
          is_active,
          created_at,
          updated_at,
          phone_mobile,
          phone_landline,
          address,
          avatar_url,
          password_hash,
          business_id
        `)
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('❌ Error fetching users:', error);
        throw error;
      }
      
      console.log(`📦 Fetched ${data?.length || 0} users from database`);
      
      // Aplicar filtro de permisos
      const filteredUsers = filterUsersByPermissions(data || []);
      
      console.log(`🎯 Final visible users: ${filteredUsers.length}`);
      
      setUsers(filteredUsers);
      
      if (filteredUsers.length === 0 && currentUserProfile.role === 'admin') {
        console.log('⚠️ Admin has no visible users - possible reasons:');
        console.log('1. No employees created yet');
        console.log('2. created_by relationships not set correctly');
        console.log('3. Users marked as inactive');
      }
      
    } catch (error) {
      console.error('💥 Error fetching users:', error);
      toast({
        title: "Error",
        description: "Error al cargar la lista de usuarios",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  // Cargar usuarios automáticamente cuando el componente se monta y cuando cambia el currentUserProfile
  useEffect(() => {
    if (currentUserProfile) {
      fetchUsers();
    }
  }, [currentUserProfile]);

  const handleDeleteUser = async (userId: string) => {
    const targetUser = users.find(u => u.id === userId);
    
    if (!targetUser || !canManageUser(targetUser)) {
      console.error('No tienes permisos para eliminar este usuario');
      toast({
        title: "Error",
        description: "No tienes permisos para eliminar este usuario",
        variant: "destructive"
      });
      return;
    }

    // Abrir modal de confirmación
    setDeleteModal({
      isOpen: true,
      user: targetUser
    });
  };

  const confirmDeleteUser = async () => {
    if (!deleteModal.user) return;

    try {
      const { error } = await supabase
        .from('profiles')
        .update({ is_active: false })
        .eq('id', deleteModal.user.id);

      if (error) throw error;

      toast({
        title: "✅ Empleado eliminado",
        description: `${deleteModal.user.full_name || deleteModal.user.email} ha sido eliminado exitosamente`,
      });

      fetchUsers();
    } catch (error) {
      console.error('Error deleting user:', error);
      toast({
        title: "Error",
        description: "Error al eliminar el empleado",
        variant: "destructive"
      });
      throw error;
    }
  };

  const closeDeleteModal = () => {
    setDeleteModal({
      isOpen: false,
      user: null
    });
  };

  const handleEditUser = (user: Profile) => {
    if (!canManageUser(user)) {
      console.error('No tienes permisos para editar este usuario');
      return;
    }
    
    setEditingUser(user);
    setShowUserForm(true);
  };

  const handleCloseForm = () => {
    setShowUserForm(false);
    setEditingUser(null);
  };

  const handleUserCreated = () => {
    console.log('User created callback triggered, refreshing user list...');
    fetchUsers();
    
    // Mostrar confirmación adicional de éxito
    toast({
      title: "🎉 ¡Perfecto!",
      description: "El nuevo empleado aparece en tu lista de usuarios",
    });
    
    // Marcar al usuario recién creado para resaltarlo visualmente
    setTimeout(() => {
      const latestUser = users[0]; // El usuario más reciente
      if (latestUser) {
        setRecentlyCreatedUser(latestUser.id);
        setTimeout(() => setRecentlyCreatedUser(null), 3000); // Quitar resaltado después de 3 segundos
      }
    }, 1000);
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'superadmin':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'admin':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  // Aplicar filtros de búsqueda y rol
  const filteredUsers = users.filter(user => {
    const matchesSearch = user.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = selectedRole === 'all' || user.role === selectedRole;
    return matchesSearch && matchesRole;
  });

  // Calcular estadísticas considerando los permisos del usuario
  const getVisibleUserCount = (role?: string) => {
    if (!role) return users.length;
    return users.filter(u => u.role === role).length;
  };

  if (showUserForm) {
    return (
      <UserForm
        user={editingUser}
        onClose={handleCloseForm}
        onBack={onBack}
        onUserCreated={handleUserCreated}
      />
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center space-x-4">
            <Button variant="ghost" size="sm" onClick={onBack}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Volver al Panel
            </Button>
            <div className="flex items-center space-x-2">
              <Shield className="h-8 w-8 text-primary" />
              <h1 className="text-2xl font-bold">Gestión de Usuarios y Roles</h1>
            </div>
          </div>
          <Button onClick={() => setShowUserForm(true)}>
            <UserPlus className="h-4 w-4 mr-2" />
            Nuevo Usuario
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        {/* Filters */}
        <div className="mb-6 flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="Buscar usuarios por nombre o email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <div className="flex items-center space-x-2">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <select
              value={selectedRole}
              onChange={(e) => setSelectedRole(e.target.value)}
              className="px-3 py-2 border border-input rounded-md bg-background"
            >
              <option value="all">Todos los roles</option>
              {canViewSuperAdmins() && (
                <option value="superadmin">Super Administrador</option>
              )}
              <option value="admin">Administrador</option>
              <option value="empleado">Empleado</option>
            </select>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-primary">{getVisibleUserCount()}</div>
              <p className="text-sm text-muted-foreground">
                {currentUserProfile?.role === 'admin' ? 'Mis Usuarios' : 'Usuarios Visibles'}
              </p>
            </CardContent>
          </Card>
          {canViewSuperAdmins() && (
            <Card>
              <CardContent className="p-4">
                <div className="text-2xl font-bold text-red-600">{getVisibleUserCount('superadmin')}</div>
                <p className="text-sm text-muted-foreground">Super Admins</p>
              </CardContent>
            </Card>
          )}
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-blue-600">{getVisibleUserCount('admin')}</div>
              <p className="text-sm text-muted-foreground">Administradores</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-green-600">{getVisibleUserCount('empleado')}</div>
              <p className="text-sm text-muted-foreground">Empleados</p>
            </CardContent>
          </Card>
        </div>

        {/* Users List */}
        <Card>
          <CardHeader>
            <CardTitle>Lista de Usuarios</CardTitle>
            <CardDescription>
              {currentUserProfile?.role === 'admin' ? (
                <span>
                  Gestiona solo los usuarios que has creado
                  <span className="block text-sm text-muted-foreground mt-1">
                    Como administrador, solo puedes ver y gestionar los empleados que tú has creado
                  </span>
                </span>
              ) : currentUserProfile?.role === 'superadmin' ? (
                'Gestiona todos los usuarios del sistema'
              ) : (
                'Gestiona tu perfil de usuario'
              )}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex justify-center items-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : filteredUsers.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-muted-foreground mb-4">
                  {users.length === 0 
                    ? currentUserProfile?.role === 'admin' 
                      ? "No has creado ningún empleado aún. Usa el botón 'Nuevo Usuario' para crear empleados."
                      : "No se encontraron usuarios. Verifica que existan usuarios activos en el sistema."
                    : "No se encontraron usuarios que coincidan con los filtros aplicados."
                  }
                </p>
                {currentUserProfile?.role === 'admin' && users.length === 0 && (
                  <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-md">
                    <p className="text-sm text-blue-800 font-semibold">Información:</p>
                    <p className="text-sm text-blue-700 mt-2">
                      Como administrador, solo puedes ver los empleados que tú has creado.
                    </p>
                    <p className="text-sm text-blue-700">
                      Los empleados aparecerán automáticamente en esta lista una vez que los crees.
                    </p>
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                {filteredUsers.map((user) => (
                  <div
                    key={user.id}
                    className={`flex items-center justify-between p-4 border border-border rounded-lg hover:bg-muted/50 transition-colors ${
                      recentlyCreatedUser === user.id 
                        ? 'bg-green-50 border-green-200 shadow-md' 
                        : ''
                    }`}
                  >
                    <div className="flex items-center space-x-4">
                      <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center relative">
                        <span className="text-sm font-semibold text-primary">
                          {user.full_name?.charAt(0) || user.email.charAt(0).toUpperCase()}
                        </span>
                        {recentlyCreatedUser === user.id && (
                          <CheckCircle className="absolute -top-1 -right-1 h-5 w-5 text-green-600 bg-white rounded-full" />
                        )}
                      </div>
                      <div>
                        <h3 className="font-semibold">{user.full_name || 'Sin nombre'}</h3>
                        <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                          <Mail className="h-4 w-4" />
                          <span>{user.email}</span>
                        </div>
                        <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                          <Calendar className="h-4 w-4" />
                          <span>Registrado: {new Date(user.created_at || '').toLocaleDateString()}</span>
                        </div>
                        {currentUserProfile?.role === 'admin' && user.role === 'empleado' && user.created_by === currentUserProfile.id && (
                          <div className="text-xs text-green-600 font-medium mt-1">
                            Creado por ti
                            {recentlyCreatedUser === user.id && (
                              <span className="ml-2 text-green-700 font-bold">¡NUEVO!</span>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-4">
                      <Badge className={getRoleBadgeColor(user.role || 'empleado')}>
                        {user.role === 'superadmin' ? 'Super Admin' : 
                         user.role === 'admin' ? 'Admin' : 'Empleado'}
                      </Badge>
                      
                      <div className="flex items-center space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEditUser(user)}
                          disabled={!canManageUser(user)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDeleteUser(user.id)}
                          disabled={!canManageUser(user)}
                          className="text-red-600 hover:text-red-700 disabled:text-gray-400"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </main>

      {/* Modal de confirmación para eliminar usuario */}
      <DeleteUserModal
        isOpen={deleteModal.isOpen}
        onClose={closeDeleteModal}
        onConfirm={confirmDeleteUser}
        user={deleteModal.user}
      />
    </div>
  );
};

export default UserManagement;
