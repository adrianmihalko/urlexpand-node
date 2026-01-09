const { fromUrlNot200 } = require("../utils");

function decodeYsmm(ysmm) {
  const chars = ysmm.split("");
  const data = [];

  for (let i = 0; i < chars.length; i += 2) {
    if (chars[i] !== undefined) {
      data.push(chars[i]);
    }
    if (chars[i + 1] !== undefined) {
      data.unshift(chars[i + 1]);
    }
  }

  const half = Math.floor(data.length / 2);
  const rotated = data.slice(half).concat(data.slice(0, half));

  const numeric = [];
  rotated.forEach((val, idx) => {
    const parsed = Number.parseInt(val, 10);
    if (!Number.isNaN(parsed)) {
      numeric.push([idx, parsed]);
    }
  });

  for (let i = 0; i + 1 < numeric.length; i += 2) {
    const [xIdx, xVal] = numeric[i];
    const [, yVal] = numeric[i + 1];
    const xor = xVal ^ yVal;
    if (xor < 10) {
      rotated[xIdx] = String(xor);
    }
  }

  let decoded;
  try {
    decoded = Buffer.from(rotated.join(""), "base64").toString("utf8");
  } catch (err) {
    return null;
  }

  if (decoded.length <= 32) {
    return null;
  }

  const trimmed = decoded.slice(16, decoded.length - 16);
  const destIndex = trimmed.indexOf("dest=");
  if (destIndex === -1) {
    return null;
  }

  const dest = trimmed.slice(destIndex + 5);
  try {
    return decodeURIComponent(dest);
  } catch (err) {
    return dest;
  }
}

async function unshort(url, timeoutMs) {
  const html = await fromUrlNot200(url, timeoutMs);
  const marker = "ysmm = '";
  const start = html.split(marker)[1];
  if (!start) {
    throw new Error("no string");
  }
  const ysmm = start.split("';")[0];
  const decoded = ysmm ? decodeYsmm(ysmm) : null;
  if (!decoded) {
    throw new Error("no string");
  }
  return decoded;
}

module.exports = { unshort };
