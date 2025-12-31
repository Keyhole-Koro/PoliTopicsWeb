const SPA_FALLBACK = "index.html";

const normalizeKey = (pathname) => {
  let key = decodeURIComponent(pathname).replace(/^\/+/, "");
  if (!key || key.endsWith("/")) key += "index.html";
  key = key.replace(/\.\.+/g, "");
  return key;
};

const shouldSpaFallback = (request, pathname) => {
  if (pathname.startsWith("/_next/")) return false;

  const last = pathname.split("/").pop() || "";
  if (last.includes(".") && !last.endsWith(".html")) return false;

  const accept = request.headers.get("accept") || "";
  return accept.includes("text/html");
};

const toResponse = (object, request, pathKey, isFallback) => {
  const headers = new Headers();
  object.writeHttpMetadata(headers);
  headers.set("etag", object.httpEtag);

  if (!headers.has("content-type") && (isFallback || pathKey.endsWith(".html"))) {
    headers.set("content-type", "text/html; charset=utf-8");
  }

  if (!headers.has("cache-control")) {
    const ct = headers.get("content-type") || "";
    const isHtml = ct.includes("text/html");
    headers.set(
      "cache-control",
      isHtml ? "public, max-age=0, must-revalidate" : "public, max-age=31536000, immutable"
    );
  }

  const body = request.method === "HEAD" ? null : object.body;
  return new Response(body, { status: 200, headers });
};

export default {
  async fetch(request, env) {
    if (request.method !== "GET" && request.method !== "HEAD") {
      return new Response("Method Not Allowed", { status: 405, headers: { allow: "GET, HEAD" } });
    }

    const url = new URL(request.url);

    const decodedKey = normalizeKey(url.pathname);

    let object = await env.ASSETS.get(decodedKey);
    let fallback = false;

    if (!object) {
      const encodedPath = url.pathname
        .split("/")
        .map((seg) => encodeURIComponent(decodeURIComponent(seg)))
        .join("/");
      const encodedKey = normalizeKey(encodedPath);
      if (encodedKey !== decodedKey) {
        object = await env.ASSETS.get(encodedKey);
      }
    }

    if (!object && decodedKey !== "index.html") {
      object = await env.ASSETS.get("index.html");
      fallback = !!object;
    }

    if (!object) {
      return new Response("Not found", { status: 404, headers: { "cache-control": "no-store" } });
    }

    return toResponse(object, request, decodedKey, fallback);
  },
};
