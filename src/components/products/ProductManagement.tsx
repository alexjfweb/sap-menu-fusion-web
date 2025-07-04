import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { supabase } from '@/integrations/supabase/client';
import { Plus, Search, Edit, Trash2, Eye, EyeOff, ArrowLeft, ChefHat, Menu as MenuIcon } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import ProductForm from './ProductForm';
import PublicMenu from '../menu/PublicMenu';
import DeleteProductModal from './DeleteProductModal';
import EnhancedBulkActionsModal from './EnhancedBulkActionsModal';
import ProductPagination from './ProductPagination';
import { Tables } from '@/integrations/supabase/types';

type Product = Tables<'products'>;
type Category = Tables<'categories'>;

interface ProductManagementProps {
  onBack?: () => void;
}

const PRODUCTS_PER_PAGE = 24; // Mostrar 24 productos por página (4x6 grid)

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
  const { toast } = useToast();

  const { data: products, isLoading: productsLoading, refetch: refetchProducts } = useQuery({
    queryKey: ['products'],
    queryFn: async () => {
      console.log('🔍 Obteniendo productos...');
      const { data, error } = await supabase
        .from('products')
        .select(`
          *,
          categories (
            id,
            name
          )
        `)
        .order('name');
      
      if (error) {
        console.error('❌ Error obteniendo productos:', error);
        throw error;
      }
      
      console.log('✅ Productos obtenidos:', data?.length || 0, 'productos');
      return data;
    },
  });

  const { data: categories } = useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      console.log('🔍 Obteniendo categorías...');
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .order('sort_order');
      
      if (error) {
        console.error('❌ Error obteniendo categorías:', error);
        throw error;
      }
      
      console.log('✅ Categorías obtenidas:', data?.length || 0, 'categorías');
      return data;
    },
  });

  const filteredProducts = products?.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         product.description?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || product.category_id === selectedCategory;
    
    return matchesSearch && matchesCategory;
  });

  const totalProducts = filteredProducts?.length || 0;
  const totalPages = Math.ceil(totalProducts / PRODUCTS_PER_PAGE);
  const paginatedProducts = filteredProducts?.slice(
    (currentPage - 1) * PRODUCTS_PER_PAGE,
    currentPage * PRODUCTS_PER_PAGE
  );

  React.useEffect(() => {
    setCurrentPage(1);
    setSelectedProducts(new Set()); // Limpiar selección al cambiar filtros
  }, [searchTerm, selectedCategory]);

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

    if (selectedIds.length > 50) {
      toast({
        title: "Demasiados productos",
        description: "Por favor selecciona máximo 50 productos a la vez para mayor estabilidad.",
        variant: "destructive",
      });
      return;
    }

    setIsDeleting(true);
    
    try {
      const CHUNK_SIZE = 20;
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
      refetchProducts();
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

      refetchProducts();
    } catch (error) {
      console.error('❌ Error updating product:', error);
      toast({
        title: "Error",
        description: "No se pudo actualizar el producto",
        variant: "destructive",
      });
    }
  };

  const handleDeleteProduct = (product: Product) => {
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
        throw error;
      }

      console.log('✅ Producto eliminado correctamente:', productToDelete.name);
      toast({
        title: "Producto eliminado",
        description: `${productToDelete.name} eliminado correctamente`,
      });

      refetchProducts();
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

  const handleSaveProduct = () => {
    console.log('💾 Producto guardado, refrescando lista...');
    handleCloseForm();
    refetchProducts();
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
              Administra el menú del restaurante • Paginación optimizada para mejor rendimiento
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
                {categories?.map((category) => (
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
                      Máx. 50 por operación
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShowBulkModal(true)}
                      disabled={selectedCount > 50}
                    >
                      Acciones en lote
                    </Button>
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {paginatedProducts?.map((product) => (
              <Card key={product.id} className="group hover:shadow-lg transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-3 flex-1">
                      <Checkbox
                        checked={selectedProducts.has(product.id)}
                        onCheckedChange={(checked) => handleSelectProduct(product.id, checked as boolean)}
                      />
                      <div className="flex-1">
                        <CardTitle className="text-lg">{product.name}</CardTitle>
                        <CardDescription className="mt-1">
                          {(product as any).categories?.name}
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
                        className="h-8 w-8 p-0 text-destructive hover:text-destructive"
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
              categories={categories || []}
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
