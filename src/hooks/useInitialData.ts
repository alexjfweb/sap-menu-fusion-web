
import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';

export const useInitialData = () => {
  const { data: hasInitialData } = useQuery({
    queryKey: ['initial-data-check'],
    queryFn: async () => {
      // Verificar si ya hay productos
      const { data: products } = await supabase
        .from('products')
        .select('id')
        .limit(1);
      
      return products && products.length > 0;
    },
  });

  useEffect(() => {
    const initializeData = async () => {
      if (hasInitialData) return;

      try {
        console.log('Inicializando datos de ejemplo...');

        // Obtener categorías
        const { data: categories } = await supabase
          .from('categories')
          .select('id, name');

        if (!categories || categories.length === 0) {
          console.log('No hay categorías disponibles');
          return;
        }

        // Insertar productos de ejemplo
        const productsToInsert = [
          {
            name: 'Ensalada César',
            description: 'Ensalada fresca con lechuga, crutones, parmesano y aderezo césar',
            price: 15.50,
            category_id: categories.find(c => c.name === 'Entradas')?.id,
            product_type: 'entrada',
            preparation_time: 10,
            is_vegetarian: true,
            is_available: true
          },
          {
            name: 'Pasta Carbonara',
            description: 'Pasta con salsa carbonara, panceta, huevo y parmesano',
            price: 22.90,
            category_id: categories.find(c => c.name === 'Platos Principales')?.id,
            product_type: 'plato',
            preparation_time: 20,
            is_vegetarian: false,
            is_available: true
          },
          {
            name: 'Agua Mineral',
            description: 'Agua mineral natural 500ml',
            price: 4.50,
            category_id: categories.find(c => c.name === 'Bebidas')?.id,
            product_type: 'bebida',
            preparation_time: 2,
            is_vegetarian: true,
            is_available: true
          },
          {
            name: 'Pizza Margherita',
            description: 'Pizza clásica con tomate, mozzarella y albahaca fresca',
            price: 18.00,
            category_id: categories.find(c => c.name === 'Platos Principales')?.id,
            product_type: 'plato',
            preparation_time: 25,
            is_vegetarian: true,
            is_available: true
          },
          {
            name: 'Coca Cola',
            description: 'Coca Cola 350ml',
            price: 5.00,
            category_id: categories.find(c => c.name === 'Bebidas')?.id,
            product_type: 'bebida',
            preparation_time: 1,
            is_vegetarian: true,
            is_available: true
          }
        ];

        const { error } = await supabase
          .from('products')
          .insert(productsToInsert);

        if (error) {
          console.error('Error insertando productos:', error);
        } else {
          console.log('Productos de ejemplo insertados correctamente');
        }

        // Insertar información del negocio si no existe
        const { data: businessInfo } = await supabase
          .from('business_info')
          .select('id')
          .limit(1);

        if (!businessInfo || businessInfo.length === 0) {
          const { error: businessError } = await supabase
            .from('business_info')
            .insert({
              business_name: 'SAP Menu Restaurant',
              tax_id: '900000000-1',
              phone: '+57 300 000 0000',
              address: 'Calle Principal 123, Ciudad',
              email: 'info@sapmenu.com',
              description: 'Restaurante de demostración para SAP Menu - Sistema de gestión de restaurantes'
            });

          if (businessError) {
            console.error('Error insertando información del negocio:', businessError);
          } else {
            console.log('Información del negocio insertada correctamente');
          }
        }

      } catch (error) {
        console.error('Error inicializando datos:', error);
      }
    };

    initializeData();
  }, [hasInitialData]);

  return { hasInitialData };
};
