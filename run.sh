#!/usr/bin/env bash
set -euo pipefail

export URLEXPAND_DNS=google
export URLEXPAND_INSECURE=1

node server.js
