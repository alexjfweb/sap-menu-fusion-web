
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ExternalLink, Menu, Share2, Eye, Globe, RefreshCw } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface QuickAccessMenuProps {
  onViewPublicMenu?: () => void;
}

const QuickAccessMenu = ({ onViewPublicMenu }: QuickAccessMenuProps) => {
  const { toast } = useToast();
  
  // Generar la URL del menú público correctamente
  const baseUrl = window.location.origin;
  const menuUrl = `${baseUrl}/menu`;
  
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
      description: 'El cache del menú ha sido limpiado',
    });
    
    // Abrir menú después de limpiar cache
    setTimeout(() => {
      handleViewInSameTab();
    }, 500);
  };

  return (
    <Card className="bg-gradient-to-br from-primary/5 to-secondary/5 border-primary/20">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Globe className="h-5 w-5 text-primary" />
            <CardTitle className="text-lg">Menú Público</CardTitle>
          </div>
          <Badge variant="default" className="bg-green-100 text-green-800">
            Activo
          </Badge>
        </div>
        <CardDescription>
          Accede y gestiona tu menú público para clientes
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="p-3 bg-muted rounded-md">
          <p className="text-sm font-medium mb-1">URL del menú:</p>
          <code className="text-xs break-all text-primary">{menuUrl}</code>
        </div>
        
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
            Actualizar
          </Button>
        </div>
        
        <div className="text-xs text-muted-foreground space-y-1">
          <p>💡 Comparte esta URL con tus clientes para que accedan a tu menú</p>
          <p>🔄 Usa "Actualizar" si el menú no se carga correctamente</p>
        </div>
      </CardContent>
    </Card>
  );
};

export default QuickAccessMenu;
