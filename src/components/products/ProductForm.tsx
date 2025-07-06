
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { useProductValidation } from '@/hooks/useProductValidation';
import { X } from 'lucide-react';
import { Tables } from '@/integrations/supabase/types';

// Import the new form components
import { ProductImageUpload } from './form/ProductImageUpload';
import { ProductBasicFields } from './form/ProductBasicFields';
import { ProductDetailsFields } from './form/ProductDetailsFields';
import { ProductOptionsFields } from './form/ProductOptionsFields';

type Product = Tables<'products'>;
type Category = Tables<'categories'>;

interface ProductFormProps {
  product?: Product | null;
  categories: Category[];
  onSave: (productName?: string) => void;
  onCancel: () => void;
}

const ProductForm: React.FC<ProductFormProps> = ({
  product,
  categories,
  onSave,
  onCancel,
}) => {
  const { toast } = useToast();
  const { profile } = useAuth();
  const { checkDuplicateProduct } = useProductValidation();
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
    image_url: '',
  });

  useEffect(() => {
    if (!profile || (profile.role !== 'admin' && profile.role !== 'superadmin')) {
      console.error('❌ Usuario sin permisos intentando acceder al formulario de productos');
      toast({
        title: "Acceso denegado",
        description: "Solo los administradores pueden crear o editar productos.",
        variant: "destructive",
      });
      onCancel();
      return;
    }

    if (product && product.created_by !== profile.id && profile.role !== 'superadmin') {
      console.error('❌ Usuario intentando editar producto que no es suyo:', product.id);
      toast({
        title: "Acceso denegado",
        description: "Solo puedes editar productos que has creado.",
        variant: "destructive",
      });
      onCancel();
      return;
    }

    console.log('✅ Usuario autorizado para', product ? 'editar' : 'crear', 'producto');
  }, [profile, product, onCancel, toast]);

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
        image_url: product.image_url || '',
      });
    }
  }, [product]);

  const handleFormDataChange = (updates: Partial<typeof formData>) => {
    setFormData(prev => ({ ...prev, ...updates }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!profile || (profile.role !== 'admin' && profile.role !== 'superadmin')) {
      toast({
        title: "Acceso denegado",
        description: "Solo los administradores pueden crear productos.",
        variant: "destructive",
      });
      return;
    }

    if (product && product.created_by !== profile.id && profile.role !== 'superadmin') {
      toast({
        title: "Acceso denegado",
        description: "Solo puedes editar productos que has creado.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      // FASE 2: Validación previa para productos nuevos
      if (!product) {
        console.log('🔍 Verificando duplicados para producto:', formData.name);
        const isDuplicate = await checkDuplicateProduct(formData.name);
        
        if (isDuplicate) {
          toast({
            title: "Producto duplicado",
            description: `Ya tienes un producto llamado "${formData.name}". Elige un nombre diferente.`,
            variant: "destructive",
          });
          setLoading(false);
          return;
        }
      }

      console.log('💾 Guardando producto...', product ? 'Actualización' : 'Creación', 'para admin:', profile.id);
      
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
        image_url: formData.image_url || null,
        created_by: profile.id,
      };

      let result;
      if (product) {
        console.log('🔄 Actualizando producto existente:', product.id);
        
        const { data: updateData, error } = await supabase
          .from('products')
          .update(productData)
          .eq('id', product.id)
          .eq('created_by', profile.id)
          .select()
          .single();

        if (error) throw error;
        result = updateData;
      } else {
        console.log('➕ Creando nuevo producto:', formData.name);
        
        const { data: insertData, error } = await supabase
          .from('products')
          .insert([productData])
          .select()
          .single();
        
        if (error) throw error;
        result = insertData;
      }

      console.log('✅ Producto guardado exitosamente:', result);
      
      toast({
        title: product ? "Producto actualizado" : "Producto creado",
        description: `${formData.name} ${product ? 'actualizado' : 'creado'} correctamente`,
      });

      // FASE 3: Simplificación - llamar onSave inmediatamente
      onSave(product ? undefined : formData.name);
      
    } catch (error: any) {
      console.error('❌ Error saving product:', error);
      
      let errorMessage = `No se pudo ${product ? 'actualizar' : 'crear'} el producto`;
      
      // FASE 3: Manejo mejorado de errores específicos
      if (error.code === '23505') {
        // Error de constraint UNIQUE
        errorMessage = `Ya tienes un producto con el nombre "${formData.name}". Elige un nombre diferente.`;
      } else if (error.code === '42501' || error.message.includes('policy')) {
        errorMessage = "No tienes permisos para realizar esta acción";
      } else if (error.message.includes('unique') || error.message.includes('already exists')) {
        errorMessage = "Ya existe un producto con ese nombre";
      }
      
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (!profile || (profile.role !== 'admin' && profile.role !== 'superadmin')) {
    return null;
  }

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
            <ProductBasicFields
              formData={formData}
              categories={categories}
              onFormDataChange={handleFormDataChange}
            />

            <ProductImageUpload
              imageUrl={formData.image_url}
              onImageChange={(url) => handleFormDataChange({ image_url: url })}
            />

            <ProductDetailsFields
              formData={formData}
              onFormDataChange={handleFormDataChange}
            />

            <ProductOptionsFields
              formData={formData}
              onFormDataChange={handleFormDataChange}
            />

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
