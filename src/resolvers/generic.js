const { followSameHost } = require("../utils");

async function unshort(url, timeoutMs) {
  return followSameHost(url, timeoutMs);
}

module.exports = { unshort };
