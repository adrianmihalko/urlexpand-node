const http = require("http");
const https = require("https");
const dns = require("dns");
const net = require("net");
const zlib = require("zlib");

const UA = "curl/7.72.0";
const DEFAULT_HEADERS = {
  "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
  "Accept-Language": "en-US,en;q=0.5",
  "Cache-Control": "no-cache",
  "User-Agent": UA
};

if (process.env.URLEXPAND_INSECURE) {
  process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";
}

let customLookup;

function buildLookup() {
  const dnsSetting = process.env.URLEXPAND_DNS;
  if (!dnsSetting) {
    return undefined;
  }

  let servers;
  if (dnsSetting === "google") {
    servers = ["8.8.8.8", "8.8.4.4"];
  } else {
    servers = dnsSetting.split(",").map((s) => s.trim()).filter(Boolean);
  }

  if (servers.length === 0) {
    return undefined;
  }

  const resolver = new dns.Resolver();
  resolver.setServers(servers);

  return (hostname, options, cb) => {
    let callback = cb;
    let lookupOptions = options;
    if (typeof options === "function") {
      callback = options;
      lookupOptions = {};
    }

    if (typeof callback !== "function") {
      throw new TypeError("callback must be a function");
    }

    if (process.env.URLEXPAND_DEBUG) {
      console.error("[urlexpand] lookup", hostname, lookupOptions);
    }

    if (!hostname) {
      callback(new Error("dns lookup failed"));
      return;
    }

    if (net.isIP(hostname)) {
      const family = net.isIP(hostname);
      callback(null, hostname, family);
      return;
    }

    const family = lookupOptions && lookupOptions.family ? lookupOptions.family : 0;
    if (family === 6) {
      callback(new Error("ipv6 disabled"));
      return;
    }

    resolver.resolve4(hostname, (err, addresses) => {
      if (err) {
        callback(err);
        return;
      }
      if (!addresses || addresses.length === 0) {
        callback(new Error("dns lookup failed"));
        return;
      }
      if (lookupOptions && lookupOptions.all) {
        const results = addresses.map((address) => ({ address, family: 4 }));
        callback(null, results);
        return;
      }
      callback(null, addresses[0], 4);
    });
  };
}

function getLookup() {
  if (!customLookup) {
    customLookup = buildLookup();
  }
  return customLookup;
}

function decompressBody(buffer, encoding) {
  if (!encoding) {
    return buffer;
  }
  const normalized = encoding.toLowerCase();
  if (normalized === "gzip") {
    return zlib.gunzipSync(buffer);
  }
  if (normalized === "deflate") {
    return zlib.inflateSync(buffer);
  }
  if (normalized === "br") {
    return zlib.brotliDecompressSync(buffer);
  }
  return buffer;
}

function requestOnce(url, options, timeoutMs) {
  return new Promise((resolve, reject) => {
    let urlObj;
    try {
      urlObj = new URL(url);
    } catch (err) {
      reject(err);
      return;
    }

    if (process.env.URLEXPAND_DEBUG) {
      console.error("[urlexpand] request", urlObj.protocol, urlObj.hostname, urlObj.pathname);
    }

    const isHttps = urlObj.protocol === "https:";
    const transport = isHttps ? https : http;
    const lookup = getLookup();

    const requestOptions = {
      method: options.method || "GET",
      hostname: urlObj.hostname,
      port: urlObj.port || (isHttps ? 443 : 80),
      path: `${urlObj.pathname}${urlObj.search}`,
      headers: options.headers || {},
      lookup,
      rejectUnauthorized: !process.env.URLEXPAND_INSECURE
    };

    const req = transport.request(requestOptions, (res) => {
      const chunks = [];
      res.on("data", (chunk) => chunks.push(chunk));
      res.on("end", () => {
        const buffer = Buffer.concat(chunks);
        const encoding = res.headers["content-encoding"];
        let body = buffer;
        try {
          body = decompressBody(buffer, encoding);
        } catch (err) {
          reject(err);
          return;
        }
        resolve({
          status: res.statusCode || 0,
          headers: res.headers,
          body: body.toString("utf8"),
          url
        });
      });
    });

    req.on("error", (err) => reject(err));

    if (timeoutMs != null) {
      req.setTimeout(timeoutMs, () => {
        req.destroy(new Error("timeout"));
      });
    }

    req.end();
  });
}

async function requestFollow(url, options, timeoutMs, maxRedirects = 10) {
  let currentUrl = url;
  for (let i = 0; i <= maxRedirects; i += 1) {
    const response = await requestOnce(currentUrl, options, timeoutMs);
    if (response.status >= 300 && response.status < 400) {
      const location = response.headers.location;
      if (!location) {
        return response;
      }
      currentUrl = new URL(location, currentUrl).toString();
      continue;
    }
    return response;
  }
  return requestOnce(currentUrl, options, timeoutMs);
}

function findFirstGroup(text, pattern) {
  const regex = new RegExp(pattern, "i");
  const match = text.match(regex);
  return match && match[1] ? match[1] : null;
}

async function fromUrl(url, timeoutMs) {
  const response = await requestFollow(url, {
    method: "GET",
    headers: DEFAULT_HEADERS
  }, timeoutMs);
  return response.body;
}

async function fromUrlNot200(url, timeoutMs) {
  const response = await requestFollow(url, {
    method: "GET",
    headers: DEFAULT_HEADERS
  }, timeoutMs);

  if (response.status === 200) {
    throw new Error("no string");
  }
  return response.body;
}

async function followSameHost(url, timeoutMs, maxRedirects = 10) {
  const initialHost = new URL(url).host;
  let currentUrl = url;

  for (let i = 0; i < maxRedirects; i += 1) {
    const response = await requestOnce(currentUrl, {
      method: "GET",
      headers: DEFAULT_HEADERS
    }, timeoutMs);

    if (response.status >= 400) {
      throw new Error(`http ${response.status}`);
    }

    if (response.status >= 300 && response.status < 400) {
      const location = response.headers.location;
      if (!location) {
        break;
      }
      const nextUrl = new URL(location, currentUrl).toString();
      const nextHost = new URL(nextUrl).host;
      if (nextHost !== initialHost) {
        return nextUrl;
      }
      currentUrl = nextUrl;
      continue;
    }

    return response.url || currentUrl;
  }

  return currentUrl;
}

module.exports = {
  DEFAULT_HEADERS,
  requestOnce,
  findFirstGroup,
  fromUrl,
  fromUrlNot200,
  followSameHost
};
