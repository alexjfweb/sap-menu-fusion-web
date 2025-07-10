-- Tabla de bitácora de intentos de cambio de rol
CREATE TABLE IF NOT EXISTS role_change_attempts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  email text NOT NULL,
  role text NOT NULL,
  attempted_action text NOT NULL,
  attempted_at timestamptz NOT NULL DEFAULT now()
);

-- Función segura para cambiar el rol solo por superadmin
CREATE OR REPLACE FUNCTION change_user_role(target_id uuid, new_role text)
RETURNS void AS $$
DECLARE
  current_user_role text;
  current_user_email text;
BEGIN
  -- Obtener el rol y email del usuario actual
  SELECT role, email INTO current_user_role, current_user_email FROM profiles WHERE id = auth.uid();

  IF current_user_role = 'superadmin' THEN
    -- Desactivar trigger de roles solo para esta sesión
    PERFORM pg_catalog.set_config('session_replication_role', 'replica', true);
    -- Cambiar el rol
    UPDATE profiles SET role = new_role, updated_at = now() WHERE id = target_id;
    -- Reactivar trigger
    PERFORM pg_catalog.set_config('session_replication_role', 'origin', true);
  ELSE
    -- Registrar intento fallido en bitácora
    INSERT INTO role_change_attempts (user_id, email, role, attempted_action)
    VALUES (auth.uid(), current_user_email, current_user_role, CONCAT('Intento de cambio de rol a ', new_role, ' para usuario ', target_id));
    RAISE EXCEPTION 'Solo los superadmins pueden cambiar roles.';
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Permitir ejecución solo a usuarios autenticados
REVOKE ALL ON FUNCTION change_user_role(uuid, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION change_user_role(uuid, text) TO authenticated; 