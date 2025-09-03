import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  Building, 
  Plus, 
  Search, 
  Edit, 
  Eye, 
  ToggleLeft, 
  ToggleRight,
  Mail,
  Phone,
  Globe,
  MapPin,
  ArrowLeft,
  RefreshCw,
  FileText
} from 'lucide-react';
import { Tables } from '@/integrations/supabase/types';
import { useAuth } from '@/hooks/useAuth';
import { useRealtimeBusinessInfo } from '@/hooks/useRealtimeBusinessInfo';
import CompanyForm from './CompanyForm';
import CompanyDetails from './CompanyDetails';

type BusinessInfo = Tables<'business_info'>;

interface CompanyManagementProps {
  onBack?: () => void;
}

const CompanyManagement = ({ onBack }: CompanyManagementProps) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [editingCompany, setEditingCompany] = useState<BusinessInfo | null>(null);
  const [viewingCompany, setViewingCompany] = useState<BusinessInfo | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const { role } = useAuth();
  const { businessData: companies, isLoading, refetch } = useRealtimeBusinessInfo();

  // Check access permissions
  const hasAccess = role === 'admin' || role === 'superadmin';

  const filteredCompanies = companies?.filter(company =>
    company.business_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    company.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    company.tax_id?.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  const handleEdit = (company: BusinessInfo) => {
    setEditingCompany(company);
    setShowForm(true);
  };

  const handleView = (company: BusinessInfo) => {
    setViewingCompany(company);
    setShowDetails(true);
  };

  const handleCreate = () => {
    setEditingCompany(null);
    setShowForm(true);
  };

  const handleCloseForm = () => {
    setShowForm(false);
    setEditingCompany(null);
    refetch();
  };

  const handleCloseDetails = () => {
    setShowDetails(false);
    setViewingCompany(null);
  };

  const handleEditFromDetails = (company: BusinessInfo) => {
    setShowDetails(false);
    setViewingCompany(null);
    setEditingCompany(company);
    setShowForm(true);
  };

  const handleManualRefresh = async () => {
    setIsRefreshing(true);
    try {
      await refetch();
    } finally {
      setIsRefreshing(false);
    }
  };

  // Show unauthorized message if user doesn't have access
  if (!hasAccess) {
    return (
      <div className="min-h-screen bg-background p-6">
        <div className="max-w-7xl mx-auto">
          <Card>
            <CardContent className="text-center py-8">
              <Building className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-lg font-medium mb-2">Acceso Restringido</p>
              <p className="text-muted-foreground">
                No tienes permisos para acceder a la gestión de empresas
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (showForm) {
    return (
      <div className="min-h-screen bg-background p-6">
        <div className="max-w-7xl mx-auto">
          <Card>
            <CardContent className="text-center py-8">
              <Building className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-lg font-medium mb-2">Funcionalidad en Desarrollo</p>
              <p className="text-muted-foreground mb-4">
                La edición de empresas se realiza desde la sección "Información del Negocio"
              </p>
              <Button onClick={() => setShowForm(false)}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Volver
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (showDetails && viewingCompany) {
    return (
      <div className="min-h-screen bg-background p-6">
        <div className="max-w-7xl mx-auto">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle className="text-2xl flex items-center gap-2">
                    <Building className="h-6 w-6" />
                    {viewingCompany.business_name}
                  </CardTitle>
                  <CardDescription>Detalles de la empresa</CardDescription>
                </div>
                <Button variant="outline" onClick={handleCloseDetails}>
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Volver
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {viewingCompany.description && (
                <div>
                  <h3 className="font-medium mb-2">Descripción</h3>
                  <p className="text-muted-foreground">{viewingCompany.description}</p>
                </div>
              )}
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {viewingCompany.tax_id && (
                  <div>
                    <h3 className="font-medium mb-1">NIT</h3>
                    <p className="text-muted-foreground">{viewingCompany.tax_id}</p>
                  </div>
                )}
                
                {viewingCompany.email && (
                  <div>
                    <h3 className="font-medium mb-1">Email</h3>
                    <p className="text-muted-foreground">{viewingCompany.email}</p>
                  </div>
                )}
                
                {viewingCompany.phone && (
                  <div>
                    <h3 className="font-medium mb-1">Teléfono</h3>
                    <p className="text-muted-foreground">{viewingCompany.phone}</p>
                  </div>
                )}
                
                {viewingCompany.address && (
                  <div>
                    <h3 className="font-medium mb-1">Dirección</h3>
                    <p className="text-muted-foreground">{viewingCompany.address}</p>
                  </div>
                )}
                
                {viewingCompany.website_url && (
                  <div>
                    <h3 className="font-medium mb-1">Sitio Web</h3>
                    <p className="text-muted-foreground">{viewingCompany.website_url}</p>
                  </div>
                )}
              </div>
              
              <div className="pt-4 border-t">
                <p className="text-sm text-muted-foreground">
                  Creado: {new Date(viewingCompany.created_at).toLocaleDateString()}
                </p>
                <p className="text-sm text-muted-foreground">
                  Actualizado: {new Date(viewingCompany.updated_at).toLocaleDateString()}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-4">
            {onBack && (
              <Button
                variant="outline"
                size="sm"
                onClick={onBack}
                className="flex items-center gap-2"
              >
                <ArrowLeft className="h-4 w-4" />
                Volver al Panel
              </Button>
            )}
            <div>
              <h1 className="text-3xl font-bold flex items-center gap-2">
                <Building className="h-8 w-8 text-primary" />
                Gestión de Empresas
              </h1>
              <p className="text-muted-foreground">
                {role === 'superadmin' 
                  ? 'Administra todos los restaurantes registrados en la plataforma' 
                  : 'Información de tu restaurante'
                }
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              onClick={handleManualRefresh}
              disabled={isRefreshing}
              className="flex items-center gap-2"
            >
              <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
              Actualizar Datos
            </Button>
            {role === 'superadmin' && (
              <Button onClick={handleCreate} className="flex items-center gap-2">
                <Plus className="h-4 w-4" />
                Nueva Empresa
              </Button>
            )}
          </div>
        </div>

        {/* Search Bar */}
        <Card className="mb-6">
          <CardContent className="p-4">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar empresas por nombre, email o NIT..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </CardContent>
        </Card>

        {/* Companies Grid */}
        {isLoading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Cargando información de empresas...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredCompanies.map((company) => (
              <Card key={company.id} className="hover:shadow-lg transition-shadow duration-300">
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div className="flex items-center space-x-2">
                      {company.logo_url ? (
                        <img
                          src={company.logo_url}
                          alt={company.business_name}
                          className="h-10 w-10 rounded-lg object-cover"
                        />
                      ) : (
                        <Building className="h-10 w-10 text-muted-foreground" />
                      )}
                      <div>
                        <CardTitle className="text-lg">{company.business_name}</CardTitle>
                        <Badge variant="default">
                          Activo
                        </Badge>
                      </div>
                    </div>
                  </div>
                </CardHeader>
                
                <CardContent className="space-y-3">
                  {company.description && (
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {company.description}
                    </p>
                  )}
                  
                  <div className="space-y-2">
                    {company.tax_id && (
                      <div className="flex items-center space-x-2 text-sm">
                        <FileText className="h-4 w-4 text-muted-foreground" />
                        <span className="truncate">NIT: {company.tax_id}</span>
                      </div>
                    )}

                    {company.email && (
                      <div className="flex items-center space-x-2 text-sm">
                        <Mail className="h-4 w-4 text-muted-foreground" />
                        <span className="truncate">{company.email}</span>
                      </div>
                    )}
                    
                    {company.phone && (
                      <div className="flex items-center space-x-2 text-sm">
                        <Phone className="h-4 w-4 text-muted-foreground" />
                        <span>{company.phone}</span>
                      </div>
                    )}
                    
                    {company.website_url && (
                      <div className="flex items-center space-x-2 text-sm">
                        <Globe className="h-4 w-4 text-muted-foreground" />
                        <span className="truncate">{company.website_url}</span>
                      </div>
                    )}
                    
                    {company.address && (
                      <div className="flex items-center space-x-2 text-sm">
                        <MapPin className="h-4 w-4 text-muted-foreground" />
                        <span className="truncate">{company.address}</span>
                      </div>
                    )}
                  </div>
                  
                  <div className="flex justify-between items-center pt-4 border-t">
                    <div className="flex space-x-2">
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => handleEdit(company)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => handleView(company)}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                    </div>
                    
                    <Badge variant="outline" className="text-green-600">
                      Empresa Activa
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Empty state */}
        {filteredCompanies.length === 0 && !isLoading && (
          <Card>
            <CardContent className="text-center py-8">
              <Building className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-lg font-medium mb-2">
                {role === 'admin' ? 'No se encontró información del negocio' : 'No se encontraron empresas'}
              </p>
              <p className="text-muted-foreground mb-4">
                {searchTerm 
                  ? 'Intenta con otros términos de búsqueda' 
                  : role === 'admin' 
                    ? 'Completa la información de tu negocio desde el panel de administración'
                    : 'Los datos de las empresas aparecerán aquí cuando se registren'
                }
              </p>
              {!searchTerm && role === 'superadmin' && (
                <Button onClick={handleCreate}>
                  <Plus className="h-4 w-4 mr-2" />
                  Crear Primera Empresa
                </Button>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default CompanyManagement;
