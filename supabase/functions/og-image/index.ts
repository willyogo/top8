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

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

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

    const { data: entries } = await supabase
      .from("top8_entries")
      .select(`
        slot,
        target:profiles!top8_entries_target_fid_fkey(
          username,
          display_name,
          pfp_url
        )
      `)
      .eq("owner_fid", profile.fid)
      .order("slot", { ascending: true });

    const entriesWithBase64 = await Promise.all(
      (entries || []).map(async (entry) => {
        if (entry.target?.pfp_url) {
          try {
            const base64Image = await fetchImageAsBase64(entry.target.pfp_url);
            return {
              ...entry,
              target: {
                ...entry.target,
                pfp_base64: base64Image,
              },
            };
          } catch (err) {
            console.error(`Failed to fetch image for ${entry.target.username}:`, err);
            return entry;
          }
        }
        return entry;
      })
    );

    const svg = generateOGImage(profile, entriesWithBase64);

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

async function fetchImageAsBase64(imageUrl: string): Promise<string> {
  try {
    const response = await fetch(imageUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; Top8Bot/1.0)'
      }
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch image: ${response.status}`);
    }

    const arrayBuffer = await response.arrayBuffer();
    const uint8Array = new Uint8Array(arrayBuffer);

    let binary = '';
    const chunkSize = 8192;
    for (let i = 0; i < uint8Array.length; i += chunkSize) {
      const chunk = uint8Array.slice(i, i + chunkSize);
      binary += String.fromCharCode.apply(null, Array.from(chunk));
    }

    const base64 = btoa(binary);
    const contentType = response.headers.get('content-type') || 'image/jpeg';
    return `data:${contentType};base64,${base64}`;
  } catch (err) {
    console.error(`Error fetching image ${imageUrl}:`, err);
    throw err;
  }
}

function generateOGImage(
  profile: any,
  entries: any[]
): string {
  const width = 900;
  const height = 600;
  const cardSize = 180;
  const gap = 20;
  const startX = 30;
  const startY = 140;

  const sortedEntries = [...entries].sort((a, b) => a.slot - b.slot);

  const cards = sortedEntries.slice(0, 8).map((entry, index) => {
    const col = index % 4;
    const row = Math.floor(index / 4);
    const x = startX + col * (cardSize + gap);
    const y = startY + row * (cardSize + gap);

    const displayName = entry.target?.display_name || "Unknown";
    const username = entry.target?.username || "";
    const pfpBase64 = entry.target?.pfp_base64 || "";

    return `
      <g>
        <rect x="${x}" y="${y}" width="${cardSize}" height="${cardSize}" fill="#fff" stroke="#ccc" stroke-width="2"/>
        ${pfpBase64 ? `<image x="${x + 15}" y="${y + 35}" width="${cardSize - 30}" height="${cardSize - 30}" href="${pfpBase64}" preserveAspectRatio="xMidYMid slice"/>` : `<rect x="${x + 15}" y="${y + 35}" width="${cardSize - 30}" height="${cardSize - 30}" fill="#f0f0f0"/>`}
        <text x="${x + cardSize / 2}" y="${y + cardSize - 40}" text-anchor="middle" font-family="Arial, sans-serif" font-size="14" font-weight="bold" fill="#0066cc">${escapeXml(truncate(displayName, 12))}</text>
        <text x="${x + cardSize / 2}" y="${y + cardSize - 20}" text-anchor="middle" font-family="Arial, sans-serif" font-size="12" fill="#666">@${escapeXml(truncate(username, 12))}</text>
        <circle cx="${x + 20}" cy="${y + 20}" r="14" fill="#ff9933"/>
        <text x="${x + 20}" y="${y + 26}" text-anchor="middle" font-family="Arial, sans-serif" font-size="14" font-weight="bold" fill="#fff">${entry.slot}</text>
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
      <rect width="${width}" height="100" fill="url(#headerGradient)"/>
      <text x="${width / 2}" y="60" text-anchor="middle" font-family="Arial, sans-serif" font-size="40" font-weight="bold" fill="#fff">${escapeXml(profile.display_name)}'s Top 8</text>
      
      <!-- Cards -->
      ${cards}
      
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
