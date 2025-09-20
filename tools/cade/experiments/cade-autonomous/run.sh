#!/bin/bash

# CADE Autonomous Agent Runner Script

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Default to task.md if no argument provided
TASK_FILE="${1:-task.md}"

echo -e "${BLUE}Running CADE Autonomous Agent${NC}"
echo -e "${GREEN}Task file: ${TASK_FILE}${NC}"
echo ""

# Run the agent
bun cade-agent.ts "$TASK_FILE"