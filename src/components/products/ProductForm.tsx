
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { X } from 'lucide-react';
import { Tables } from '@/integrations/supabase/types';

type Product = Tables<'products'>;
type Category = Tables<'categories'>;

interface ProductFormProps {
  product?: Product | null;
  categories: Category[];
  onSave: () => void;
  onCancel: () => void;
}

const ProductForm: React.FC<ProductFormProps> = ({
  product,
  categories,
  onSave,
  onCancel,
}) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    category_id: '',
    product_type: 'plato',
    preparation_time: '15',
    is_available: true,
    is_vegetarian: false,
    is_vegan: false,
    is_gluten_free: false,
    calories: '',
    ingredients: '',
    allergens: '',
  });

  useEffect(() => {
    if (product) {
      setFormData({
        name: product.name || '',
        description: product.description || '',
        price: product.price?.toString() || '',
        category_id: product.category_id || '',
        product_type: product.product_type || 'plato',
        preparation_time: product.preparation_time?.toString() || '15',
        is_available: product.is_available ?? true,
        is_vegetarian: product.is_vegetarian ?? false,
        is_vegan: product.is_vegan ?? false,
        is_gluten_free: product.is_gluten_free ?? false,
        calories: product.calories?.toString() || '',
        ingredients: product.ingredients?.join(', ') || '',
        allergens: product.allergens?.join(', ') || '',
      });
    }
  }, [product]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const productData = {
        name: formData.name,
        description: formData.description || null,
        price: parseFloat(formData.price),
        category_id: formData.category_id || null,
        product_type: formData.product_type as any,
        preparation_time: parseInt(formData.preparation_time),
        is_available: formData.is_available,
        is_vegetarian: formData.is_vegetarian,
        is_vegan: formData.is_vegan,
        is_gluten_free: formData.is_gluten_free,
        calories: formData.calories ? parseInt(formData.calories) : null,
        ingredients: formData.ingredients ? formData.ingredients.split(',').map(i => i.trim()) : null,
        allergens: formData.allergens ? formData.allergens.split(',').map(a => a.trim()) : null,
      };

      let error;
      if (product) {
        // Actualizar producto existente
        ({ error } = await supabase
          .from('products')
          .update(productData)
          .eq('id', product.id));
      } else {
        // Crear nuevo producto
        ({ error } = await supabase
          .from('products')
          .insert([productData]));
      }

      if (error) throw error;

      toast({
        title: product ? "Producto actualizado" : "Producto creado",
        description: `${formData.name} ${product ? 'actualizado' : 'creado'} correctamente`,
      });

      onSave();
    } catch (error) {
      console.error('Error saving product:', error);
      toast({
        title: "Error",
        description: `No se pudo ${product ? 'actualizar' : 'crear'} el producto`,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle>
            {product ? 'Editar Producto' : 'Nuevo Producto'}
          </CardTitle>
          <Button variant="ghost" size="sm" onClick={onCancel}>
            <X className="h-4 w-4" />
          </Button>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nombre *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="price">Precio (€) *</Label>
                <Input
                  id="price"
                  type="number"
                  step="0.01"
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Descripción</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={3}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="category">Categoría</Label>
                <select
                  id="category"
                  value={formData.category_id}
                  onChange={(e) => setFormData({ ...formData, category_id: e.target.value })}
                  className="w-full px-3 py-2 border border-input rounded-md bg-background"
                >
                  <option value="">Seleccionar categoría</option>
                  {categories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="product_type">Tipo</Label>
                <select
                  id="product_type"
                  value={formData.product_type}
                  onChange={(e) => setFormData({ ...formData, product_type: e.target.value })}
                  className="w-full px-3 py-2 border border-input rounded-md bg-background"
                >
                  <option value="plato">Plato</option>
                  <option value="bebida">Bebida</option>
                  <option value="postre">Postre</option>
                  <option value="entrada">Entrada</option>
                  <option value="acompañamiento">Acompañamiento</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="preparation_time">Tiempo de preparación (min)</Label>
                <Input
                  id="preparation_time"
                  type="number"
                  value={formData.preparation_time}
                  onChange={(e) => setFormData({ ...formData, preparation_time: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="calories">Calorías</Label>
                <Input
                  id="calories"
                  type="number"
                  value={formData.calories}
                  onChange={(e) => setFormData({ ...formData, calories: e.target.value })}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="ingredients">Ingredientes (separados por coma)</Label>
              <Textarea
                id="ingredients"
                value={formData.ingredients}
                onChange={(e) => setFormData({ ...formData, ingredients: e.target.value })}
                placeholder="tomate, lechuga, cebolla..."
                rows={2}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="allergens">Alérgenos (separados por coma)</Label>
              <Textarea
                id="allergens"
                value={formData.allergens}
                onChange={(e) => setFormData({ ...formData, allergens: e.target.value })}
                placeholder="gluten, lactosa, frutos secos..."
                rows={2}
              />
            </div>

            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <Switch
                  id="is_available"
                  checked={formData.is_available}
                  onCheckedChange={(checked) => setFormData({ ...formData, is_available: checked })}
                />
                <Label htmlFor="is_available">Disponible</Label>
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="is_vegetarian"
                  checked={formData.is_vegetarian}
                  onCheckedChange={(checked) => setFormData({ ...formData, is_vegetarian: checked })}
                />
                <Label htmlFor="is_vegetarian">Vegetariano</Label>
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="is_vegan"
                  checked={formData.is_vegan}
                  onCheckedChange={(checked) => setFormData({ ...formData, is_vegan: checked })}
                />
                <Label htmlFor="is_vegan">Vegano</Label>
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="is_gluten_free"
                  checked={formData.is_gluten_free}
                  onCheckedChange={(checked) => setFormData({ ...formData, is_gluten_free: checked })}
                />
                <Label htmlFor="is_gluten_free">Sin Gluten</Label>
              </div>
            </div>

            <div className="flex justify-end space-x-2 pt-4">
              <Button type="button" variant="outline" onClick={onCancel}>
                Cancelar
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? 'Guardando...' : (product ? 'Actualizar' : 'Crear')}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default ProductForm;
