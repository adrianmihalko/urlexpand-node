#!/usr/bin/env node
const { isShortened, unshorten } = require("../src/index");

async function main() {
  const args = process.argv.slice(2);
  if (args.length === 0) {
    console.log("pass a url to expand:");
    console.log("  eg: unshorten https://bit.ly/3alqLKi");
    console.log("  eg: unshorten https://lnkd.in/eUeGcvsr");
    process.exit(1);
  }

  const url = args[0];
  const shortened = isShortened(url);
  if (!shortened) {
    console.log(`${url} not a short url`);
    return;
  }

  try {
    const expanded = await unshorten(url, null);
    console.log(`${url}\nis_shortened? ${shortened}\nExpanded URL = ${expanded}`);
  } catch (err) {
    console.error(err.message || String(err));
    process.exitCode = 1;
  }
}

main();
