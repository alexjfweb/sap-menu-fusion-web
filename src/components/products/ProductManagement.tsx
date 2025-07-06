import React, { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { useBusinessContext } from '@/hooks/useBusinessContext';
import { 
  Plus, 
  Search, 
  Edit, 
  Trash2, 
  Eye, 
  EyeOff,
  Package,
  AlertCircle,
  ArrowLeft
} from 'lucide-react';
import ProductForm from './ProductForm';
import DeleteProductModal from './DeleteProductModal';
import { Tables } from '@/integrations/supabase/types';

type Product = Tables<'products'>;
type Category = Tables<'categories'>;

interface ProductManagementProps {
  onBack?: () => void;
}

const ProductManagement: React.FC<ProductManagementProps> = ({ onBack }) => {
  const { toast } = useToast();
  const { profile } = useAuth();
  const { businessId, businessName, isLoading: businessLoading } = useBusinessContext();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [showForm, setShowForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [deletingProduct, setDeletingProduct] = useState<Product | null>(null);

  // FASE 2: Query corregida para productos del restaurante específico
  const { data: products, isLoading: loadingProducts } = useQuery({
    queryKey: ['products-by-business', businessId, profile?.id],
    queryFn: async () => {
      if (!profile?.id || !businessId) {
        console.log('⚠️ No hay perfil de usuario o business_id, no se pueden cargar productos');
        return [];
      }

      console.log('🔍 Cargando productos para business:', businessId, 'admin:', profile.id);

      let query = supabase
        .from('products')
        .select(`
          *,
          categories (
            id,
            name
          )
        `)
        .eq('business_id', businessId); // CORRECCIÓN: Filtrar por business_id

      // Superadmin ve todos los productos del negocio
      // Admin regular solo ve sus productos del negocio
      if (profile.role !== 'superadmin') {
        query = query.eq('created_by', profile.id);
        console.log('👤 Admin regular: filtrando por created_by');
      } else {
        console.log('👑 Superadmin: viendo todos los productos del negocio');
      }
      
      const { data, error } = await query.order('created_at', { ascending: false });

      if (error) {
        console.error('❌ Error loading products:', error);
        throw error;
      }

      console.log(`✅ Cargados ${data?.length || 0} productos para negocio ${businessId}`);
      return data as Product[];
    },
    enabled: !!profile?.id && !!businessId,
  });

  // Fetch categories
  const { data: categories } = useQuery({
    queryKey: ['categories'],
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
    try {
      const { error } = await supabase
        .from('products')
        .update({ is_available: !product.is_available })
        .eq('id', product.id)
        .eq('business_id', businessId); // Verificar business_id

      if (error) throw error;

      // FASE 4: Invalidación de cache sincronizada
      queryClient.invalidateQueries({ queryKey: ['products-by-business'] });
      queryClient.invalidateQueries({ queryKey: ['products-public-optimized-v2'] });
      
      toast({
        title: "Producto actualizado",
        description: `${product.name} ${product.is_available ? 'desactivado' : 'activado'}`,
      });
    } catch (error) {
      console.error('Error toggling availability:', error);
      toast({
        title: "Error",
        description: "No se pudo actualizar el producto",
        variant: "destructive",
      });
    }
  };

  const handleEdit = (product: Product) => {
    // Verificar propiedad antes de editar
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
    // Verificar propiedad antes de eliminar
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
    // FASE 4: Invalidación sincronizada del cache
    queryClient.invalidateQueries({ queryKey: ['products-by-business'] });
    queryClient.invalidateQueries({ queryKey: ['products-public-optimized-v2'] });
    setShowForm(false);
    setEditingProduct(null);
  };

  const handleFormCancel = () => {
    setShowForm(false);
    setEditingProduct(null);
  };

  const handleDeleteConfirm = async () => {
    if (!deletingProduct || !businessId) return;

    try {
      const { error } = await supabase
        .from('products')
        .delete()
        .eq('id', deletingProduct.id)
        .eq('business_id', businessId); // Verificar business_id

      if (error) throw error;

      // FASE 4: Invalidación sincronizada
      queryClient.invalidateQueries({ queryKey: ['products-by-business'] });
      queryClient.invalidateQueries({ queryKey: ['products-public-optimized-v2'] });
      
      toast({
        title: "Producto eliminado",
        description: "El producto ha sido eliminado correctamente",
      });
    } catch (error) {
      console.error('Error deleting product:', error);
      toast({
        title: "Error",
        description: "No se pudo eliminar el producto",
        variant: "destructive",
      });
    } finally {
      setDeletingProduct(null);
    }
  };

  // Loading states
  if (businessLoading || !businessId) {
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
            <h2 className="text-2xl font-bold">Gestión de Productos</h2>
            <p className="text-muted-foreground">
              {businessName ? `Restaurante: ${businessName}` : 'Administra tus productos'}
            </p>
            <p className="text-xs text-muted-foreground">
              {profile.role === 'superadmin' 
                ? 'Administra todos los productos del restaurante'
                : 'Administra tus productos'
              }
            </p>
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
              <p className="text-muted-foreground">Cargando productos del restaurante...</p>
            </div>
          </CardContent>
        </Card>
      ) : filteredProducts.length === 0 ? (
        <Card>
          <CardContent className="flex items-center justify-center p-8">
            <div className="text-center">
              <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">
                {products?.length === 0 ? 'No hay productos' : 'No se encontraron productos'}
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
                <div className="absolute top-2 right-2 flex gap-2">
                  {product.is_available ? (
                    <Badge variant="default">Disponible</Badge>
                  ) : (
                    <Badge variant="secondary">No disponible</Badge>
                  )}
                </div>
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
                <div className="flex justify-between items-center">
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEdit(product)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => toggleAvailability(product)}
                    >
                      {product.is_available ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDelete(product)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {showForm && (
        <ProductForm
          product={editingProduct}
          categories={categories || []}
          businessId={businessId}
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
          isLoading={false}
        />
      )}
    </div>
  );
};

export default ProductManagement;
