import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  ArrowLeft,
  Calendar,
  Clock,
  Users,
  Phone,
  Mail,
  MapPin,
  FileText,
  CheckCircle,
  XCircle,
  AlertCircle
} from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { useToast } from '@/hooks/use-toast';
import { Database } from '@/integrations/supabase/types';

type ReservationStatus = Database['public']['Enums']['reservation_status'];

interface ReservationDetailsProps {
  reservationId: string;
  onBack: () => void;
}

const ReservationDetails = ({ reservationId, onBack }: ReservationDetailsProps) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: reservation, isLoading } = useQuery({
    queryKey: ['reservation', reservationId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('reservations')
        .select(`
          *,
          tables (
            table_number,
            capacity,
            location,
            is_available
          )
        `)
        .eq('id', reservationId)
        .single();

      if (error) throw error;
      return data;
    },
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({ status }: { status: ReservationStatus }) => {
      const { error } = await supabase
        .from('reservations')
        .update({ status, updated_at: new Date().toISOString() })
        .eq('id', reservationId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reservation', reservationId] });
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

  const handleStatusChange = (newStatus: ReservationStatus) => {
    updateStatusMutation.mutate({ status: newStatus });
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="outline" onClick={onBack}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Volver
          </Button>
          <h2 className="text-3xl font-bold">Cargando reserva...</h2>
        </div>
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Cargando detalles de la reserva...</p>
        </div>
      </div>
    );
  }

  if (!reservation) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="outline" onClick={onBack}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Volver
          </Button>
          <h2 className="text-3xl font-bold">Reserva no encontrada</h2>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="outline" onClick={onBack}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Volver
          </Button>
          <div>
            <h2 className="text-3xl font-bold">Detalles de Reserva</h2>
            <p className="text-muted-foreground">
              Reserva de {reservation.customer_name}
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          {getStatusBadge(reservation.status || 'pendiente')}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Customer Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Información del Cliente
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium text-muted-foreground">Nombre</label>
              <p className="text-lg font-semibold">{reservation.customer_name}</p>
            </div>
            
            <div>
              <label className="text-sm font-medium text-muted-foreground">Teléfono</label>
              <p className="flex items-center gap-2">
                <Phone className="h-4 w-4" />
                {reservation.customer_phone}
              </p>
            </div>
            
            {reservation.customer_email && (
              <div>
                <label className="text-sm font-medium text-muted-foreground">Email</label>
                <p className="flex items-center gap-2">
                  <Mail className="h-4 w-4" />
                  {reservation.customer_email}
                </p>
              </div>
            )}
            
            <div>
              <label className="text-sm font-medium text-muted-foreground">Número de personas</label>
              <p className="flex items-center gap-2">
                <Users className="h-4 w-4" />
                {reservation.party_size} personas
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Reservation Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Información de la Reserva
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium text-muted-foreground">Fecha</label>
              <p className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                {format(new Date(reservation.reservation_date), 'dd/MM/yyyy', { locale: es })}
              </p>
            </div>
            
            <div>
              <label className="text-sm font-medium text-muted-foreground">Hora</label>
              <p className="flex items-center gap-2">
                <Clock className="h-4 w-4" />
                {reservation.reservation_time}
              </p>
            </div>
            
            <div>
              <label className="text-sm font-medium text-muted-foreground">Mesa</label>
              <p className="flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                Mesa {reservation.tables?.table_number} ({reservation.tables?.location})
              </p>
              <p className="text-sm text-muted-foreground">
                Capacidad: {reservation.tables?.capacity} personas
              </p>
            </div>
            
            <div>
              <label className="text-sm font-medium text-muted-foreground">Estado</label>
              <div className="mt-1">
                {getStatusBadge(reservation.status || 'pendiente')}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Special Requests */}
        {reservation.special_requests && (
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Solicitudes Especiales
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-700">{reservation.special_requests}</p>
            </CardContent>
          </Card>
        )}

        {/* Actions */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Acciones</CardTitle>
            <CardDescription>
              Actualizar el estado de la reserva
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-3">
              {reservation.status === 'pendiente' && (
                <Button
                  onClick={() => handleStatusChange('confirmada')}
                  disabled={updateStatusMutation.isPending}
                  className="flex items-center gap-2"
                >
                  <CheckCircle className="h-4 w-4" />
                  Confirmar Reserva
                </Button>
              )}
              
              {reservation.status === 'confirmada' && (
                <Button
                  variant="outline"
                  onClick={() => handleStatusChange('completada')}
                  disabled={updateStatusMutation.isPending}
                  className="flex items-center gap-2"
                >
                  <CheckCircle className="h-4 w-4" />
                  Marcar como Completada
                </Button>
              )}
              
              {(reservation.status === 'pendiente' || reservation.status === 'confirmada') && (
                <Button
                  variant="destructive"
                  onClick={() => handleStatusChange('cancelada')}
                  disabled={updateStatusMutation.isPending}
                  className="flex items-center gap-2"
                >
                  <XCircle className="h-4 w-4" />
                  Cancelar Reserva
                </Button>
              )}
              
              {reservation.status === 'cancelada' && (
                <Button
                  variant="outline"
                  onClick={() => handleStatusChange('pendiente')}
                  disabled={updateStatusMutation.isPending}
                  className="flex items-center gap-2"
                >
                  <AlertCircle className="h-4 w-4" />
                  Reactivar Reserva
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Timestamps */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Información del Sistema</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <label className="text-muted-foreground">Creada el:</label>
              <p>{format(new Date(reservation.created_at), 'dd/MM/yyyy HH:mm', { locale: es })}</p>
            </div>
            <div>
              <label className="text-muted-foreground">Última actualización:</label>
              <p>{format(new Date(reservation.updated_at), 'dd/MM/yyyy HH:mm', { locale: es })}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ReservationDetails;
