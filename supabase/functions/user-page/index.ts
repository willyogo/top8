import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2.57.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

const DOMAIN = "https://farcaster-top-8-frie-c060.bolt.host";

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

    const title = `${profile.display_name}'s Top 8 on Farcaster`;
    const description = `Check out ${profile.display_name}'s Top 8 friends on Farcaster! MySpace for Farcaster.`;
    const imageUrl = `${supabaseUrl}/functions/v1/og-image?username=${encodeURIComponent(username)}`;
    const pageUrl = `${DOMAIN}/${username}`;

    const html = generateHTML({
      title,
      description,
      imageUrl,
      pageUrl,
      username,
    });

    return new Response(html, {
      status: 200,
      headers: {
        ...corsHeaders,
        "Content-Type": "text/html; charset=utf-8",
        "Cache-Control": "public, max-age=300, s-maxage=600",
      },
    });
  } catch (err) {
    console.error("Error generating user page:", err);
    return new Response("Internal server error", {
      status: 500,
      headers: corsHeaders,
    });
  }
});

function generateHTML(params: {
  title: string;
  description: string;
  imageUrl: string;
  pageUrl: string;
  username: string;
}): string {
  const miniAppMeta = {
    version: "next",
    imageUrl: params.imageUrl,
    button: {
      title: "View Top 8",
      action: {
        type: "launch_frame"
      }
    }
  };

  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <link rel="icon" type="image/png" href="${DOMAIN}/top8_icon_text_1024.png" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${escapeHtml(params.title)}</title>

    <!-- Open Graph / Social Media Meta Tags -->
    <meta property="og:title" content="${escapeHtml(params.title)}" />
    <meta property="og:description" content="${escapeHtml(params.description)}" />
    <meta property="og:type" content="website" />
    <meta property="og:url" content="${escapeHtml(params.pageUrl)}" />
    <meta property="og:image" content="${escapeHtml(params.imageUrl)}" />

    <!-- Twitter Card Meta Tags -->
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content="${escapeHtml(params.title)}" />
    <meta name="twitter:description" content="${escapeHtml(params.description)}" />
    <meta name="twitter:image" content="${escapeHtml(params.imageUrl)}" />

    <!-- Farcaster Frame Meta Tags -->
    <meta property="fc:frame" content="vNext" />
    <meta property="fc:frame:image" content="${escapeHtml(params.imageUrl)}" />

    <!-- Farcaster Mini App Meta Tags -->
    <meta name="fc:miniapp" content='${JSON.stringify(miniAppMeta)}' />
    
    <!-- Redirect to main app for real users -->
    <meta http-equiv="refresh" content="0; url=${DOMAIN}/${escapeHtml(params.username)}" />
    <script>window.location.href = "${DOMAIN}/${escapeHtml(params.username)}";</script>
  </head>
  <body>
    <p>Redirecting to ${escapeHtml(params.username)}'s Top 8...</p>
    <p>If you're not redirected, <a href="${DOMAIN}/${escapeHtml(params.username)}">click here</a>.</p>
  </body>
</html>`;
}

function escapeHtml(unsafe: string): string {
  return unsafe
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}
