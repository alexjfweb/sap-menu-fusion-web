
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { 
  Users, 
  UserPlus, 
  Search, 
  Filter,
  ArrowLeft,
  UserCheck,
  UserX,
  Eye,
  Edit,
  Trash2,
  Activity,
  Bell
} from 'lucide-react';
import { useEmployeeManagement, Employee } from '@/hooks/useEmployeeManagement';
import EmployeeForm from './EmployeeForm';
import EmployeeProfile from './EmployeeProfile';
import ActivityHistoryPanel from './ActivityHistoryPanel';
import EmployeeCreatedModal from './EmployeeCreatedModal';

interface EmployeeManagementProps {
  onBack: () => void;
}

const EmployeeManagement = ({ onBack }: EmployeeManagementProps) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [activeView, setActiveView] = useState<'list' | 'create' | 'edit' | 'profile' | 'activity'>('list');
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [newEmployeeData, setNewEmployeeData] = useState<{ employee: Employee; password: string } | null>(null);

  const {
    employees,
    isLoadingEmployees,
    createEmployee,
    isCreatingEmployee,
    updateEmployee,
    isUpdatingEmployee,
    toggleEmployeeStatus,
    isTogglingStatus,
    deleteEmployee,
    isDeletingEmployee,
  } = useEmployeeManagement((data) => {
    setNewEmployeeData(data);
  });

  // Filtrar empleados
  const filteredEmployees = employees.filter(employee => {
    const matchesSearch = employee.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         employee.email.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || 
                         (statusFilter === 'active' && employee.is_active) ||
                         (statusFilter === 'inactive' && !employee.is_active);

    return matchesSearch && matchesStatus;
  });

  const handleCreateEmployee = (data: any) => {
    createEmployee(data);
    setActiveView('list');
  };

  const handleUpdateEmployee = (data: any) => {
    if (selectedEmployee) {
      updateEmployee({ id: selectedEmployee.id, data });
      setActiveView('list');
      setSelectedEmployee(null);
    }
  };

  const handleEditEmployee = (employee: Employee) => {
    setSelectedEmployee(employee);
    setActiveView('edit');
  };

  const handleViewProfile = (employee: Employee) => {
    setSelectedEmployee(employee);
    setActiveView('profile');
  };

  const handleToggleStatus = (employee: Employee) => {
    toggleEmployeeStatus({ id: employee.id, is_active: !employee.is_active });
  };

  const handleDeleteEmployee = (employee: Employee) => {
    if (window.confirm(`¿Estás seguro de que quieres eliminar a ${employee.full_name}?`)) {
      deleteEmployee(employee.id);
    }
  };

  // Estadísticas
  const stats = {
    total: employees.length,
    active: employees.filter(e => e.is_active).length,
    inactive: employees.filter(e => !e.is_active).length,
    newThisMonth: employees.filter(e => {
      const created = new Date(e.created_at);
      const now = new Date();
      return created.getMonth() === now.getMonth() && created.getFullYear() === now.getFullYear();
    }).length,
  };

  if (activeView === 'create') {
    return (
      <EmployeeForm
        onSubmit={handleCreateEmployee}
        onCancel={() => setActiveView('list')}
        isLoading={isCreatingEmployee}
        title="Crear Nuevo Empleado"
      />
    );
  }

  if (activeView === 'edit' && selectedEmployee) {
    return (
      <EmployeeForm
        onSubmit={handleUpdateEmployee}
        onCancel={() => {
          setActiveView('list');
          setSelectedEmployee(null);
        }}
        isLoading={isUpdatingEmployee}
        title="Editar Empleado"
        initialData={selectedEmployee}
      />
    );
  }

  if (activeView === 'profile' && selectedEmployee) {
    return (
      <EmployeeProfile
        employee={selectedEmployee}
        onBack={() => {
          setActiveView('list');
          setSelectedEmployee(null);
        }}
      />
    );
  }

  if (activeView === 'activity') {
    return (
      <ActivityHistoryPanel
        onBack={() => setActiveView('list')}
      />
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b bg-card">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Button variant="outline" size="sm" onClick={onBack}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Volver al Dashboard
              </Button>
              <div>
                <h1 className="text-2xl font-bold flex items-center">
                  <Users className="h-6 w-6 mr-2" />
                  Gestión de Empleados
                </h1>
                <p className="text-sm text-muted-foreground">
                  Administra tu equipo de trabajo
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Button
                onClick={() => setActiveView('activity')}
                variant="outline"
                size="sm"
              >
                <Activity className="h-4 w-4 mr-2" />
                Historial de Actividades
              </Button>
              <Button
                onClick={() => setActiveView('create')}
                size="sm"
              >
                <UserPlus className="h-4 w-4 mr-2" />
                Nuevo Empleado
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6">
        {/* Estadísticas */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-2xl font-bold text-blue-600">{stats.total}</div>
                  <p className="text-sm text-muted-foreground">Total Empleados</p>
                </div>
                <Users className="h-8 w-8 text-blue-600 opacity-50" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-2xl font-bold text-green-600">{stats.active}</div>
                  <p className="text-sm text-muted-foreground">Activos</p>
                </div>
                <UserCheck className="h-8 w-8 text-green-600 opacity-50" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-2xl font-bold text-red-600">{stats.inactive}</div>
                  <p className="text-sm text-muted-foreground">Inactivos</p>
                </div>
                <UserX className="h-8 w-8 text-red-600 opacity-50" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-2xl font-bold text-purple-600">{stats.newThisMonth}</div>
                  <p className="text-sm text-muted-foreground">Nuevos este mes</p>
                </div>
                <Bell className="h-8 w-8 text-purple-600 opacity-50" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filtros y búsqueda */}
        <Card className="mb-6">
          <CardContent className="p-4">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Buscar por nombre o email..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <Filter className="h-4 w-4 text-muted-foreground" />
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value as any)}
                  className="px-3 py-2 border rounded-md text-sm"
                >
                  <option value="all">Todos</option>
                  <option value="active">Activos</option>
                  <option value="inactive">Inactivos</option>
                </select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Lista de empleados */}
        <Card>
          <CardHeader>
            <CardTitle>Empleados ({filteredEmployees.length})</CardTitle>
            <CardDescription>
              Lista de todos los empleados bajo tu gestión
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoadingEmployees ? (
              <div className="flex justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : filteredEmployees.length === 0 ? (
              <div className="text-center py-8">
                <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">No hay empleados</h3>
                <p className="text-muted-foreground mb-4">
                  {searchTerm || statusFilter !== 'all' 
                    ? 'No se encontraron empleados con los filtros aplicados'
                    : 'Comienza creando tu primer empleado'
                  }
                </p>
                {!searchTerm && statusFilter === 'all' && (
                  <Button onClick={() => setActiveView('create')}>
                    <UserPlus className="h-4 w-4 mr-2" />
                    Crear Primer Empleado
                  </Button>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                {filteredEmployees.map((employee) => (
                  <div
                    key={employee.id}
                    className="flex items-center justify-between p-4 border rounded-lg hover:shadow-sm transition-shadow"
                  >
                    <div className="flex items-center space-x-4">
                      <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                        <span className="text-sm font-medium text-primary">
                          {employee.full_name?.charAt(0) || employee.email.charAt(0)}
                        </span>
                      </div>
                      <div>
                        <h3 className="font-medium">{employee.full_name || 'Sin nombre'}</h3>
                        <p className="text-sm text-muted-foreground">{employee.email}</p>
                        <div className="flex items-center space-x-2 mt-1">
                          <Badge variant={employee.role === 'admin' ? 'default' : 'secondary'}>
                            {employee.role}
                          </Badge>
                          <Badge variant={employee.is_active ? 'default' : 'secondary'}>
                            {employee.is_active ? 'Activo' : 'Inactivo'}
                          </Badge>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleViewProfile(employee)}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleEditEmployee(employee)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleToggleStatus(employee)}
                        disabled={isTogglingStatus}
                      >
                        {employee.is_active ? (
                          <UserX className="h-4 w-4 text-red-600" />
                        ) : (
                          <UserCheck className="h-4 w-4 text-green-600" />
                        )}
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleDeleteEmployee(employee)}
                        disabled={isDeletingEmployee}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Modal de confirmación de empleado creado */}
      {newEmployeeData && (
        <EmployeeCreatedModal
          isOpen={!!newEmployeeData}
          onClose={() => setNewEmployeeData(null)}
          employee={newEmployeeData.employee}
          password={newEmployeeData.password}
        />
      )}
    </div>
  );
};

export default EmployeeManagement;
