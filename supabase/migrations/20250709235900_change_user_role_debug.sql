-- Eliminar la función anterior si existe
DROP FUNCTION IF EXISTS change_user_role(uuid, text);

-- Crear función de depuración que recibe el id del superadmin explícitamente
CREATE OR REPLACE FUNCTION change_user_role(superadmin_id uuid, target_id uuid, new_role text)
RETURNS TABLE(user_id uuid, user_role text, updated integer) AS $$
DECLARE
  current_user_role text;
  current_user_email text;
  updated_count integer;
BEGIN
  -- Obtener el rol y email del superadmin explícito
  SELECT role, email INTO current_user_role, current_user_email FROM profiles WHERE id = superadmin_id;

  -- Registrar en bitácora para depuración
  INSERT INTO role_change_attempts (user_id, email, role, attempted_action)
  VALUES (superadmin_id, current_user_email, current_user_role, CONCAT('Intento de cambio de rol a ', new_role, ' para usuario ', target_id, ' (depuración explícita)'));

  IF current_user_role = 'superadmin' THEN
    UPDATE profiles SET role = new_role, updated_at = now() WHERE id = target_id;
    GET DIAGNOSTICS updated_count = ROW_COUNT;
    RETURN QUERY SELECT superadmin_id, current_user_role, updated_count;
  ELSE
    RAISE EXCEPTION 'Solo los superadmins pueden cambiar roles.';
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Dar permisos de ejecución
GRANT EXECUTE ON FUNCTION change_user_role(uuid, uuid, text) TO authenticated; 