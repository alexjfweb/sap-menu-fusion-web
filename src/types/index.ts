
export interface Order {
  id: string;
  order_number: string;
  customer_name: string | null;
  customer_phone: string | null;
  status: 'pendiente' | 'en_preparacion' | 'listo' | 'entregado' | 'cancelado';
  total_amount: number;
  notes: string | null;
  table_id: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface OrderItem {
  id: string;
  order_id: string;
  product_id: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  special_instructions: string | null;
  created_at: string;
}

export interface Product {
  id: string;
  name: string;
  price: number;
  description: string | null;
  image_url: string | null;
  category_id: string | null;
  is_available: boolean;
  created_at: string;
  updated_at: string;
}
