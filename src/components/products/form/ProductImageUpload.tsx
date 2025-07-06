
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { useFileUpload } from '@/hooks/useFileUpload';
import { X, Upload, Link } from 'lucide-react';

interface ProductImageUploadProps {
  imageUrl: string;
  onImageChange: (url: string) => void;
}

export const ProductImageUpload: React.FC<ProductImageUploadProps> = ({
  imageUrl,
  onImageChange,
}) => {
  const { toast } = useToast();
  const { uploadFile, uploading } = useFileUpload();
  const [uploadMethod, setUploadMethod] = useState<'pc' | 'url'>('pc');
  const [tempImageUrl, setTempImageUrl] = useState('');

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const uploadedUrl = await uploadFile(file, 'products');
    if (uploadedUrl) {
      onImageChange(uploadedUrl);
    }
  };

  const handleUrlSubmit = () => {
    if (tempImageUrl) {
      onImageChange(tempImageUrl);
      toast({
        title: "URL añadida",
        description: "La URL de la imagen se ha añadida correctamente",
      });
    }
  };

  const handleRemoveImage = () => {
    onImageChange('');
    setTempImageUrl('');
  };

  return (
    <div className="space-y-4">
      <Label>Imagen del Producto</Label>
      
      <div className="flex gap-2">
        <Button
          type="button"
          variant={uploadMethod === 'pc' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setUploadMethod('pc')}
          className="flex items-center gap-2"
        >
          <Upload className="h-4 w-4" />
          Subir desde PC
        </Button>
        <Button
          type="button"
          variant={uploadMethod === 'url' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setUploadMethod('url')}
          className="flex items-center gap-2"
        >
          <Link className="h-4 w-4" />
          URL de imagen
        </Button>
      </div>

      {uploadMethod === 'pc' && (
        <div className="space-y-2">
          <div className="border-2 border-dashed border-border rounded-lg p-4">
            <input
              type="file"
              accept="image/*"
              onChange={handleFileUpload}
              className="w-full"
              disabled={uploading}
            />
            {uploading && (
              <p className="text-sm text-muted-foreground mt-2">
                Subiendo imagen...
              </p>
            )}
          </div>
        </div>
      )}

      {uploadMethod === 'url' && (
        <div className="space-y-2">
          <div className="flex gap-2">
            <Input
              placeholder="https://ejemplo.com/imagen.jpg"
              value={tempImageUrl}
              onChange={(e) => setTempImageUrl(e.target.value)}
              className="flex-1"
            />
            <Button
              type="button"
              onClick={handleUrlSubmit}
              size="sm"
              disabled={!tempImageUrl}
            >
              Añadir
            </Button>
          </div>
        </div>
      )}

      {imageUrl && (
        <div className="space-y-2">
          <Label>Vista previa:</Label>
          <div className="relative w-32 h-32 border rounded-lg overflow-hidden">
            <img
              src={imageUrl}
              alt="Vista previa del producto"
              className="w-full h-full object-cover"
              onError={() => {
                toast({
                  title: "Error",
                  description: "No se pudo cargar la imagen",
                  variant: "destructive",
                });
              }}
            />
            <Button
              type="button"
              variant="destructive"
              size="sm"
              className="absolute top-1 right-1 h-6 w-6 p-0"
              onClick={handleRemoveImage}
            >
              <X className="h-3 w-3" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};
