
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Copy, Facebook, Twitter, Instagram, MessageCircle, Check } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const ShareModal = ({ isOpen, onClose }: ShareModalProps) => {
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();
  
  const currentUrl = window.location.href;
  const menuUrl = `${window.location.origin}/menu`;
  const shareText = "¡Echa un vistazo a este delicioso menú del restaurante!";

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

          {/* Share Text */}
          <div className="space-y-2">
            <Label>Texto para compartir</Label>
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
