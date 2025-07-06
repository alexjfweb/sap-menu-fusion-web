
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Tables } from '@/integrations/supabase/types';
import { ProductBasicFields } from './form/ProductBasicFields';
import { ProductDetailsFields } from './form/ProductDetailsFields';
import { ProductOptionsFields } from './form/ProductOptionsFields';

type Product = Tables<'products'>;
type Category = Tables<'categories'>;

interface ProductFormProps {
  product?: Product | null;
  categories: Category[];
  businessId: string;
  onSave: () => void;
  onCancel: () => void;
}

const ProductForm: React.FC<ProductFormProps> = ({ 
  product, 
  categories, 
  businessId, 
  onSave, 
  onCancel 
}) => {
  const { toast } = useToast();
  const { profile } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    category_id: '',
    product_type: 'plato',
    is_available: true,
    is_vegetarian: false,
    is_vegan: false,
    is_gluten_free: false,
    preparation_time: '',
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
        is_available: product.is_available ?? true,
        is_vegetarian: product.is_vegetarian ?? false,
        is_vegan: product.is_vegan ?? false,
        is_gluten_free: product.is_gluten_free ?? false,
        preparation_time: product.preparation_time?.toString() || '',
        calories: product.calories?.toString() || '',
        ingredients: Array.isArray(product.ingredients) ? product.ingredients.join(', ') : '',
        allergens: Array.isArray(product.allergens) ? product.allergens.join(', ') : '',
      });
    }
  }, [product]);

  const handleFormDataChange = (newData: Partial<typeof formData>) => {
    setFormData(prev => ({ ...prev, ...newData }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!profile?.id || !businessId) {
      toast({
        title: "Error",
        description: "No se pudo identificar el usuario o restaurante",
        variant: "destructive",
      });
      return;
    }

    if (!formData.name.trim() || !formData.price) {
      toast({
        title: "Error",
        description: "El nombre y precio son obligatorios",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      const productData = {
        name: formData.name.trim(),
        description: formData.description.trim() || null,
        price: parseFloat(formData.price),
        category_id: formData.category_id || null,
        product_type: formData.product_type as any,
        is_available: formData.is_available,
        is_vegetarian: formData.is_vegetarian,
        is_vegan: formData.is_vegan,
        is_gluten_free: formData.is_gluten_free,
        preparation_time: formData.preparation_time ? parseInt(formData.preparation_time) : null,
        calories: formData.calories ? parseInt(formData.calories) : null,
        ingredients: formData.ingredients ? formData.ingredients.split(',').map(i => i.trim()).filter(i => i) : null,
        allergens: formData.allergens ? formData.allergens.split(',').map(a => a.trim()).filter(a => a) : null,
        business_id: businessId, // CORRECCIÓN: Incluir business_id
        created_by: profile.id,
      };

      console.log('💾 Guardando producto con business_id:', businessId);

      if (product) {
        // Actualizar producto existente
        const { error } = await supabase
          .from('products')
          .update(productData)
          .eq('id', product.id)
          .eq('business_id', businessId); // Verificar business_id

        if (error) throw error;

        toast({
          title: "Producto actualizado",
          description: "El producto ha sido actualizado correctamente",
        });
      } else {
        // Crear nuevo producto
        const { error } = await supabase
          .from('products')
          .insert([productData]);

        if (error) throw error;

        toast({
          title: "Producto creado",
          description: "El producto ha sido creado correctamente",
        });
      }

      onSave();
    } catch (error: any) {
      console.error('Error saving product:', error);
      toast({
        title: "Error",
        description: error.message || "No se pudo guardar el producto",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <CardHeader>
          <CardTitle>
            {product ? 'Editar Producto' : 'Nuevo Producto'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <ProductBasicFields
              formData={formData}
              categories={categories}
              onFormDataChange={handleFormDataChange}
            />
            
            <ProductDetailsFields
              formData={formData}
              onFormDataChange={handleFormDataChange}
            />

            <ProductOptionsFields
              formData={formData}
              onFormDataChange={handleFormDataChange}
            />

            <div className="flex justify-end space-x-2">
              <Button 
                type="button" 
                variant="outline" 
                onClick={onCancel}
                disabled={isLoading}
              >
                Cancelar
              </Button>
              <Button 
                type="submit"
                disabled={isLoading}
              >
                {isLoading ? 'Guardando...' : (product ? 'Actualizar' : 'Crear')}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default ProductForm;
