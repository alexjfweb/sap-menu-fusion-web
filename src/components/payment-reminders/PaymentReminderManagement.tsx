
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ArrowLeft, Settings, History, MessageSquare, Calendar, AlertTriangle, CheckCircle } from 'lucide-react';
import ReminderConfigurations from './ReminderConfigurations';
import ReminderTemplates from './ReminderTemplates';
import ReminderHistory from './ReminderHistory';
import UpcomingReminders from './UpcomingReminders';
import ReminderSettings from './ReminderSettings';

interface PaymentReminderManagementProps {
  onBack: () => void;
}

const PaymentReminderManagement = ({ onBack }: PaymentReminderManagementProps) => {
  const [activeTab, setActiveTab] = useState('overview');

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center space-x-4">
            <Button variant="outline" size="sm" onClick={onBack}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Volver
            </Button>
            <div>
              <h1 className="text-2xl font-bold">Recordatorios de Pago</h1>
              <p className="text-muted-foreground">
                Gestiona recordatorios automáticos para vencimientos de suscripciones
              </p>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="overview" className="flex items-center space-x-2">
              <Calendar className="h-4 w-4" />
              <span>Resumen</span>
            </TabsTrigger>
            <TabsTrigger value="configurations" className="flex items-center space-x-2">
              <Settings className="h-4 w-4" />
              <span>Configuración</span>
            </TabsTrigger>
            <TabsTrigger value="templates" className="flex items-center space-x-2">
              <MessageSquare className="h-4 w-4" />
              <span>Plantillas</span>
            </TabsTrigger>
            <TabsTrigger value="history" className="flex items-center space-x-2">
              <History className="h-4 w-4" />
              <span>Historial</span>
            </TabsTrigger>
            <TabsTrigger value="settings" className="flex items-center space-x-2">
              <Settings className="h-4 w-4" />
              <span>Sistema</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-2xl font-bold text-orange-600">12</div>
                      <p className="text-sm text-muted-foreground">Vencen esta semana</p>
                    </div>
                    <AlertTriangle className="h-8 w-8 text-orange-600 opacity-50" />
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-2xl font-bold text-red-600">5</div>
                      <p className="text-sm text-muted-foreground">En mora</p>
                    </div>
                    <AlertTriangle className="h-8 w-8 text-red-600 opacity-50" />
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-2xl font-bold text-green-600">47</div>
                      <p className="text-sm text-muted-foreground">Recordatorios enviados hoy</p>
                    </div>
                    <CheckCircle className="h-8 w-8 text-green-600 opacity-50" />
                  </div>
                </CardContent>
              </Card>
            </div>

            <UpcomingReminders />
          </TabsContent>

          <TabsContent value="configurations">
            <ReminderConfigurations />
          </TabsContent>

          <TabsContent value="templates">
            <ReminderTemplates />
          </TabsContent>

          <TabsContent value="history">
            <ReminderHistory />
          </TabsContent>

          <TabsContent value="settings">
            <ReminderSettings />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default PaymentReminderManagement;
