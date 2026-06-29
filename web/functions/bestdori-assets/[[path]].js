/** @type {import('@cloudflare/workers-types').PagesFunction} */
export async function onRequest(context) {
  const pathParts = context.params.path;
  const path = Array.isArray(pathParts) ? pathParts.join("/") : String(pathParts ?? "");

  if (!path || path.includes("..")) {
    return new Response("Bad request", { status: 400 });
  }

  const upstream = `https://bestdori.com/assets/${path}`;
  const res = await fetch(upstream, {
    headers: { "User-Agent": "BangDream-Museum/1.0" },
  });

  if (!res.ok) {
    return new Response("Not found", { status: res.status });
  }

  const contentType = res.headers.get("Content-Type") ?? "";
  if (contentType.includes("text/html")) {
    return new Response("Not found", { status: 404 });
  }

  return new Response(res.body, {
    status: res.status,
    headers: {
      "Content-Type": contentType || "application/octet-stream",
      "Access-Control-Allow-Origin": "*",
      "Cache-Control": "public, max-age=604800, immutable",
    },
  });
}
