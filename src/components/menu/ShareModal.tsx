import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Copy, Facebook, Twitter, Instagram, MessageCircle, Check, Upload, RotateCcw, Save } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useFileUpload } from '@/hooks/useFileUpload';
import { supabase } from '@/integrations/supabase/client';

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  restaurantInfo?: {
    business_name: string;
    id: string;
  };
}

const ShareModal = ({ isOpen, onClose, restaurantInfo }: ShareModalProps) => {
  const [copied, setCopied] = useState(false);
  const [customMessage, setCustomMessage] = useState('');
  const [customImageUrl, setCustomImageUrl] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();
  const { uploadFile, uploading } = useFileUpload();
  
  // Generar la URL del menú público con slug del restaurante
  const baseUrl = window.location.origin;
  const restaurantSlug = restaurantInfo?.business_name ? 
    restaurantInfo.business_name
      .toLowerCase()
      .replace(/[áàäâ]/g, 'a')
      .replace(/[éèëê]/g, 'e')
      .replace(/[íìïî]/g, 'i')
      .replace(/[óòöô]/g, 'o')
      .replace(/[úùüû]/g, 'u')
      .replace(/[ñ]/g, 'n')
      .replace(/[ç]/g, 'c')
      .replace(/[^\w\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim() : '';
  
  const menuUrl = restaurantSlug ? `${baseUrl}/menu/${restaurantSlug}` : `${baseUrl}/menu`;
  const defaultShareText = `¡Echa un vistazo al delicioso menú de ${restaurantInfo?.business_name || 'este restaurante'}!`;
  const shareText = customMessage || defaultShareText;
  
  // Load custom share content when modal opens
  useEffect(() => {
    if (isOpen && restaurantInfo?.id) {
      loadCustomShareContent();
    }
  }, [isOpen, restaurantInfo?.id]);

  const loadCustomShareContent = async () => {
    if (!restaurantInfo?.id) return;
    
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('business_info')
        .select('custom_share_message, custom_share_image_url')
        .eq('id', restaurantInfo.id)
        .single();

      if (error) throw error;

      setCustomMessage(data?.custom_share_message || '');
      setCustomImageUrl(data?.custom_share_image_url || '');
    } catch (error) {
      console.error('Error loading custom share content:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const saveCustomContent = async () => {
    if (!restaurantInfo?.id) return;

    setIsSaving(true);
    try {
      const { error } = await supabase
        .from('business_info')
        .update({
          custom_share_message: customMessage || null,
          custom_share_image_url: customImageUrl || null
        })
        .eq('id', restaurantInfo.id);

      if (error) throw error;

      toast({
        title: "¡Guardado!",
        description: "Tu personalización se ha guardado correctamente",
      });
    } catch (error) {
      console.error('Error saving custom content:', error);
      toast({
        title: "Error",
        description: "No se pudo guardar la personalización",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const resetToDefault = async () => {
    if (!restaurantInfo?.id) return;

    setIsSaving(true);
    try {
      const { error } = await supabase
        .from('business_info')
        .update({
          custom_share_message: null,
          custom_share_image_url: null
        })
        .eq('id', restaurantInfo.id);

      if (error) throw error;

      setCustomMessage('');
      setCustomImageUrl('');

      toast({
        title: "Restablecido",
        description: "Se ha vuelto al contenido predeterminado",
      });
    } catch (error) {
      console.error('Error resetting content:', error);
      toast({
        title: "Error",
        description: "No se pudo restablecer el contenido",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const uploadedUrl = await uploadFile(file, 'share-images');
      if (uploadedUrl) {
        setCustomImageUrl(uploadedUrl);
        toast({
          title: "Imagen subida",
          description: "La imagen se ha subido correctamente",
        });
      }
    } catch (error) {
      console.error('Error uploading image:', error);
    }
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      toast({
        title: "¡Copiado!",
        description: "El enlace ha sido copiado al portapapeles",
      });
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudo copiar el enlace",
        variant: "destructive",
      });
    }
  };

  const shareOnSocial = (platform: string) => {
    const encodedText = encodeURIComponent(shareText);
    const encodedUrl = encodeURIComponent(menuUrl);
    
    let shareUrl = '';
    
    switch (platform) {
      case 'facebook':
        shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`;
        break;
      case 'twitter':
        shareUrl = `https://twitter.com/intent/tweet?text=${encodedText}&url=${encodedUrl}`;
        break;
      case 'whatsapp':
        shareUrl = `https://wa.me/?text=${encodedText} ${encodedUrl}`;
        break;
      case 'instagram':
        // Instagram doesn't support direct URL sharing, so we copy the link
        copyToClipboard(menuUrl);
        toast({
          title: "Enlace copiado",
          description: "Pega el enlace en tu historia o publicación de Instagram",
        });
        return;
    }
    
    if (shareUrl) {
      window.open(shareUrl, '_blank', 'width=600,height=400');
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Compartir Menú</DialogTitle>
          <DialogDescription>
            Comparte nuestro menú con tus amigos y familiares
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Personalización */}
          <div className="space-y-4 p-4 border rounded-lg bg-muted/30">
            <div className="flex items-center justify-between">
              <Label className="text-base font-medium">Personalizar contenido</Label>
              <div className="flex space-x-2">
                <Button 
                  size="sm" 
                  onClick={saveCustomContent}
                  disabled={isSaving || isLoading}
                >
                  <Save className="h-4 w-4 mr-1" />
                  Guardar
                </Button>
                <Button 
                  size="sm" 
                  variant="outline" 
                  onClick={resetToDefault}
                  disabled={isSaving || isLoading}
                >
                  <RotateCcw className="h-4 w-4 mr-1" />
                  Resetear
                </Button>
              </div>
            </div>
            
            <div className="space-y-3">
              <div>
                <Label htmlFor="custom-message">Mensaje personalizado</Label>
                <Textarea
                  id="custom-message"
                  placeholder={defaultShareText}
                  value={customMessage}
                  onChange={(e) => setCustomMessage(e.target.value)}
                  className="mt-1"
                  rows={3}
                  maxLength={280}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  {customMessage.length}/280 caracteres
                </p>
              </div>
              
              <div>
                <Label htmlFor="custom-image">Imagen personalizada</Label>
                <div className="mt-1">
                  <div className="flex items-center space-x-2">
                    <Input
                      type="file"
                      id="custom-image"
                      accept="image/*"
                      onChange={handleImageUpload}
                      disabled={uploading}
                      className="flex-1"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => document.getElementById('custom-image')?.click()}
                      disabled={uploading}
                    >
                      <Upload className="h-4 w-4" />
                    </Button>
                  </div>
                  {customImageUrl && (
                    <div className="mt-2">
                      <img 
                        src={customImageUrl} 
                        alt="Preview" 
                        className="w-20 h-20 object-cover rounded border"
                      />
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Copy Link */}
          <div className="space-y-2">
            <Label>Enlace del menú</Label>
            <div className="flex space-x-2">
              <Input 
                value={menuUrl} 
                readOnly 
                className="flex-1"
              />
              <Button 
                variant="outline" 
                onClick={() => copyToClipboard(menuUrl)}
                className="px-3"
              >
                {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              </Button>
            </div>
          </div>

          {/* Social Media Buttons */}
          <div className="space-y-3">
            <Label>Compartir en redes sociales</Label>
            
            <div className="grid grid-cols-2 gap-3">
              <Button 
                variant="outline" 
                onClick={() => shareOnSocial('facebook')}
                className="flex items-center space-x-2"
              >
                <Facebook className="h-4 w-4 text-blue-600" />
                <span>Facebook</span>
              </Button>
              
              <Button 
                variant="outline" 
                onClick={() => shareOnSocial('twitter')}
                className="flex items-center space-x-2"
              >
                <Twitter className="h-4 w-4 text-blue-400" />
                <span>Twitter</span>
              </Button>
              
              <Button 
                variant="outline" 
                onClick={() => shareOnSocial('whatsapp')}
                className="flex items-center space-x-2"
              >
                <MessageCircle className="h-4 w-4 text-green-600" />
                <span>WhatsApp</span>
              </Button>
              
              <Button 
                variant="outline" 
                onClick={() => shareOnSocial('instagram')}
                className="flex items-center space-x-2"
              >
                <Instagram className="h-4 w-4 text-pink-600" />
                <span>Instagram</span>
              </Button>
            </div>
          </div>

          {/* Share Text Preview */}
          <div className="space-y-2">
            <Label>Vista previa del texto</Label>
            <div className="flex space-x-2">
              <Input 
                value={shareText} 
                readOnly 
                className="flex-1"
              />
              <Button 
                variant="outline" 
                onClick={() => copyToClipboard(shareText)}
                className="px-3"
              >
                <Copy className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ShareModal;
