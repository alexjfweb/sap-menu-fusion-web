import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { NavigationItem, useNavigationConfig } from '@/hooks/useNavigationConfig';
import { 
  Home, Package, ShoppingCart, Calendar, BarChart3, Settings, Users, 
  CreditCard, MessageCircle, Zap, LogIn, LayoutDashboard, ArrowLeft,
  ChefHat
} from 'lucide-react';
import * as LucideIcons from 'lucide-react';

const iconMap = LucideIcons as any;

interface NavigationPreviewProps {
  previewRole: string;
  isAuthenticated: boolean;
  onRoleChange: (role: string) => void;
  onAuthChange: (isAuth: boolean) => void;
}

export const NavigationPreview: React.FC<NavigationPreviewProps> = ({
  previewRole,
  isAuthenticated,
  onRoleChange,
  onAuthChange,
}) => {
  const { getVisibleItemsByRole } = useNavigationConfig();
  
  const topNavItems = getVisibleItemsByRole('top', previewRole, isAuthenticated);
  const bottomNavItems = getVisibleItemsByRole('bottom', previewRole, isAuthenticated);

  const renderIcon = (iconName: string, className: string = "h-4 w-4") => {
    const IconComponent = iconMap[iconName];
    return IconComponent ? <IconComponent className={className} /> : <Home className={className} />;
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'public': return 'secondary';
      case 'empleado': return 'default';
      case 'admin': return 'destructive';
      case 'superadmin': return 'outline';
      default: return 'secondary';
    }
  };

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="text-lg">Vista Previa</CardTitle>
        
        {/* Controles de vista previa */}
        <div className="space-y-4 pt-4 border-t">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Rol del usuario</Label>
              <Select value={previewRole} onValueChange={onRoleChange}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="public">Público</SelectItem>
                  <SelectItem value="empleado">Empleado</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="superadmin">Super Admin</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="flex items-center space-x-2 pt-8">
              <Switch
                id="authenticated"
                checked={isAuthenticated}
                onCheckedChange={onAuthChange}
              />
              <Label htmlFor="authenticated">Autenticado</Label>
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Navegación Superior */}
        <div className="space-y-3">
          <h3 className="font-medium text-sm text-muted-foreground">Navegación Superior</h3>
          <div className="bg-background border rounded-lg p-4">
            <nav className="border-b border-border bg-background/95 backdrop-blur">
              <div className="container mx-auto px-4 py-4 flex justify-between items-center">
                <div className="flex items-center space-x-2">
                  <ChefHat className="h-8 w-8 text-primary" />
                  <span className="text-xl font-bold">SAP Menu</span>
                </div>
                
                <div className="hidden md:flex items-center space-x-6">
                  {topNavItems.map((item) => (
                    <div key={item.id} className="flex items-center gap-2">
                      <Button variant="ghost" className="flex items-center space-x-1">
                        {renderIcon(item.item_icon)}
                        <span className="text-sm">{item.item_label}</span>
                      </Button>
                      <Badge variant={getRoleBadgeColor(item.required_role)} className="text-xs">
                        {item.required_role}
                      </Badge>
                    </div>
                  ))}
                </div>
              </div>
            </nav>
          </div>
        </div>

        {/* Navegación Dashboard */}
        {isAuthenticated && bottomNavItems.length > 0 && (
          <div className="space-y-3">
            <h3 className="font-medium text-sm text-muted-foreground">Navegación Dashboard</h3>
            <div className="bg-background border rounded-lg p-4">
              <nav className="border-b border-border bg-background/95 backdrop-blur">
                <div className="container mx-auto px-4 py-4 flex justify-between items-center">
                  <div className="flex items-center space-x-2">
                    <Button variant="outline" className="flex items-center space-x-2">
                      <ArrowLeft className="h-4 w-4" />
                      <span>Volver al inicio</span>
                    </Button>
                  </div>
                </div>
              </nav>
              
              <div className="p-4 space-y-2">
                {bottomNavItems.map((item) => (
                  <div key={item.id} className="flex items-center justify-between p-2 rounded hover:bg-muted">
                    <div className="flex items-center gap-2">
                      {renderIcon(item.item_icon)}
                      <span className="text-sm">{item.item_label}</span>
                    </div>
                    <Badge variant={getRoleBadgeColor(item.required_role)} className="text-xs">
                      {item.required_role}
                    </Badge>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Estado actual */}
        <div className="bg-muted p-3 rounded-lg text-xs space-y-1">
          <div><strong>Rol actual:</strong> {previewRole}</div>
          <div><strong>Autenticado:</strong> {isAuthenticated ? 'Sí' : 'No'}</div>
          <div><strong>Items superiores visibles:</strong> {topNavItems.length}</div>
          <div><strong>Items dashboard visibles:</strong> {bottomNavItems.length}</div>
        </div>
      </CardContent>
    </Card>
  );
};