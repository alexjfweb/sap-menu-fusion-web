
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ArrowLeft, CreditCard, Settings, BarChart3 } from 'lucide-react';
import SubscriptionPlans from './SubscriptionPlans';
import PaymentMethods from './PaymentMethods';
import TransactionHistory from './TransactionHistory';

interface SubscriptionManagementProps {
  onBack: () => void;
}

const SubscriptionManagement = ({ onBack }: SubscriptionManagementProps) => {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 py-4 flex items-center space-x-4">
          <Button variant="ghost" size="sm" onClick={onBack}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Volver al Dashboard
          </Button>
          <div className="flex items-center space-x-2">
            <CreditCard className="h-6 w-6 text-primary" />
            <h1 className="text-2xl font-bold">Gestión de Suscripciones</h1>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <h2 className="text-3xl font-bold mb-2">Sistema de Suscripciones</h2>
          <p className="text-muted-foreground">
            Administra planes de suscripción, métodos de pago y transacciones
          </p>
        </div>

        <Tabs defaultValue="plans" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="plans" className="flex items-center space-x-2">
              <CreditCard className="h-4 w-4" />
              <span>Planes</span>
            </TabsTrigger>
            <TabsTrigger value="payment-methods" className="flex items-center space-x-2">
              <Settings className="h-4 w-4" />
              <span>Métodos de Pago</span>
            </TabsTrigger>
            <TabsTrigger value="transactions" className="flex items-center space-x-2">
              <BarChart3 className="h-4 w-4" />
              <span>Transacciones</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="plans">
            <SubscriptionPlans />
          </TabsContent>

          <TabsContent value="payment-methods">
            <PaymentMethods />
          </TabsContent>

          <TabsContent value="transactions">
            <TransactionHistory />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default SubscriptionManagement;
