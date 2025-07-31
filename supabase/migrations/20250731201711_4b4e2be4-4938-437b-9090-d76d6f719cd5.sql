-- Mejorar la función get_business_by_name para manejar slugs correctamente
CREATE OR REPLACE FUNCTION public.get_business_by_name(restaurant_name text)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  business_uuid UUID;
  normalized_input text;
  normalized_business_name text;
BEGIN
  -- Normalizar el input para comparación (convertir slug a formato comparable)
  normalized_input := LOWER(TRIM(restaurant_name));
  
  -- Buscar por nombre exacto primero
  SELECT id INTO business_uuid
  FROM public.business_info 
  WHERE LOWER(TRIM(business_name)) = normalized_input
  AND business_name != 'Mi Restaurante'  -- Excluir plantillas por defecto
  LIMIT 1;
  
  -- Si no se encuentra por nombre exacto, buscar por slug
  IF business_uuid IS NULL THEN
    -- Convertir slug a texto searchable (reemplazar guiones por espacios y capitalizar)
    normalized_input := REPLACE(restaurant_name, '-', ' ');
    
    -- Buscar comparando business_name convertido a slug
    SELECT id INTO business_uuid
    FROM public.business_info 
    WHERE LOWER(
      REPLACE(
        REPLACE(
          REPLACE(
            REPLACE(
              REPLACE(
                REPLACE(
                  REPLACE(
                    REPLACE(
                      REPLACE(TRIM(business_name), 'á', 'a'),
                      'é', 'e'
                    ), 'í', 'i'
                  ), 'ó', 'o'
                ), 'ú', 'u'
              ), 'ñ', 'n'
            ), 'ç', 'c'
          ), ' ', '-'
        ), '--', '-'
      )
    ) = LOWER(TRIM(restaurant_name))
    AND business_name != 'Mi Restaurante'  -- Excluir plantillas por defecto
    LIMIT 1;
  END IF;
  
  RETURN business_uuid;
END;
$function$