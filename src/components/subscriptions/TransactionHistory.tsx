
import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { Search, Download, Filter } from 'lucide-react';
import { Tables } from '@/integrations/supabase/types';

type Transaction = Tables<'transactions'>;

const TransactionHistory = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [dateRange, setDateRange] = useState('all');

  const { data: transactions, isLoading } = useQuery({
    queryKey: ['transactions', searchTerm, statusFilter, dateRange],
    queryFn: async () => {
      let query = supabase
        .from('transactions')
        .select(`
          *,
          subscription_plans(name),
          payment_methods(name, type)
        `)
        .order('created_at', { ascending: false });

      if (statusFilter !== 'all') {
        query = query.eq('status', statusFilter);
      }

      if (dateRange !== 'all') {
        const now = new Date();
        const days = parseInt(dateRange);
        const fromDate = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
        query = query.gte('created_at', fromDate.toISOString());
      }

      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
  });

  const getStatusBadge = (status: string) => {
    const variants: Record<string, 'default' | 'secondary' | 'destructive'> = {
      completed: 'default',
      pending: 'secondary',
      failed: 'destructive',
      cancelled: 'destructive',
      refunded: 'secondary',
    };

    const labels: Record<string, string> = {
      completed: 'Completado',
      pending: 'Pendiente',
      failed: 'Fallido',
      cancelled: 'Cancelado',
      refunded: 'Reembolsado',
    };

    return (
      <Badge variant={variants[status] || 'secondary'}>
        {labels[status] || status}
      </Badge>
    );
  };

  const formatCurrency = (amount: number, currency: string) => {
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: currency.toUpperCase(),
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (isLoading) {
    return <div className="flex justify-center py-8">Cargando transacciones...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header y controles */}
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-2xl font-bold">Historial de Transacciones</h3>
          <p className="text-muted-foreground">
            Seguimiento detallado de todas las transacciones
          </p>
        </div>
        <Button>
          <Download className="h-4 w-4 mr-2" />
          Exportar
        </Button>
      </div>

      {/* Filtros */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center">
            <Filter className="h-4 w-4 mr-2" />
            Filtros y Búsqueda
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar transacciones..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Estado" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los estados</SelectItem>
                <SelectItem value="completed">Completado</SelectItem>
                <SelectItem value="pending">Pendiente</SelectItem>
                <SelectItem value="failed">Fallido</SelectItem>
                <SelectItem value="cancelled">Cancelado</SelectItem>
                <SelectItem value="refunded">Reembolsado</SelectItem>
              </SelectContent>
            </Select>
            <Select value={dateRange} onValueChange={setDateRange}>
              <SelectTrigger>
                <SelectValue placeholder="Periodo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todo el tiempo</SelectItem>
                <SelectItem value="1">Último día</SelectItem>
                <SelectItem value="7">Última semana</SelectItem>
                <SelectItem value="30">Último mes</SelectItem>
                <SelectItem value="90">Últimos 3 meses</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" onClick={() => {
              setSearchTerm('');
              setStatusFilter('all');
              setDateRange('all');
            }}>
              Limpiar Filtros
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Estadísticas rápidas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-green-600">
              $24,567
            </div>
            <p className="text-sm text-muted-foreground">Ingresos del Mes</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold">1,234</div>
            <p className="text-sm text-muted-foreground">Transacciones Totales</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-blue-600">98.5%</div>
            <p className="text-sm text-muted-foreground">Tasa de Éxito</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold">$45.67</div>
            <p className="text-sm text-muted-foreground">Valor Promedio</p>
          </CardContent>
        </Card>
      </div>

      {/* Lista de transacciones */}
      <Card>
        <CardHeader>
          <CardTitle>Transacciones Recientes</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {transactions?.map((transaction: any) => (
              <div key={transaction.id} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center space-x-4">
                  <div>
                    <p className="font-medium">
                      {transaction.subscription_plans?.name || 'Plan eliminado'}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {transaction.payment_methods?.name} • {formatDate(transaction.created_at)}
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-4">
                  <div className="text-right">
                    <p className="font-medium">
                      {formatCurrency(transaction.amount, transaction.currency)}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      ID: {transaction.id.slice(0, 8)}...
                    </p>
                  </div>
                  {getStatusBadge(transaction.status)}
                </div>
              </div>
            ))}
            {transactions?.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                No se encontraron transacciones
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default TransactionHistory;
