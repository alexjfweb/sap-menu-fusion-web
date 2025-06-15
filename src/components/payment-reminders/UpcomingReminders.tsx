
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Calendar, Send, AlertTriangle, Clock } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { format, addDays, differenceInDays } from 'date-fns';
import { es } from 'date-fns/locale';

interface UpcomingSubscription {
  id: string;
  ends_at: string;
  status: string;
  plan_name: string;
  user_name: string;
  user_email: string;
  days_until_expiry: number;
}

const UpcomingReminders = () => {
  const [upcomingSubscriptions, setUpcomingSubscriptions] = useState<UpcomingSubscription[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchUpcomingSubscriptions();
  }, []);

  const fetchUpcomingSubscriptions = async () => {
    try {
      // Obtener suscripciones que vencen en los próximos 30 días
      const thirtyDaysFromNow = addDays(new Date(), 30).toISOString();
      
      const { data, error } = await supabase
        .from('user_subscriptions')
        .select(`
          id,
          ends_at,
          status,
          subscription_plans(name),
          profiles(full_name, email)
        `)
        .eq('status', 'active')
        .lte('ends_at', thirtyDaysFromNow)
        .gte('ends_at', new Date().toISOString())
        .order('ends_at', { ascending: true });

      if (error) throw error;

      const subscriptionsWithDays = data?.map(sub => ({
        id: sub.id,
        ends_at: sub.ends_at,
        status: sub.status,
        plan_name: sub.subscription_plans?.name || 'Plan desconocido',
        user_name: sub.profiles?.full_name || 'Sin nombre',
        user_email: sub.profiles?.email || 'Sin email',
        days_until_expiry: differenceInDays(new Date(sub.ends_at), new Date())
      })) || [];

      setUpcomingSubscriptions(subscriptionsWithDays);
    } catch (error) {
      console.error('Error fetching upcoming subscriptions:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'No se pudieron cargar las próximas suscripciones.',
      });
    } finally {
      setLoading(false);
    }
  };

  const sendImmediateReminder = async (subscriptionId: string, userEmail: string) => {
    try {
      // Aquí implementarías la lógica para enviar un recordatorio inmediato
      // Por ahora simularemos el envío
      await new Promise(resolve => setTimeout(resolve, 1000));

      toast({
        title: 'Recordatorio enviado',
        description: `Se envió un recordatorio inmediato a ${userEmail}`,
      });
    } catch (error) {
      console.error('Error sending reminder:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'No se pudo enviar el recordatorio.',
      });
    }
  };

  const getUrgencyColor = (days: number) => {
    if (days <= 3) return 'bg-red-100 text-red-800';
    if (days <= 7) return 'bg-orange-100 text-orange-800';
    return 'bg-yellow-100 text-yellow-800';
  };

  const getUrgencyIcon = (days: number) => {
    if (days <= 3) return <AlertTriangle className="h-4 w-4 text-red-600" />;
    if (days <= 7) return <Clock className="h-4 w-4 text-orange-600" />;
    return <Calendar className="h-4 w-4 text-yellow-600" />;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Calendar className="h-5 w-5" />
          <span>Próximos Vencimientos</span>
        </CardTitle>
        <CardDescription>
          Suscripciones que vencen en los próximos 30 días
        </CardDescription>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="animate-pulse space-y-2">
                <div className="h-4 bg-muted rounded w-3/4"></div>
                <div className="h-3 bg-muted rounded w-1/2"></div>
              </div>
            ))}
          </div>
        ) : upcomingSubscriptions.length === 0 ? (
          <div className="text-center py-8">
            <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">
              No hay suscripciones próximas a vencer
            </p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Restaurante</TableHead>
                <TableHead>Plan</TableHead>
                <TableHead>Vence en</TableHead>
                <TableHead>Fecha de vencimiento</TableHead>
                <TableHead>Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {upcomingSubscriptions.map((subscription) => (
                <TableRow key={subscription.id}>
                  <TableCell>
                    <div>
                      <div className="font-medium">{subscription.user_name}</div>
                      <div className="text-sm text-muted-foreground">
                        {subscription.user_email}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{subscription.plan_name}</Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-2">
                      {getUrgencyIcon(subscription.days_until_expiry)}
                      <Badge className={getUrgencyColor(subscription.days_until_expiry)}>
                        {subscription.days_until_expiry} días
                      </Badge>
                    </div>
                  </TableCell>
                  <TableCell>
                    {format(new Date(subscription.ends_at), 'dd/MM/yyyy', { locale: es })}
                  </TableCell>
                  <TableCell>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => sendImmediateReminder(subscription.id, subscription.user_email)}
                    >
                      <Send className="h-4 w-4 mr-2" />
                      Enviar Recordatorio
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
};

export default UpcomingReminders;
