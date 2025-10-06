import type { VercelRequest, VercelResponse } from '@vercel/node';

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || 'https://0ec90b57d6e95fcbda19832f.supabase.co';

const CRAWLER_USER_AGENTS = [
  'facebookexternalhit',
  'farcaster',
  'twitterbot',
  'discordbot',
  'telegrambot',
  'slackbot',
  'whatsapp',
  'linkedinbot',
  'redditbot',
  'pinterestbot',
  'bingbot',
  'googlebot',
  'baiduspider',
  'yandexbot',
  'duckduckbot',
  'slurp',
  'ia_archiver',
  'embedly',
  'tumblr',
  'bitlybot',
  'vkshare',
  'outbrain',
  'w3c_validator',
  'mastodon',
  'bluesky',
];

function isCrawler(userAgent: string): boolean {
  const lowerUA = userAgent.toLowerCase();
  return CRAWLER_USER_AGENTS.some(crawler => lowerUA.includes(crawler));
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const { username } = req.query;
  const userAgent = req.headers['user-agent'] || '';

  if (!username || typeof username !== 'string') {
    return res.status(400).send('Invalid username');
  }

  console.log(`[${username}] User-Agent: ${userAgent}, isCrawler: ${isCrawler(userAgent)}`);

  if (isCrawler(userAgent)) {
    try {
      const edgeFunctionUrl = `${SUPABASE_URL}/functions/v1/user-page?username=${encodeURIComponent(username)}`;
      console.log(`[${username}] Fetching from edge function: ${edgeFunctionUrl}`);

      const response = await fetch(edgeFunctionUrl, {
        headers: {
          'User-Agent': 'Vercel-Serverless-Function',
        },
      });

      console.log(`[${username}] Edge function response status: ${response.status}`);

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`[${username}] Edge function error: ${response.status} - ${errorText}`);

        const fallbackHtml = generateFallbackHtml(username);
        res.setHeader('Content-Type', 'text/html; charset=utf-8');
        return res.status(200).send(fallbackHtml);
      }

      const html = await response.text();
      console.log(`[${username}] Successfully fetched dynamic HTML from edge function`);

      res.setHeader('Content-Type', 'text/html; charset=utf-8');
      res.setHeader('Cache-Control', 'public, max-age=300, s-maxage=600');
      return res.status(200).send(html);
    } catch (error) {
      console.error(`[${username}] Error fetching from edge function:`, error);

      const fallbackHtml = generateFallbackHtml(username);
      res.setHeader('Content-Type', 'text/html; charset=utf-8');
      return res.status(200).send(fallbackHtml);
    }
  }

  const indexHtml = generateFallbackHtml(username);
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  return res.status(200).send(indexHtml);
}

function generateFallbackHtml(username: string): string {
  const vercelDomain = 'https://top8-pi.vercel.app';

  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <link rel="icon" type="image/png" href="${vercelDomain}/top8_icon_text_1024.png" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${username}'s Top 8 - Farcaster Top 8</title>

    <!-- Open Graph / Social Media Meta Tags -->
    <meta property="og:title" content="${username}'s Top 8 on Farcaster" />
    <meta property="og:description" content="Check out ${username}'s Top 8 friends on Farcaster! MySpace for Farcaster." />
    <meta property="og:type" content="website" />
    <meta property="og:url" content="${vercelDomain}/${username}" />
    <meta property="og:image" content="${SUPABASE_URL}/functions/v1/og-image?username=${encodeURIComponent(username)}" />

    <!-- Twitter Card Meta Tags -->
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content="${username}'s Top 8 on Farcaster" />
    <meta name="twitter:description" content="Check out ${username}'s Top 8 friends on Farcaster! MySpace for Farcaster." />
    <meta name="twitter:image" content="${SUPABASE_URL}/functions/v1/og-image?username=${encodeURIComponent(username)}" />

    <!-- Farcaster Frame Meta Tags -->
    <meta property="fc:frame" content="vNext" />
    <meta property="fc:frame:image" content="${SUPABASE_URL}/functions/v1/og-image?username=${encodeURIComponent(username)}" />

    <!-- Farcaster Mini App Meta Tags -->
    <meta name="fc:miniapp" content='{"version":"next","imageUrl":"${SUPABASE_URL}/functions/v1/og-image?username=${encodeURIComponent(username)}","button":{"title":"View Top 8","action":{"type":"launch_frame"}}}' />

    <meta http-equiv="refresh" content="0; url=${vercelDomain}/${username}" />
    <script>window.location.href = "${vercelDomain}/${username}";</script>
    <script type="module" crossorigin src="/assets/index-BW6RUQ8t.js"></script>
    <link rel="stylesheet" crossorigin href="/assets/index-sh_xZEn1.css">
  </head>
  <body>
    <div id="root"></div>
    <p>Redirecting to ${username}'s Top 8...</p>
  </body>
</html>`;
}
