
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

    // Validaciones básicas
    if (!operation || !productIds || !Array.isArray(productIds)) {
      throw new Error('Invalid request: operation and productIds are required');
    }

    if (productIds.length === 0) {
      throw new Error('No products selected');
    }

    // Reducir límite a 100 productos por operación para mayor estabilidad
    if (productIds.length > 100) {
      throw new Error('Cannot process more than 100 products at once. Please split into smaller batches.');
    }

    console.log(`🔄 Starting bulk ${operation} operation for ${productIds.length} products`);
    console.log(`📋 Product IDs:`, productIds.slice(0, 5), productIds.length > 5 ? `... and ${productIds.length - 5} more` : '');

    // Procesar de 5 en 5 para evitar sobrecarga y mejorar control de errores
    const INDIVIDUAL_BATCH_SIZE = 5;
    const batches = [];
    for (let i = 0; i < productIds.length; i += INDIVIDUAL_BATCH_SIZE) {
      batches.push(productIds.slice(i, i + INDIVIDUAL_BATCH_SIZE));
    }

    console.log(`📦 Processing ${batches.length} micro-batches of up to ${INDIVIDUAL_BATCH_SIZE} products each`);

    let totalAffectedRows = 0;
    const allResults = [];
    let batchIndex = 0;

    for (const batch of batches) {
      batchIndex++;
      console.log(`🔄 Processing micro-batch ${batchIndex}/${batches.length} with ${batch.length} products`);

      // Procesar cada producto individualmente para evitar problemas con .in()
      for (const productId of batch) {
        try {
          let result;
          let affectedRows = 0;

          switch (operation) {
            case 'delete':
              console.log(`🗑️ Deleting product: ${productId}`);
              const { data: deletedData, error: deleteError } = await supabaseClient
                .from('products')
                .delete()
                .eq('id', productId)
                .select('id, name');

              if (deleteError) {
                console.error(`❌ Delete error for product ${productId}:`, deleteError);
                throw deleteError;
              }

              result = deletedData;
              affectedRows = deletedData?.length || 0;
              break;

            case 'activate':
              console.log(`👁️ Activating product: ${productId}`);
              const { data: activateData, error: activateError } = await supabaseClient
                .from('products')
                .update({ is_available: true })
                .eq('id', productId)
                .select('id, name');

              if (activateError) {
                console.error(`❌ Activate error for product ${productId}:`, activateError);
                throw activateError;
              }

              result = activateData;
              affectedRows = activateData?.length || 0;
              break;

            case 'deactivate':
              console.log(`🚫 Deactivating product: ${productId}`);
              const { data: deactivateData, error: deactivateError } = await supabaseClient
                .from('products')
                .update({ is_available: false })
                .eq('id', productId)
                .select('id, name');

              if (deactivateError) {
                console.error(`❌ Deactivate error for product ${productId}:`, deactivateError);
                throw deactivateError;
              }

              result = deactivateData;
              affectedRows = deactivateData?.length || 0;
              break;

            default:
              throw new Error(`Invalid operation: ${operation}`);
          }

          totalAffectedRows += affectedRows;
          if (result && result.length > 0) {
            allResults.push(...result);
          }

          console.log(`✅ Successfully processed product ${productId}`);

        } catch (productError) {
          console.error(`💥 Error processing product ${productId}:`, productError);
          // Continuar con el siguiente producto en lugar de fallar completamente
          console.log(`⚠️ Skipping product ${productId} due to error, continuing with remaining products`);
        }

        // Pequeña pausa entre productos para evitar sobrecarga
        await new Promise(resolve => setTimeout(resolve, 50));
      }

      // Pausa entre micro-lotes
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    console.log(`🎉 Bulk ${operation} operation completed`);
    console.log(`📊 Total processed: ${totalAffectedRows} products across ${batches.length} micro-batches`);

    return new Response(
      JSON.stringify({
        success: true,
        operation,
        affectedRows: totalAffectedRows,
        totalBatches: batches.length,
        batchSize: INDIVIDUAL_BATCH_SIZE,
        data: allResults
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
