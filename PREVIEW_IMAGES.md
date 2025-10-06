# Preview Images Implementation

## Overview

This app implements dynamic preview images for Farcaster Mini App embeds using a hybrid approach.

## Current Implementation

### 1. Static Landing Page Preview
- **File**: `index.html`
- **Image**: `/top8splash.png`
- **Use Case**: When sharing the main app URL

The landing page (`index.html`) contains static meta tags with the splash image for optimal preview when sharing the root URL.

### 2. Dynamic User Page Previews
- **Edge Function**: `/functions/v1/og-image`
- **Edge Function**: `/functions/v1/user-page`
- **Use Case**: When sharing individual user Top 8 pages

#### OG Image Generation
The `og-image` edge function dynamically generates SVG preview images showing:
- User's display name
- Their Top 8 friends with avatars
- Friend usernames and display names

#### User Page HTML Generation
The `user-page` edge function generates HTML with proper meta tags for a specific user's Top 8 page.

## SPA Limitation & Workaround

Since this is a Single Page Application (SPA), all routes serve the same `index.html` by default. This means:
- Crawlers requesting `https://app.com/username` see the **static** splash image
- They don't see the **dynamic** preview for that specific user

### Solutions

#### Option 1: Use Direct Edge Function URLs (Current)
Share the edge function URL directly for better previews:
```
https://[supabase-url]/functions/v1/user-page?username=USERNAME
```

This URL:
- Serves HTML with dynamic meta tags for that user
- Includes the user-specific OG image
- Redirects browsers back to the main SPA

#### Option 2: Netlify Edge Functions (Recommended)
For production, implement Netlify Edge Functions to:
- Detect crawler User-Agents (Farcaster, Twitter, etc.)
- Serve dynamic HTML with proper meta tags for crawlers
- Serve the SPA for regular users
- Handle all routes seamlessly

Example Netlify Edge Function pattern:
```typescript
export default async (request: Request, context: any) => {
  const userAgent = request.headers.get('user-agent') || '';
  const isCrawler = /bot|crawler|spider|farcaster/i.test(userAgent);

  if (isCrawler && request.url.includes('/')) {
    // Extract username from URL
    // Fetch user data
    // Return HTML with meta tags
  }

  // Serve SPA for regular users
  return context.next();
};
```

#### Option 3: Pre-rendering
Use a service like Prerender.io or implement build-time pre-rendering for known popular users.

## Testing Preview Images

### Test in Farcaster
1. Share the edge function URL in a cast:
   ```
   https://[supabase-url]/functions/v1/user-page?username=USERNAME
   ```

2. Or use the main URL (will show static splash image):
   ```
   https://farcaster-top-8-frie-c060.bolt.host/USERNAME
   ```

### Test OG Image Directly
Visit the OG image endpoint:
```
https://[supabase-url]/functions/v1/og-image?username=USERNAME
```

## Meta Tags Structure

### Required Meta Tags
```html
<!-- Open Graph -->
<meta property="og:title" content="..." />
<meta property="og:description" content="..." />
<meta property="og:image" content="..." />
<meta property="og:url" content="..." />

<!-- Twitter -->
<meta name="twitter:card" content="summary_large_image" />
<meta name="twitter:image" content="..." />

<!-- Farcaster Frame -->
<meta property="fc:frame" content="vNext" />
<meta property="fc:frame:image" content="..." />

<!-- Farcaster Mini App -->
<meta name="fc:miniapp" content='{"version":"next","imageUrl":"...","button":{...}}' />
```

### Important Notes
- All image URLs MUST be absolute (not relative)
- Image URLs should use HTTPS
- Images should be publicly accessible
- Recommended image size: 1200x630px (OG standard)

## Files

- `index.html` - Static landing page with splash image meta tags
- `src/lib/metaTags.ts` - Client-side meta tag update utilities
- `supabase/functions/og-image/` - Dynamic OG image generator
- `supabase/functions/user-page/` - Dynamic HTML generator with meta tags
