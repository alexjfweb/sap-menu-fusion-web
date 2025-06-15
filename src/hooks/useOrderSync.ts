
import { supabase } from '@/integrations/supabase/client';

interface CartItem {
  id: string;
  product_id: string;
  quantity: number;
  products?: {
    name: string;
    price: number;
  };
  special_instructions?: string;
}

export const useOrderSync = () => {
  const syncOrderToDatabase = async (
    cartItems: CartItem[], 
    totalAmount: number, 
    customerName: string, 
    customerPhone: string,
    customerEmail: string = '',
    specialInstructions: string = '',
    paymentMethod: string = '',
    sessionId: string
  ) => {
    try {
      console.log('Syncing order to database...');
      
      // Preparar los items del carrito en formato JSONB
      const formattedCartItems = cartItems.map(item => ({
        product_id: item.product_id,
        quantity: item.quantity,
        unit_price: Number(item.products?.price || 0),
        total_price: item.quantity * Number(item.products?.price || 0),
        special_instructions: item.special_instructions || null
      }));

      // Insertar en payment_orders que automáticamente sincronizará con orders
      const { data, error } = await supabase
        .from('payment_orders')
        .insert({
          session_id: sessionId,
          customer_name: customerName,
          customer_phone: customerPhone,
          customer_email: customerEmail || null,
          special_instructions: specialInstructions || null,
          payment_method: paymentMethod,
          payment_status: 'pending',
          total_amount: totalAmount,
          cart_items: formattedCartItems,
          status: 'confirmed'
        });

      if (error) {
        console.error('Error syncing order:', error);
        throw error;
      }

      console.log('Order synced successfully:', data);
      return { success: true, data };
    } catch (error) {
      console.error('Error syncing order to database:', error);
      return { success: false, error };
    }
  };

  return { syncOrderToDatabase };
};
