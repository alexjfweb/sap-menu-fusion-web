
import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { supabase } from '@/integrations/supabase/client';
import { ArrowLeft, Building, Save, Upload, Globe, Facebook, Instagram, Twitter } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Tables } from '@/integrations/supabase/types';

type BusinessInfo = Tables<'business_info'>;

interface BusinessInfoManagementProps {
  onBack?: () => void;
}

const BusinessInfoManagement = ({ onBack }: BusinessInfoManagementProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState<Partial<BusinessInfo>>({});
  const { toast } = useToast();

  const { data: businessInfo, isLoading, refetch } = useQuery({
    queryKey: ['business-info'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('business_info')
        .select('*')
        .single();
      
      if (error) {
        console.error('Error fetching business info:', error);
        throw error;
      }
      
      return data;
    },
  });

  const handleEdit = () => {
    setFormData(businessInfo || {});
    setIsEditing(true);
  };

  const handleCancel = () => {
    setFormData({});
    setIsEditing(false);
  };

  const handleSave = async () => {
    try {
      const { error } = await supabase
        .from('business_info')
        .update({
          ...formData,
          updated_at: new Date().toISOString(),
        })
        .eq('id', businessInfo?.id);

      if (error) throw error;

      toast({
        title: "Información actualizada",
        description: "La información del negocio se actualizó correctamente",
      });

      setIsEditing(false);
      refetch();
    } catch (error) {
      console.error('Error updating business info:', error);
      toast({
        title: "Error",
        description: "No se pudo actualizar la información del negocio",
        variant: "destructive",
      });
    }
  };

  const handleInputChange = (field: keyof BusinessInfo, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-4">
              {onBack && (
                <Button variant="ghost" size="sm" onClick={onBack}>
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Volver al Panel
                </Button>
              )}
              <div className="flex items-center space-x-2">
                <Building className="h-8 w-8 text-primary" />
                <h1 className="text-2xl font-bold">Información del Negocio</h1>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              {!isEditing ? (
                <Button onClick={handleEdit} className="flex items-center gap-2">
                  Editar Información
                </Button>
              ) : (
                <>
                  <Button variant="outline" onClick={handleCancel}>
                    Cancelar
                  </Button>
                  <Button onClick={handleSave} className="flex items-center gap-2">
                    <Save className="h-4 w-4" />
                    Guardar Cambios
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto space-y-6">
          {/* Información Básica */}
          <Card>
            <CardHeader>
              <CardTitle>Información Básica</CardTitle>
              <CardDescription>
                Datos principales de tu restaurante
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="business_name">Nombre Comercial *</Label>
                  <Input
                    id="business_name"
                    value={isEditing ? formData.business_name || '' : businessInfo?.business_name || ''}
                    onChange={(e) => handleInputChange('business_name', e.target.value)}
                    disabled={!isEditing}
                    placeholder="Nombre de tu restaurante"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="tax_id">NIT</Label>
                  <Input
                    id="tax_id"
                    value={isEditing ? formData.tax_id || '' : businessInfo?.tax_id || ''}
                    onChange={(e) => handleInputChange('tax_id', e.target.value)}
                    disabled={!isEditing}
                    placeholder="Número de identificación tributaria"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Teléfono</Label>
                  <Input
                    id="phone"
                    value={isEditing ? formData.phone || '' : businessInfo?.phone || ''}
                    onChange={(e) => handleInputChange('phone', e.target.value)}
                    disabled={!isEditing}
                    placeholder="+57 300 000 0000"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Correo Electrónico</Label>
                  <Input
                    id="email"
                    type="email"
                    value={isEditing ? formData.email || '' : businessInfo?.email || ''}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    disabled={!isEditing}
                    placeholder="info@mirestaurante.com"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="address">Dirección</Label>
                <Input
                  id="address"
                  value={isEditing ? formData.address || '' : businessInfo?.address || ''}
                  onChange={(e) => handleInputChange('address', e.target.value)}
                  disabled={!isEditing}
                  placeholder="Calle 123 #45-67, Ciudad, País"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Descripción</Label>
                <Textarea
                  id="description"
                  value={isEditing ? formData.description || '' : businessInfo?.description || ''}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  disabled={!isEditing}
                  placeholder="Descripción de tu restaurante"
                  rows={3}
                />
              </div>
            </CardContent>
          </Card>

          {/* Imágenes */}
          <Card>
            <CardHeader>
              <CardTitle>Imágenes del Negocio</CardTitle>
              <CardDescription>
                Logo y imagen de portada para tu restaurante
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="logo_url">URL del Logo</Label>
                  <div className="flex space-x-2">
                    <Input
                      id="logo_url"
                      value={isEditing ? formData.logo_url || '' : businessInfo?.logo_url || ''}
                      onChange={(e) => handleInputChange('logo_url', e.target.value)}
                      disabled={!isEditing}
                      placeholder="https://ejemplo.com/logo.png"
                    />
                    <Button variant="outline" size="sm" disabled={!isEditing}>
                      <Upload className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="cover_image_url">URL de Imagen de Portada</Label>
                  <div className="flex space-x-2">
                    <Input
                      id="cover_image_url"
                      value={isEditing ? formData.cover_image_url || '' : businessInfo?.cover_image_url || ''}
                      onChange={(e) => handleInputChange('cover_image_url', e.target.value)}
                      disabled={!isEditing}
                      placeholder="https://ejemplo.com/portada.jpg"
                    />
                    <Button variant="outline" size="sm" disabled={!isEditing}>
                      <Upload className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Redes Sociales y Enlaces */}
          <Card>
            <CardHeader>
              <CardTitle>Redes Sociales y Enlaces</CardTitle>
              <CardDescription>
                Conecta tus redes sociales y sitio web
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="website_url" className="flex items-center gap-2">
                    <Globe className="h-4 w-4" />
                    Sitio Web
                  </Label>
                  <Input
                    id="website_url"
                    value={isEditing ? formData.website_url || '' : businessInfo?.website_url || ''}
                    onChange={(e) => handleInputChange('website_url', e.target.value)}
                    disabled={!isEditing}
                    placeholder="https://mirestaurante.com"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="public_menu_url">URL del Menú Público</Label>
                  <Input
                    id="public_menu_url"
                    value={isEditing ? formData.public_menu_url || '' : businessInfo?.public_menu_url || ''}
                    onChange={(e) => handleInputChange('public_menu_url', e.target.value)}
                    disabled={!isEditing}
                    placeholder="https://menu.mirestaurante.com"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="facebook_url" className="flex items-center gap-2">
                    <Facebook className="h-4 w-4" />
                    Facebook
                  </Label>
                  <Input
                    id="facebook_url"
                    value={isEditing ? formData.facebook_url || '' : businessInfo?.facebook_url || ''}
                    onChange={(e) => handleInputChange('facebook_url', e.target.value)}
                    disabled={!isEditing}
                    placeholder="https://facebook.com/mirestaurante"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="instagram_url" className="flex items-center gap-2">
                    <Instagram className="h-4 w-4" />
                    Instagram
                  </Label>
                  <Input
                    id="instagram_url"
                    value={isEditing ? formData.instagram_url || '' : businessInfo?.instagram_url || ''}
                    onChange={(e) => handleInputChange('instagram_url', e.target.value)}
                    disabled={!isEditing}
                    placeholder="https://instagram.com/mirestaurante"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="twitter_url" className="flex items-center gap-2">
                    <Twitter className="h-4 w-4" />
                    Twitter
                  </Label>
                  <Input
                    id="twitter_url"
                    value={isEditing ? formData.twitter_url || '' : businessInfo?.twitter_url || ''}
                    onChange={(e) => handleInputChange('twitter_url', e.target.value)}
                    disabled={!isEditing}
                    placeholder="https://twitter.com/mirestaurante"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default BusinessInfoManagement;
