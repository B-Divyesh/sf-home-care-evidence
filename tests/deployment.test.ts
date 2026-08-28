import { existsSync, readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

interface RoutePolicy {
  route: string;
  headers: Record<string, string>;
}

interface StaticWebAppConfig {
  globalHeaders: Record<string, string>;
  mimeTypes: Record<string, string>;
  routes: RoutePolicy[];
  responseOverrides: Record<string, { rewrite: string }>;
}

const config = JSON.parse(readFileSync('public/staticwebapp.config.json', 'utf8')) as StaticWebAppConfig;
const html = readFileSync('index.html', 'utf8');

function route(path: string): RoutePolicy {
  const policy = config.routes.find(item => item.route === path);
  if (!policy) throw new Error(`Missing response policy for ${path}`);
  return policy;
}

describe('production response policy', () => {
  it('caches versioned assets immutably while revalidating the app shell', () => {
    expect(route('/assets/*').headers['Cache-Control']).toBe('public, max-age=31536000, immutable');
    expect(route('/sw.js').headers['Cache-Control']).toBe('no-cache, no-store, must-revalidate');
    expect(config.globalHeaders['Cache-Control']).toBe('public, max-age=0, must-revalidate');
  });

  it('serves the web manifest with its registered media type', () => {
    expect(route('/manifest.webmanifest').headers['Content-Type']).toBe('application/manifest+json');
    expect(config.mimeTypes['.webmanifest']).toBe('application/manifest+json');
  });

  it('locks runtime resources to this site and the billing verification API', () => {
    const policy = config.globalHeaders['Content-Security-Policy'];
    expect(policy).toContain("default-src 'self'");
    expect(policy).toContain("connect-src 'self' https://api.sociobot.in");
    expect(policy).toContain("frame-ancestors 'none'");
    expect(policy).toContain("object-src 'none'");
    expect(policy).not.toContain("'unsafe-inline'");
    expect(policy).not.toContain("'unsafe-eval'");
  });

  it('serves a designed document for unknown routes without masking the 404 response', () => {
    expect(config.responseOverrides['404'].rewrite).toBe('/404.html');
  });

  it('ships canonical, social, install, and legal discovery metadata', () => {
    expect(html).toContain('rel="canonical"');
    expect(html).toContain('property="og:image"');
    expect(html).toContain('name="twitter:card"');
    expect(html).toContain('rel="apple-touch-icon"');
    expect(existsSync('public/social-preview.jpg')).toBe(true);
    expect(readFileSync('public/sitemap.xml', 'utf8')).toContain('/demo</loc>');
  });

  it('maps every declared claim to exactly one tagged browser test', () => {
    const claims = JSON.parse(readFileSync('.factory/claims.json', 'utf8')) as Array<{ id: string; test: string }>;
    const browserTests = [readFileSync('tests/e2e/app.spec.ts', 'utf8'), readFileSync('tests/e2e/claims.spec.ts', 'utf8')].join('\n');
    expect(claims.length).toBeGreaterThan(0);
    for (const claim of claims) {
      expect(claim.test).toBe(`npm run test:e2e -- --grep @claim:${claim.id}`);
      expect(browserTests.match(new RegExp(`@claim:${claim.id}`, 'g')) ?? []).toHaveLength(1);
    }
  });
});
