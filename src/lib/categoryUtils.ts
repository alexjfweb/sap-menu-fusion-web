
import { Tables } from '@/integrations/supabase/types';

type Category = Tables<'categories'>;

// Nombres exactos de categorías tal como están en la base de datos
export const CATEGORY_ORDER = [
  'Platos Principales',
  'Platos Ejecutivos', 
  'Platos Especiales'
];

// Función centralizada para ordenar productos por categoría
export const sortProductsByStandardizedCategories = <T extends { categories?: { name: string } | null }>(
  products: T[], 
  categories?: Category[]
): T[] => {
  return products.sort((a, b) => {
    const categoryA = a.categories?.name || '';
    const categoryB = b.categories?.name || '';
    
    // Primero ordenar por categoría según el orden predefinido
    const indexA = CATEGORY_ORDER.findIndex(order => 
      categoryA.toLowerCase().includes(order.toLowerCase()) || 
      order.toLowerCase().includes(categoryA.toLowerCase())
    );
    const indexB = CATEGORY_ORDER.findIndex(order => 
      categoryB.toLowerCase().includes(order.toLowerCase()) || 
      order.toLowerCase().includes(categoryB.toLowerCase())
    );
    
    if (indexA !== -1 && indexB !== -1) {
      if (indexA !== indexB) {
        return indexA - indexB;
      }
    } else if (indexA !== -1) {
      return -1;
    } else if (indexB !== -1) {
      return 1;
    }
    
    // Si están en la misma categoría o ambas fuera del orden predefinido, ordenar alfabéticamente
    if (categoryA === categoryB) {
      return (a as any).name?.localeCompare((b as any).name) || 0;
    }
    
    return categoryA.localeCompare(categoryB);
  });
};

// Función para ordenar categorías según el orden estándar
export const sortCategoriesByStandardOrder = (categories: Category[]): Category[] => {
  return [...categories].sort((a, b) => {
    const indexA = CATEGORY_ORDER.findIndex(order => 
      a.name.toLowerCase().includes(order.toLowerCase()) || 
      order.toLowerCase().includes(a.name.toLowerCase())
    );
    const indexB = CATEGORY_ORDER.findIndex(order => 
      b.name.toLowerCase().includes(order.toLowerCase()) || 
      order.toLowerCase().includes(b.name.toLowerCase())
    );
    
    if (indexA !== -1 && indexB !== -1) {
      return indexA - indexB;
    }
    
    if (indexA !== -1) return -1;
    if (indexB !== -1) return 1;
    
    if (a.sort_order !== b.sort_order) {
      return (a.sort_order || 0) - (b.sort_order || 0);
    }
    
    return a.name.localeCompare(b.name);
  });
};
