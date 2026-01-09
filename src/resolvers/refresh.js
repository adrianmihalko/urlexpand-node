const { findFirstGroup, fromUrlNot200 } = require("../utils");

async function unshort(url, timeoutMs) {
  const html = await fromUrlNot200(url, timeoutMs);
  const match = findFirstGroup(html, "URL=([^\"]*)");
  if (!match) {
    throw new Error("no string");
  }
  return match;
}

module.exports = { unshort };
