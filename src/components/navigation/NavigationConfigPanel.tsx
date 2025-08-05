import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus, Save, RotateCcw } from 'lucide-react';
import { NavigationItemEditor } from './NavigationItemEditor';
import { NavigationPreview } from './NavigationPreview';
import { NavigationItem, useNavigationConfig } from '@/hooks/useNavigationConfig';
import { DndContext, closestCenter, DragEndEvent } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy, arrayMove } from '@dnd-kit/sortable';
import { useToast } from '@/hooks/use-toast';

export const NavigationConfigPanel: React.FC = () => {
  const { 
    navigationItems, 
    isLoading, 
    createNavigationItem, 
    updateNavigationItem, 
    deleteNavigationItem,
    updatePositions,
    getItemsByType 
  } = useNavigationConfig();

  const [editingItem, setEditingItem] = useState<string | null>(null);
  const [previewRole, setPreviewRole] = useState('public');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const { toast } = useToast();

  const topNavItems = getItemsByType('top');
  const bottomNavItems = getItemsByType('bottom');

  const handleDragEnd = async (event: DragEndEvent, navType: 'top' | 'bottom') => {
    const { active, over } = event;

    if (!over || active.id === over.id) return;

    const items = navType === 'top' ? topNavItems : bottomNavItems;
    const oldIndex = items.findIndex((item) => item.id === active.id);
    const newIndex = items.findIndex((item) => item.id === over.id);

    if (oldIndex === -1 || newIndex === -1) return;

    const newItems = arrayMove(items, oldIndex, newIndex);
    const updatedItems = newItems.map((item, index) => ({
      ...item,
      position: index + 1
    }));

    try {
      await updatePositions(updatedItems);
      toast({
        title: "Éxito",
        description: "Orden actualizado correctamente",
      });
    } catch (error) {
      console.error('Error updating order:', error);
    }
  };

  const handleCreateItem = async (navType: 'top' | 'bottom') => {
    const items = navType === 'top' ? topNavItems : bottomNavItems;
    const newPosition = Math.max(0, ...items.map(i => i.position)) + 1;

    const newItem: Omit<NavigationItem, 'id' | 'created_at' | 'updated_at'> = {
      item_name: `new_item_${Date.now()}`,
      item_icon: 'Circle',
      item_label: 'Nuevo Item',
      route_path: '/nuevo',
      position: newPosition,
      nav_type: navType,
      is_visible: true,
      auth_required: navType === 'bottom',
      required_role: navType === 'top' ? 'public' : 'empleado',
    };

    try {
      const created = await createNavigationItem(newItem);
      setEditingItem(created.id);
    } catch (error) {
      console.error('Error creating item:', error);
    }
  };

  const handleResetToDefaults = async () => {
    if (!confirm('¿Estás seguro de que quieres restaurar la configuración por defecto? Esto eliminará todos los cambios personalizados.')) {
      return;
    }

    try {
      // Aquí podrías implementar la lógica para restaurar valores por defecto
      toast({
        title: "Información",
        description: "Función de restaurar por defecto próximamente disponible",
      });
    } catch (error) {
      console.error('Error resetting to defaults:', error);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Configuración de Navegación</h2>
          <p className="text-muted-foreground">
            Gestiona los elementos de navegación superior y dashboard
          </p>
        </div>
        
        <div className="flex gap-2">
          <Button onClick={handleResetToDefaults} variant="outline" size="sm">
            <RotateCcw className="h-4 w-4 mr-2" />
            Restaurar
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Editor Panel */}
        <div className="space-y-6">
          <Tabs defaultValue="top" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="top">Navegación Superior</TabsTrigger>
              <TabsTrigger value="bottom">Navegación Dashboard</TabsTrigger>
            </TabsList>
            
            <TabsContent value="top" className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium">Items Superiores</h3>
                <Button onClick={() => handleCreateItem('top')} size="sm">
                  <Plus className="h-4 w-4 mr-2" />
                  Agregar
                </Button>
              </div>
              
              <DndContext
                collisionDetection={closestCenter}
                onDragEnd={(event) => handleDragEnd(event, 'top')}
              >
                <SortableContext
                  items={topNavItems.map(item => item.id)}
                  strategy={verticalListSortingStrategy}
                >
                  <div className="space-y-3">
                    {topNavItems.map((item) => (
                      <NavigationItemEditor
                        key={item.id}
                        item={item}
                        onUpdate={updateNavigationItem}
                        onDelete={deleteNavigationItem}
                        isEditing={editingItem === item.id}
                        onToggleEdit={() => setEditingItem(
                          editingItem === item.id ? null : item.id
                        )}
                      />
                    ))}
                  </div>
                </SortableContext>
              </DndContext>
            </TabsContent>
            
            <TabsContent value="bottom" className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium">Items Dashboard</h3>
                <Button onClick={() => handleCreateItem('bottom')} size="sm">
                  <Plus className="h-4 w-4 mr-2" />
                  Agregar
                </Button>
              </div>
              
              <DndContext
                collisionDetection={closestCenter}
                onDragEnd={(event) => handleDragEnd(event, 'bottom')}
              >
                <SortableContext
                  items={bottomNavItems.map(item => item.id)}
                  strategy={verticalListSortingStrategy}
                >
                  <div className="space-y-3">
                    {bottomNavItems.map((item) => (
                      <NavigationItemEditor
                        key={item.id}
                        item={item}
                        onUpdate={updateNavigationItem}
                        onDelete={deleteNavigationItem}
                        isEditing={editingItem === item.id}
                        onToggleEdit={() => setEditingItem(
                          editingItem === item.id ? null : item.id
                        )}
                      />
                    ))}
                  </div>
                </SortableContext>
              </DndContext>
            </TabsContent>
          </Tabs>
        </div>

        {/* Preview Panel */}
        <div className="lg:sticky lg:top-6">
          <NavigationPreview
            previewRole={previewRole}
            isAuthenticated={isAuthenticated}
            onRoleChange={setPreviewRole}
            onAuthChange={setIsAuthenticated}
          />
        </div>
      </div>
    </div>
  );
};