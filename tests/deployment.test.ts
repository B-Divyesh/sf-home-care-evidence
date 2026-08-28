import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

interface RoutePolicy {
  route: string;
  headers: Record<string, string>;
}

interface StaticWebAppConfig {
  globalHeaders: Record<string, string>;
  routes: RoutePolicy[];
}

const config = JSON.parse(readFileSync('public/staticwebapp.config.json', 'utf8')) as StaticWebAppConfig;

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
});
