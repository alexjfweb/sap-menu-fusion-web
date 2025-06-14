
import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
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
        <ScrollArea className="w-full whitespace-nowrap">
          <div className="flex space-x-2 pb-4">
            <Button
              variant={selectedCategory === 'all' ? 'default' : 'outline'}
              onClick={() => onCategoryChange('all')}
              className="flex-shrink-0"
            >
              Todas las Categorías
            </Button>
            
            {categories.map((category) => (
              <Button
                key={category.id}
                variant={selectedCategory === category.id ? 'default' : 'outline'}
                onClick={() => onCategoryChange(category.id)}
                className="flex-shrink-0 flex items-center gap-2"
              >
                <span>{category.name}</span>
                {category.description && (
                  <Badge variant="secondary" className="text-xs">
                    {category.description.length > 10 
                      ? `${category.description.substring(0, 10)}...` 
                      : category.description
                    }
                  </Badge>
                )}
              </Button>
            ))}
          </div>
          <ScrollBar orientation="horizontal" />
        </ScrollArea>
      </div>
    </div>
  );
};

export default MenuExplorer;
