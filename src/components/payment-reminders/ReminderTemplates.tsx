
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Mail, MessageSquare, Bell, Edit, Save, X } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface ReminderTemplate {
  id: string;
  config_id: string;
  delivery_method: string;
  subject: string | null;
  message_body: string;
  tone: string;
  variables: any;
  config_name?: string;
}

const ReminderTemplates = () => {
  const [templates, setTemplates] = useState<ReminderTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingTemplate, setEditingTemplate] = useState<string | null>(null);
  const [editData, setEditData] = useState<Partial<ReminderTemplate>>({});
  const { toast } = useToast();

  useEffect(() => {
    fetchTemplates();
  }, []);

  const fetchTemplates = async () => {
    try {
      const { data, error } = await supabase
        .from('payment_reminder_templates')
        .select(`
          *,
          payment_reminder_configs(name)
        `)
        .order('delivery_method');

      if (error) throw error;

      const templatesWithConfig = data?.map(template => ({
        ...template,
        config_name: template.payment_reminder_configs?.name || 'Sin configuración'
      })) || [];

      setTemplates(templatesWithConfig);
    } catch (error) {
      console.error('Error fetching templates:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'No se pudieron cargar las plantillas.',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (template: ReminderTemplate) => {
    setEditingTemplate(template.id);
    setEditData({
      subject: template.subject,
      message_body: template.message_body,
      tone: template.tone,
    });
  };

  const handleSave = async (templateId: string) => {
    try {
      const { error } = await supabase
        .from('payment_reminder_templates')
        .update(editData)
        .eq('id', templateId);

      if (error) throw error;

      setTemplates(templates.map(template => 
        template.id === templateId 
          ? { ...template, ...editData }
          : template
      ));

      setEditingTemplate(null);
      setEditData({});

      toast({
        title: 'Plantilla actualizada',
        description: 'La plantilla se actualizó exitosamente.',
      });
    } catch (error) {
      console.error('Error updating template:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'No se pudo actualizar la plantilla.',
      });
    }
  };

  const handleCancel = () => {
    setEditingTemplate(null);
    setEditData({});
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

  const getToneColor = (tone: string) => {
    switch (tone) {
      case 'friendly': return 'bg-green-100 text-green-800';
      case 'urgent': return 'bg-red-100 text-red-800';
      case 'formal': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const groupedTemplates = templates.reduce((acc, template) => {
    if (!acc[template.delivery_method]) {
      acc[template.delivery_method] = [];
    }
    acc[template.delivery_method].push(template);
    return acc;
  }, {} as Record<string, ReminderTemplate[]>);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Plantillas de Recordatorios</h2>
        <p className="text-muted-foreground">
          Personaliza los mensajes de recordatorio para cada método de envío
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Variables Disponibles</CardTitle>
          <CardDescription>
            Puedes usar estas variables en tus plantillas
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Badge variant="outline">{'{nombre_restaurante}'}</Badge>
            <Badge variant="outline">{'{fecha_vencimiento}'}</Badge>
            <Badge variant="outline">{'{monto}'}</Badge>
            <Badge variant="outline">{'{dias_restantes}'}</Badge>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="email" className="space-y-4">
        <TabsList>
          <TabsTrigger value="email" className="flex items-center space-x-2">
            <Mail className="h-4 w-4" />
            <span>Email</span>
          </TabsTrigger>
          <TabsTrigger value="sms" className="flex items-center space-x-2">
            <MessageSquare className="h-4 w-4" />
            <span>SMS</span>
          </TabsTrigger>
          <TabsTrigger value="whatsapp" className="flex items-center space-x-2">
            <MessageSquare className="h-4 w-4" />
            <span>WhatsApp</span>
          </TabsTrigger>
          <TabsTrigger value="push" className="flex items-center space-x-2">
            <Bell className="h-4 w-4" />
            <span>Push</span>
          </TabsTrigger>
        </TabsList>

        {Object.entries(groupedTemplates).map(([method, methodTemplates]) => (
          <TabsContent key={method} value={method} className="space-y-4">
            {methodTemplates.map((template) => (
              <Card key={template.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      {getDeliveryMethodIcon(template.delivery_method)}
                      <div>
                        <CardTitle className="text-lg">{template.config_name}</CardTitle>
                        <CardDescription className="capitalize">
                          {template.delivery_method}
                        </CardDescription>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge className={getToneColor(template.tone)}>
                        {template.tone}
                      </Badge>
                      {editingTemplate === template.id ? (
                        <div className="flex space-x-1">
                          <Button 
                            size="sm" 
                            onClick={() => handleSave(template.id)}
                          >
                            <Save className="h-4 w-4" />
                          </Button>
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={handleCancel}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      ) : (
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => handleEdit(template)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {editingTemplate === template.id ? (
                    <>
                      {template.delivery_method === 'email' && (
                        <div className="space-y-2">
                          <Label htmlFor="subject">Asunto</Label>
                          <Input
                            id="subject"
                            value={editData.subject || ''}
                            onChange={(e) => setEditData({ ...editData, subject: e.target.value })}
                            placeholder="Asunto del email"
                          />
                        </div>
                      )}
                      
                      <div className="space-y-2">
                        <Label htmlFor="message">Mensaje</Label>
                        <Textarea
                          id="message"
                          value={editData.message_body || ''}
                          onChange={(e) => setEditData({ ...editData, message_body: e.target.value })}
                          placeholder="Contenido del mensaje"
                          rows={4}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="tone">Tono</Label>
                        <Select
                          value={editData.tone}
                          onValueChange={(value) => setEditData({ ...editData, tone: value })}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="friendly">Amigable</SelectItem>
                            <SelectItem value="formal">Formal</SelectItem>
                            <SelectItem value="urgent">Urgente</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </>
                  ) : (
                    <>
                      {template.subject && (
                        <div>
                          <Label className="text-sm font-medium">Asunto:</Label>
                          <p className="mt-1 text-sm">{template.subject}</p>
                        </div>
                      )}
                      
                      <div>
                        <Label className="text-sm font-medium">Mensaje:</Label>
                        <p className="mt-1 text-sm whitespace-pre-wrap">{template.message_body}</p>
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>
            ))}
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
};

export default ReminderTemplates;
