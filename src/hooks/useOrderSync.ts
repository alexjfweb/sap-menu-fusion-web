import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

import { Order, OrderItem } from '@/types';
import { useActivityLogger } from './useActivityLogger';

interface OrderFormData {
  customer_name: string;
  customer_phone: string;
  customer_email?: string;
  total_amount: number;
  items: OrderItem[];
  notes?: string;
  table_id?: string;
  status?: string;
  order_number: string;
}

export const useOrderSync = () => {
  const { logOrderActivity } = useActivityLogger();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Obtener todas las órdenes
  const { data: orders, isLoading: isLoadingOrders, error: ordersError } = useQuery({
    queryKey: ['orders'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching orders:', error);
        throw error;
      }

      return data as Order[];
    },
  });

  // Obtener una orden por ID
  const useOrder = (id: string) => {
    return useQuery({
      queryKey: ['orders', id],
      queryFn: async () => {
        const { data, error } = await supabase
          .from('orders')
          .select('*')
          .eq('id', id)
          .single();

        if (error) {
          console.error('Error fetching order:', error);
          throw error;
        }

        return data as Order;
      },
    });
  };

  // Crear una nueva orden
  const createOrderMutation = useMutation({
    mutationFn: async (orderData: OrderFormData) => {
      const { items, ...order } = orderData;

      const { data: orderResult, error: orderError } = await supabase
        .from('orders')
        .insert({
          ...order,
          total_amount: orderData.total_amount,
        })
        .select()
        .single();

      if (orderError) {
        console.error('Error creating order:', orderError);
        throw orderError;
      }

      if (items && orderResult) {
        const orderItems = items.map((item) => ({
          order_id: orderResult.id,
          product_id: item.product_id,
          quantity: item.quantity,
          unit_price: item.unit_price,
          total_price: item.total_price,
          special_instructions: item.special_instructions,
        }));

        const { error: itemsError } = await supabase
          .from('order_items')
          .insert(orderItems);

        if (itemsError) {
          console.error('Error creating order items:', itemsError);
          throw itemsError;
        }
      }
      
      // Log activity after successful creation
      if (orderResult) {
        logOrderActivity(
          'created',
          orderResult.id,
          `Pedido creado: ${orderData.order_number} para ${orderData.customer_name}`,
          {
            customer_name: orderData.customer_name,
            total_amount: orderData.total_amount,
            items_count: orderData.items?.length || 0
          }
        );
      }
      
      return orderResult;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      toast({
        title: 'Orden creada',
        description: 'La orden ha sido creada exitosamente.',
      });
    },
    onError: (error: any) => {
      console.error('Error creating order:', error);
      toast({
        title: 'Error al crear orden',
        description: error.message || 'Ocurrió un error inesperado',
        variant: 'destructive',
      });
    },
  });

  // Actualizar una orden existente
  const updateOrderMutation = useMutation({
    mutationFn: async ({ id, data: updateData }: { id: string; data: Partial<OrderFormData> }) => {
      const { data, error } = await supabase
        .from('orders')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();
      
      // Log activity after successful update
      if (data) {
        logOrderActivity(
          'updated',
          data.id,
          `Pedido actualizado: ${data.order_number} - Estado: ${updateData.status || data.status}`,
          {
            previous_status: data.status,
            new_status: updateData.status,
            updated_fields: Object.keys(updateData)
          }
        );
      }
      
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      toast({
        title: 'Orden actualizada',
        description: 'La orden ha sido actualizada exitosamente.',
      });
    },
    onError: (error: any) => {
      console.error('Error updating order:', error);
      toast({
        title: 'Error al actualizar orden',
        description: error.message || 'Ocurrió un error inesperado',
        variant: 'destructive',
      });
    },
  });

  // Eliminar una orden
  const deleteOrderMutation = useMutation({
    mutationFn: async (id: string) => {
      const { data, error } = await supabase
        .from('orders')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Error deleting order:', error);
        throw error;
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      toast({
        title: 'Orden eliminada',
        description: 'La orden ha sido eliminada exitosamente.',
      });
    },
    onError: (error: any) => {
      console.error('Error deleting order:', error);
      toast({
        title: 'Error al eliminar orden',
        description: error.message || 'Ocurrió un error inesperado',
        variant: 'destructive',
      });
    },
  });

  return {
    orders,
    isLoadingOrders,
    ordersError,
    useOrder,
    createOrder: createOrderMutation.mutate,
    isCreatingOrder: createOrderMutation.isPending,
    updateOrder: updateOrderMutation.mutate,
    isUpdatingOrder: updateOrderMutation.isPending,
    deleteOrder: deleteOrderMutation.mutate,
    isDeletingOrder: deleteOrderMutation.isPending,
  };
};
