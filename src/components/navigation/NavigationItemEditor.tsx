import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { IconSelector } from './IconSelector';
import { NavigationItem } from '@/hooks/useNavigationConfig';
import { GripVertical, Trash2, Edit3 } from 'lucide-react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface NavigationItemEditorProps {
  item: NavigationItem;
  onUpdate: (id: string, updates: Partial<NavigationItem>) => void;
  onDelete: (id: string) => void;
  isEditing: boolean;
  onToggleEdit: () => void;
}

export const NavigationItemEditor: React.FC<NavigationItemEditorProps> = ({
  item,
  onUpdate,
  onDelete,
  isEditing,
  onToggleEdit,
}) => {
  const [localItem, setLocalItem] = useState(item);

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: item.id,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const handleSave = () => {
    onUpdate(item.id, localItem);
    onToggleEdit();
  };

  const handleCancel = () => {
    setLocalItem(item);
    onToggleEdit();
  };

  const updateLocalItem = (field: keyof NavigationItem, value: any) => {
    setLocalItem(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div ref={setNodeRef} style={style}>
      <Card className={`transition-all duration-200 ${isDragging ? 'shadow-lg' : ''}`}>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <button
                {...attributes}
                {...listeners}
                className="cursor-grab hover:text-primary transition-colors"
              >
                <GripVertical className="h-4 w-4" />
              </button>
              {item.item_label}
            </CardTitle>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={onToggleEdit}
                className="h-8 w-8 p-0"
              >
                <Edit3 className="h-3 w-3" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onDelete(item.id)}
                className="h-8 w-8 p-0 text-destructive hover:text-destructive"
              >
                <Trash2 className="h-3 w-3" />
              </Button>
            </div>
          </div>
        </CardHeader>

        {isEditing && (
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="item_label">Etiqueta</Label>
                <Input
                  id="item_label"
                  value={localItem.item_label}
                  onChange={(e) => updateLocalItem('item_label', e.target.value)}
                  placeholder="Etiqueta del menú"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="route_path">Ruta</Label>
                <Input
                  id="route_path"
                  value={localItem.route_path}
                  onChange={(e) => updateLocalItem('route_path', e.target.value)}
                  placeholder="/ruta"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Ícono</Label>
              <IconSelector
                selectedIcon={localItem.item_icon}
                onIconSelect={(icon) => updateLocalItem('item_icon', icon)}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="required_role">Rol requerido</Label>
                <Select
                  value={localItem.required_role}
                  onValueChange={(value) => updateLocalItem('required_role', value)}
                >
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

              <div className="space-y-2">
                <Label htmlFor="nav_type">Tipo de navegación</Label>
                <Select
                  value={localItem.nav_type}
                  onValueChange={(value) => updateLocalItem('nav_type', value as 'top' | 'bottom')}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="top">Superior</SelectItem>
                    <SelectItem value="bottom">Dashboard</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Switch
                  id="is_visible"
                  checked={localItem.is_visible}
                  onCheckedChange={(checked) => updateLocalItem('is_visible', checked)}
                />
                <Label htmlFor="is_visible">Visible</Label>
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="auth_required"
                  checked={localItem.auth_required}
                  onCheckedChange={(checked) => updateLocalItem('auth_required', checked)}
                />
                <Label htmlFor="auth_required">Requiere autenticación</Label>
              </div>
            </div>

            <div className="flex gap-2 pt-4">
              <Button onClick={handleSave} size="sm" className="flex-1">
                Guardar
              </Button>
              <Button onClick={handleCancel} variant="outline" size="sm" className="flex-1">
                Cancelar
              </Button>
            </div>
          </CardContent>
        )}
      </Card>
    </div>
  );
};