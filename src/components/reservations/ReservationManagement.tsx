
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
  Calendar,
  Clock,
  Users,
  Phone,
  Mail,
  MapPin,
  Eye,
  CheckCircle,
  XCircle,
  AlertCircle
} from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import ReservationDetails from './ReservationDetails';
import { useToast } from '@/hooks/use-toast';
import { Database } from '@/integrations/supabase/types';

type ReservationStatus = Database['public']['Enums']['reservation_status'];

const ReservationManagement = () => {
  const [selectedReservation, setSelectedReservation] = useState<string | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch reservations with table details
  const { data: reservations, isLoading } = useQuery({
    queryKey: ['reservations'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('reservations')
        .select(`
          *,
          tables (
            table_number,
            capacity,
            location
          )
        `)
        .order('reservation_date', { ascending: true })
        .order('reservation_time', { ascending: true });

      if (error) throw error;
      return data;
    },
  });

  // Update reservation status
  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: ReservationStatus }) => {
      const { error } = await supabase
        .from('reservations')
        .update({ status, updated_at: new Date().toISOString() })
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reservations'] });
      toast({
        title: "Estado actualizado",
        description: "El estado de la reserva se ha actualizado correctamente.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "No se pudo actualizar el estado de la reserva.",
        variant: "destructive",
      });
      console.error('Error updating reservation status:', error);
    },
  });

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      pendiente: { label: 'Pendiente', variant: 'secondary' as const, icon: AlertCircle },
      confirmada: { label: 'Confirmada', variant: 'default' as const, icon: CheckCircle },
      cancelada: { label: 'Cancelada', variant: 'destructive' as const, icon: XCircle },
      completada: { label: 'Completada', variant: 'outline' as const, icon: CheckCircle },
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pendiente;
    const Icon = config.icon;

    return (
      <Badge variant={config.variant} className="flex items-center gap-1">
        <Icon className="h-3 w-3" />
        {config.label}
      </Badge>
    );
  };

  const handleStatusChange = (reservationId: string, newStatus: ReservationStatus) => {
    updateStatusMutation.mutate({ id: reservationId, status: newStatus });
  };

  // Calculate quick stats
  const stats = reservations ? {
    total: reservations.length,
    pendientes: reservations.filter(r => r.status === 'pendiente').length,
    confirmadas: reservations.filter(r => r.status === 'confirmada').length,
    hoy: reservations.filter(r => {
      const today = new Date().toISOString().split('T')[0];
      return r.reservation_date === today;
    }).length,
  } : { total: 0, pendientes: 0, confirmadas: 0, hoy: 0 };

  if (selectedReservation) {
    return (
      <ReservationDetails
        reservationId={selectedReservation}
        onBack={() => setSelectedReservation(null)}
      />
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold mb-2">Gestión de Reservas</h2>
        <p className="text-muted-foreground">
          Administra las reservas de mesas del restaurante
        </p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Reservas</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pendientes</CardTitle>
            <AlertCircle className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{stats.pendientes}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Confirmadas</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.confirmadas}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Reservas Hoy</CardTitle>
            <Clock className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{stats.hoy}</div>
          </CardContent>
        </Card>
      </div>

      {/* Reservations List */}
      <Card>
        <CardHeader>
          <CardTitle>Listado de Reservas</CardTitle>
          <CardDescription>
            Todas las reservas ordenadas por fecha y hora
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-muted-foreground">Cargando reservas...</p>
            </div>
          ) : reservations && reservations.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Fecha y Hora</TableHead>
                  <TableHead>Mesa</TableHead>
                  <TableHead>Personas</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {reservations.map((reservation) => (
                  <TableRow key={reservation.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">{reservation.customer_name}</div>
                        <div className="text-sm text-muted-foreground flex items-center gap-1">
                          <Phone className="h-3 w-3" />
                          {reservation.customer_phone}
                        </div>
                        {reservation.customer_email && (
                          <div className="text-sm text-muted-foreground flex items-center gap-1">
                            <Mail className="h-3 w-3" />
                            {reservation.customer_email}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <div className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {format(new Date(reservation.reservation_date), 'dd/MM/yyyy', { locale: es })}
                        </div>
                        <div className="flex items-center gap-1 text-sm text-muted-foreground">
                          <Clock className="h-3 w-3" />
                          {reservation.reservation_time}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium">Mesa {reservation.tables?.table_number}</div>
                        <div className="text-sm text-muted-foreground flex items-center gap-1">
                          <MapPin className="h-3 w-3" />
                          {reservation.tables?.location}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Users className="h-3 w-3" />
                        {reservation.party_size}
                      </div>
                    </TableCell>
                    <TableCell>
                      {getStatusBadge(reservation.status || 'pendiente')}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setSelectedReservation(reservation.id)}
                        >
                          <Eye className="h-3 w-3 mr-1" />
                          Ver
                        </Button>
                        
                        {reservation.status === 'pendiente' && (
                          <Button
                            variant="default"
                            size="sm"
                            onClick={() => handleStatusChange(reservation.id, 'confirmada')}
                            disabled={updateStatusMutation.isPending}
                          >
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Confirmar
                          </Button>
                        )}
                        
                        {reservation.status === 'confirmada' && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleStatusChange(reservation.id, 'completada')}
                            disabled={updateStatusMutation.isPending}
                          >
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Completar
                          </Button>
                        )}
                        
                        {(reservation.status === 'pendiente' || reservation.status === 'confirmada') && (
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => handleStatusChange(reservation.id, 'cancelada')}
                            disabled={updateStatusMutation.isPending}
                          >
                            <XCircle className="h-3 w-3 mr-1" />
                            Cancelar
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-8">
              <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No hay reservas</h3>
              <p className="text-muted-foreground">No se encontraron reservas en el sistema</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ReservationManagement;
