
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ExternalLink, Menu, Share2, Eye, Globe, RefreshCw } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useRestaurantContext, createRestaurantSlug } from '@/hooks/useRestaurantContext';

interface QuickAccessMenuProps {
  onViewPublicMenu?: () => void;
}

const QuickAccessMenu = ({ onViewPublicMenu }: QuickAccessMenuProps) => {
  const { toast } = useToast();
  
  // FASE 3: Usar contexto del restaurante para generar URL amigable
  const { data: restaurantInfo, isLoading } = useRestaurantContext();
  
  // Generar URL amigable basada en el nombre del restaurante
  const restaurantSlug = restaurantInfo ? createRestaurantSlug(restaurantInfo.business_name) : '';
  const baseUrl = window.location.origin;
  const friendlyUrl = restaurantSlug ? `${baseUrl}/menu/${restaurantSlug}` : `${baseUrl}/menu`;
  const menuUrl = friendlyUrl; // Usar URL amigable como principal
  
  const handleCopyUrl = () => {
    navigator.clipboard.writeText(menuUrl);
    toast({
      title: 'URL copiada',
      description: 'La URL del menú público se ha copiado al portapapeles',
    });
  };

  const handleOpenInNewTab = () => {
    console.log('🔗 [QUICK ACCESS] Abriendo menú en nueva pestaña:', menuUrl);
    window.open('/menu', '_blank');
  };

  const handleViewInSameTab = () => {
    console.log('🔗 [QUICK ACCESS] Navegando al menú en la misma pestaña');
    if (onViewPublicMenu) {
      onViewPublicMenu();
    } else {
      window.location.href = '/menu';
    }
  };

  const handleRefreshMenu = () => {
    console.log('🔄 [QUICK ACCESS] Refrescando menú...');
    
    // Limpiar cache del navegador para el menú
    if ('caches' in window) {
      caches.keys().then(names => {
        names.forEach(name => {
          if (name.includes('menu') || name.includes('product')) {
            caches.delete(name);
          }
        });
      });
    }
    
    // Mostrar notificación
    toast({
      title: 'Menú actualizado',
      description: 'El cache del menú ha sido limpiado y sincronizado',
    });
    
    // Abrir menú después de limpiar cache
    setTimeout(() => {
      handleViewInSameTab();
    }, 500);
  };

  if (isLoading) {
    return (
      <Card className="bg-gradient-to-br from-primary/5 to-secondary/5 border-primary/20">
        <CardContent className="flex items-center justify-center p-8">
          <div className="text-center">
            <Globe className="h-8 w-8 text-primary mx-auto mb-2 animate-pulse" />
            <p className="text-sm text-muted-foreground">Cargando información del restaurante...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-gradient-to-br from-primary/5 to-secondary/5 border-primary/20">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Globe className="h-5 w-5 text-primary" />
            <CardTitle className="text-lg">Menú Público</CardTitle>
          </div>
          <div className="flex gap-2">
            <Badge variant="default" className="bg-green-100 text-green-800">
              ✅ Sincronizado
            </Badge>
            <Badge variant="default" className="bg-blue-100 text-blue-800">
              Activo
            </Badge>
          </div>
        </div>
        <CardDescription>
          {restaurantInfo 
            ? `Menú público de ${restaurantInfo.business_name} - Accede y gestiona`
            : 'Accede y gestiona tu menú público para clientes'
          }
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="p-3 bg-muted rounded-md">
          <p className="text-sm font-medium mb-1">
            🌐 URL amigable del menú:
          </p>
          <code className="text-xs break-all text-primary font-mono bg-white p-1 rounded">
            {menuUrl}
          </code>
          {restaurantSlug && (
            <p className="text-xs text-muted-foreground mt-1">
              💡 URL optimizada para SEO y fácil de recordar
            </p>
          )}
        </div>

        {restaurantInfo && (
          <div className="p-3 bg-blue-50 rounded-md">
            <div className="flex items-center gap-2 mb-2">
              <Badge variant="outline" className="text-xs">
                🏪 {restaurantInfo.business_name}
              </Badge>
              <Badge variant="outline" className="text-xs">
                🔄 Datos sincronizados
              </Badge>
            </div>
            <p className="text-xs text-blue-700">
              Los productos que gestiones aquí se mostrarán automáticamente en el menú público
            </p>
          </div>
        )}
        
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-2">
          <Button 
            onClick={handleViewInSameTab}
            className="w-full"
            size="sm"
          >
            <Eye className="h-4 w-4 mr-2" />
            Ver Menú
          </Button>
          
          <Button 
            onClick={handleOpenInNewTab}
            variant="outline"
            className="w-full"
            size="sm"
          >
            <ExternalLink className="h-4 w-4 mr-2" />
            Nueva Pestaña
          </Button>
          
          <Button 
            onClick={handleCopyUrl}
            variant="outline"
            className="w-full"
            size="sm"
          >
            <Share2 className="h-4 w-4 mr-2" />
            Copiar URL
          </Button>

          <Button 
            onClick={handleRefreshMenu}
            variant="outline"
            className="w-full"
            size="sm"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Sincronizar
          </Button>
        </div>
        
        <div className="text-xs text-muted-foreground space-y-1">
          <p>🔗 Comparte la URL amigable con tus clientes</p>
          <p>🔄 Los cambios en productos se reflejan automáticamente</p>
          <p>⚡ Usa "Sincronizar" si hay problemas de cache</p>
        </div>
      </CardContent>
    </Card>
  );
};

export default QuickAccessMenu;
