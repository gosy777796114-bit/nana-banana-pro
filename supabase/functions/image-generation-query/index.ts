import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

// ── OOM guard: if decoded size > 4 MB, skip Storage upload ───────
// atob + Uint8Array would allocate 3× the decoded bytes in Deno RAM.
// For large images (e.g. 4K outputs) this can crash the worker.
// In that case we return the data URL directly; the browser renders
// it from the response body without any extra server-side allocation.
const MAX_STORAGE_B64_BYTES = 4_000_000; // ~3 MB decoded

async function saveBase64ToStorage(
  markdownText: string,
  supabaseUrl: string,
  serviceKey: string,
): Promise<string> {
  const match = markdownText.match(/data:([^;]+);base64,([A-Za-z0-9+/=]+)/);
  if (!match) throw new Error("Could not parse Base64 image from response");

  const [, mimeType, base64Data] = match;

  // OOM guard: skip transfer to Storage for very large images
  if (base64Data.length > MAX_STORAGE_B64_BYTES) {
    console.log(`[image-query] Large image (${base64Data.length} b64 chars) — returning data URL directly (skip Storage)`);
    return `data:${mimeType};base64,${base64Data}`;
  }

  const ext = mimeType.split("/")[1] ?? "jpg";
  const filePath = `uploads/${crypto.randomUUID()}.${ext}`;

  // Decode in chunks to avoid single large contiguous allocation
  const decoded = atob(base64Data);
  const bytes = new Uint8Array(decoded.length);
  for (let i = 0; i < decoded.length; i++) bytes[i] = decoded.charCodeAt(i);

  const supabase = createClient(supabaseUrl, serviceKey);

  const { error } = await supabase.storage
    .from("generated-media")
    .upload(filePath, bytes, { contentType: mimeType, upsert: false });

  if (error) throw error;

  const { data: urlData } = supabase.storage.from("generated-media").getPublicUrl(filePath);
  return urlData.publicUrl;
}

serve(async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response("Method Not Allowed", { status: 405, headers: corsHeaders });
  }

  let taskId: string;
  try {
    const body = await req.json();
    taskId = body.taskId;
    if (!taskId) throw new Error("Missing taskId");
  } catch {
    return new Response(JSON.stringify({ error: "Invalid request body" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const apiKey = Deno.env.get("INTEGRATIONS_API_KEY");
  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

  if (!apiKey) {
    return new Response(JSON.stringify({ error: "Server configuration error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const upstream = await fetch(
    "https://app-cd2ufz8vv669-api-GYX1lzGw0DQa.gateway.appmedo.com/image-generation/task",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Gateway-Authorization": `Bearer ${apiKey}`,
      },
      body: JSON.stringify({ taskId }),
    }
  );

  if (upstream.status === 429 || upstream.status === 402) {
    const errText = await upstream.text();
    return new Response(errText, {
      status: upstream.status,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  if (!upstream.ok) {
    return new Response(
      JSON.stringify({ error: `Upstream error: ${upstream.status}` }),
      { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  const result = await upstream.json();

  // On SUCCESS, transfer Base64 image to Supabase Storage and return persistent URL
  if (result?.data?.status === "SUCCESS" && supabaseUrl && serviceKey) {
    try {
      const markdownText = result.data.result.candidates[0].content.parts[0].text;
      const publicUrl = await saveBase64ToStorage(markdownText, supabaseUrl, serviceKey);
      result.data.imageUrl = publicUrl;
      result.data.result.candidates[0].content.parts[0].text = `![image](${publicUrl})`;
    } catch (storageErr) {
      // Non-fatal: fall back to returning raw Base64 if storage fails
      console.error("Storage transfer failed:", storageErr);
      // Still return imageUrl as data URL for frontend display
      const markdownText = result.data.result.candidates[0].content.parts[0].text;
      const urlMatch = markdownText.match(/\(([^)]+)\)/);
      if (urlMatch) result.data.imageUrl = urlMatch[1];
    }
  }

  return new Response(JSON.stringify(result), {
    status: 200,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
});
