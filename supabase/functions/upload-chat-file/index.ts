import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-file-name, x-file-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '', // Use service role key for server-side upload
      {
        auth: {
          persistSession: false,
        },
      }
    );

    // Verify JWT token to get user ID
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response('Unauthorized: Missing Authorization header', { status: 401, headers: corsHeaders });
    }
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser(token);

    if (userError || !user) {
      console.error('Auth error:', userError?.message);
      return new Response('Unauthorized: Invalid token', { status: 401, headers: corsHeaders });
    }

    const userId = user.id;
    const fileName = req.headers.get('x-file-name');
    const fileType = req.headers.get('x-file-type');

    if (!fileName || !fileType) {
      return new Response('Bad Request: Missing x-file-name or x-file-type headers', { status: 400, headers: corsHeaders });
    }

    const fileExtension = fileName.split('.').pop();
    const filePath = `${userId}/${crypto.randomUUID()}.${fileExtension}`; // Store in user-specific folder

    const fileBlob = await req.blob();

    const { data, error } = await supabaseClient.storage
      .from('chat-files')
      .upload(filePath, fileBlob, {
        contentType: fileType,
        upsert: false,
      });

    if (error) {
      console.error('Supabase Storage upload error:', error);
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Get public URL
    const { data: publicUrlData } = supabaseClient.storage
      .from('chat-files')
      .getPublicUrl(filePath);

    return new Response(JSON.stringify({ fileUrl: publicUrlData.publicUrl }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Edge Function error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});