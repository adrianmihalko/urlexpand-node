const { DEFAULT_HEADERS, requestOnce } = require("../utils");

async function unshort(url, timeoutMs) {
  const response = await requestOnce(url, {
    method: "HEAD",
    headers: DEFAULT_HEADERS
  }, timeoutMs);
  const location = response.headers.location;
  if (!location) {
    throw new Error("no string");
  }
  return new URL(location, url).toString();
}

module.exports = { unshort };
