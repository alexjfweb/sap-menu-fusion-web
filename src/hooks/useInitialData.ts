
import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from './useAuth';

export const useInitialData = () => {
  const { isAuthenticated, loading: authLoading } = useAuth();

  const { data: hasInitialData, refetch } = useQuery({
    queryKey: ['initial-data-check'],
    queryFn: async () => {
      console.log('Verificando datos iniciales...');
      
      // Verificar si ya hay productos
      const { data: products, error } = await supabase
        .from('products')
        .select('id')
        .limit(1);
      
      if (error) {
        console.error('Error verificando productos:', error);
        return false;
      }
      
      console.log('Productos encontrados:', products?.length || 0);
      return products && products.length > 0;
    },
    enabled: !authLoading, // Solo ejecutar cuando no esté cargando la auth
  });

  useEffect(() => {
    const initializeData = async () => {
      if (authLoading || hasInitialData) {
        console.log('Saltando inicialización:', { authLoading, hasInitialData });
        return;
      }

      try {
        console.log('Inicializando datos de ejemplo...');

        // Verificar si existen categorías primero
        const { data: categories, error: categoriesError } = await supabase
          .from('categories')
          .select('id, name');

        if (categoriesError) {
          console.error('Error obteniendo categorías:', categoriesError);
          return;
        }

        console.log('Categorías encontradas:', categories?.length || 0);

        // Si no hay categorías, crearlas primero
        if (!categories || categories.length === 0) {
          console.log('Creando categorías...');
          const { data: newCategories, error: createCategoriesError } = await supabase
            .from('categories')
            .insert([
              { name: 'Entradas', description: 'Platos de entrada', sort_order: 1 },
              { name: 'Platos Principales', description: 'Platos principales', sort_order: 2 },
              { name: 'Bebidas', description: 'Bebidas y refrescos', sort_order: 3 },
              { name: 'Postres', description: 'Postres y dulces', sort_order: 4 }
            ])
            .select();

          if (createCategoriesError) {
            console.error('Error creando categorías:', createCategoriesError);
            return;
          }

          console.log('Categorías creadas:', newCategories);
          
          // Actualizar la variable categories
          categories.push(...(newCategories || []));
        }

        // Buscar IDs de categorías
        const entradasCat = categories.find(c => c.name === 'Entradas');
        const platosCat = categories.find(c => c.name === 'Platos Principales');
        const bebidasCat = categories.find(c => c.name === 'Bebidas');
        const postresCat = categories.find(c => c.name === 'Postres');

        console.log('Categorías mapeadas:', {
          entradas: entradasCat?.id,
          platos: platosCat?.id,
          bebidas: bebidasCat?.id,
          postres: postresCat?.id
        });

        // Crear productos de ejemplo
        const productsToInsert = [
          ...(entradasCat ? [{
            name: 'Ensalada César',
            description: 'Ensalada fresca con lechuga, crutones, parmesano y aderezo césar',
            price: 15.50,
            category_id: entradasCat.id,
            product_type: 'entrada' as const,
            preparation_time: 10,
            is_vegetarian: true,
            is_available: true
          }, {
            name: 'Nachos con Guacamole',
            description: 'Nachos crujientes con guacamole casero y pico de gallo',
            price: 12.90,
            category_id: entradasCat.id,
            product_type: 'entrada' as const,
            preparation_time: 8,
            is_vegetarian: true,
            is_available: true
          }] : []),
          ...(platosCat ? [{
            name: 'Pasta Carbonara',
            description: 'Pasta con salsa carbonara, panceta, huevo y parmesano',
            price: 22.90,
            category_id: platosCat.id,
            product_type: 'plato' as const,
            preparation_time: 20,
            is_vegetarian: false,
            is_available: true
          }, {
            name: 'Pizza Margherita',
            description: 'Pizza clásica con tomate, mozzarella y albahaca fresca',
            price: 18.00,
            category_id: platosCat.id,
            product_type: 'plato' as const,
            preparation_time: 25,
            is_vegetarian: true,
            is_available: true
          }, {
            name: 'Hamburguesa Clásica',
            description: 'Hamburguesa de carne con lechuga, tomate, cebolla y papas fritas',
            price: 16.50,
            category_id: platosCat.id,
            product_type: 'plato' as const,
            preparation_time: 15,
            is_vegetarian: false,
            is_available: true
          }] : []),
          ...(bebidasCat ? [{
            name: 'Agua Mineral',
            description: 'Agua mineral natural 500ml',
            price: 4.50,
            category_id: bebidasCat.id,
            product_type: 'bebida' as const,
            preparation_time: 2,
            is_vegetarian: true,
            is_available: true
          }, {
            name: 'Coca Cola',
            description: 'Coca Cola 350ml',
            price: 5.00,
            category_id: bebidasCat.id,
            product_type: 'bebida' as const,
            preparation_time: 1,
            is_vegetarian: true,
            is_available: true
          }, {
            name: 'Jugo de Naranja',
            description: 'Jugo natural de naranja recién exprimido',
            price: 6.50,
            category_id: bebidasCat.id,
            product_type: 'bebida' as const,
            preparation_time: 3,
            is_vegetarian: true,
            is_available: true
          }] : []),
          ...(postresCat ? [{
            name: 'Tiramisu',
            description: 'Postre italiano con café, mascarpone y cacao',
            price: 8.50,
            category_id: postresCat.id,
            product_type: 'postre' as const,
            preparation_time: 5,
            is_vegetarian: true,
            is_available: true
          }, {
            name: 'Cheesecake de Fresa',
            description: 'Tarta de queso con mermelada de fresa',
            price: 7.90,
            category_id: postresCat.id,
            product_type: 'postre' as const,
            preparation_time: 5,
            is_vegetarian: true,
            is_available: true
          }] : [])
        ];

        console.log('Productos a insertar:', productsToInsert.length);

        if (productsToInsert.length > 0) {
          const { data: insertedProducts, error: productsError } = await supabase
            .from('products')
            .insert(productsToInsert)
            .select();

          if (productsError) {
            console.error('Error insertando productos:', productsError);
          } else {
            console.log('Productos insertados correctamente:', insertedProducts?.length);
          }
        }

        // Insertar información del negocio si no existe
        const { data: businessInfo, error: businessInfoError } = await supabase
          .from('business_info')
          .select('id')
          .limit(1);

        if (businessInfoError) {
          console.error('Error verificando business_info:', businessInfoError);
        } else if (!businessInfo || businessInfo.length === 0) {
          console.log('Creando información del negocio...');
          const { data: newBusinessInfo, error: businessError } = await supabase
            .from('business_info')
            .insert({
              business_name: 'SAP Menu Restaurant',
              tax_id: '900000000-1',
              phone: '+57 300 000 0000',
              address: 'Calle Principal 123, Ciudad',
              email: 'info@sapmenu.com',
              description: 'Restaurante de demostración para SAP Menu - Sistema de gestión de restaurantes'
            })
            .select();

          if (businessError) {
            console.error('Error insertando información del negocio:', businessError);
          } else {
            console.log('Información del negocio insertada correctamente:', newBusinessInfo);
          }
        }

        // Refetch para actualizar el estado
        refetch();

      } catch (error) {
        console.error('Error inicializando datos:', error);
      }
    };

    // Solo inicializar cuando no esté cargando la auth
    if (!authLoading) {
      initializeData();
    }
  }, [hasInitialData, authLoading, refetch]);

  return { hasInitialData };
};
