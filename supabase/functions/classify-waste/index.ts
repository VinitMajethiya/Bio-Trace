// @ts-nocheck
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const WASTE_CATEGORIES = ["Paper", "Plastic", "Metal", "Glass", "E-Waste", "Textiles", "Organic"];

/**
 * Category slug normalizer — maps AI display-cased output to DB-authoritative keys.
 */
const SLUG_MAP: Record<string, string> = {
  paper: "paper",
  cardboard: "paper",
  newspaper: "paper",
  plastic: "plastic",
  pet: "plastic",
  metal: "metal",
  aluminum: "metal",
  tin: "metal",
  can: "metal",
  glass: "glass",
  ewaste: "ewaste",
  electronic: "ewaste",
  electronics: "ewaste",
  textiles: "textiles",
  textile: "textiles",
  cloth: "textiles",
  fabric: "textiles",
  organic: "organic",
  food: "organic",
  compost: "organic",
};

function normalizeCategorySlug(raw: string | null): string | null {
  if (!raw || raw.toLowerCase().trim() === "unknown") return null;
  const slug = raw.toLowerCase().replace(/[^a-z0-9]/g, "");
  return SLUG_MAP[slug] || null;
}

serve(async (req: Request) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { imageBase64 } = await req.json();

    if (!imageBase64) {
      return new Response(
        JSON.stringify({ category_key: null, confidence: 0, estimated_weight_kg: 0, reasoning: "No image provided." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const apiKey = Deno.env.get("GEMINI_API_KEY");
    if (!apiKey) {
      return new Response(
        JSON.stringify({ category_key: null, confidence: 0, estimated_weight_kg: 0, reasoning: "GEMINI_API_KEY secret missing." }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Strip any data URI prefix
    const cleanBase64 = imageBase64.replace(/^data:image\/\w+;base64,/, "").trim();

    const promptText = `You are a waste classification and weight estimation assistant for a recycling app.

Look at this image and:
1. Classify the waste item into one of these categories: ${WASTE_CATEGORIES.join(", ")}.
2. If the item is NOT clearly a recyclable waste item, is obscured, or you genuinely cannot identify it, you MUST return category as "unknown". Do NOT guess.
3. Estimate the physical weight of the item in kilograms (kg) based on its visual appearance — consider the object's apparent size, material type, and typical packaging weights. Examples: empty 500ml PET bottle ≈ 0.03 kg, glass sauce bottle ≈ 0.35 kg, aluminium soda can ≈ 0.015 kg, newspaper stack ≈ 0.5 kg, old keyboard ≈ 0.8 kg.

You MUST respond with ONLY a JSON object in this exact format, no other text:
{"category": "<one of: ${WASTE_CATEGORIES.join(", ")}, or unknown>", "confidence": <0.0 to 1.0>, "estimated_weight_kg": <weight in kg as a number>, "item_description": "<brief description of the item>", "reasoning": "<one sentence explaining your classification>"}`;

    // Try gemini-3.5-flash first, then gemini-3.5-flash-lite, then gemini-3.6-flash
    const modelsToTry = ["gemini-3.5-flash", "gemini-3.5-flash-lite", "gemini-3.6-flash"];
    let data = null;

    for (const model of modelsToTry) {
      try {
        const response = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              contents: [
                {
                  parts: [
                    {
                      inline_data: {
                        mime_type: "image/jpeg",
                        data: cleanBase64,
                      },
                    },
                    {
                      text: promptText,
                    },
                  ],
                },
              ],
              generationConfig: { temperature: 0 },
            }),
          }
        );

        const resJson = await response.json();
        if (resJson.candidates?.length) {
          data = resJson;
          break;
        } else {
          console.warn(`Model ${model} response:`, resJson.error?.message || "No candidates");
        }
      } catch (err) {
        console.warn(`Model ${model} fetch failed:`, err);
      }
    }

    if (!data || !data.candidates?.length) {
      return new Response(
        JSON.stringify({ category_key: null, confidence: 0, estimated_weight_kg: 0, reasoning: "AI service unavailable" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const raw = data.candidates[0].content.parts[0].text;
    const clean = raw.replace(/```json|```/gi, "").trim();
    const result = JSON.parse(clean);

    // Normalize category to DB-authoritative slug
    const categoryKey = normalizeCategorySlug(result.category);

    return new Response(
      JSON.stringify({
        category_key: categoryKey, // null if unknown/unmapped
        category_display: result.category, // raw AI output for display
        confidence: result.confidence || 0,
        estimated_weight_kg: result.estimated_weight_kg || 0,
        item_description: result.item_description || "",
        reasoning: result.reasoning || "",
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    return new Response(
      JSON.stringify({
        category_key: null,
        confidence: 0,
        estimated_weight_kg: 0,
        reasoning: "Classification error: " + err.message,
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
