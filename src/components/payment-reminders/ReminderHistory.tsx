
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Search, Filter, Mail, MessageSquare, Bell, CheckCircle, XCircle, Clock } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface ReminderHistoryItem {
  id: string;
  delivery_method: string;
  message_content: string;
  sent_at: string;
  status: string;
  error_message: string | null;
  retry_count: number;
  user_name?: string;
  user_email?: string;
}

const ReminderHistory = () => {
  const [history, setHistory] = useState<ReminderHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [methodFilter, setMethodFilter] = useState('all');
  const { toast } = useToast();

  useEffect(() => {
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    try {
      // Primero obtenemos el historial básico
      const { data: historyData, error } = await supabase
        .from('payment_reminder_history')
        .select('*')
        .order('sent_at', { ascending: false })
        .limit(100);

      if (error) throw error;

      // Luego obtenemos los datos de usuario para cada entrada
      const enrichedHistory = await Promise.all(
        (historyData || []).map(async (item) => {
          if (item.user_id) {
            const { data: profileData } = await supabase
              .from('profiles')
              .select('full_name, email')
              .eq('id', item.user_id)
              .single();

            return {
              ...item,
              user_name: profileData?.full_name || 'Sin nombre',
              user_email: profileData?.email || 'Sin email'
            };
          }
          return {
            ...item,
            user_name: 'Sin nombre',
            user_email: 'Sin email'
          };
        })
      );

      setHistory(enrichedHistory);
    } catch (error) {
      console.error('Error fetching history:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'No se pudo cargar el historial.',
      });
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'sent':
      case 'delivered':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'failed':
        return <XCircle className="h-4 w-4 text-red-600" />;
      default:
        return <Clock className="h-4 w-4 text-yellow-600" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'sent':
      case 'delivered':
        return 'bg-green-100 text-green-800';
      case 'failed':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-yellow-100 text-yellow-800';
    }
  };

  const getDeliveryMethodIcon = (method: string) => {
    switch (method) {
      case 'email': return <Mail className="h-4 w-4" />;
      case 'sms': return <MessageSquare className="h-4 w-4" />;
      case 'whatsapp': return <MessageSquare className="h-4 w-4" />;
      case 'push': return <Bell className="h-4 w-4" />;
      default: return <Mail className="h-4 w-4" />;
    }
  };

  const filteredHistory = history.filter(item => {
    const matchesSearch = searchTerm === '' || 
      item.user_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.user_email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.message_content.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || item.status === statusFilter;
    const matchesMethod = methodFilter === 'all' || item.delivery_method === methodFilter;
    
    return matchesSearch && matchesStatus && matchesMethod;
  });

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Historial de Recordatorios</h2>
        <p className="text-muted-foreground">
          Revisa todos los recordatorios enviados y su estado
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Filter className="h-5 w-5" />
            <span>Filtros</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Buscar</label>
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar por nombre, email o mensaje..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Estado</label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="sent">Enviado</SelectItem>
                  <SelectItem value="delivered">Entregado</SelectItem>
                  <SelectItem value="failed">Fallido</SelectItem>
                  <SelectItem value="read">Leído</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Método</label>
              <Select value={methodFilter} onValueChange={setMethodFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="email">Email</SelectItem>
                  <SelectItem value="sms">SMS</SelectItem>
                  <SelectItem value="whatsapp">WhatsApp</SelectItem>
                  <SelectItem value="push">Push</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Recordatorios Enviados</CardTitle>
          <CardDescription>
            {filteredHistory.length} de {history.length} recordatorios
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
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Restaurante</TableHead>
                  <TableHead>Método</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Enviado</TableHead>
                  <TableHead>Reintentos</TableHead>
                  <TableHead>Mensaje</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredHistory.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">
                          {item.user_name}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {item.user_email}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        {getDeliveryMethodIcon(item.delivery_method)}
                        <span className="capitalize">{item.delivery_method}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        {getStatusIcon(item.status)}
                        <Badge className={getStatusColor(item.status)}>
                          {item.status}
                        </Badge>
                      </div>
                    </TableCell>
                    <TableCell>
                      {format(new Date(item.sent_at), 'dd/MM/yyyy HH:mm', { locale: es })}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {item.retry_count}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="max-w-xs truncate" title={item.message_content}>
                        {item.message_content}
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
  );
};

export default ReminderHistory;
