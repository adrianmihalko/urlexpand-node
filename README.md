URLEXPAND (Node)
================
Node.js port of the Rust urlexpand crate. Expands shortened URLs, strips tracking parameters,
and includes a tiny web UI + redirect endpoint.

Requirements
------------
- Node.js 18+ (uses built-in `fetch`)
- Optional: set `URLEXPAND_INSECURE=1` to allow invalid TLS certs (matches Rust behavior).
  This sets `NODE_TLS_REJECT_UNAUTHORIZED=0` under the hood.
- Optional: set `URLEXPAND_DNS=google` (or a comma-separated list of DNS servers)
  to bypass local DNS overrides (e.g., `8.8.8.8,8.8.4.4`).

Library usage
-------------
```js
const { unshorten, isShortened } = require("./src/index");

const url = "https://bit.ly/3alqLKi";
if (isShortened(url)) {
  unshorten(url, 10000)
    .then((expanded) => console.log(expanded))
    .catch(console.error);
}
```

CLI usage
---------
```bash
node bin/unshorten.js https://bit.ly/3alqLKi
```

Web server
----------
```bash
node server.js
```
Then open `http://localhost:8080`.

Redirect endpoint
-----------------
Use a URL path like:
```
http://localhost:8080/https://s.click.aliexpress.com/...
```
The server expands + cleans and responds with a 302 redirect to the final URL.

Tracking cleanup
----------------
Expanded URLs are automatically stripped of common tracking parameters:
`utm_*`, `fbclid`, `gclid`, `aff_*`, `aff_trace_key`, `terminal_id`,
`afSmartRedirect`, `spm`, `scm`, `tt`, `sk`, and others.

Convenience launcher
--------------------
```bash
./run.sh
```
This starts the server with `URLEXPAND_DNS=google` and `URLEXPAND_INSECURE=1` enabled.
