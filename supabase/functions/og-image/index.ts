import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2.57.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const url = new URL(req.url);
    const username = url.searchParams.get("username");

    if (!username) {
      return new Response("Missing username parameter", {
        status: 400,
        headers: corsHeaders,
      });
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Fetch user profile
    const { data: profile } = await supabase
      .from("profiles")
      .select("fid, username, display_name, pfp_url")
      .eq("username", username)
      .maybeSingle();

    if (!profile) {
      return new Response("User not found", {
        status: 404,
        headers: corsHeaders,
      });
    }

    // Fetch top 8 entries
    const { data: top8Data } = await supabase
      .from("top8")
      .select(`
        entries:top8_entries(
          slot,
          target:profiles!top8_entries_target_fid_fkey(
            username,
            display_name,
            pfp_url
          )
        )
      `)
      .eq("fid", profile.fid)
      .maybeSingle();

    const entries = top8Data?.entries || [];

    // Generate SVG image
    const svg = generateOGImage(profile, entries);

    return new Response(svg, {
      status: 200,
      headers: {
        ...corsHeaders,
        "Content-Type": "image/svg+xml",
        "Cache-Control": "public, max-age=3600",
      },
    });
  } catch (err) {
    console.error("Error generating OG image:", err);
    return new Response("Internal server error", {
      status: 500,
      headers: corsHeaders,
    });
  }
});

function generateOGImage(
  profile: any,
  entries: any[]
): string {
  const width = 1200;
  const height = 630;
  const cardSize = 140;
  const gap = 20;
  const startX = 100;
  const startY = 180;

  // Sort entries by slot
  const sortedEntries = [...entries].sort((a, b) => a.slot - b.slot);

  // Generate cards
  const cards = sortedEntries.slice(0, 8).map((entry, index) => {
    const col = index % 4;
    const row = Math.floor(index / 4);
    const x = startX + col * (cardSize + gap);
    const y = startY + row * (cardSize + gap);

    const displayName = entry.target?.display_name || "Unknown";
    const username = entry.target?.username || "";
    const pfpUrl = entry.target?.pfp_url || "";

    return `
      <g>
        <rect x="${x}" y="${y}" width="${cardSize}" height="${cardSize}" fill="#fff" stroke="#ccc" stroke-width="2"/>
        ${pfpUrl ? `<image x="${x + 10}" y="${y + 25}" width="${cardSize - 20}" height="${cardSize - 20}" href="${pfpUrl}" preserveAspectRatio="xMidYMid slice"/>` : `<rect x="${x + 10}" y="${y + 25}" width="${cardSize - 20}" height="${cardSize - 20}" fill="#f0f0f0"/>`}
        <text x="${x + cardSize / 2}" y="${y + cardSize - 30}" text-anchor="middle" font-family="Arial, sans-serif" font-size="12" font-weight="bold" fill="#0066cc">${escapeXml(truncate(displayName, 10))}</text>
        <text x="${x + cardSize / 2}" y="${y + cardSize - 15}" text-anchor="middle" font-family="Arial, sans-serif" font-size="10" fill="#666">@${escapeXml(truncate(username, 10))}</text>
        <circle cx="${x + 15}" cy="${y + 15}" r="10" fill="#ff9933"/>
        <text x="${x + 15}" y="${y + 19}" text-anchor="middle" font-family="Arial, sans-serif" font-size="12" font-weight="bold" fill="#fff">${entry.slot}</text>
      </g>
    `;
  }).join("");

  return `
    <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="headerGradient" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" style="stop-color:#ffcc66;stop-opacity:1" />
          <stop offset="100%" style="stop-color:#ff9933;stop-opacity:1" />
        </linearGradient>
      </defs>
      
      <!-- Background -->
      <rect width="${width}" height="${height}" fill="#f8f8f8"/>
      
      <!-- Header -->
      <rect width="${width}" height="120" fill="url(#headerGradient)"/>
      <text x="${width / 2}" y="70" text-anchor="middle" font-family="Arial, sans-serif" font-size="48" font-weight="bold" fill="#fff">${escapeXml(profile.display_name)}'s Top 8</text>
      
      <!-- Cards -->
      ${cards}
      
      <!-- Footer -->
      <text x="${width / 2}" y="${height - 40}" text-anchor="middle" font-family="Arial, sans-serif" font-size="24" fill="#666">MySpace for Farcaster</text>
    </svg>
  `;
}

function truncate(str: string, maxLen: number): string {
  return str.length > maxLen ? str.substring(0, maxLen - 1) + "…" : str;
}

function escapeXml(unsafe: string): string {
  return unsafe.replace(/[<>&'"]/g, (c) => {
    switch (c) {
      case "<": return "&lt;";
      case ">": return "&gt;";
      case "&": return "&amp;";
      case "'": return "&apos;";
      case '"': return "&quot;";
      default: return c;
    }
  });
}
