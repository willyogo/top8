const SUPABASE_URL = 'https://0ec90b57d6e95fcbda19832f.supabase.co';

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

function extractUsername(pathname: string): string | null {
  const parts = pathname.split('/').filter(Boolean);

  if (parts.length === 1) {
    const username = parts[0];
    if (username && !username.includes('.') && username.length > 0) {
      return username;
    }
  }

  return null;
}

export default async function middleware(request: Request) {
  try {
    const url = new URL(request.url);
    const userAgent = request.headers.get('user-agent') || '';
    const pathname = url.pathname;

    if (pathname === '/' || pathname === '') {
      return;
    }

    const username = extractUsername(pathname);

    if (!username) {
      return;
    }

    if (isCrawler(userAgent)) {
      try {
        const edgeFunctionUrl = `${SUPABASE_URL}/functions/v1/user-page?username=${encodeURIComponent(username)}`;

        const response = await fetch(edgeFunctionUrl, {
          headers: {
            'User-Agent': 'Vercel-Edge-Middleware',
          },
        });

        if (!response.ok) {
          console.error(`Edge function returned ${response.status} for username: ${username}`);
          return;
        }

        const html = await response.text();

        return new Response(html, {
          status: 200,
          headers: {
            'Content-Type': 'text/html; charset=utf-8',
            'Cache-Control': 'public, max-age=300, s-maxage=600',
          },
        });
      } catch (error) {
        console.error('Error fetching from edge function:', error);
        return;
      }
    }

    return;
  } catch (error) {
    console.error('Middleware error:', error);
    return;
  }
}

export const config = {
  matcher: [
    '/((?!_next|api|favicon.ico|icon.svg|top8.*\\.png|.*\\.js|.*\\.css|.*\\.json).*)',
  ],
};
