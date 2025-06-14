
import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { format, subDays, eachDayOfInterval } from 'date-fns';
import { es } from 'date-fns/locale';

interface SalesChartProps {
  period: string;
}

const SalesChart = ({ period }: SalesChartProps) => {
  const { data: salesData, isLoading } = useQuery({
    queryKey: ['sales-chart', period],
    queryFn: async () => {
      const endDate = new Date();
      const startDate = new Date();
      
      let days = 7;
      switch (period) {
        case '30d':
          days = 30;
          break;
        case '90d':
          days = 90;
          break;
        default:
          days = 7;
      }
      
      startDate.setDate(endDate.getDate() - days);

      // Fetch orders data
      const { data: orders } = await supabase
        .from('orders')
        .select('total_amount, created_at')
        .gte('created_at', startDate.toISOString())
        .lte('created_at', endDate.toISOString())
        .order('created_at');

      // Generate all days in the range
      const allDays = eachDayOfInterval({ start: startDate, end: endDate });
      
      // Group orders by date
      const salesByDate = allDays.map(date => {
        const dateStr = format(date, 'yyyy-MM-dd');
        const dayOrders = orders?.filter(order => 
          format(new Date(order.created_at), 'yyyy-MM-dd') === dateStr
        ) || [];
        
        const totalSales = dayOrders.reduce((sum, order) => 
          sum + (Number(order.total_amount) || 0), 0
        );

        return {
          date: dateStr,
          sales: totalSales,
          orders: dayOrders.length,
          formattedDate: format(date, 'dd MMM', { locale: es })
        };
      });

      return salesByDate;
    }
  });

  if (isLoading) {
    return (
      <div className="h-64 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-background border rounded-lg p-3 shadow-lg">
          <p className="font-medium">{data.formattedDate}</p>
          <p className="text-primary">
            Ventas: €{payload[0].value.toFixed(2)}
          </p>
          <p className="text-muted-foreground">
            Pedidos: {data.orders}
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="h-64">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={salesData}>
          <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
          <XAxis 
            dataKey="formattedDate"
            className="text-xs"
            tick={{ fontSize: 12 }}
          />
          <YAxis 
            className="text-xs"
            tick={{ fontSize: 12 }}
            tickFormatter={(value) => `€${value}`}
          />
          <Tooltip content={<CustomTooltip />} />
          <Line 
            type="monotone" 
            dataKey="sales" 
            stroke="hsl(var(--primary))"
            strokeWidth={2}
            dot={{ fill: 'hsl(var(--primary))', strokeWidth: 2, r: 4 }}
            activeDot={{ r: 6, stroke: 'hsl(var(--primary))', strokeWidth: 2 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

export default SalesChart;
