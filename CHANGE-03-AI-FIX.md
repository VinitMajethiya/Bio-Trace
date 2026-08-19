# CHANGE-03-AI-FIX.md — Fix AI Scanning (Replace Hugging Face)

## The problem

The current Hugging Face integration gives wrong answers for both:
- **Species identification** — likely because the current model was trained on a narrow dataset or the label set doesn't match Indian biodiversity.
- **Waste classification** — likely because the current model conflates categories (e.g., glass vs. clear plastic) or returns generic labels that don't match the app's category system.

The fix is different for each scanner — they have different problems and different free solutions.

---

## Species Scanner — Replace with iNaturalist Vision API

### Why iNaturalist

- Free, no API key, no rate-limit registration needed for reasonable usage.
- Trained on 200M+ community observations worldwide, with strong India coverage.
- Covers all four taxon groups needed by CHANGE-02 (birds, wildlife, plants, insects) in a single endpoint — no need for separate models per taxon.
- Returns confidence scores, common names, scientific names, taxon group, and Wikipedia summary URLs.
- Accepts lat/lng to bias results to regionally plausible species — critical for accuracy in India.

### API call (from a Supabase Edge Function or directly from the RN app)

```ts
// lib/inaturalist.ts
export async function identifySpecies(
  imageBase64: string,
  lat: number,
  lng: number,
  taxonGroup: TaxonGroup
): Promise<SpeciesResult[]> {
  const formData = new FormData();
  formData.append("image", {
    uri: `data:image/jpeg;base64,${imageBase64}`,
    type: "image/jpeg",
    name: "photo.jpg",
  });
  formData.append("lat", lat.toString());
  formData.append("lng", lng.toString());
  formData.append("locale", "en");

  const response = await fetch(
    "https://api.inaturalist.org/v1/computervision/score_image",
    { method: "POST", body: formData }
  );
  const data = await response.json();

  // Filter to chosen taxon group and return top 3
  return data.results
    .filter((r: any) =>
      taxonGroupMatches(r.taxon.iconic_taxon_name, taxonGroup)
    )
    .slice(0, 3)
    .map((r: any) => ({
      commonName: r.taxon.preferred_common_name ?? r.taxon.name,
      scientificName: r.taxon.name,
      confidence: r.combined_score,
      taxonGroup: r.taxon.iconic_taxon_name,
      wikipediaUrl: r.taxon.wikipedia_url,
    }));
}
```

### UI — show top 3 suggestions, let user confirm

Instead of auto-confirming the top hit (which the Hugging Face version presumably did), show the top 3 results as tappable cards. The user taps the correct one. This matches how iNaturalist's own app works and is honest about confidence — species ID is hard, even for ML.

### Minimum confidence threshold

If the top result has `combined_score < 0.3`, show a "We're not sure — try a clearer photo" state instead of guessing. This avoids confidently wrong answers.

---

## Waste Scanner — Replace with Gemini Vision API (free tier)

### Why not iNaturalist for waste

iNaturalist is a biodiversity tool — its CV model doesn't know what "PET plastic" or "e-waste" is.

### Why Gemini Vision (Google AI Studio free tier)

- Google AI Studio free tier gives access to `gemini-1.5-flash` with **no billing account required** for a generous daily request quota — more than sufficient for a demo.
- Gemini's vision capability handles waste classification reliably because it's a general-purpose model, not a narrow classifier.
- Zero model maintenance — no Hugging Face model weights, no dataset mismatch.
- The prompt can be tightly constrained to return only one of the app's exact category names, eliminating label mismatch entirely.

### API call (via Supabase Edge Function — keeps the API key server-side and out of the app bundle)

```ts
// supabase/functions/classify-waste/index.ts
import { serve } from "https://deno.land/std/http/server.ts";

const WASTE_CATEGORIES = ["Paper", "Plastic", "Metal", "Glass", "E-Waste", "Textiles", "Organic"];

serve(async (req) => {
  const { imageBase64 } = await req.json();

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${Deno.env.get("GEMINI_API_KEY")}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{
          parts: [
            {
              inline_data: {
                mime_type: "image/jpeg",
                data: imageBase64,
              },
            },
            {
              text: `You are a waste classification assistant. Look at this image and classify the waste item.
You MUST respond with ONLY a JSON object in this exact format, no other text:
{"category": "<one of: ${WASTE_CATEGORIES.join(", ")}>", "confidence": <0.0 to 1.0>, "reasoning": "<one sentence>"}
If the image does not clearly show waste, respond: {"category": null, "confidence": 0, "reasoning": "No waste item visible."}`
            }
          ]
        }],
        generationConfig: { temperature: 0 }
      }),
    }
  );

  const data = await response.json();
  const text = data.candidates[0].content.parts[0].text;
  return new Response(text, { headers: { "Content-Type": "application/json" } });
});
```

Store the `GEMINI_API_KEY` as an EAS/Supabase secret — never in the app bundle or `.env` committed to git.

### Get the free Gemini API key

1. Go to `aistudio.google.com`
2. Sign in with a Google account
3. "Get API Key" → "Create API key" → free tier, no billing required
4. Store it: `eas secret:create GEMINI_API_KEY <your-key>` and also as a Supabase Edge Function secret

---

## Hugging Face — removal

- Delete the existing HF inference call from both the species and waste scan flows.
- Delete the HF API key from all secrets/env files.
- Add a comment in the code wherever HF was called: `// Replaced: Hugging Face inference removed (low accuracy). See CHANGE-03-AI-FIX.md.`

---

## Testing checklist

- [ ] Species scanner returns iNaturalist top-3 results with confidence scores
- [ ] Species scanner shows "not sure" state when confidence < 0.3
- [ ] Results are filtered to the correct taxon group
- [ ] Waste scanner Edge Function is deployed and callable from the app
- [ ] Waste scanner returns exactly one of the 7 valid category strings
- [ ] Waste scanner shows a fallback if no waste is visible in the image
- [ ] No Hugging Face calls remain anywhere in the codebase (`grep -r "huggingface" .` should return nothing)
