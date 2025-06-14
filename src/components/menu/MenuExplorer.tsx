
import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tables } from '@/integrations/supabase/types';

type Category = Tables<'categories'>;

interface MenuExplorerProps {
  categories: Category[];
  selectedCategory: string;
  onCategoryChange: (categoryId: string) => void;
}

const MenuExplorer = ({ categories, selectedCategory, onCategoryChange }: MenuExplorerProps) => {
  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-xl font-bold mb-4">Explorar por Categorías</h2>
        <div className="flex flex-wrap gap-2">
          <Button
            variant={selectedCategory === 'all' ? 'default' : 'outline'}
            onClick={() => onCategoryChange('all')}
            className="mb-2"
          >
            Todas las Categorías
          </Button>
          
          {categories.map((category) => (
            <Button
              key={category.id}
              variant={selectedCategory === category.id ? 'default' : 'outline'}
              onClick={() => onCategoryChange(category.id)}
              className="mb-2"
            >
              {category.name}
              {category.description && (
                <Badge variant="secondary" className="ml-2 text-xs">
                  {category.description.substring(0, 10)}...
                </Badge>
              )}
            </Button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default MenuExplorer;
