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

    // Ensure Content-Type for index.html (especially during fallback)
    if (!headers.has("Content-Type") && object.key.endsWith("index.html")) {
      headers.set("Content-Type", "text/html; charset=utf-8");
    }

    return new Response(object.body, {
      headers,
      status: 200,
    });
  },
};
