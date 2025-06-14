
import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';

interface ReservationsChartProps {
  period: string;
}

const ReservationsChart = ({ period }: ReservationsChartProps) => {
  const { data: reservationsData, isLoading } = useQuery({
    queryKey: ['reservations-chart', period],
    queryFn: async () => {
      const endDate = new Date();
      const startDate = new Date();
      
      switch (period) {
        case '7d':
          startDate.setDate(endDate.getDate() - 7);
          break;
        case '30d':
          startDate.setDate(endDate.getDate() - 30);
          break;
        case '90d':
          startDate.setDate(endDate.getDate() - 90);
          break;
      }

      // Fetch reservations data
      const { data: reservations } = await supabase
        .from('reservations')
        .select('status, party_size')
        .gte('created_at', startDate.toISOString())
        .lte('created_at', endDate.toISOString());

      // Group by status
      const statusCounts = reservations?.reduce((acc: any, reservation: any) => {
        const status = reservation.status || 'pendiente';
        acc[status] = (acc[status] || 0) + 1;
        return acc;
      }, {}) || {};

      // Convert to chart format
      const chartData = Object.entries(statusCounts).map(([status, count]) => ({
        name: status.charAt(0).toUpperCase() + status.slice(1),
        value: count,
        status
      }));

      return chartData;
    }
  });

  const COLORS = {
    pendiente: '#f59e0b',
    confirmada: '#10b981',
    cancelada: '#ef4444',
    completada: '#6366f1'
  };

  if (isLoading) {
    return (
      <div className="h-64 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-background border rounded-lg p-3 shadow-lg">
          <p className="font-medium">{data.name}</p>
          <p className="text-primary">
            Cantidad: {data.value}
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="h-64">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={reservationsData}
            cx="50%"
            cy="50%"
            labelLine={false}
            outerRadius={80}
            fill="#8884d8"
            dataKey="value"
            label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
          >
            {reservationsData?.map((entry: any, index: number) => (
              <Cell 
                key={`cell-${index}`} 
                fill={COLORS[entry.status as keyof typeof COLORS] || '#8884d8'} 
              />
            ))}
          </Pie>
          <Tooltip content={<CustomTooltip />} />
          <Legend />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
};

export default ReservationsChart;
