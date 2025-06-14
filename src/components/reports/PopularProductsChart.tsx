
import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface PopularProductsChartProps {
  period: string;
}

const PopularProductsChart = ({ period }: PopularProductsChartProps) => {
  const { data: productsData, isLoading } = useQuery({
    queryKey: ['popular-products', period],
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

      // Fetch order items with product information
      const { data: orderItems } = await supabase
        .from('order_items')
        .select(`
          quantity,
          total_price,
          products!inner(name, price),
          orders!inner(created_at)
        `)
        .gte('orders.created_at', startDate.toISOString())
        .lte('orders.created_at', endDate.toISOString());

      // Group by product and calculate totals
      const productSummary = orderItems?.reduce((acc: any, item: any) => {
        const productName = item.products.name;
        if (!acc[productName]) {
          acc[productName] = {
            name: productName,
            quantity: 0,
            revenue: 0
          };
        }
        acc[productName].quantity += item.quantity;
        acc[productName].revenue += Number(item.total_price);
        return acc;
      }, {}) || {};

      // Convert to array and sort by quantity
      const sortedProducts = Object.values(productSummary)
        .sort((a: any, b: any) => b.quantity - a.quantity)
        .slice(0, 8); // Top 8 products

      return sortedProducts;
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
          <p className="font-medium">{label}</p>
          <p className="text-primary">
            Cantidad: {payload[0].value}
          </p>
          <p className="text-muted-foreground">
            Ingresos: €{data.revenue.toFixed(2)}
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="h-64">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={productsData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
          <XAxis 
            dataKey="name"
            className="text-xs"
            tick={{ fontSize: 12 }}
            angle={-45}
            textAnchor="end"
            height={60}
          />
          <YAxis 
            className="text-xs"
            tick={{ fontSize: 12 }}
          />
          <Tooltip content={<CustomTooltip />} />
          <Bar 
            dataKey="quantity" 
            fill="hsl(var(--primary))"
            radius={[4, 4, 0, 0]}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

export default PopularProductsChart;
