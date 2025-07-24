
import React, { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { 
  Plus, 
  Search, 
  Package,
  AlertCircle,
  ArrowLeft,
  CheckCircle,
  Users
} from 'lucide-react';
import ProductForm from './ProductForm';
import DeleteProductModal from './DeleteProductModal';
import ProductPermissions from './ProductPermissions';
import { Tables } from '@/integrations/supabase/types';
import { useRestaurantContext } from '@/hooks/useRestaurantContext';
import { useAdminProducts, useInvalidateAdminProducts } from '@/hooks/useAdminProducts';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

type Product = Tables<'products'>;
type Category = Tables<'categories'>;

interface ProductManagementProps {
  onBack?: () => void;
}

const ProductManagement: React.FC<ProductManagementProps> = ({ onBack }) => {
  const { toast } = useToast();
  const { profile } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [showForm, setShowForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [deletingProduct, setDeletingProduct] = useState<Product | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Obtener contexto del restaurante
  const { 
    data: restaurantInfo, 
    isLoading: restaurantLoading 
  } = useRestaurantContext();

  const restaurantId = restaurantInfo?.id;
  const restaurantName = restaurantInfo?.business_name;

  // Usar hook especializado para productos de admin
  const { 
    data: products, 
    isLoading: loadingProducts,
    error: productsError
  } = useAdminProducts({
    businessId: restaurantId,
    enabled: !!profile?.id && !!restaurantId
  });

  // Hook para invalidar cache
  const invalidateAdminProducts = useInvalidateAdminProducts();

  // Fetch categories
  const { data: categories } = useQuery({
    queryKey: ['categories-admin'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .eq('is_active', true)
        .order('sort_order', { ascending: true });

      if (error) throw error;
      return data as Category[];
    },
  });

  const filteredProducts = useMemo(() => {
    return products?.filter(product => {
      const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          product.description?.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory = selectedCategory === 'all' || product.category_id === selectedCategory;
      return matchesSearch && matchesCategory;
    }) || [];
  }, [products, searchTerm, selectedCategory]);

  const toggleAvailability = async (product: Product) => {
    // Verificar permisos antes de continuar
    if (profile?.role !== 'superadmin' && product.created_by !== profile?.id) {
      toast({
        title: "Acceso denegado",
        description: "Solo puedes cambiar la disponibilidad de productos que has creado",
        variant: "destructive",
      });
      return;
    }

    try {
      const { error } = await supabase
        .from('products')
        .update({ is_available: !product.is_available })
        .eq('id', product.id);

      if (error) throw error;

      invalidateAdminProducts(restaurantId);
      
      toast({
        title: "Producto actualizado",
        description: `${product.name} ${product.is_available ? 'desactivado' : 'activado'}`,
      });
    } catch (error) {
      console.error('Error toggling availability:', error);
      toast({
        title: "Error",
        description: "No se pudo actualizar el producto. Verifica tus permisos.",
        variant: "destructive",
      });
    }
  };

  const handleEdit = (product: Product) => {
    // Verificar permisos antes de editar
    if (profile?.role !== 'superadmin' && product.created_by !== profile?.id) {
      toast({
        title: "Acceso denegado",
        description: "Solo puedes editar productos que has creado",
        variant: "destructive",
      });
      return;
    }
    
    setEditingProduct(product);
    setShowForm(true);
  };

  const handleDelete = (product: Product) => {
    // Verificar permisos antes de eliminar
    if (profile?.role !== 'superadmin' && product.created_by !== profile?.id) {
      toast({
        title: "Acceso denegado",
        description: "Solo puedes eliminar productos que has creado",
        variant: "destructive",
      });
      return;
    }
    
    setDeletingProduct(product);
  };

  const handleFormSave = () => {
    invalidateAdminProducts(restaurantId);
    setShowForm(false);
    setEditingProduct(null);
  };

  const handleFormCancel = () => {
    setShowForm(false);
    setEditingProduct(null);
  };

  const handleDeleteConfirm = async () => {
    if (!deletingProduct || !restaurantId) return;

    setIsDeleting(true);
    
    try {
      const { error } = await supabase
        .from('products')
        .delete()
        .eq('id', deletingProduct.id);

      if (error) {
        console.error('Delete error:', error);
        throw error;
      }

      invalidateAdminProducts(restaurantId);
      
      toast({
        title: "Producto eliminado",
        description: "El producto ha sido eliminado correctamente",
      });
    } catch (error: any) {
      console.error('Error deleting product:', error);
      
      // Manejar errores específicos de permisos
      if (error.message?.includes('policy')) {
        toast({
          title: "Acceso denegado",
          description: "No tienes permisos para eliminar este producto",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Error",
          description: "No se pudo eliminar el producto. Intenta nuevamente.",
          variant: "destructive",
        });
      }
    } finally {
      setIsDeleting(false);
      setDeletingProduct(null);
    }
  };

  // Loading states
  if (restaurantLoading || !restaurantId) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center p-8">
          <div className="text-center">
            <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4 animate-pulse" />
            <p className="text-muted-foreground">Cargando contexto del restaurante...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!profile || (profile.role !== 'admin' && profile.role !== 'superadmin')) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center p-8">
          <div className="text-center">
            <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium">Acceso Restringido</h3>
            <p className="text-muted-foreground">Solo los administradores pueden gestionar productos.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (productsError) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center p-8">
          <div className="text-center">
            <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h3 className="text-lg font-medium">Error al cargar productos</h3>
            <p className="text-muted-foreground">
              {productsError.message || 'Ocurrió un error al cargar los productos'}
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div className="flex items-center space-x-4">
          {onBack && (
            <Button variant="outline" onClick={onBack}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Volver
            </Button>
          )}
          <div>
            <div className="flex items-center gap-3">
              <h2 className="text-2xl font-bold">Gestión de Productos</h2>
              <Badge variant="default" className="bg-green-100 text-green-800">
                <CheckCircle className="h-3 w-3 mr-1" />
                Corregido
              </Badge>
            </div>
            <p className="text-muted-foreground">
              {restaurantName ? `Restaurante: ${restaurantName}` : 'Administra tus productos'}
            </p>
            <p className="text-xs text-muted-foreground">
              {profile.role === 'superadmin' 
                ? `Ver todos los productos del restaurante (${products?.length || 0} productos)`
                : `Ver solo tus productos (${products?.length || 0} productos)`
              }
            </p>
            <div className="flex items-center gap-2 mt-1">
              <Users className="h-3 w-3 text-blue-600" />
              <span className="text-xs text-blue-600">
                Solo puedes editar/eliminar productos que has creado
              </span>
            </div>
          </div>
        </div>
        <Button onClick={() => setShowForm(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Nuevo Producto
        </Button>
      </div>

      <Card>
        <CardContent className="p-4">
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
            <div className="w-full sm:w-64">
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full px-3 py-2 border border-input rounded-md bg-background"
              >
                <option value="all">Todas las categorías</option>
                {categories?.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {loadingProducts ? (
        <Card>
          <CardContent className="flex items-center justify-center p-8">
            <div className="text-center">
              <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4 animate-pulse" />
              <p className="text-muted-foreground">Cargando productos...</p>
            </div>
          </CardContent>
        </Card>
      ) : filteredProducts.length === 0 ? (
        <Card>
          <CardContent className="flex items-center justify-center p-8">
            <div className="text-center">
              <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">
                {products?.length === 0 ? 'No tienes productos' : 'No se encontraron productos'}
              </h3>
              <p className="text-muted-foreground mb-4">
                {products?.length === 0 
                  ? 'Comienza creando tu primer producto'
                  : 'Intenta con otros términos de búsqueda'
                }
              </p>
              {products?.length === 0 && (
                <Button onClick={() => setShowForm(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Crear Primer Producto
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProducts.map((product) => (
            <Card key={product.id} className="overflow-hidden">
              <div className="aspect-video bg-muted relative">
                {product.image_url ? (
                  <img
                    src={product.image_url}
                    alt={product.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Package className="h-12 w-12 text-muted-foreground" />
                  </div>
                )}
              </div>
              <CardContent className="p-4">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-semibold text-lg">{product.name}</h3>
                  <span className="text-lg font-bold text-green-600">${product.price}</span>
                </div>
                {product.description && (
                  <p className="text-muted-foreground text-sm mb-3 line-clamp-2">
                    {product.description}
                  </p>
                )}
                <ProductPermissions
                  product={product}
                  onEdit={handleEdit}
                  onDelete={handleDelete}
                  onToggleAvailability={toggleAvailability}
                />
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {showForm && (
        <ProductForm
          product={editingProduct}
          categories={categories || []}
          businessId={restaurantId}
          onSave={handleFormSave}
          onCancel={handleFormCancel}
        />
      )}

      {deletingProduct && (
        <DeleteProductModal
          isOpen={!!deletingProduct}
          onClose={() => setDeletingProduct(null)}
          onConfirm={handleDeleteConfirm}
          productName={deletingProduct.name}
          isLoading={isDeleting}
        />
      )}
    </div>
  );
};

export default ProductManagement;
