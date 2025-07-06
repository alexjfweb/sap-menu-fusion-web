
import React from 'react';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Tables } from '@/integrations/supabase/types';

type Category = Tables<'categories'>;

interface FormData {
  name: string;
  description: string;
  price: string;
  category_id: string;
  product_type: string;
}

interface ProductBasicFieldsProps {
  formData: FormData;
  categories: Category[];
  onFormDataChange: (data: Partial<FormData>) => void;
}

export const ProductBasicFields: React.FC<ProductBasicFieldsProps> = ({
  formData,
  categories,
  onFormDataChange,
}) => {
  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="name">Nombre *</Label>
          <Input
            id="name"
            value={formData.name}
            onChange={(e) => onFormDataChange({ name: e.target.value })}
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
            onChange={(e) => onFormDataChange({ price: e.target.value })}
            required
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Descripción</Label>
        <Textarea
          id="description"
          value={formData.description}
          onChange={(e) => onFormDataChange({ description: e.target.value })}
          rows={3}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="category">Categoría</Label>
          <select
            id="category"
            value={formData.category_id}
            onChange={(e) => onFormDataChange({ category_id: e.target.value })}
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
            onChange={(e) => onFormDataChange({ product_type: e.target.value })}
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
    </>
  );
};
