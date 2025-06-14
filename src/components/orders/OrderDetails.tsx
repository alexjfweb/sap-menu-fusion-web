
import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  ArrowLeft, 
  Clock, 
  ChefHat, 
  CheckCircle, 
  Truck, 
  XCircle, 
  User, 
  Phone, 
  MapPin,
  FileText
} from 'lucide-react';
import { Tables } from '@/integrations/supabase/types';

type Order = Tables<'orders'> & {
  tables?: Tables<'tables'>;
};

type OrderItem = Tables<'order_items'> & {
  products?: Tables<'products'>;
};

interface OrderDetailsProps {
  order: Order;
  onBack: () => void;
}

const OrderDetails = ({ order, onBack }: OrderDetailsProps) => {
  const { data: orderItems, isLoading } = useQuery({
    queryKey: ['order-items', order.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('order_items')
        .select(`
          *,
          products (
            name,
            description,
            price,
            image_url
          )
        `)
        .eq('order_id', order.id);

      if (error) throw error;
      return data as OrderItem[];
    },
  });

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      pendiente: { color: 'bg-yellow-500', icon: Clock, text: 'Pendiente' },
      en_preparacion: { color: 'bg-blue-500', icon: ChefHat, text: 'En Preparación' },
      listo: { color: 'bg-green-500', icon: CheckCircle, text: 'Listo' },
      entregado: { color: 'bg-gray-500', icon: Truck, text: 'Entregado' },
      cancelado: { color: 'bg-red-500', icon: XCircle, text: 'Cancelado' },
    };

    const config = statusConfig[status as keyof typeof statusConfig];
    if (!config) return null;
    
    const Icon = config.icon;

    return (
      <Badge className={`${config.color} text-white`}>
        <Icon className="h-3 w-3 mr-1" />
        {config.text}
      </Badge>
    );
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center space-x-4">
        <Button variant="outline" onClick={onBack}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Volver
        </Button>
        <div>
          <h2 className="text-3xl font-bold">Detalles del Pedido</h2>
          <p className="text-muted-foreground">{order.order_number}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Información del pedido */}
        <div className="lg:col-span-2 space-y-6">
          {/* Items del pedido */}
          <Card>
            <CardHeader>
              <CardTitle>Productos del Pedido</CardTitle>
              <CardDescription>
                Lista de productos ordenados
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="text-center py-4">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
                  <p className="text-sm text-muted-foreground">Cargando productos...</p>
                </div>
              ) : !orderItems || orderItems.length === 0 ? (
                <div className="text-center py-4">
                  <p className="text-muted-foreground">No hay productos en este pedido</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {orderItems.map((item) => (
                    <div key={item.id} className="flex items-center space-x-4 p-4 border rounded-lg">
                      {item.products?.image_url && (
                        <img
                          src={item.products.image_url}
                          alt={item.products.name}
                          className="w-16 h-16 object-cover rounded-md"
                        />
                      )}
                      <div className="flex-1">
                        <h4 className="font-semibold">{item.products?.name}</h4>
                        <p className="text-sm text-muted-foreground">
                          {item.products?.description}
                        </p>
                        {item.special_instructions && (
                          <p className="text-sm text-orange-600 mt-1">
                            <strong>Instrucciones:</strong> {item.special_instructions}
                          </p>
                        )}
                      </div>
                      <div className="text-right">
                        <p className="font-semibold">Cantidad: {item.quantity}</p>
                        <p className="text-sm text-muted-foreground">
                          €{Number(item.unit_price).toFixed(2)} c/u
                        </p>
                        <p className="font-bold text-primary">
                          €{Number(item.total_price).toFixed(2)}
                        </p>
                      </div>
                    </div>
                  ))}
                  
                  <Separator />
                  
                  <div className="flex justify-between items-center text-lg font-bold">
                    <span>Total del Pedido:</span>
                    <span className="text-2xl text-primary">
                      €{Number(order.total_amount || 0).toFixed(2)}
                    </span>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Información lateral */}
        <div className="space-y-6">
          {/* Estado del pedido */}
          <Card>
            <CardHeader>
              <CardTitle>Estado del Pedido</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center">
                {getStatusBadge(order.status || 'pendiente')}
                <p className="text-sm text-muted-foreground mt-2">
                  Creado: {formatDate(order.created_at || '')}
                </p>
                {order.updated_at && order.updated_at !== order.created_at && (
                  <p className="text-sm text-muted-foreground">
                    Actualizado: {formatDate(order.updated_at)}
                  </p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Información del cliente */}
          <Card>
            <CardHeader>
              <CardTitle>Cliente</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center space-x-2">
                <User className="h-4 w-4 text-muted-foreground" />
                <span>{order.customer_name || 'Sin nombre'}</span>
              </div>
              {order.customer_phone && (
                <div className="flex items-center space-x-2">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <span>{order.customer_phone}</span>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Información de la mesa */}
          {order.tables && (
            <Card>
              <CardHeader>
                <CardTitle>Mesa</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center space-x-2">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  <span>Mesa {order.tables.table_number}</span>
                </div>
                <div className="text-sm text-muted-foreground">
                  <p>Ubicación: {order.tables.location}</p>
                  <p>Capacidad: {order.tables.capacity} personas</p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Notas del pedido */}
          {order.notes && (
            <Card>
              <CardHeader>
                <CardTitle>Notas</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-start space-x-2">
                  <FileText className="h-4 w-4 text-muted-foreground mt-1" />
                  <p className="text-sm">{order.notes}</p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

export default OrderDetails;
