const http = require("http");
const fs = require("fs");
const path = require("path");
const { unshorten } = require("./src/index");

const INDEX_HTML = fs.readFileSync(path.join(__dirname, "web", "index.html"), "utf8");

function textResponse(res, status, body) {
  res.writeHead(status, { "Content-Type": "text/plain; charset=utf-8" });
  res.end(body);
}

function htmlResponse(res) {
  res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
  res.end(INDEX_HTML);
}

async function handleUnshorten(req, res) {
  let body = "";
  req.on("data", (chunk) => {
    body += chunk;
  });
  req.on("end", async () => {
    const input = body.trim();
    if (!input) {
      textResponse(res, 400, "empty url");
      return;
    }
    try {
      const url = await unshorten(input, 10000);
      textResponse(res, 200, url);
    } catch (err) {
      textResponse(res, 422, `error: ${err.message || String(err)}`);
    }
  });
}

const server = http.createServer((req, res) => {
  if (req.method === "GET" && req.url === "/") {
    htmlResponse(res);
    return;
  }

  if (req.method === "GET" && (req.url.startsWith("/http://") || req.url.startsWith("/https://"))) {
    const encoded = req.url.slice(1);
    let target;
    try {
      target = decodeURIComponent(encoded);
    } catch (err) {
      textResponse(res, 400, "invalid url encoding");
      return;
    }
    unshorten(target, 10000)
      .then((expanded) => {
        res.writeHead(302, { Location: expanded });
        res.end();
      })
      .catch((err) => {
        textResponse(res, 422, `error: ${err.message || String(err)}`);
      });
    return;
  }

  if (req.method === "GET" && req.url === "/health") {
    textResponse(res, 200, "ok");
    return;
  }

  if (req.method === "POST" && req.url === "/api/unshorten") {
    handleUnshorten(req, res);
    return;
  }

  textResponse(res, 404, "not found");
});

const portEnv = process.env.URLEXPAND_PORT || process.env.PORT;
const port = Number.parseInt(portEnv, 10) || 8080;
server.listen(port, "0.0.0.0", () => {
  console.log(`Listening on http://0.0.0.0:${port}`);
});
