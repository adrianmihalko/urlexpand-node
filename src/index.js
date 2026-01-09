const { SERVICES, whichService } = require("./services");
const adfly = require("./resolvers/adfly");
const adfocus = require("./resolvers/adfocus");
const generic = require("./resolvers/generic");
const linkedin = require("./resolvers/linkedin");
const redirect = require("./resolvers/redirect");
const refresh = require("./resolvers/refresh");
const shorturl = require("./resolvers/shorturl");
const surlli = require("./resolvers/surlli");

const TRACKING_PREFIXES = [
  "utm_",
  "fbclid",
  "gclid",
  "dclid",
  "yclid",
  "mc_cid",
  "mc_eid",
  "igshid",
  "msclkid",
  "ref",
  "ref_",
  "aff_",
  "affid",
  "affiliate",
  "affsource",
  "affsub",
  "affsub2",
  "affsub3",
  "affsub4",
  "affsub5",
  "terminal_id",
  "afsmartredirect",
  "campaign",
  "cmpid",
  "clickid",
  "s_kwcid",
  "tt",
  "ttclid",
  "sk",
  "source",
  "spm",
  "scm"
];

function stripTrackingParams(rawUrl) {
  let url;
  try {
    url = new URL(rawUrl);
  } catch (err) {
    return rawUrl;
  }

  const params = new URLSearchParams(url.search);
  const cleaned = new URLSearchParams();

  for (const [key, value] of params.entries()) {
    const lower = key.toLowerCase();
    const matchedPrefix = TRACKING_PREFIXES.some((prefix) => {
      if (prefix.endsWith("_")) {
        return lower.startsWith(prefix);
      }
      return lower === prefix;
    });
    if (!matchedPrefix) {
      cleaned.append(key, value);
    }
  }

  url.search = cleaned.toString();
  return url.toString();
}

function isShortened(url) {
  return SERVICES.some((service) => url.includes(service));
}

function validate(input) {
  let url;
  try {
    url = new URL(input);
  } catch (err) {
    try {
      url = new URL(`https://${input}`);
    } catch (err2) {
      return null;
    }
  }

  const domain = url.hostname;
  if (!domain || !isShortened(domain)) {
    return null;
  }

  return url.toString();
}

async function unshorten(url, timeoutMs) {
  const validated = validate(url);
  if (!validated) {
    throw new Error("no string");
  }

  const service = whichService(validated);
  if (!service) {
    throw new Error("no string");
  }

  let expanded;
  switch (service) {
    case "adf.ly":
    case "atominik.com":
    case "fumacrom.com":
    case "intamema.com":
    case "j.gs":
    case "q.gs":
      expanded = await adfly.unshort(validated, timeoutMs);
      break;

    case "gns.io":
    case "ity.im":
    case "ldn.im":
    case "nowlinks.net":
    case "rlu.ru":
    case "tinyurl.com":
    case "tr.im":
    case "u.to":
    case "vzturl.com":
      expanded = await redirect.unshort(validated, timeoutMs);
      break;

    case "cutt.us":
    case "soo.gd":
      expanded = await refresh.unshort(validated, timeoutMs);
      break;

    case "adfoc.us":
      expanded = await adfocus.unshort(validated, timeoutMs);
      break;
    case "lnkd.in":
      expanded = await linkedin.unshort(validated, timeoutMs);
      break;
    case "shorturl.at":
      expanded = await shorturl.unshort(validated, timeoutMs);
      break;
    case "surl.li":
      expanded = await surlli.unshort(validated, timeoutMs);
      break;

    default:
      expanded = await generic.unshort(validated, timeoutMs);
  }

  return stripTrackingParams(expanded);
}

module.exports = {
  isShortened,
  unshorten
};
