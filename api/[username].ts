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

  if (isCrawler(userAgent)) {
    try {
      const edgeFunctionUrl = `${SUPABASE_URL}/functions/v1/user-page?username=${encodeURIComponent(username)}`;

      const response = await fetch(edgeFunctionUrl, {
        headers: {
          'User-Agent': 'Vercel-Serverless-Function',
        },
      });

      if (!response.ok) {
        console.error(`Edge function returned ${response.status} for username: ${username}`);
        return res.status(response.status).send('Error fetching user page');
      }

      const html = await response.text();

      res.setHeader('Content-Type', 'text/html; charset=utf-8');
      res.setHeader('Cache-Control', 'public, max-age=300, s-maxage=600');
      return res.status(200).send(html);
    } catch (error) {
      console.error('Error fetching from edge function:', error);
      return res.status(500).send('Internal server error');
    }
  }

  const indexHtml = `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <link rel="icon" type="image/png" href="/top8_icon_text_1024.png" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Top 8</title>
    <script type="module" crossorigin src="/assets/index-BWCnypPi.js"></script>
    <link rel="stylesheet" crossorigin href="/assets/index-sh_xZEn1.css">
  </head>
  <body>
    <div id="root"></div>
  </body>
</html>`;

  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  return res.status(200).send(indexHtml);
}
