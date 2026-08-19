// @ts-nocheck
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

serve(async (req: Request) => {
  try {
    const { society_id, period = "monthly" } = await req.json().catch(() => ({}));

    // Must use SUPABASE_SERVICE_ROLE_KEY to bypass RLS for multi-society queries
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    // Fetch primary society
    const targetSocietyId = society_id || "11111111-1111-1111-1111-111111111111";
    const { data: society } = await supabase
      .from("societies")
      .select("*")
      .eq("id", targetSocietyId)
      .single();

    const score = Number(society?.health_score) || 78;
    const band =
      score >= 85 ? "excellent" : score >= 70 ? "good" : score >= 55 ? "fair" : score >= 40 ? "needs_attention" : "critical";

    // Fetch all societies for rankings
    const { data: societiesList } = await supabase
      .from("societies")
      .select("id, name, health_score")
      .order("health_score", { ascending: false });

    // Count species observations & pickup stats
    const { count: speciesCount } = await supabase
      .from("species_observations")
      .select("*", { count: "exact", head: true });

    const { count: pickupsCount } = await supabase
      .from("pickup_requests")
      .select("*", { count: "exact", head: true });

    const responsePayload = {
      score,
      delta: 6,
      rank: "#3 of 18",
      species: speciesCount || 1420,
      co2_tonnes: 62,
      band,
      factors: [
        {
          id: "biodiversity",
          name: "AI Biodiversity Index",
          weight: "20%",
          score: 72,
          delta: 4,
          iconName: "leaf",
          iconBg: "#2A3D2A",
          iconColor: "#4CAF72",
          detail: "Evaluates native species observations logged with AI verification across territory.",
          subMetricALabel: "Species Observations",
          subMetricAVal: `${speciesCount || 142} logged`,
          subMetricBLabel: "Taxon Richness",
          subMetricBVal: "4 categories",
        },
        {
          id: "diversion",
          name: "Waste Diversion Rate",
          weight: "20%",
          score: 68,
          delta: 2,
          iconName: "recycle",
          iconBg: "#2A3D2A",
          iconColor: "#4CAF72",
          detail: "Measures dry waste diverted from landfills via locker collection.",
          subMetricALabel: "Diverted Material",
          subMetricAVal: "840 kg",
          subMetricBLabel: "Locker Velocity",
          subMetricBVal: `${pickupsCount || 12} pickups`,
        },
        {
          id: "carbon",
          name: "Carbon Impact (CO₂e)",
          weight: "20%",
          score: 80,
          delta: 6,
          iconName: "molecule-co2",
          iconBg: "#2A3D2A",
          iconColor: "#4CAF72",
          detail: "Calculates avoided greenhouse gas emissions from organic composting.",
          subMetricALabel: "CO₂ Abated",
          subMetricAVal: "62 tonnes",
          subMetricBLabel: "Equiv. Trees Planted",
          subMetricBVal: "1,420 trees",
        },
        {
          id: "ewaste",
          name: "E-Waste Safe Diversion",
          weight: "15%",
          score: 58,
          delta: -1,
          iconName: "chip",
          iconBg: "#2E2510",
          iconColor: "#E8A920",
          detail: "Tracks hazardous e-waste items turned in to authorized drop-off centers.",
          subMetricALabel: "E-Waste Collected",
          subMetricAVal: "45 items",
          subMetricBLabel: "Toxic Metal Safe",
          subMetricBVal: "12.4 kg",
        },
        {
          id: "institutional",
          name: "Institutional Compliance",
          weight: "15%",
          score: 50,
          delta: 0,
          iconName: "office-building",
          iconBg: "rgba(232,84,84,0.15)",
          iconColor: "#E85454",
          detail: "Measures participation across society administration, hostels, and cafeteria units.",
          subMetricALabel: "Onboarded Units",
          subMetricAVal: "4 of 8 units",
          subMetricBLabel: "Audit Status",
          subMetricBVal: "Pending Review",
        },
        {
          id: "participation",
          name: "Clan & Community",
          weight: "10%",
          score: 85,
          delta: 8,
          iconName: "account-group",
          iconBg: "#2A3D2A",
          iconColor: "#4CAF72",
          detail: "Active member count contributing to Clean Raids and weekly eco-challenges.",
          subMetricALabel: "Active Clan Members",
          subMetricAVal: "184 users",
          subMetricBLabel: "Clean Raids Done",
          subMetricBVal: "14 events",
        },
      ],
      trend: period === "quarterly" ? [55, 60, 68, 74, 76, 82] : [62, 65, 68, 72, 70, 78],
      cityAvg: 71,
      best: { label: "Baner-Balewadi best", score: 90 },
      insights: {
        positives: [
          "Diversion rate held flat rather than declining during peak monsoon season.",
          "Avian species observations increased by 18% month-over-month.",
          "Clean Raid attendance reached all-time high with 48 volunteer hours.",
        ],
        negatives: [
          "E-waste recycling drop-off frequency dipped 4% below target.",
          "Cafeteria organic waste segregation compliance requires administrative audit.",
        ],
      },
      societies: (societiesList || []).map((s) => ({
        id: s.id,
        name: s.name,
        health_score: Number(s.health_score) || 75,
        participation: "68%",
        kg_diverted: "810 kg",
      })),
      institutions: [
        { name: "SGU Main Cafeteria", status: "Onboarded" },
        { name: "Hostel Block A & B", status: "Onboarded" },
        { name: "Science Research Annex", status: "Pending" },
        { name: "Sports Complex & Field", status: "Not started" },
      ],
    };

    return new Response(JSON.stringify(responsePayload), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(
      JSON.stringify({ error: "Failed to fetch dashboard data: " + err.message }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
});
