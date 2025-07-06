
import React from 'react';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';

interface FormData {
  preparation_time: string;
  calories: string;
  ingredients: string;
  allergens: string;
}

interface ProductDetailsFieldsProps {
  formData: FormData;
  onFormDataChange: (data: Partial<FormData>) => void;
}

export const ProductDetailsFields: React.FC<ProductDetailsFieldsProps> = ({
  formData,
  onFormDataChange,
}) => {
  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="preparation_time">Tiempo de preparación (min)</Label>
          <Input
            id="preparation_time"
            type="number"
            value={formData.preparation_time}
            onChange={(e) => onFormDataChange({ preparation_time: e.target.value })}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="calories">Calorías</Label>
          <Input
            id="calories"
            type="number"
            value={formData.calories}
            onChange={(e) => onFormDataChange({ calories: e.target.value })}
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="ingredients">Ingredientes (separados por coma)</Label>
        <Textarea
          id="ingredients"
          value={formData.ingredients}
          onChange={(e) => onFormDataChange({ ingredients: e.target.value })}
          placeholder="tomate, lechuga, cebolla..."
          rows={2}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="allergens">Alérgenos (separados por coma)</Label>
        <Textarea
          id="allergens"
          value={formData.allergens}
          onChange={(e) => onFormDataChange({ allergens: e.target.value })}
          placeholder="gluten, lactosa, frutos secos..."
          rows={2}
        />
      </div>
    </>
  );
};
