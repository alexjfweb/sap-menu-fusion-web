import React, { useState, useCallback } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { supabase } from '@/integrations/supabase/client';
import { Plus, Search, Edit, Trash2, Eye, EyeOff, ArrowLeft, ChefHat, Menu as MenuIcon, CheckCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import ProductForm from './ProductForm';
import PublicMenu from '../menu/PublicMenu';
import DeleteProductModal from './DeleteProductModal';
import EnhancedBulkActionsModal from './EnhancedBulkActionsModal';
import ProductPagination from './ProductPagination';
import { Tables } from '@/integrations/supabase/types';
import { sortProductsByStandardizedCategories, sortCategoriesByStandardOrder } from '@/lib/categoryUtils';

type Product = Tables<'products'>;
type Category = Tables<'categories'>;

// Tipo específico para productos con categorías parciales (como viene de la consulta)
type ProductWithPartialCategory = Product & { 
  categories?: { id: string; name: string } | null 
};

interface ProductManagementProps {
  onBack?: () => void;
}

const PRODUCTS_PER_PAGE = 100;

const ProductManagement = ({ onBack }: ProductManagementProps) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [showForm, setShowForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [showPublicMenu, setShowPublicMenu] = useState(false);
  const [selectedProducts, setSelectedProducts] = useState<Set<string>>(new Set());
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [productToDelete, setProductToDelete] = useState<Product | null>(null);
  const [showBulkModal, setShowBulkModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [recentlyCreatedProduct, setRecentlyCreatedProduct] = useState<string | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // CORRECCIÓN CRÍTICA: Query unificada con PublicMenu
  const { data: products, isLoading: productsLoading, refetch: refetchProducts } = useQuery({
    queryKey: ['products'], // ✅ Misma key que PublicMenu
    queryFn: async () => {
      console.log('🔍 [PRODUCT MANAGEMENT] Obteniendo productos...');
      const { data, error } = await supabase
        .from('products')
        .select(`
          *,
          categories (
            id,
            name
          )
        `)
        .order('created_at', { ascending: false }); // CAMBIO CRÍTICO: Ordenar por fecha de creación descendente
      
      if (error) {
        console.error('❌ Error obteniendo productos:', error);
        throw error;
      }
      
      console.log('✅ [PRODUCT MANAGEMENT] Productos obtenidos:', data?.length || 0, 'productos');
      console.log('📅 Primer producto (más reciente):', data?.[0]?.name, data?.[0]?.created_at);
      return data as ProductWithPartialCategory[];
    },
  });

  // CORRECCIÓN CRÍTICA: Query unificada con PublicMenu
  const { data: categories } = useQuery({
    queryKey: ['categories'], // ✅ Misma key que PublicMenu
    queryFn: async () => {
      console.log('🔍 [PRODUCT MANAGEMENT] Obteniendo categorías...');
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .order('sort_order');
      
      if (error) {
        console.error('❌ Error obteniendo categorías:', error);
        throw error;
      }
      
      console.log('✅ [PRODUCT MANAGEMENT] Categorías obtenidas:', data?.length || 0, 'categorías');
      return data;
    },
  });

  // Ordenar categorías según el orden establecido usando la utilidad centralizada
  const sortedCategories = React.useMemo(() => {
    if (!categories) return [];
    return sortCategoriesByStandardOrder(categories);
  }, [categories]);

  // Aplicar filtros pero mantener el orden cronológico descendente para productos recientes
  const sortedAndFilteredProducts = React.useMemo(() => {
    if (!products || !categories) return [];
    
    const filtered = products.filter(product => {
      const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           product.description?.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory = selectedCategory === 'all' || product.category_id === selectedCategory;
      
      return matchesSearch && matchesCategory;
    });
    
    // Para mantener los productos recientes al inicio, solo aplicamos ordenamiento por categoría
    // si no hay filtros activos. Si hay filtros, mantenemos el orden cronológico.
    if (searchTerm || selectedCategory !== 'all') {
      return filtered; // Mantener orden cronológico cuando hay filtros
    }
    
    return sortProductsByStandardizedCategories(filtered, categories);
  }, [products, categories, searchTerm, selectedCategory]);

  const totalProducts = sortedAndFilteredProducts?.length || 0;
  const totalPages = Math.ceil(totalProducts / PRODUCTS_PER_PAGE);
  const paginatedProducts = sortedAndFilteredProducts?.slice(
    (currentPage - 1) * PRODUCTS_PER_PAGE,
    currentPage * PRODUCTS_PER_PAGE
  );

  React.useEffect(() => {
    setCurrentPage(1);
    setSelectedProducts(new Set());
  }, [searchTerm, selectedCategory]);

  // Función para encontrar y resaltar el producto recién creado
  const highlightNewProduct = useCallback((productName: string) => {
    console.log('🎯 Resaltando producto recién creado:', productName);
    setRecentlyCreatedProduct(productName);
    
    // Ir a la primera página donde debería estar el producto más reciente
    setCurrentPage(1);
    
    // Quitar el resaltado después de 5 segundos
    setTimeout(() => {
      setRecentlyCreatedProduct(null);
    }, 5000);
  }, []);

  // SISTEMA DE INVALIDACIÓN GLOBAL MEJORADO
  const notifyPublicMenuUpdate = useCallback(() => {
    try {
      // Señal para que PublicMenu se actualice
      localStorage.setItem('product_management_updated', Date.now().toString());
      console.log('🔔 [PRODUCT MANAGEMENT] Notificación enviada a PublicMenu');
      
      // Forzar evento de storage para componentes en la misma pestaña
      window.dispatchEvent(new StorageEvent('storage', {
        key: 'product_management_updated',
        newValue: Date.now().toString()
      }));
    } catch (error) {
      console.warn('⚠️ No se pudo notificar actualización via localStorage:', error);
    }
  }, []);

  // Función mejorada para refrescar datos con cache optimista mejorado
  const refreshProductData = async (newProductName?: string, maxRetries = 6): Promise<boolean> => {
    setIsRefreshing(true);
    
    // PASO 1: Cache optimista mejorado - usar nombre real si se proporciona
    let optimisticProduct: ProductWithPartialCategory | null = null;
    if (newProductName && !editingProduct) {
      optimisticProduct = {
        id: 'temp-' + Date.now(),
        name: newProductName,
        description: 'Producto recién creado...',
        price: 0,
        category_id: null,
        product_type: 'plato' as any,
        is_available: true,
        preparation_time: 15,
        calories: null,
        is_vegetarian: false,
        is_vegan: false,
        is_gluten_free: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        image_url: null,
        ingredients: null,
        allergens: null,
        categories: null
      };

      // Actualizar cache optimista - agregar al principio de la lista
      queryClient.setQueryData(['products'], (oldData: ProductWithPartialCategory[] | undefined) => {
        if (!oldData) return [optimisticProduct!];
        return [optimisticProduct!, ...oldData];
      });

      console.log('✨ Cache optimista aplicado para:', newProductName);
    }

    // PASO 2: Delay estratégico más largo para asegurar propagación
    console.log('⏳ Esperando propagación de datos en Supabase...');
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        console.log(`🔄 Intento ${attempt}/${maxRetries} - Refrescando datos de productos...`);
        
        // INVALIDACIÓN GLOBAL: Invalidar tanto productos como categorías
        await Promise.all([
          queryClient.invalidateQueries({ queryKey: ['products'] }),
          queryClient.invalidateQueries({ queryKey: ['categories'] })
        ]);
        
        // Notificar a PublicMenu sobre la actualización
        notifyPublicMenuUpdate();
        
        // Esperar procesamiento de invalidaciones
        await new Promise(resolve => setTimeout(resolve, 400));
        
        // Refetch explícito con timeout aumentado y tipado correcto
        const refetchPromise = refetchProducts();
        const timeoutPromise = new Promise<never>((_, reject) => 
          setTimeout(() => reject(new Error('Timeout en refetch')), 10000)
        );
        
        const result = await Promise.race([refetchPromise, timeoutPromise]);
        
        // PASO 3: Verificación crítica - buscar el producto en los datos refrescados
        if (newProductName && !editingProduct) {
          // Verificar directamente en los datos devueltos por el refetch - FIX CRÍTICO DEL TIPADO
          const freshData = result.data as ProductWithPartialCategory[] | undefined;
          const foundProduct = freshData?.find(p => p.name === newProductName);
          
          if (!foundProduct) {
            console.warn(`⚠️ Intento ${attempt}: Producto "${newProductName}" no encontrado en datos refrescados`);
            
            // Verificación adicional directa a la base de datos
            const { data: verificationData } = await supabase
              .from('products')
              .select('id, name, created_at')
              .eq('name', newProductName)
              .order('created_at', { ascending: false })
              .limit(1);

            if (!verificationData || verificationData.length === 0) {
              throw new Error(`Producto "${newProductName}" no encontrado en verificación directa`);
            }

            console.log('✅ Producto encontrado en verificación directa:', verificationData[0]);
            
            // Si está en la DB pero no en el refetch, es un problema de timing
            if (attempt < maxRetries) {
              const delay = Math.min(1500 * attempt, 4000);
              console.log(`⏳ Problema de timing detectado, esperando ${delay}ms más...`);
              await new Promise(resolve => setTimeout(resolve, delay));
              continue;
            }
          } else {
            console.log('✅ Producto encontrado en refetch:', foundProduct.name, foundProduct.created_at);
            
            // Resaltar el producto recién creado
            highlightNewProduct(newProductName);
          }
        }
        
        console.log('✅ [PRODUCT MANAGEMENT] Datos refrescados exitosamente con invalidación global');
        setIsRefreshing(false);
        return true;
        
      } catch (error) {
        console.warn(`⚠️ Intento ${attempt} falló:`, error);
        
        if (attempt === maxRetries) {
          console.error('❌ Todos los intentos de refetch fallaron');
          
          // Limpiar cache optimista si falló
          if (optimisticProduct) {
            queryClient.setQueryData(['products'], (oldData: ProductWithPartialCategory[] | undefined) => {
              if (!oldData) return [];
              return oldData.filter(p => p.id !== optimisticProduct!.id);
            });
            console.log('🧹 Cache optimista limpiado debido a fallo');
          }
          
          setIsRefreshing(false);
          return false;
        }
        
        // Esperar antes del siguiente intento con backoff exponencial
        const delay = Math.min(1200 * Math.pow(1.5, attempt - 1), 6000);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
    
    setIsRefreshing(false);
    return false;
  };

  const checkProductDependencies = async (productId: string) => {
    try {
      // Verificar si existe en order_items
      const { data: orderItems, error: orderError } = await supabase
        .from('order_items')
        .select('id')
        .eq('product_id', productId)
        .limit(1);

      if (orderError) {
        console.error('❌ Error verificando dependencias en order_items:', orderError);
        return { hasOrderItems: false, hasDependencies: false };
      }

      const hasOrderItems = (orderItems?.length || 0) > 0;

      return {
        hasOrderItems,
        hasDependencies: hasOrderItems
      };
    } catch (error) {
      console.error('❌ Error verificando dependencias:', error);
      return { hasOrderItems: false, hasDependencies: false };
    }
  };

  const handleSelectProduct = (productId: string, checked: boolean) => {
    const newSelected = new Set(selectedProducts);
    if (checked) {
      newSelected.add(productId);
    } else {
      newSelected.delete(productId);
    }
    console.log('📋 Productos seleccionados en página:', Array.from(newSelected));
    setSelectedProducts(newSelected);
  };

  const handleSelectAllCurrentPage = () => {
    if (!paginatedProducts) return;
    
    const newSelected = new Set(selectedProducts);
    const currentPageIds = paginatedProducts.map(p => p.id);
    
    const allCurrentPageSelected = currentPageIds.every(id => selectedProducts.has(id));
    
    if (allCurrentPageSelected) {
      currentPageIds.forEach(id => newSelected.delete(id));
    } else {
      currentPageIds.forEach(id => newSelected.add(id));
    }
    
    console.log('📋 Selección página actual - productos seleccionados:', Array.from(newSelected));
    setSelectedProducts(newSelected);
  };

  const performBulkOperation = async (
    operation: 'delete' | 'activate' | 'deactivate',
    showProgress: (progress: number) => void
  ) => {
    if (selectedProducts.size === 0) {
      console.warn('⚠️ No hay productos seleccionados');
      return;
    }

    const selectedIds = Array.from(selectedProducts);
    console.log(`🔄 Iniciando operación masiva: ${operation}`);
    console.log(`📋 Total productos seleccionados:`, selectedIds.length);

    if (selectedIds.length > 100) {
      toast({
        title: "Demasiados productos",
        description: "Por favor selecciona máximo 100 productos a la vez para mayor estabilidad.",
        variant: "destructive",
      });
      return;
    }

    setIsDeleting(true);
    
    try {
      const CHUNK_SIZE = 50;
      const chunks = [];
      for (let i = 0; i < selectedIds.length; i += CHUNK_SIZE) {
        chunks.push(selectedIds.slice(i, i + CHUNK_SIZE));
      }

      console.log(`📦 Procesando ${chunks.length} grupos de hasta ${CHUNK_SIZE} productos cada uno`);

      let totalAffected = 0;
      let chunkIndex = 0;

      for (const chunk of chunks) {
        chunkIndex++;
        const progressValue = (chunkIndex / chunks.length) * 100;
        showProgress(progressValue);
        
        console.log(`📦 Procesando grupo ${chunkIndex}/${chunks.length} con ${chunk.length} productos`);

        const { data, error } = await supabase.functions.invoke('bulk-product-operations', {
          body: {
            operation,
            productIds: chunk
          }
        });

        if (error) {
          console.error(`❌ Error en grupo ${chunkIndex} de operación ${operation}:`, error);
          throw new Error(`Error en grupo ${chunkIndex}: ${error.message}. ${totalAffected} productos fueron procesados exitosamente.`);
        }

        if (!data.success) {
          console.error(`❌ Grupo ${chunkIndex} de operación ${operation} falló:`, data.error);
          throw new Error(`Grupo ${chunkIndex} falló: ${data.error}. ${totalAffected} productos fueron procesados exitosamente.`);
        }

        totalAffected += data.affectedRows;
        console.log(`✅ Grupo ${chunkIndex} completado: ${data.affectedRows} productos afectados (Total: ${totalAffected})`);
      }

      showProgress(100);
      console.log(`🎉 Operación masiva ${operation} completada: ${totalAffected} productos procesados en ${chunks.length} grupos`);

      let successMessage = '';
      switch (operation) {
        case 'delete':
          successMessage = `${totalAffected} productos eliminados correctamente`;
          break;
        case 'activate':
          successMessage = `${totalAffected} productos activados correctamente`;
          break;
        case 'deactivate':
          successMessage = `${totalAffected} productos desactivados correctamente`;
          break;
      }

      toast({
        title: "Operación completada",
        description: successMessage,
      });

      setSelectedProducts(new Set());
      await refreshProductData();
      setShowBulkModal(false);

    } catch (error) {
      console.error(`❌ Error en operación masiva ${operation}:`, error);
      toast({
        title: "Error en operación masiva",
        description: error.message || `No se pudo completar la operación ${operation}`,
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
    }
  };

  const handleBulkDelete = (showProgress: (progress: number) => void) => 
    performBulkOperation('delete', showProgress);
  const handleBulkActivate = (showProgress: (progress: number) => void) => 
    performBulkOperation('activate', showProgress);
  const handleBulkDeactivate = (showProgress: (progress: number) => void) => 
    performBulkOperation('deactivate', showProgress);

  const toggleProductAvailability = async (product: Product) => {
    try {
      console.log(`🔄 Cambiando disponibilidad de "${product.name}": ${product.is_available} → ${!product.is_available}`);
      
      const { error } = await supabase
        .from('products')
        .update({ is_available: !product.is_available })
        .eq('id', product.id);

      if (error) {
        console.error('❌ Error actualizando disponibilidad:', error);
        throw error;
      }

      console.log(`✅ Disponibilidad actualizada para "${product.name}"`);
      toast({
        title: "Producto actualizado",
        description: `${product.name} ${!product.is_available ? 'activado' : 'desactivado'} correctamente`,
      });

      // INVALIDACIÓN GLOBAL: Refrescar datos y notificar a PublicMenu
      await refreshProductData();
    } catch (error) {
      console.error('❌ Error updating product:', error);
      toast({
        title: "Error",
        description: "No se pudo actualizar el producto",
        variant: "destructive",
      });
    }
  };

  const handleDeleteProduct = async (product: Product) => {
    console.log('🔍 Verificando dependencias para:', product.name, product.id);
    
    // Verificar dependencias antes de mostrar el modal
    const dependencies = await checkProductDependencies(product.id);
    
    if (dependencies.hasDependencies) {
      let dependencyMessage = '';
      if (dependencies.hasOrderItems) {
        dependencyMessage = 'Este producto está asociado a pedidos anteriores y no puede ser eliminado. ';
      }
      
      toast({
        title: "No se puede eliminar el producto",
        description: `${dependencyMessage}Considera desactivarlo en su lugar para que no aparezca en el menú público pero mantenga el historial.`,
        variant: "destructive",
      });
      return;
    }

    console.log('🗑️ Preparando eliminación de producto:', product.name, product.id);
    setProductToDelete(product);
    setShowDeleteModal(true);
  };

  const confirmDeleteProduct = async () => {
    if (!productToDelete) return;

    setIsDeleting(true);
    try {
      console.log('🗑️ Eliminando producto:', productToDelete.name, productToDelete.id);
      
      const { error } = await supabase
        .from('products')
        .delete()
        .eq('id', productToDelete.id);

      if (error) {
        console.error('❌ Error eliminando producto:', error);
        
        // Manejar específicamente el error 409 de clave foránea
        if (error.code === '23503' || error.message.includes('violates foreign key constraint')) {
          toast({
            title: "No se puede eliminar el producto",
            description: "Este producto está asociado a pedidos anteriores y no puede ser eliminado. Considera desactivarlo en su lugar.",
            variant: "destructive",
          });
        } else {
          toast({
            title: "Error",
            description: "No se pudo eliminar el producto. Inténtalo de nuevo.",
            variant: "destructive",
          });
        }
        return;
      }

      console.log('✅ Producto eliminado correctamente:', productToDelete.name);
      toast({
        title: "Producto eliminado",
        description: `${productToDelete.name} eliminado correctamente`,
      });

      await refreshProductData();
      setShowDeleteModal(false);
      setProductToDelete(null);
    } catch (error) {
      console.error('❌ Error deleting product:', error);
      toast({
        title: "Error",
        description: "No se pudo eliminar el producto",
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
    }
  };

  const handleEditProduct = (product: Product) => {
    console.log('✏️ Editando producto:', product.name, product.id);
    setEditingProduct(product);
    setShowForm(true);
  };

  const handleCloseForm = () => {
    console.log('❌ Cerrando formulario de producto');
    setShowForm(false);
    setEditingProduct(null);
  };

  // Función mejorada para manejar el guardado con confirmación visual
  const handleSaveProduct = async (newProductName?: string) => {
    console.log('💾 Producto guardado, iniciando refesco robusto...', newProductName ? `para: ${newProductName}` : '(actualización)');
    
    try {
      // Refrescar datos de forma robusta con el nombre real del producto
      const refreshSuccess = await refreshProductData(newProductName);
      
      if (refreshSuccess) {
        handleCloseForm();
        
        // Mostrar confirmación visual mejorada con botón para navegar al producto
        if (newProductName) {
          toast({
            title: "¡Producto creado exitosamente!",
            description: (
              <div className="flex items-center justify-between">
                <span>{newProductName} se agregó al inicio de la lista</span>
                <CheckCircle className="h-4 w-4 text-green-500 ml-2" />
              </div>
            ),
          });
        } else {
          toast({
            title: "Producto actualizado",
            description: "Los cambios se guardaron correctamente",
          });
        }
        
        console.log('✅ Producto guardado y lista actualizada exitosamente');
      } else {
        toast({
          title: "Advertencia",
          description: "El producto se guardó, pero hubo problemas actualizando la lista. Ve a la primera página para verlo.",
          variant: "destructive",
        });
        
        // Cerrar formulario y ir a la primera página de todos modos
        handleCloseForm();
        setCurrentPage(1);
      }
      
    } catch (error) {
      console.error('❌ Error en handleSaveProduct:', error);
      toast({
        title: "Advertencia",
        description: "El producto se guardó, pero puede que tengas que recargar para verlo en la lista.",
        variant: "destructive",
      });
      
      // Cerrar formulario de todos modos
      handleCloseForm();
    }
  };

  if (showPublicMenu) {
    return <PublicMenu onBack={() => setShowPublicMenu(false)} />;
  }

  if (productsLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  const selectedCount = selectedProducts.size;
  const currentPageProductCount = paginatedProducts?.length || 0;
  const allCurrentPageSelected = currentPageProductCount > 0 && 
    paginatedProducts?.every(p => selectedProducts.has(p.id));

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-4">
              {onBack && (
                <Button variant="ghost" size="sm" onClick={onBack}>
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Volver al Panel
                </Button>
              )}
              <div className="flex items-center space-x-2">
                <ChefHat className="h-8 w-8 text-primary" />
                <h1 className="text-2xl font-bold">Gestión de Productos</h1>
                {isRefreshing && (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
                )}
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Button 
                variant="outline" 
                onClick={() => setShowPublicMenu(true)} 
                className="flex items-center gap-2 bg-primary text-primary-foreground hover:bg-primary/90"
              >
                <MenuIcon className="h-4 w-4" />
                Ver Menú Público
              </Button>
              <Button onClick={() => setShowForm(true)} className="flex items-center gap-2">
                <Plus className="h-4 w-4" />
                Nuevo Producto
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="space-y-6">
          <div>
            <h2 className="text-2xl font-bold">Gestión de Productos</h2>
            <p className="text-muted-foreground">
              Administra el menú del restaurante • Los productos más recientes aparecen primero • Hasta 100 productos por página
            </p>
          </div>

          <div className="flex flex-col gap-4">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                  <Input
                    placeholder="Buscar productos..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="px-3 py-2 border border-input rounded-md bg-background"
              >
                <option value="all">Todas las categorías</option>
                {sortedCategories?.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </div>

            {currentPageProductCount > 0 && (
              <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                <div className="flex items-center space-x-3">
                  <Checkbox
                    checked={allCurrentPageSelected}
                    onCheckedChange={handleSelectAllCurrentPage}
                  />
                  <span className="text-sm">
                    {allCurrentPageSelected 
                      ? `Deseleccionar página (${currentPageProductCount})` 
                      : `Seleccionar página actual (${currentPageProductCount})`
                    }
                  </span>
                  {selectedCount > 0 && (
                    <Badge variant="secondary">{selectedCount} seleccionados</Badge>
                  )}
                </div>
                
                {selectedCount > 0 && (
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">
                      Máx. 100 por operación
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShowBulkModal(true)}
                      disabled={selectedCount > 100}
                    >
                      Acciones en lote
                    </Button>
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-6">
            {paginatedProducts?.map((product) => (
              <Card 
                key={product.id} 
                className={`group hover:shadow-lg transition-all duration-300 ${
                  recentlyCreatedProduct === product.name 
                    ? 'ring-2 ring-green-500 bg-green-50 shadow-lg scale-105' 
                    : ''
                }`}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-3 flex-1">
                      <Checkbox
                        checked={selectedProducts.has(product.id)}
                        onCheckedChange={(checked) => handleSelectProduct(product.id, checked as boolean)}
                      />
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <CardTitle className="text-lg">{product.name}</CardTitle>
                          {recentlyCreatedProduct === product.name && (
                            <Badge variant="secondary" className="text-xs bg-green-100 text-green-800">
                              ¡Nuevo!
                            </Badge>
                          )}
                        </div>
                        <CardDescription className="mt-1">
                          {product.categories?.name}
                        </CardDescription>
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => toggleProductAvailability(product)}
                        className="h-8 w-8 p-0"
                      >
                        {product.is_available ? (
                          <Eye className="h-4 w-4 text-green-600" />
                        ) : (
                          <EyeOff className="h-4 w-4 text-gray-400" />
                        )}
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEditProduct(product)}
                        className="h-8 w-8 p-0"
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteProduct(product)}
                        className="h-8 w-8 p-0 text-destructive hover:text-destructive flex items-center justify-center"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                
                <CardContent>
                  {product.image_url && (
                    <img 
                      src={product.image_url} 
                      alt={product.name}
                      className="w-full h-32 object-cover rounded-md mb-3"
                      onError={(e) => {
                        console.error('Error loading image:', e);
                        e.currentTarget.style.display = 'none';
                      }}
                    />
                  )}
                  
                  {product.description && (
                    <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                      {product.description}
                    </p>
                  )}
                  
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-2xl font-bold text-primary">
                      ${Number(product.price).toFixed(2)}
                    </span>
                    <Badge variant={product.is_available ? "default" : "secondary"}>
                      {product.is_available ? "Disponible" : "No disponible"}
                    </Badge>
                  </div>

                  <div className="flex flex-wrap gap-1">
                    {product.is_vegetarian && (
                      <Badge variant="outline" className="text-xs">Vegetariano</Badge>
                    )}
                    {product.is_vegan && (
                      <Badge variant="outline" className="text-xs">Vegano</Badge>
                    )}
                    {product.is_gluten_free && (
                      <Badge variant="outline" className="text-xs">Sin Gluten</Badge>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <ProductPagination
            currentPage={currentPage}
            totalPages={totalPages}
            totalItems={totalProducts}
            itemsPerPage={PRODUCTS_PER_PAGE}
            onPageChange={setCurrentPage}
          />

          {paginatedProducts?.length === 0 && (
            <div className="text-center py-12">
              <p className="text-muted-foreground">
                {searchTerm || selectedCategory !== 'all' 
                  ? 'No se encontraron productos con los filtros aplicados'
                  : 'No hay productos registrados'
                }
              </p>
            </div>
          )}

          {showForm && (
            <ProductForm
              product={editingProduct}
              categories={sortedCategories || []}
              onSave={handleSaveProduct}
              onCancel={handleCloseForm}
            />
          )}

          <DeleteProductModal
            isOpen={showDeleteModal}
            onClose={() => {
              setShowDeleteModal(false);
              setProductToDelete(null);
            }}
            onConfirm={confirmDeleteProduct}
            productName={productToDelete?.name || ''}
            isLoading={isDeleting}
          />

          <EnhancedBulkActionsModal
            isOpen={showBulkModal}
            onClose={() => setShowBulkModal(false)}
            selectedCount={selectedCount}
            currentPage={currentPage}
            onBulkDelete={handleBulkDelete}
            onBulkActivate={handleBulkActivate}
            onBulkDeactivate={handleBulkDeactivate}
            isLoading={isDeleting}
          />
        </div>
      </main>
    </div>
  );
};

export default ProductManagement;
