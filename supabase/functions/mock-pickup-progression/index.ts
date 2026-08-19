// @ts-nocheck
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

serve(async (req: Request) => {
  try {
    const { pickupId } = await req.json();

    if (!pickupId) {
      return new Response(
        JSON.stringify({ error: "pickupId is required" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // Must use SUPABASE_SERVICE_ROLE_KEY to bypass RLS for background updates
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    // Step 1: Assign collector -> status: 'assigned'
    const { data: pickup, error: fetchErr } = await supabase
      .from("pickup_requests")
      .select("*")
      .eq("id", pickupId)
      .single();

    if (fetchErr || !pickup) {
      return new Response(
        JSON.stringify({ error: "Pickup request not found: " + fetchErr?.message }),
        { status: 444, headers: { "Content-Type": "application/json" } }
      );
    }

    // Advance status to assigned
    await supabase
      .from("pickup_requests")
      .update({
        status: "assigned",
        assigned_at: new Date().toISOString(),
        mock_eta_seconds: 30,
      })
      .eq("id", pickupId);

    // Short delay for demo simulation
    await new Promise((resolve) => setTimeout(resolve, 2000));

    // Advance status to in_transit
    await supabase
      .from("pickup_requests")
      .update({
        status: "in_transit",
        mock_eta_seconds: 10,
      })
      .eq("id", pickupId);

    await new Promise((resolve) => setTimeout(resolve, 2000));

    // Advance status to collected & trigger payout
    const finalWeight = pickup.total_weight_kg || 4.5;
    const finalValue = Math.round(finalWeight * 15);

    await supabase
      .from("pickup_requests")
      .update({
        status: "collected",
        collected_at: new Date().toISOString(),
        actual_weight_kg: finalWeight,
        actual_value_inr: finalValue,
        payout_status: "completed",
        mock_eta_seconds: 0,
      })
      .eq("id", pickupId);

    // Award GreenPoints to user
    const earnedPoints = Math.round(finalWeight * 25);
    await supabase.from("greenpoints_ledger").insert({
      user_id: pickup.user_id,
      source: "waste_pickup",
      amount: earnedPoints,
      zone_tier: "home",
    });

    return new Response(
      JSON.stringify({ success: true, message: "Mock pickup progression completed successfully." }),
      { headers: { "Content-Type": "application/json" } }
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ error: err.message }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
});
