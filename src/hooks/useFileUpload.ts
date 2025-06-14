
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export const useFileUpload = () => {
  const [uploading, setUploading] = useState(false);
  const { toast } = useToast();

  const uploadFile = async (file: File, folder: string = 'business'): Promise<string | null> => {
    try {
      setUploading(true);
      
      // Generate a unique filename
      const fileExt = file.name.split('.').pop();
      const fileName = `${folder}/${Date.now()}.${fileExt}`;
      
      const { data, error } = await supabase.storage
        .from('uploads')
        .upload(fileName, file);

      if (error) {
        console.error('Error uploading file:', error);
        toast({
          title: "Error",
          description: "No se pudo subir el archivo",
          variant: "destructive",
        });
        return null;
      }

      // Get the public URL
      const { data: { publicUrl } } = supabase.storage
        .from('uploads')
        .getPublicUrl(data.path);

      toast({
        title: "Archivo subido",
        description: "El archivo se subió correctamente",
      });

      return publicUrl;
    } catch (error) {
      console.error('Error uploading file:', error);
      toast({
        title: "Error",
        description: "No se pudo subir el archivo",
        variant: "destructive",
      });
      return null;
    } finally {
      setUploading(false);
    }
  };

  return { uploadFile, uploading };
};
