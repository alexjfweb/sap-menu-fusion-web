
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Menu, ExternalLink, AlertCircle } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';

const DashboardHeader = () => {
  const { user } = useAuth();
  
  const handleOpenMenu = () => {
    window.open('/menu', '_blank');
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Panel de Control</h1>
          <p className="text-muted-foreground">
            Bienvenido, {user?.user_metadata?.full_name || user?.email}
          </p>
        </div>
        <Button onClick={handleOpenMenu} className="gap-2">
          <Menu className="h-4 w-4" />
          Ver Menú Público
          <ExternalLink className="h-4 w-4" />
        </Button>
      </div>

      <Card className="bg-blue-50 border-blue-200">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <AlertCircle className="h-5 w-5 text-blue-600" />
              <CardTitle className="text-lg text-blue-900">Acceso Rápido al Menú</CardTitle>
            </div>
            <Badge variant="secondary" className="bg-blue-100 text-blue-800">
              URL: /menu
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-blue-700">
                Tu menú público está disponible en <strong>/menu</strong>
              </p>
              <p className="text-xs text-blue-600 mt-1">
                Los clientes pueden acceder sin necesidad de autenticación
              </p>
            </div>
            <Button 
              onClick={handleOpenMenu}
              size="sm"
              variant="outline"
              className="border-blue-300 text-blue-700 hover:bg-blue-100"
            >
              Abrir Menú
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default DashboardHeader;
