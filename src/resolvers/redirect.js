const { findFirstGroup, fromUrl } = require("../utils");

const RE_PATTERNS = [
  "Here is the URL which you want to visit:<br><br>\\n<a href=\"([^\">]*)",
  "window.open\\([\"']([^'\"\\)]*)",
  "window.location[= '\"]*([^'\"]*)",
  "target='_blank'>([^<]*)",
  "\"redirecturl\" href=\"(.*)\">",
  "src=['\"]([^\"']*)\" scrolling"
];

async function unshort(url, timeoutMs) {
  const html = await fromUrl(url, timeoutMs);
  const match = findFirstGroup(html, RE_PATTERNS.join("|"));
  if (!match) {
    throw new Error("no string");
  }
  return match;
}

module.exports = { unshort };
