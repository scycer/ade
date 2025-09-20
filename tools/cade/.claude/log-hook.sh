#!/bin/bash
# Hook script to log tool usage

echo "[$(date '+%Y-%m-%d %H:%M:%S')] Hook: $CLAUDE_HOOK_TYPE" >> /home/scycer/dev/ade/tools/cade/.claude/hooks.log
echo "  Tool: $CLAUDE_TOOL_NAME" >> /home/scycer/dev/ade/tools/cade/.claude/hooks.log
echo "  Args: $CLAUDE_TOOL_ARGS" >> /home/scycer/dev/ade/tools/cade/.claude/hooks.log
echo "  Working Dir: $(pwd)" >> /home/scycer/dev/ade/tools/cade/.claude/hooks.log
echo "  All Env Vars:" >> /home/scycer/dev/ade/tools/cade/.claude/hooks.log
env | grep -i claude >> /home/scycer/dev/ade/tools/cade/.claude/hooks.log
echo "---" >> /home/scycer/dev/ade/tools/cade/.claude/hooks.log