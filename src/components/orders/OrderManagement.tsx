import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { 
  Clock, 
  ChefHat, 
  CheckCircle, 
  Truck, 
  XCircle,
  Eye,
  Edit,
  ArrowLeft
} from 'lucide-react';
import { Tables } from '@/integrations/supabase/types';
import OrderDetails from './OrderDetails';

type Order = Tables<'orders'> & {
  tables?: Tables<'tables'>;
};

type OrderStatus = 'pendiente' | 'en_preparacion' | 'listo' | 'entregado' | 'cancelado';

interface OrderManagementProps {
  onBack?: () => void;
}

const OrderManagement = ({ onBack }: OrderManagementProps) => {
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [isViewingDetails, setIsViewingDetails] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: orders, isLoading } = useQuery({
    queryKey: ['orders'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('orders')
        .select(`
          *,
          tables (
            table_number,
            capacity,
            location
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as Order[];
    },
  });

  const updateOrderMutation = useMutation({
    mutationFn: async ({ orderId, status }: { orderId: string; status: OrderStatus }) => {
      const { error } = await supabase
        .from('orders')
        .update({ 
          status,
          updated_at: new Date().toISOString()
        })
        .eq('id', orderId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      toast({
        title: "Estado actualizado",
        description: "El estado del pedido se ha actualizado correctamente.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "No se pudo actualizar el estado del pedido.",
        variant: "destructive",
      });
      console.error('Error updating order:', error);
    },
  });

  const getStatusBadge = (status: OrderStatus) => {
    const statusConfig = {
      pendiente: { color: 'bg-yellow-500', icon: Clock, text: 'Pendiente' },
      en_preparacion: { color: 'bg-blue-500', icon: ChefHat, text: 'En Preparación' },
      listo: { color: 'bg-green-500', icon: CheckCircle, text: 'Listo' },
      entregado: { color: 'bg-gray-500', icon: Truck, text: 'Entregado' },
      cancelado: { color: 'bg-red-500', icon: XCircle, text: 'Cancelado' },
    };

    const config = statusConfig[status];
    const Icon = config.icon;

    return (
      <Badge className={`${config.color} text-white`}>
        <Icon className="h-3 w-3 mr-1" />
        {config.text}
      </Badge>
    );
  };

  const handleStatusChange = (orderId: string, newStatus: OrderStatus) => {
    updateOrderMutation.mutate({ orderId, status: newStatus });
  };

  const handleViewDetails = (order: Order) => {
    setSelectedOrder(order);
    setIsViewingDetails(true);
  };

  if (isViewingDetails && selectedOrder) {
    return (
      <OrderDetails 
        order={selectedOrder}
        onBack={() => {
          setIsViewingDetails(false);
          setSelectedOrder(null);
        }}
      />
    );
  }

  if (isLoading) {
    return (
      <div className="text-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
        <p className="text-muted-foreground">Cargando pedidos...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center space-x-4">
            {onBack && (
              <Button variant="ghost" size="sm" onClick={onBack}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Volver al Panel
              </Button>
            )}
            <div className="flex items-center space-x-2">
              <ChefHat className="h-8 w-8 text-primary" />
              <h1 className="text-2xl font-bold">Gestión de Pedidos</h1>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <div className="space-y-6">
          <div>
            <h2 className="text-3xl font-bold mb-2">Gestión de Pedidos</h2>
            <p className="text-muted-foreground">
              Administra y supervisa todos los pedidos del restaurante
            </p>
          </div>

          {/* Estadísticas rápidas */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Pendientes
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-yellow-600">
                  {orders?.filter(o => o.status === 'pendiente').length || 0}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  En Preparación
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-600">
                  {orders?.filter(o => o.status === 'en_preparacion').length || 0}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Listos
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">
                  {orders?.filter(o => o.status === 'listo').length || 0}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Total Hoy
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-primary">
                  {orders?.length || 0}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Tabla de pedidos */}
          <Card>
            <CardHeader>
              <CardTitle>Lista de Pedidos</CardTitle>
              <CardDescription>
                Gestiona el estado de todos los pedidos
              </CardDescription>
            </CardHeader>
            <CardContent>
              {!orders || orders.length === 0 ? (
                <div className="text-center py-8">
                  <ChefHat className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No hay pedidos</h3>
                  <p className="text-muted-foreground">Los pedidos aparecerán aquí cuando se realicen.</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Número</TableHead>
                      <TableHead>Cliente</TableHead>
                      <TableHead>Mesa</TableHead>
                      <TableHead>Estado</TableHead>
                      <TableHead>Total</TableHead>
                      <TableHead>Fecha</TableHead>
                      <TableHead>Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {orders.map((order) => (
                      <TableRow key={order.id}>
                        <TableCell className="font-medium">
                          {order.order_number}
                        </TableCell>
                        <TableCell>
                          <div>
                            <div className="font-medium">{order.customer_name}</div>
                            <div className="text-sm text-muted-foreground">
                              {order.customer_phone}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          {order.tables ? (
                            <div>
                              <div className="font-medium">Mesa {order.tables.table_number}</div>
                              <div className="text-sm text-muted-foreground">
                                {order.tables.location} • {order.tables.capacity} personas
                              </div>
                            </div>
                          ) : (
                            <span className="text-muted-foreground">Sin mesa</span>
                          )}
                        </TableCell>
                        <TableCell>
                          {getStatusBadge(order.status as OrderStatus)}
                        </TableCell>
                        <TableCell>
                          €{Number(order.total_amount || 0).toFixed(2)}
                        </TableCell>
                        <TableCell>
                          {new Date(order.created_at || '').toLocaleDateString('es-ES', {
                            day: '2-digit',
                            month: '2-digit',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </TableCell>
                        <TableCell>
                          <div className="flex space-x-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleViewDetails(order)}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            
                            <Select
                              value={order.status || 'pendiente'}
                              onValueChange={(value: OrderStatus) => 
                                handleStatusChange(order.id, value)
                              }
                            >
                              <SelectTrigger className="w-[140px]">
                                <Edit className="h-4 w-4 mr-2" />
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="pendiente">Pendiente</SelectItem>
                                <SelectItem value="en_preparacion">En Preparación</SelectItem>
                                <SelectItem value="listo">Listo</SelectItem>
                                <SelectItem value="entregado">Entregado</SelectItem>
                                <SelectItem value="cancelado">Cancelado</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default OrderManagement;
