#!/bin/bash

# ADE Start Script

# Check if bun is installed
if ! command -v bun &> /dev/null; then
    echo "Error: bun is not installed"
    echo "Install bun with: curl -fsSL https://bun.sh/install | bash"
    exit 1
fi

# Always ensure dependencies are up to date
echo "Checking dependencies..."
bun install

# Start the application
echo "Starting ADE..."
bun run start