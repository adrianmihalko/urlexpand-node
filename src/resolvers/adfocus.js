const { fromUrlNot200 } = require("../utils");

async function unshort(url, timeoutMs) {
  const html = await fromUrlNot200(url, timeoutMs);
  const marker = "click_url = \"";
  const start = html.split(marker)[1];
  if (!start) {
    throw new Error("no string");
  }
  const result = start.split("\";")[0];
  if (!result) {
    throw new Error("no string");
  }
  return result;
}

module.exports = { unshort };
