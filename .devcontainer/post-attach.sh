#!/bin/bash
set -e

echo "=== Setting up Yggdrasil development environment ==="

# Install CLI dependencies and link globally
cd source/cli
npm install
npm link
cd ../..

echo "=== ygg CLI linked globally ==="
ygg --version

echo "=== Setup complete ==="
