
import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { supabase } from '@/integrations/supabase/client';
import { Plus, Search, Edit, Trash2, Eye, EyeOff, ArrowLeft, ChefHat, Menu as MenuIcon, Check, X } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import ProductForm from './ProductForm';
import PublicMenu from '../menu/PublicMenu';
import DeleteProductModal from './DeleteProductModal';
import BulkActionsModal from './BulkActionsModal';
import { Tables } from '@/integrations/supabase/types';

type Product = Tables<'products'>;
type Category = Tables<'categories'>;

interface ProductManagementProps {
  onBack?: () => void;
}

const ProductManagement = ({ onBack }: ProductManagementProps) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
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
        console.error('Error fetching products:', error);
        throw error;
      }
      
      return data;
    },
  });

  const { data: categories } = useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .order('sort_order');
      
      if (error) {
        console.error('Error fetching categories:', error);
        throw error;
      }
      
      return data;
    },
  });

  const filteredProducts = products?.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         product.description?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || product.category_id === selectedCategory;
    
    return matchesSearch && matchesCategory;
  });

  const handleSelectProduct = (productId: string, checked: boolean) => {
    const newSelected = new Set(selectedProducts);
    if (checked) {
      newSelected.add(productId);
    } else {
      newSelected.delete(productId);
    }
    setSelectedProducts(newSelected);
  };

  const handleSelectAllInCategory = () => {
    if (!filteredProducts) return;
    
    const newSelected = new Set(selectedProducts);
    const categoryProducts = filteredProducts.map(p => p.id);
    
    // Si todos los productos de la categoría están seleccionados, deseleccionar
    const allSelected = categoryProducts.every(id => selectedProducts.has(id));
    
    if (allSelected) {
      categoryProducts.forEach(id => newSelected.delete(id));
    } else {
      categoryProducts.forEach(id => newSelected.add(id));
    }
    
    setSelectedProducts(newSelected);
  };

  const toggleProductAvailability = async (product: Product) => {
    try {
      const { error } = await supabase
        .from('products')
        .update({ is_available: !product.is_available })
        .eq('id', product.id);

      if (error) throw error;

      toast({
        title: "Producto actualizado",
        description: `${product.name} ${!product.is_available ? 'activado' : 'desactivado'} correctamente`,
      });

      refetchProducts();
    } catch (error) {
      console.error('Error updating product:', error);
      toast({
        title: "Error",
        description: "No se pudo actualizar el producto",
        variant: "destructive",
      });
    }
  };

  const handleDeleteProduct = (product: Product) => {
    setProductToDelete(product);
    setShowDeleteModal(true);
  };

  const confirmDeleteProduct = async () => {
    if (!productToDelete) return;

    setIsDeleting(true);
    try {
      const { error } = await supabase
        .from('products')
        .delete()
        .eq('id', productToDelete.id);

      if (error) throw error;

      toast({
        title: "Producto eliminado",
        description: `${productToDelete.name} eliminado correctamente`,
      });

      refetchProducts();
      setShowDeleteModal(false);
      setProductToDelete(null);
    } catch (error) {
      console.error('Error deleting product:', error);
      toast({
        title: "Error",
        description: "No se pudo eliminar el producto",
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
    }
  };

  const handleBulkDelete = async () => {
    if (selectedProducts.size === 0) return;

    setIsDeleting(true);
    try {
      const { error } = await supabase
        .from('products')
        .delete()
        .in('id', Array.from(selectedProducts));

      if (error) throw error;

      toast({
        title: "Productos eliminados",
        description: `${selectedProducts.size} productos eliminados correctamente`,
      });

      setSelectedProducts(new Set());
      refetchProducts();
      setShowBulkModal(false);
    } catch (error) {
      console.error('Error deleting products:', error);
      toast({
        title: "Error",
        description: "No se pudieron eliminar los productos",
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
    }
  };

  const handleBulkActivate = async () => {
    if (selectedProducts.size === 0) return;

    try {
      const { error } = await supabase
        .from('products')
        .update({ is_available: true })
        .in('id', Array.from(selectedProducts));

      if (error) throw error;

      toast({
        title: "Productos activados",
        description: `${selectedProducts.size} productos activados correctamente`,
      });

      setSelectedProducts(new Set());
      refetchProducts();
      setShowBulkModal(false);
    } catch (error) {
      console.error('Error activating products:', error);
      toast({
        title: "Error",
        description: "No se pudieron activar los productos",
        variant: "destructive",
      });
    }
  };

  const handleBulkDeactivate = async () => {
    if (selectedProducts.size === 0) return;

    try {
      const { error } = await supabase
        .from('products')
        .update({ is_available: false })
        .in('id', Array.from(selectedProducts));

      if (error) throw error;

      toast({
        title: "Productos desactivados",
        description: `${selectedProducts.size} productos desactivados correctamente`,
      });

      setSelectedProducts(new Set());
      refetchProducts();
      setShowBulkModal(false);
    } catch (error) {
      console.error('Error deactivating products:', error);
      toast({
        title: "Error",
        description: "No se pudieron desactivar los productos",
        variant: "destructive",
      });
    }
  };

  const handleEditProduct = (product: Product) => {
    setEditingProduct(product);
    setShowForm(true);
  };

  const handleCloseForm = () => {
    setShowForm(false);
    setEditingProduct(null);
  };

  const handleSaveProduct = () => {
    handleCloseForm();
    refetchProducts();
  };

  // Show public menu if requested
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
  const categoryProductCount = filteredProducts?.length || 0;
  const allCategorySelected = categoryProductCount > 0 && filteredProducts?.every(p => selectedProducts.has(p.id));

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
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

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <div className="space-y-6">
          <div>
            <h2 className="text-2xl font-bold">Gestión de Productos</h2>
            <p className="text-muted-foreground">Administra el menú del restaurante</p>
          </div>

          {/* Filtros y acciones en lote */}
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

            {/* Barra de selección */}
            {categoryProductCount > 0 && (
              <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                <div className="flex items-center space-x-3">
                  <Checkbox
                    checked={allCategorySelected}
                    onCheckedChange={handleSelectAllInCategory}
                  />
                  <span className="text-sm">
                    {allCategorySelected ? 'Deseleccionar todos' : `Seleccionar todos (${categoryProductCount})`}
                  </span>
                  {selectedCount > 0 && (
                    <Badge variant="secondary">{selectedCount} seleccionados</Badge>
                  )}
                </div>
                
                {selectedCount > 0 && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowBulkModal(true)}
                  >
                    Acciones en lote
                  </Button>
                )}
              </div>
            )}
          </div>

          {/* Lista de productos */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredProducts?.map((product) => (
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

          {filteredProducts?.length === 0 && (
            <div className="text-center py-12">
              <p className="text-muted-foreground">No se encontraron productos</p>
            </div>
          )}

          {/* Modal de formulario */}
          {showForm && (
            <ProductForm
              product={editingProduct}
              categories={categories || []}
              onSave={handleSaveProduct}
              onCancel={handleCloseForm}
            />
          )}

          {/* Modal de eliminación */}
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

          {/* Modal de acciones en lote */}
          <BulkActionsModal
            isOpen={showBulkModal}
            onClose={() => setShowBulkModal(false)}
            selectedCount={selectedCount}
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
