import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface NavigationItem {
  id: string;
  item_name: string;
  item_icon: string;
  item_label: string;
  route_path: string;
  position: number;
  nav_type: 'top' | 'bottom';
  is_visible: boolean;
  auth_required: boolean;
  required_role: 'public' | 'empleado' | 'admin' | 'superadmin';
  parent_id?: string;
  created_at: string;
  updated_at: string;
}

export const useNavigationConfig = () => {
  const [navigationItems, setNavigationItems] = useState<NavigationItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  const fetchNavigationItems = async () => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('navigation_config')
        .select('*')
        .order('nav_type', { ascending: true })
        .order('position', { ascending: true });

      if (error) throw error;
      setNavigationItems((data || []) as NavigationItem[]);
    } catch (error) {
      console.error('Error fetching navigation items:', error);
      toast({
        title: "Error",
        description: "No se pudieron cargar los elementos de navegación",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const createNavigationItem = async (item: Omit<NavigationItem, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      const { data, error } = await supabase
        .from('navigation_config')
        .insert([item])
        .select()
        .single();

      if (error) throw error;

      setNavigationItems(prev => [...prev, data as NavigationItem]);
      toast({
        title: "Éxito",
        description: "Elemento de navegación creado correctamente",
      });
      
      return data;
    } catch (error) {
      console.error('Error creating navigation item:', error);
      toast({
        title: "Error",
        description: "No se pudo crear el elemento de navegación",
        variant: "destructive",
      });
      throw error;
    }
  };

  const updateNavigationItem = async (id: string, updates: Partial<NavigationItem>) => {
    try {
      const { data, error } = await supabase
        .from('navigation_config')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      setNavigationItems(prev => 
        prev.map(item => item.id === id ? { ...item, ...data as NavigationItem } : item)
      );

      return data;
    } catch (error) {
      console.error('Error updating navigation item:', error);
      toast({
        title: "Error",
        description: "No se pudo actualizar el elemento de navegación",
        variant: "destructive",
      });
      throw error;
    }
  };

  const deleteNavigationItem = async (id: string) => {
    try {
      const { error } = await supabase
        .from('navigation_config')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setNavigationItems(prev => prev.filter(item => item.id !== id));
      toast({
        title: "Éxito",
        description: "Elemento de navegación eliminado correctamente",
      });
    } catch (error) {
      console.error('Error deleting navigation item:', error);
      toast({
        title: "Error",
        description: "No se pudo eliminar el elemento de navegación",
        variant: "destructive",
      });
      throw error;
    }
  };

  const updatePositions = async (items: NavigationItem[]) => {
    try {
      const updates = items.map(item => 
        supabase
          .from('navigation_config')
          .update({ position: item.position })
          .eq('id', item.id)
      );

      await Promise.all(updates);
      setNavigationItems(items);
    } catch (error) {
      console.error('Error updating positions:', error);
      toast({
        title: "Error",
        description: "No se pudieron actualizar las posiciones",
        variant: "destructive",
      });
      throw error;
    }
  };

  const getItemsByType = (type: 'top' | 'bottom') => {
    return navigationItems.filter(item => item.nav_type === type);
  };

  const getVisibleItemsByRole = (type: 'top' | 'bottom', userRole: string = 'public', isAuthenticated: boolean = false) => {
    const roleHierarchy = {
      'public': 0,
      'empleado': 1,
      'admin': 2,
      'superadmin': 3
    };

    return navigationItems
      .filter(item => item.nav_type === type && item.is_visible)
      .filter(item => {
        // Verificar si requiere autenticación
        if (item.auth_required && !isAuthenticated) return false;
        
        // Verificar permisos de rol
        const userLevel = roleHierarchy[userRole as keyof typeof roleHierarchy] || 0;
        const requiredLevel = roleHierarchy[item.required_role as keyof typeof roleHierarchy] || 0;
        
        return userLevel >= requiredLevel;
      })
      .sort((a, b) => a.position - b.position);
  };

  useEffect(() => {
    fetchNavigationItems();

    // Suscribirse a cambios en tiempo real
    const subscription = supabase
      .channel('navigation_config_changes')
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'navigation_config' 
      }, () => {
        fetchNavigationItems();
      })
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  return {
    navigationItems,
    isLoading,
    createNavigationItem,
    updateNavigationItem,
    deleteNavigationItem,
    updatePositions,
    getItemsByType,
    getVisibleItemsByRole,
    refetch: fetchNavigationItems,
  };
};