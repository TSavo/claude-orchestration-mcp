#!/bin/bash

# Start the orchestrator Claude instance in tmux for multi-agent orchestration
# This script sets up the orchestrator with proper context and MCP tools

# Check if tmux is installed
if ! command -v tmux &> /dev/null; then
    echo "Error: tmux is not installed. Please install tmux first."
    echo "On macOS: brew install tmux"
    echo "On Ubuntu/Debian: sudo apt-get install tmux"
    exit 1
fi

# Check if claude CLI is available
if ! command -v claude &> /dev/null; then
    echo "Error: claude CLI is not installed or not in PATH"
    echo "Please ensure Claude Desktop is installed and the CLI is available"
    exit 1
fi

# Default session name
SESSION="orchestrator"
WINDOW="0"

# Check if session already exists
if tmux has-session -t $SESSION 2>/dev/null; then
    echo "Orchestrator session already exists!"
    echo "To attach: tmux attach -t $SESSION"
    echo "To kill it: tmux kill-session -t $SESSION"
    exit 1
fi

echo "Starting orchestrator in tmux session '$SESSION'..."

# Create new tmux session with Claude
tmux new-session -d -s $SESSION "claude"

# Wait for Claude to fully load
echo "Waiting for Claude to initialize..."
sleep 3

# Store session info for MCP server
echo "$SESSION:$WINDOW" > .orchestrator-session

# Send the orchestrator briefing
echo "Briefing the orchestrator..."

# Split the briefing into smaller chunks to avoid tmux buffer issues
tmux send-keys -t $SESSION:$WINDOW "You are the Orchestrator, the central coordinator of a multi-agent AI system. You have access to MCP tools that let you create and manage specialized AI agents who work autonomously while coordinating through a shared chat system."
sleep 0.5
tmux send-keys -t $SESSION:$WINDOW Enter
sleep 0.5

tmux send-keys -t $SESSION:$WINDOW "IMPORTANT: Read the CLAUDE.md file in this directory for detailed orchestration patterns, team structures, and best practices. It contains critical information about Kiro spec-driven development workflow, team leader notification systems, git discipline requirements, communication protocols, and example team compositions."
sleep 0.5
tmux send-keys -t $SESSION:$WINDOW Enter
sleep 0.5

tmux send-keys -t $SESSION:$WINDOW "Your MCP tools include: make-new-agent (create specialized agents), send-agent-command (give agents tasks), read-chat/send-chat (monitor team communication), get-last-messages (check agent activity), and summarize-agent (get work summaries)."
sleep 0.5
tmux send-keys -t $SESSION:$WINDOW Enter
sleep 0.5

tmux send-keys -t $SESSION:$WINDOW "Your agents will work autonomously on assigned tasks, communicate through shared chat, report updates via @Orchestrator mentions, and escalate blockers needing your input. When you see 'read-chat agentName: Orchestrator' appear, it means agents have sent you messages - check these promptly for escalations."
sleep 0.5
tmux send-keys -t $SESSION:$WINDOW Enter
sleep 0.5

tmux send-keys -t $SESSION:$WINDOW "CRITICAL: You communicate with agents through chat like everyone else. Use send-chat to message agents. When agents complete tasks, they MUST report to you. After reading agent messages with read-chat, ALWAYS ask the user 'What would you like me to do next?' to close the communication loop."
sleep 0.5
tmux send-keys -t $SESSION:$WINDOW Enter
sleep 0.5

tmux send-keys -t $SESSION:$WINDOW "Start by reading CLAUDE.md to understand the full system capabilities, then tell me what you'd like to orchestrate."
sleep 0.5
tmux send-keys -t $SESSION:$WINDOW Enter

echo ""
echo "✅ Orchestrator started successfully!"
echo ""
echo "To attach to the orchestrator session:"
echo "  tmux attach -t $SESSION"
echo ""
echo "To detach from tmux (leave it running):"
echo "  Press Ctrl+B, then D"
echo ""
echo "To see orchestrator messages:"
echo "  Use the MCP tool: read-chat agentName: 'Orchestrator'"
echo ""
echo "Agents will notify you automatically when they send messages to @Orchestrator"