
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface BulkOperationRequest {
  operation: 'delete' | 'activate' | 'deactivate';
  productIds: string[];
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    );

    if (req.method !== 'POST') {
      throw new Error('Only POST method is allowed');
    }

    const { operation, productIds }: BulkOperationRequest = await req.json();

    // Validaciones
    if (!operation || !productIds || !Array.isArray(productIds)) {
      throw new Error('Invalid request: operation and productIds are required');
    }

    if (productIds.length === 0) {
      throw new Error('No products selected');
    }

    if (productIds.length > 100) {
      throw new Error('Cannot process more than 100 products at once');
    }

    console.log(`🔄 Starting bulk ${operation} operation for ${productIds.length} products`);
    console.log(`📋 Product IDs:`, productIds.slice(0, 10), productIds.length > 10 ? `... and ${productIds.length - 10} more` : '');

    let result;
    let affectedRows = 0;

    switch (operation) {
      case 'delete':
        console.log('🗑️ Executing bulk delete...');
        const { data: deletedData, error: deleteError } = await supabaseClient
          .from('products')
          .delete()
          .in('id', productIds)
          .select('id, name');

        if (deleteError) {
          console.error('❌ Delete error:', deleteError);
          throw deleteError;
        }

        result = deletedData;
        affectedRows = deletedData?.length || 0;
        console.log(`✅ Successfully deleted ${affectedRows} products`);
        break;

      case 'activate':
        console.log('👁️ Executing bulk activate...');
        const { data: activateData, error: activateError } = await supabaseClient
          .from('products')
          .update({ is_available: true })
          .in('id', productIds)
          .select('id, name');

        if (activateError) {
          console.error('❌ Activate error:', activateError);
          throw activateError;
        }

        result = activateData;
        affectedRows = activateData?.length || 0;
        console.log(`✅ Successfully activated ${affectedRows} products`);
        break;

      case 'deactivate':
        console.log('🚫 Executing bulk deactivate...');
        const { data: deactivateData, error: deactivateError } = await supabaseClient
          .from('products')
          .update({ is_available: false })
          .in('id', productIds)
          .select('id, name');

        if (deactivateError) {
          console.error('❌ Deactivate error:', deactivateError);
          throw deactivateError;
        }

        result = deactivateData;
        affectedRows = deactivateData?.length || 0;
        console.log(`✅ Successfully deactivated ${affectedRows} products`);
        break;

      default:
        throw new Error(`Invalid operation: ${operation}`);
    }

    console.log(`🎉 Bulk ${operation} operation completed successfully`);

    return new Response(
      JSON.stringify({
        success: true,
        operation,
        affectedRows,
        data: result
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );

  } catch (error) {
    console.error('💥 Bulk operation error:', error);
    
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || 'Unknown error occurred',
        details: error
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    );
  }
});
