
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export const useFileUpload = () => {
  const [uploading, setUploading] = useState(false);
  const { toast } = useToast();

  const validateFile = (file: File): { isValid: boolean; error?: string } => {
    // Validar tamaño máximo (5MB)
    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      return { isValid: false, error: "El archivo no puede ser mayor a 5MB" };
    }

    // Validar tipos de archivo permitidos
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];
    if (!allowedTypes.includes(file.type)) {
      return { isValid: false, error: "Solo se permiten archivos JPG, PNG, WebP y GIF" };
    }

    return { isValid: true };
  };

  const uploadFile = async (file: File, folder: string = 'business'): Promise<string | null> => {
    try {
      setUploading(true);
      
      // Validar archivo antes de subir
      const validation = validateFile(file);
      if (!validation.isValid) {
        toast({
          title: "Error de validación",
          description: validation.error,
          variant: "destructive",
        });
        return null;
      }
      
      // Generate a unique filename
      const fileExt = file.name.split('.').pop()?.toLowerCase();
      const fileName = `${folder}/${Date.now()}.${fileExt}`;
      
      // Intentar subida con retry automático
      let retries = 3;
      let lastError: any = null;
      
      while (retries > 0) {
        try {
          const { data, error } = await supabase.storage
            .from('uploads')
            .upload(fileName, file, {
              cacheControl: '3600',
              upsert: false
            });

          if (error) {
            lastError = error;
            console.error('Error uploading file:', error);
            
            // Si es error 502, reintentar
            if (error.message?.includes('502') || error.message?.includes('Bad Gateway')) {
              retries--;
              if (retries > 0) {
                console.log(`Reintentando subida... intentos restantes: ${retries}`);
                await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1 second
                continue;
              }
            }
            break;
          }

          // Get the public URL
          const { data: { publicUrl } } = supabase.storage
            .from('uploads')
            .getPublicUrl(data.path);

          toast({
            title: "Archivo subido",
            description: "La imagen se subió correctamente",
          });

          return publicUrl;
        } catch (err) {
          lastError = err;
          retries--;
          if (retries > 0) {
            await new Promise(resolve => setTimeout(resolve, 1000));
          }
        }
      }

      // Si llegamos aquí, todos los intentos fallaron
      const errorMsg = lastError?.message?.includes('502') || lastError?.message?.includes('Bad Gateway')
        ? "El servidor de almacenamiento está temporalmente no disponible. Intenta usar una URL de imagen en su lugar."
        : "No se pudo subir el archivo. Verifica tu conexión e intenta nuevamente.";
      
      toast({
        title: "Error de subida",
        description: errorMsg,
        variant: "destructive",
      });
      return null;

    } catch (error) {
      console.error('Error uploading file:', error);
      toast({
        title: "Error",
        description: "Error inesperado al subir el archivo",
        variant: "destructive",
      });
      return null;
    } finally {
      setUploading(false);
    }
  };

  return { uploadFile, uploading };
};
