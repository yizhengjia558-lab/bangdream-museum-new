import http from "node:http";
import https from "node:https";

const PORT = Number(process.env.LIVE2D_PROXY_PORT ?? 3002);

const server = http.createServer((req, res) => {
  const url = req.url ?? "";
  if (!url.startsWith("/bestdori-assets/")) {
    res.writeHead(404);
    res.end("Not found");
    return;
  }

  const assetPath = url.slice("/bestdori-assets/".length);
  if (!assetPath || assetPath.includes("..")) {
    res.writeHead(400);
    res.end("Bad request");
    return;
  }

  const upstream = `https://bestdori.com/assets/${assetPath}`;
  https
    .get(upstream, { headers: { "User-Agent": "BangDream-Museum/1.0" } }, (upstreamRes) => {
      const contentType = upstreamRes.headers["content-type"] ?? "";
      if (String(contentType).includes("text/html")) {
        res.writeHead(404);
        res.end("Not found");
        upstreamRes.resume();
        return;
      }

      res.writeHead(upstreamRes.statusCode ?? 502, {
        "Content-Type": contentType || "application/octet-stream",
        "Access-Control-Allow-Origin": "*",
        "Cache-Control": "public, max-age=604800, immutable",
      });
      upstreamRes.pipe(res);
    })
    .on("error", () => {
      res.writeHead(502);
      res.end("Bad gateway");
    });
});

server.listen(PORT, () => {
  console.log(`Live2D asset proxy listening on http://localhost:${PORT}`);
});
