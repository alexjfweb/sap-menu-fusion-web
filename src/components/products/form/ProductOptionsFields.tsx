
import React from 'react';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';

interface FormData {
  is_available: boolean;
  is_vegetarian: boolean;
  is_vegan: boolean;
  is_gluten_free: boolean;
}

interface ProductOptionsFieldsProps {
  formData: FormData;
  onFormDataChange: (data: Partial<FormData>) => void;
}

export const ProductOptionsFields: React.FC<ProductOptionsFieldsProps> = ({
  formData,
  onFormDataChange,
}) => {
  return (
    <div className="space-y-4">
      <div className="flex items-center space-x-2">
        <Switch
          id="is_available"
          checked={formData.is_available}
          onCheckedChange={(checked) => onFormDataChange({ is_available: checked })}
        />
        <Label htmlFor="is_available">Disponible</Label>
      </div>

      <div className="flex items-center space-x-2">
        <Switch
          id="is_vegetarian"
          checked={formData.is_vegetarian}
          onCheckedChange={(checked) => onFormDataChange({ is_vegetarian: checked })}
        />
        <Label htmlFor="is_vegetarian">Vegetariano</Label>
      </div>

      <div className="flex items-center space-x-2">
        <Switch
          id="is_vegan"
          checked={formData.is_vegan}
          onCheckedChange={(checked) => onFormDataChange({ is_vegan: checked })}
        />
        <Label htmlFor="is_vegan">Vegano</Label>
      </div>

      <div className="flex items-center space-x-2">
        <Switch
          id="is_gluten_free"
          checked={formData.is_gluten_free}
          onCheckedChange={(checked) => onFormDataChange({ is_gluten_free: checked })}
        />
        <Label htmlFor="is_gluten_free">Sin Gluten</Label>
      </div>
    </div>
  );
};
