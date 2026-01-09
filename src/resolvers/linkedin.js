const { fromUrl } = require("../utils");
const generic = require("./generic");

async function getFromHtml(url, timeoutMs) {
  const html = await fromUrl(url, timeoutMs);
  const marker = "data-tracking-control-name=\"external_url_click\"";
  const start = html.split(marker)[1];
  if (!start) {
    throw new Error("no string");
  }
  const hrefStart = start.split("href=\"")[1];
  if (!hrefStart) {
    throw new Error("no string");
  }
  const urlMatch = hrefStart.split("\">")[0];
  if (!urlMatch) {
    throw new Error("no string");
  }
  return urlMatch;
}

async function unshort(url, timeoutMs) {
  const expandedUrl = await generic.unshort(url, timeoutMs);
  if (expandedUrl.includes("linkedin.com") || expandedUrl.includes("lnkd.in")) {
    try {
      return await getFromHtml(url, timeoutMs);
    } catch (err) {
      return expandedUrl;
    }
  }
  return expandedUrl;
}

module.exports = { unshort };
