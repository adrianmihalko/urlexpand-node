const { fromUrl } = require("../utils");
const generic = require("./generic");

async function getFromHtml(url, timeoutMs) {
  const html = await fromUrl(url, timeoutMs);
  const marker = "api.miniature.io/?url=";
  const match = html.split(marker).pop();
  if (!match) {
    throw new Error("no string");
  }
  const end = match.split('"')[0];
  if (!end) {
    throw new Error("no string");
  }
  return end;
}

async function unshort(url, timeoutMs) {
  const expandedUrl = await generic.unshort(url, timeoutMs);
  const expandedTail = expandedUrl.split("//").pop() || "";
  if (url.endsWith(expandedTail)) {
    try {
      return await getFromHtml(url, timeoutMs);
    } catch (err) {
      return expandedUrl;
    }
  }
  return expandedUrl;
}

module.exports = { unshort };
