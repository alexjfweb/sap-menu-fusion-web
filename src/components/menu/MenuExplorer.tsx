
import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ChefHat, Grid3X3 } from 'lucide-react';
import { Tables } from '@/integrations/supabase/types';
import { sortCategoriesByStandardOrder } from '@/lib/categoryUtils';

type Category = Tables<'categories'>;
type MenuCustomization = Tables<'menu_customization'>;

interface MenuExplorerProps {
  categories: Category[];
  selectedCategory: string;
  onCategoryChange: (categoryId: string) => void;
  customization?: Partial<MenuCustomization>;
}

const MenuExplorer = ({ 
  categories, 
  selectedCategory, 
  onCategoryChange,
  customization 
}: MenuExplorerProps) => {
  const defaultColors = {
    button_bg_color: '#007bff',
    button_text_color: '#ffffff',
    product_card_bg_color: '#ffffff',
    product_card_border_color: '#e9ecef',
    text_color: '#333333',
    product_description_color: '#6c757d',
  };

  const colors = customization || defaultColors;

  // Ordenar categorías según el orden establecido usando la utilidad centralizada
  const sortedCategories = React.useMemo(() => {
    return sortCategoriesByStandardOrder(categories);
  }, [categories]);

  return (
    <Card 
      className="w-full"
      style={{ 
        backgroundColor: colors.product_card_bg_color,
        borderColor: colors.product_card_border_color
      }}
    >
      <CardHeader>
        <CardTitle 
          className="flex items-center gap-2"
          style={{ color: colors.text_color }}
        >
          <Grid3X3 className="h-5 w-5" />
          Explorar Categorías
        </CardTitle>
        <CardDescription style={{ color: colors.product_description_color }}>
          Navega por nuestras diferentes categorías de productos
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex flex-wrap gap-2">
          <Button
            variant={selectedCategory === 'all' ? 'default' : 'outline'}
            onClick={() => onCategoryChange('all')}
            className="flex items-center gap-2"
            style={selectedCategory === 'all' ? {
              backgroundColor: colors.button_bg_color,
              color: colors.button_text_color,
              borderColor: colors.button_bg_color
            } : {
              borderColor: colors.product_card_border_color,
              color: colors.text_color
            }}
          >
            <ChefHat className="h-4 w-4" />
            Todas las categorías
            <Badge 
              variant="secondary" 
              className="ml-1"
              style={{ 
                backgroundColor: selectedCategory === 'all' ? 'rgba(255,255,255,0.2)' : colors.product_card_border_color,
                color: selectedCategory === 'all' ? colors.button_text_color : colors.text_color
              }}
            >
              {sortedCategories.length}
            </Badge>
          </Button>
          
          {sortedCategories.map((category) => (
            <Button
              key={category.id}
              variant={selectedCategory === category.id ? 'default' : 'outline'}
              onClick={() => onCategoryChange(category.id)}
              style={selectedCategory === category.id ? {
                backgroundColor: colors.button_bg_color,
                color: colors.button_text_color,
                borderColor: colors.button_bg_color
              } : {
                borderColor: colors.product_card_border_color,
                color: colors.text_color
              }}
            >
              {category.name}
            </Button>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default MenuExplorer;
