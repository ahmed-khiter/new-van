const http = require("http");
const https = require("https");
const url = require("url");

const TARGET = "https://www.swippednetwork.com";
const PORT = 3001;

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

http
  .createServer((req, res) => {
    if (req.method === "OPTIONS") {
      res.writeHead(204, CORS_HEADERS);
      res.end();
      return;
    }

    const parsed = url.parse(TARGET);
    const options = {
      hostname: parsed.hostname,
      path: req.url,
      method: req.method,
      headers: { ...req.headers, host: parsed.hostname },
    };

    const proxy = https.request(options, (proxyRes) => {
      const headers = { ...proxyRes.headers, ...CORS_HEADERS };
      res.writeHead(proxyRes.statusCode, headers);
      proxyRes.pipe(res);
    });

    proxy.on("error", (err) => {
      res.writeHead(502, CORS_HEADERS);
      res.end(JSON.stringify({ error: err.message }));
    });

    req.pipe(proxy);
  })
  .listen(PORT, "0.0.0.0", () => {
    console.log(`CORS proxy → ${TARGET} on http://0.0.0.0:${PORT}`);
  });
