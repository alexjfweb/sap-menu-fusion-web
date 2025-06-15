
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ExternalLink, Menu, Share2, Eye } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const QuickAccessMenu = () => {
  const { toast } = useToast();
  
  const menuUrl = `${window.location.origin}/menu`;
  
  const handleCopyUrl = () => {
    navigator.clipboard.writeText(menuUrl);
    toast({
      title: 'URL copiada',
      description: 'La URL del menú público se ha copiado al portapapeles',
    });
  };

  const handleOpenMenu = () => {
    window.open('/menu', '_blank');
  };

  const handleViewInSameTab = () => {
    window.location.href = '/menu';
  };

  return (
    <Card className="bg-gradient-to-br from-primary/5 to-secondary/5 border-primary/20">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Menu className="h-5 w-5 text-primary" />
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
        
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
          <Button 
            onClick={handleViewInSameTab}
            className="w-full"
            size="sm"
          >
            <Eye className="h-4 w-4 mr-2" />
            Ver Menú
          </Button>
          
          <Button 
            onClick={handleOpenMenu}
            variant="outline"
            className="w-full"
            size="sm"
          >
            <ExternalLink className="h-4 w-4 mr-2" />
            Abrir en Nueva Pestaña
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
        </div>
        
        <div className="text-xs text-muted-foreground">
          <p>💡 Comparte esta URL con tus clientes para que accedan a tu menú</p>
        </div>
      </CardContent>
    </Card>
  );
};

export default QuickAccessMenu;
