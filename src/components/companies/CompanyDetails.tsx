
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Building, 
  Mail, 
  Phone, 
  Globe, 
  MapPin, 
  Calendar,
  Clock,
  X,
  Edit
} from 'lucide-react';
import { Tables } from '@/integrations/supabase/types';

type Company = Tables<'companies'>;

interface CompanyDetailsProps {
  company: Company;
  onClose: () => void;
  onEdit: (company: Company) => void;
}

const CompanyDetails = ({ company, onClose, onEdit }: CompanyDetailsProps) => {
  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              size="sm"
              onClick={onClose}
              className="flex items-center gap-2"
            >
              <X className="h-4 w-4" />
              Cerrar
            </Button>
            <div>
              <h1 className="text-3xl font-bold flex items-center gap-2">
                <Building className="h-8 w-8 text-primary" />
                Detalles de la Empresa
              </h1>
              <p className="text-muted-foreground">
                Información completa de {company.name}
              </p>
            </div>
          </div>
          <Button onClick={() => onEdit(company)} className="flex items-center gap-2">
            <Edit className="h-4 w-4" />
            Editar Empresa
          </Button>
        </div>

        {/* Company Details Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Info */}
          <div className="lg:col-span-2 space-y-6">
            {/* Basic Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building className="h-5 w-5" />
                  Información Básica
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    {company.logo_url ? (
                      <img
                        src={company.logo_url}
                        alt={company.name}
                        className="h-16 w-16 rounded-lg object-cover border"
                      />
                    ) : (
                      <div className="h-16 w-16 rounded-lg bg-muted flex items-center justify-center">
                        <Building className="h-8 w-8 text-muted-foreground" />
                      </div>
                    )}
                    <div>
                      <h2 className="text-2xl font-bold">{company.name}</h2>
                      <Badge variant={company.is_active ? "default" : "secondary"}>
                        {company.is_active ? "Activa" : "Inactiva"}
                      </Badge>
                    </div>
                  </div>
                </div>
                
                {company.description && (
                  <div>
                    <h3 className="font-medium mb-2">Descripción</h3>
                    <p className="text-muted-foreground">{company.description}</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Contact Information */}
            <Card>
              <CardHeader>
                <CardTitle>Información de Contacto</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {company.email && (
                  <div className="flex items-center space-x-3">
                    <Mail className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="font-medium">Email</p>
                      <p className="text-muted-foreground">{company.email}</p>
                    </div>
                  </div>
                )}
                
                {company.phone && (
                  <div className="flex items-center space-x-3">
                    <Phone className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="font-medium">Teléfono</p>
                      <p className="text-muted-foreground">{company.phone}</p>
                    </div>
                  </div>
                )}
                
                {company.website && (
                  <div className="flex items-center space-x-3">
                    <Globe className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="font-medium">Sitio Web</p>
                      <a 
                        href={company.website} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-primary hover:underline"
                      >
                        {company.website}
                      </a>
                    </div>
                  </div>
                )}
                
                {company.address && (
                  <div className="flex items-center space-x-3">
                    <MapPin className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="font-medium">Dirección</p>
                      <p className="text-muted-foreground">{company.address}</p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Timestamps */}
            <Card>
              <CardHeader>
                <CardTitle>Información del Sistema</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center space-x-3">
                  <Calendar className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="font-medium">Fecha de Creación</p>
                    <p className="text-sm text-muted-foreground">
                      {new Date(company.created_at).toLocaleDateString('es-ES', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-3">
                  <Clock className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="font-medium">Última Actualización</p>
                    <p className="text-sm text-muted-foreground">
                      {new Date(company.updated_at).toLocaleDateString('es-ES', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-3">
                  <Building className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="font-medium">ID de la Empresa</p>
                    <p className="text-xs text-muted-foreground font-mono">{company.id}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Quick Stats */}
            <Card>
              <CardHeader>
                <CardTitle>Estadísticas Rápidas</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-primary">0</div>
                  <p className="text-sm text-muted-foreground">Usuarios Asociados</p>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">0</div>
                  <p className="text-sm text-muted-foreground">Productos Registrados</p>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">0</div>
                  <p className="text-sm text-muted-foreground">Pedidos Totales</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CompanyDetails;
