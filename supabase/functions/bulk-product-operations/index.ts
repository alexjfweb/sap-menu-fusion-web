
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

    // Aumentar límite a 500 productos por operación
    if (productIds.length > 500) {
      throw new Error('Cannot process more than 500 products at once. Please split into smaller batches.');
    }

    console.log(`🔄 Starting bulk ${operation} operation for ${productIds.length} products`);
    console.log(`📋 Product IDs sample:`, productIds.slice(0, 5), productIds.length > 5 ? `... and ${productIds.length - 5} more` : '');

    // Procesar en lotes de 50 productos para evitar límites de URL
    const BATCH_SIZE = 50;
    const batches = [];
    for (let i = 0; i < productIds.length; i += BATCH_SIZE) {
      batches.push(productIds.slice(i, i + BATCH_SIZE));
    }

    console.log(`📦 Processing ${batches.length} batches of up to ${BATCH_SIZE} products each`);

    let totalAffectedRows = 0;
    const allResults = [];
    let batchIndex = 0;

    for (const batch of batches) {
      batchIndex++;
      console.log(`🔄 Processing batch ${batchIndex}/${batches.length} with ${batch.length} products`);

      let batchResult;
      let batchAffectedRows = 0;

      try {
        switch (operation) {
          case 'delete':
            console.log(`🗑️ Executing batch delete for ${batch.length} products...`);
            const { data: deletedData, error: deleteError } = await supabaseClient
              .from('products')
              .delete()
              .in('id', batch)
              .select('id, name');

            if (deleteError) {
              console.error(`❌ Delete error in batch ${batchIndex}:`, deleteError);
              throw deleteError;
            }

            batchResult = deletedData;
            batchAffectedRows = deletedData?.length || 0;
            console.log(`✅ Batch ${batchIndex}: Successfully deleted ${batchAffectedRows} products`);
            break;

          case 'activate':
            console.log(`👁️ Executing batch activate for ${batch.length} products...`);
            const { data: activateData, error: activateError } = await supabaseClient
              .from('products')
              .update({ is_available: true })
              .in('id', batch)
              .select('id, name');

            if (activateError) {
              console.error(`❌ Activate error in batch ${batchIndex}:`, activateError);
              throw activateError;
            }

            batchResult = activateData;
            batchAffectedRows = activateData?.length || 0;
            console.log(`✅ Batch ${batchIndex}: Successfully activated ${batchAffectedRows} products`);
            break;

          case 'deactivate':
            console.log(`🚫 Executing batch deactivate for ${batch.length} products...`);
            const { data: deactivateData, error: deactivateError } = await supabaseClient
              .from('products')
              .update({ is_available: false })
              .in('id', batch)
              .select('id, name');

            if (deactivateError) {
              console.error(`❌ Deactivate error in batch ${batchIndex}:`, deactivateError);
              throw deactivateError;
            }

            batchResult = deactivateData;
            batchAffectedRows = deactivateData?.length || 0;
            console.log(`✅ Batch ${batchIndex}: Successfully deactivated ${batchAffectedRows} products`);
            break;

          default:
            throw new Error(`Invalid operation: ${operation}`);
        }

        totalAffectedRows += batchAffectedRows;
        if (batchResult) {
          allResults.push(...batchResult);
        }

      } catch (batchError) {
        console.error(`💥 Error in batch ${batchIndex}:`, batchError);
        // En caso de error en un lote, aún reportamos los lotes exitosos anteriores
        throw new Error(`Batch ${batchIndex} failed: ${batchError.message}. ${totalAffectedRows} products were processed successfully before this error.`);
      }
    }

    console.log(`🎉 Bulk ${operation} operation completed successfully`);
    console.log(`📊 Total processed: ${totalAffectedRows} products across ${batches.length} batches`);

    return new Response(
      JSON.stringify({
        success: true,
        operation,
        affectedRows: totalAffectedRows,
        totalBatches: batches.length,
        batchSize: BATCH_SIZE,
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
