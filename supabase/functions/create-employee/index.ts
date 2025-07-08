import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Get the service role key for admin operations
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    if (!supabaseServiceKey) {
      console.error('❌ [CREATE-EMPLOYEE] Service role key not configured');
      throw new Error('Service role key not configured');
    }

    // Create admin client
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      supabaseServiceKey,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    );

    // Parse and validate request body
    const { employeeData, currentAdminId } = await req.json();
    
    if (!employeeData || !currentAdminId) {
      console.error('❌ [CREATE-EMPLOYEE] Missing required data');
      throw new Error('Missing required data: employeeData and currentAdminId');
    }

    // Strict validation of required fields
    if (!employeeData.email || typeof employeeData.email !== 'string') {
      throw new Error('Email es requerido y debe ser válido');
    }
    
    if (!employeeData.full_name || typeof employeeData.full_name !== 'string' || employeeData.full_name.trim().length === 0) {
      throw new Error('Nombre completo es requerido');
    }
    
    if (!employeeData.password || typeof employeeData.password !== 'string') {
      throw new Error('Contraseña es requerida');
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(employeeData.email)) {
      throw new Error('Formato de email inválido');
    }

    // Sanitize and prepare data
    const email = employeeData.email.toLowerCase().trim();
    const fullName = employeeData.full_name.trim();
    const password = employeeData.password;
    
    console.log('🔧 [CREATE-EMPLOYEE] Creating employee:', email);

    // Validate password length (minimum 6 characters as requested)
    if (password.length < 6) {
      throw new Error('La contraseña debe tener al menos 6 caracteres');
    }

    // Check if email already exists in auth.users
    console.log('🔍 [CREATE-EMPLOYEE] Checking if email already exists...');
    const { data: existingUser, error: checkError } = await supabaseAdmin.auth.admin.listUsers({
      page: 1,
      perPage: 1000 // Check in batches if needed
    });

    if (checkError) {
      console.error('❌ [CREATE-EMPLOYEE] Error checking existing users:', checkError);
      throw new Error('Error verificando usuarios existentes');
    }

    const emailExists = existingUser?.users?.some(user => 
      user.email?.toLowerCase() === email.toLowerCase()
    );

    if (emailExists) {
      console.error('❌ [CREATE-EMPLOYEE] Email already exists:', email);
      throw new Error('Ya existe una cuenta con este correo');
    }

    // Create user in auth.users with metadata
    const { data: authUser, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: employeeData.email.toLowerCase().trim(),
      password: password,
      email_confirm: true, // Auto-confirm email for admin-created users
      user_metadata: {
        full_name: employeeData.full_name,
        created_by_admin: currentAdminId,
        employee_creation: 'true',
        phone_mobile: employeeData.phone_mobile || null,
        phone_landline: employeeData.phone_landline || null,
        address: employeeData.address || null,
        is_active: employeeData.is_active
      }
    });

    if (authError) {
      console.error('❌ [CREATE-EMPLOYEE] Auth error:', authError);
      
      // Handle specific error cases
      if (authError.message?.includes('already registered') || authError.message?.includes('email')) {
        throw new Error('Ya existe una cuenta con este correo.');
      }
      
      throw new Error(`Error creating user: ${authError.message}`);
    }

    if (!authUser.user) {
      throw new Error('Failed to create user - no user data returned');
    }

    console.log('✅ [CREATE-EMPLOYEE] User created in auth.users:', authUser.user.id);

    // Manually insert profile (removing dependency on trigger for better control)
    console.log('📝 [CREATE-EMPLOYEE] Creating profile manually...');
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .insert({
        id: authUser.user.id,
        email: email,
        full_name: fullName,
        role: 'empleado',
        created_by: currentAdminId,
        is_active: employeeData.is_active ?? true,
        phone_mobile: employeeData.phone_mobile || null,
        phone_landline: employeeData.phone_landline || null,
        address: employeeData.address || null
      })
      .select()
      .single();

    if (profileError) {
      console.error('❌ [CREATE-EMPLOYEE] Profile creation failed:', profileError);
      
      // ROLLBACK: Delete the user from auth.users since profile creation failed
      console.log('🔄 [CREATE-EMPLOYEE] Rolling back user creation...');
      try {
        const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(authUser.user.id);
        if (deleteError) {
          console.error('❌ [CREATE-EMPLOYEE] Failed to rollback user creation:', deleteError);
        } else {
          console.log('✅ [CREATE-EMPLOYEE] User rollback successful');
        }
      } catch (rollbackError) {
        console.error('❌ [CREATE-EMPLOYEE] Error during rollback:', rollbackError);
      }
      
      throw new Error('Error creando perfil de empleado. Usuario eliminado.');
    }

    console.log('✅ [CREATE-EMPLOYEE] Employee created successfully:', profile.id);

    // Log activity
    try {
      await supabaseAdmin.rpc('log_employee_activity', {
        p_employee_id: currentAdminId,
        p_activity_type: 'employee_created',
        p_description: `Empleado creado: ${employeeData.full_name}`,
        p_entity_type: 'employee',
        p_entity_id: profile.id,
        p_metadata: { 
          employee_email: employeeData.email, 
          employee_role: 'empleado',
          temp_password_generated: true
        }
      });
    } catch (logError) {
      console.warn('⚠️ [CREATE-EMPLOYEE] Failed to log activity:', logError);
      // Don't fail the whole operation for logging issues
    }

    return new Response(JSON.stringify({
      success: true,
      data: profile,
      message: 'Empleado creado exitosamente',
      password: password // Return password so admin can share with employee
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('❌ [CREATE-EMPLOYEE] Error:', error);
    
    return new Response(JSON.stringify({
      success: false,
      error: error.message || 'Error inesperado al crear empleado'
    }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});