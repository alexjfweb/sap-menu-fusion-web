
-- Agregar columna created_by a la tabla profiles para establecer relación creador-usuario
ALTER TABLE public.profiles 
ADD COLUMN created_by UUID REFERENCES public.profiles(id);

-- Actualizar usuarios existentes para que tengan una relación con quien los creó
-- Los usuarios con rol 'admin' se asignan como creados por sí mismos
UPDATE public.profiles 
SET created_by = id 
WHERE role = 'admin';

-- Los usuarios con rol 'empleado' se asignan al primer admin disponible como temporal
-- (esto es solo para datos existentes, en adelante se asignará correctamente)
UPDATE public.profiles 
SET created_by = (
  SELECT id FROM public.profiles 
  WHERE role = 'admin' 
  LIMIT 1
) 
WHERE role = 'empleado' AND created_by IS NULL;

-- Los superadmins se asignan como creados por sí mismos
UPDATE public.profiles 
SET created_by = id 
WHERE role = 'superadmin';
