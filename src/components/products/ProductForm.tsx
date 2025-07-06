import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useFileUpload } from '@/hooks/useFileUpload';
import { useAuth } from '@/hooks/useAuth';
import { X, Upload, Image, Link } from 'lucide-react';
import { Tables } from '@/integrations/supabase/types';

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
  const { uploadFile, uploading } = useFileUpload();
  const [loading, setLoading] = useState(false);
  const [confirmingCreation, setConfirmingCreation] = useState(false);
  const [uploadMethod, setUploadMethod] = useState<'pc' | 'url'>('pc');
  const [imageUrl, setImageUrl] = useState('');
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
      setImageUrl(product.image_url || '');
    }
  }, [product]);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const uploadedUrl = await uploadFile(file, 'products');
    if (uploadedUrl) {
      setFormData({ ...formData, image_url: uploadedUrl });
      setImageUrl(uploadedUrl);
    }
  };

  const handleUrlSubmit = () => {
    if (imageUrl) {
      setFormData({ ...formData, image_url: imageUrl });
      toast({
        title: "URL añadida",
        description: "La URL de la imagen se ha añadido correctamente",
      });
    }
  };

  const confirmProductCreation = async (productName: string, adminId: string, maxRetries = 8): Promise<boolean> => {
    console.log('🔍 Confirmando creación del producto:', productName, 'para admin:', adminId);
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const delay = attempt === 1 ? 1200 : Math.min(800 * attempt, 3000);
        console.log(`⏳ Esperando ${delay}ms antes de verificación ${attempt}...`);
        await new Promise(resolve => setTimeout(resolve, delay));

        const { data, error } = await supabase
          .from('products')
          .select('id, name, created_at, created_by')
          .eq('name', productName)
          .eq('created_by', adminId)
          .order('created_at', { ascending: false })
          .limit(1);

        if (error) {
          console.error(`❌ Error en intento ${attempt} de confirmación:`, error);
          if (attempt === maxRetries) throw error;
        } else if (data && data.length > 0) {
          console.log('✅ Producto confirmado en la base de datos para admin', adminId, ':', data[0]);
          console.log('📅 Fecha de creación:', data[0].created_at);
          return true;
        } else {
          console.log(`⚠️ Intento ${attempt}: Producto "${productName}" aún no encontrado para admin ${adminId}`);
        }

      } catch (error) {
        console.error(`❌ Error en confirmación intento ${attempt}:`, error);
        if (attempt === maxRetries) throw error;
      }
    }

    return false;
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

      let error;
      if (product) {
        console.log('🔄 Actualizando producto existente:', product.id, 'para admin:', profile.id);
        
        const { data: updateData, error: updateError } = await supabase
          .from('products')
          .update(productData)
          .eq('id', product.id)
          .eq('created_by', profile.id)
          .select();

        error = updateError;
        
        if (!error && (!updateData || updateData.length === 0)) {
          throw new Error('No se pudo actualizar el producto. Verifica que tienes permisos para editarlo.');
        }
      } else {
        console.log('➕ Creando nuevo producto con nombre:', formData.name, 'para admin:', profile.id);
        
        const { error: insertError } = await supabase
          .from('products')
          .insert([productData]);
        
        error = insertError;
      }

      if (error) {
        console.error('❌ Error guardando producto:', error);
        
        if (error.code === '42501' || error.message.includes('policy')) {
          throw new Error('No tienes permisos para realizar esta acción. Solo puedes gestionar productos que has creado.');
        }
        
        throw error;
      }

      console.log('✅ Producto guardado exitosamente en la base de datos');

      if (!product) {
        console.log('🔍 Iniciando confirmación de creación para:', formData.name, 'admin:', profile.id);
        setConfirmingCreation(true);
        
        const confirmed = await confirmProductCreation(formData.name, profile.id);
        
        if (!confirmed) {
          throw new Error(`No se pudo confirmar la creación del producto "${formData.name}" para el administrador ${profile.id}`);
        }
        
        console.log('✅ Creación del producto confirmada exitosamente');
        setConfirmingCreation(false);
      }
      
      toast({
        title: product ? "Producto actualizado" : "Producto creado",
        description: `${formData.name} ${product ? 'actualizado' : 'creado'} correctamente`,
      });

      onSave(product ? undefined : formData.name);
      
    } catch (error) {
      console.error('❌ Error saving product:', error);
      setConfirmingCreation(false);
      
      let errorMessage = `No se pudo ${product ? 'actualizar' : 'crear'} el producto`;
      
      if (error.message.includes('permisos') || error.message.includes('policy')) {
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
                <Label htmlFor="price">Precio ($) *</Label>
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

            <div className="space-y-4">
              <Label>Imagen del Producto</Label>
              
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant={uploadMethod === 'pc' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setUploadMethod('pc')}
                  className="flex items-center gap-2"
                >
                  <Upload className="h-4 w-4" />
                  Subir desde PC
                </Button>
                <Button
                  type="button"
                  variant={uploadMethod === 'url' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setUploadMethod('url')}
                  className="flex items-center gap-2"
                >
                  <Link className="h-4 w-4" />
                  URL de imagen
                </Button>
              </div>

              {uploadMethod === 'pc' && (
                <div className="space-y-2">
                  <div className="border-2 border-dashed border-border rounded-lg p-4">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleFileUpload}
                      className="w-full"
                      disabled={uploading}
                    />
                    {uploading && (
                      <p className="text-sm text-muted-foreground mt-2">
                        Subiendo imagen...
                      </p>
                    )}
                  </div>
                </div>
              )}

              {uploadMethod === 'url' && (
                <div className="space-y-2">
                  <div className="flex gap-2">
                    <Input
                      placeholder="https://ejemplo.com/imagen.jpg"
                      value={imageUrl}
                      onChange={(e) => setImageUrl(e.target.value)}
                      className="flex-1"
                    />
                    <Button
                      type="button"
                      onClick={handleUrlSubmit}
                      size="sm"
                      disabled={!imageUrl}
                    >
                      Añadir
                    </Button>
                  </div>
                </div>
              )}

              {formData.image_url && (
                <div className="space-y-2">
                  <Label>Vista previa:</Label>
                  <div className="relative w-32 h-32 border rounded-lg overflow-hidden">
                    <img
                      src={formData.image_url}
                      alt="Vista previa del producto"
                      className="w-full h-full object-cover"
                      onError={() => {
                        toast({
                          title: "Error",
                          description: "No se pudo cargar la imagen",
                          variant: "destructive",
                        });
                      }}
                    />
                    <Button
                      type="button"
                      variant="destructive"
                      size="sm"
                      className="absolute top-1 right-1 h-6 w-6 p-0"
                      onClick={() => {
                        setFormData({ ...formData, image_url: '' });
                        setImageUrl('');
                      }}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              )}
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
              <Button type="submit" disabled={loading || uploading || confirmingCreation}>
                {loading ? 'Guardando...' 
                  : confirmingCreation ? 'Confirmando creación...'
                  : (product ? 'Actualizar' : 'Crear')}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default ProductForm;
