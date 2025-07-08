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

    // Parse request body
    const { employeeData, currentAdminId } = await req.json();
    
    if (!employeeData || !currentAdminId) {
      throw new Error('Missing required data: employeeData and currentAdminId');
    }

    console.log('🔧 [CREATE-EMPLOYEE] Creating employee:', employeeData.email);

    // Generate a temporary password for the employee
    const tempPassword = `Temp${Math.random().toString(36).slice(-8)}!`;

    // Create user in auth.users with metadata
    const { data: authUser, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: employeeData.email.toLowerCase().trim(),
      password: tempPassword,
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

    // The trigger will automatically create the profile, so we just need to fetch it
    // Wait a moment for the trigger to execute
    await new Promise(resolve => setTimeout(resolve, 500));

    // Fetch the created profile to return to frontend
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('*')
      .eq('id', authUser.user.id)
      .single();

    if (profileError) {
      console.error('❌ [CREATE-EMPLOYEE] Profile fetch error:', profileError);
      throw new Error('Employee created but failed to fetch profile data');
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
      tempPassword // Return temp password so admin can share with employee
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