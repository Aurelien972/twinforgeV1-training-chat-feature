/**
 * Training Voice Transcribe Edge Function
 * Transcribes audio feedback using OpenAI Whisper API
 */

import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface TranscriptionResponse {
  text: string;
  language?: string;
  duration?: number;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    // Get OpenAI API key from environment
    const openaiApiKey = Deno.env.get("OPENAI_API_KEY");
    if (!openaiApiKey) {
      throw new Error("OpenAI API key not configured");
    }

    // Parse multipart form data
    const formData = await req.formData();
    const audioFile = formData.get("file");
    const model = formData.get("model") || "whisper-1";
    const language = formData.get("language") || "fr";

    if (!audioFile || !(audioFile instanceof File)) {
      throw new Error("No audio file provided");
    }

    console.log("Transcribing audio file", {
      name: audioFile.name,
      type: audioFile.type,
      size: audioFile.size,
      model,
      language,
    });

    // Prepare form data for OpenAI
    const openaiFormData = new FormData();
    openaiFormData.append("file", audioFile);
    openaiFormData.append("model", model as string);
    openaiFormData.append("language", language as string);
    openaiFormData.append("response_format", "verbose_json");

    // Call OpenAI Whisper API
    const startTime = Date.now();
    const response = await fetch("https://api.openai.com/v1/audio/transcriptions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${openaiApiKey}`,
      },
      body: openaiFormData,
    });

    const duration = Date.now() - startTime;

    if (!response.ok) {
      const errorText = await response.text();
      console.error("OpenAI API error", {
        status: response.status,
        error: errorText,
      });
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const result = await response.json();

    console.log("Transcription successful", {
      text: result.text,
      language: result.language,
      duration,
    });

    const transcriptionData: TranscriptionResponse = {
      text: result.text,
      language: result.language,
      duration: result.duration,
    };

    return new Response(
      JSON.stringify({
        success: true,
        data: transcriptionData,
      }),
      {
        status: 200,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );
  } catch (error) {
    console.error("Transcription error", {
      error: error instanceof Error ? error.message : "Unknown error",
      stack: error instanceof Error ? error.stack : undefined,
    });

    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : "Transcription failed",
      }),
      {
        status: 500,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );
  }
});
