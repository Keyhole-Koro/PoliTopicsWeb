export default {
  async fetch(request, env) {
    const { method, url } = request;

    // 1. Method Check
    if (method !== "GET" && method !== "HEAD") {
      return new Response("Method Not Allowed", {
        status: 405,
        headers: { "Allow": "GET, HEAD" },
      });
    }

    const parsedUrl = new URL(url);
    const pathname = decodeURIComponent(parsedUrl.pathname);

    // 2. Key Normalization
    // Remove leading slash. If root or directory, append index.html
    let key = pathname.startsWith("/") ? pathname.slice(1) : pathname;
    if (key === "" || key.endsWith("/")) {
      key += "index.html";
    }

    // 3. Fetch from R2
    let object = await env.ASSETS.get(key);

    // 4. SPA Fallback Handling
    if (!object) {
      // Avoid fallback for:
      // - Next.js build chunks (/_next/...)
      // - Static files with extensions (e.g. .js, .css, .png)
      // This fixes the "SyntaxError: Unexpected token '<'" when JS chunks are missing.
      const isNextAsset = pathname.startsWith("/_next/");
      const hasExtension = /\.[a-zA-Z0-9]+$/.test(pathname);

      if (isNextAsset || (hasExtension && !pathname.endsWith(".html"))) {
        return new Response("Not Found", { status: 404 });
      }

      // Serve index.html for unknown routes (Client-side routing)
      object = await env.ASSETS.get("index.html");

      if (!object) {
        return new Response("Not Found", { status: 404 });
      }
    }

    // 5. Construct Response
    const headers = new Headers();
    object.writeHttpMetadata(headers);
    headers.set("ETag", object.httpEtag);

    // 6. Enforce Cache-Control
    // Next.js hashed assets -> Immutable (1 year)
    // HTML / Fallback -> No-cache (Always revalidate)
    if (pathname.startsWith("/_next/")) {
      headers.set("Cache-Control", "public, max-age=31536000, immutable");
    } else {
      headers.set("Cache-Control", "no-cache, no-store, must-revalidate");
    }

    if (!headers.has("Content-Type")) {
      const contentType = guessContentType(object.key);
      if (contentType) {
        headers.set("Content-Type", contentType);
      }
    }

    return new Response(object.body, {
      headers,
      status: 200,
    });
  },
};

const EXTENSION_CONTENT_TYPES = {
  ".html": "text/html; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".map": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
  ".ico": "image/x-icon",
  ".txt": "text/plain; charset=utf-8",
  ".woff": "font/woff",
  ".woff2": "font/woff2",
  ".ttf": "font/ttf",
  ".otf": "font/otf",
  ".eot": "application/vnd.ms-fontobject",
};

function guessContentType(key) {
  const match = key.toLowerCase().match(/\.[a-z0-9]+$/);
  if (!match) return undefined;
  return EXTENSION_CONTENT_TYPES[match[0]];
}
