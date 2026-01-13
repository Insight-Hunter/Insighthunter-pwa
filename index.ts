// index.ts — minimal static file server for your PWA

export interface Env {
  // No bindings yet
}

export default {
  async fetch(request: Request, _env: Env, _ctx: ExecutionContext): Promise<Response> {
    const url = new URL(request.url);
    let path = url.pathname;

    // Default to index.html for root or SPA routes
    if (path === '/' || path === '') {
      path = '/index.html';
    }

    // Map to static assets in the Worker bundle
    try {
      // @ts-ignore: __STATIC_CONTENT is injected by Wrangler when using assets
      // but for a minimal TS example without assets binding, we use import.meta.
      const asset = await import(`./public${path}`, {
        with: { type: 'bytes' }
      } as any);

      const body = asset.default as ArrayBuffer;

      const contentType =
        path.endsWith('.html') ? 'text/html; charset=utf-8' :
        path.endsWith('.js')   ? 'application/javascript; charset=utf-8' :
        path.endsWith('.css')  ? 'text/css; charset=utf-8' :
        path.endsWith('.webmanifest') ? 'application/manifest+json' :
        path.endsWith('.png')  ? 'image/png' :
        'application/octet-stream';

      return new Response(body, {
        status: 200,
        headers: {
          'Content-Type': contentType,
          'Cache-Control': 'public, max-age=3600'
        }
      });
    } catch {
      // Fallback to index.html for unknown paths (SPA behavior)
      try {
        const asset = await import('./public/index.html', {
          with: { type: 'bytes' }
        } as any);

        return new Response(asset.default as ArrayBuffer, {
          status: 200,
          headers: {
            'Content-Type': 'text/html; charset=utf-8'
          }
        });
      } catch {
        return new Response('Not found', { status: 404 });
      }
    }
  }
} satisfies ExportedHandler<Env>;
