#!/bin/bash

# Start the orchestrator Claude instance in tmux for multi-agent orchestration
# This script sets up the orchestrator with proper context and MCP tools

# Default Claude options
CLAUDE_OPTS="--dangerously-skip-permissions --add-dir /"

# Parse command line arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        --claude-opts)
            CLAUDE_OPTS="$2"
            shift 2
            ;;
        --help|-h)
            echo "Usage: $0 [options]"
            echo ""
            echo "Options:"
            echo "  --claude-opts \"OPTIONS\"  Custom Claude CLI options"
            echo "                          Default: \"--dangerously-skip-permissions --add-dir /\""
            echo "  --help, -h             Show this help message"
            echo ""
            echo "Examples:"
            echo "  $0                     # Use default options"
            echo "  $0 --claude-opts \"\"   # Start without any Claude options"
            echo "  $0 --claude-opts \"--add-dir /home/user/projects\""
            exit 0
            ;;
        *)
            echo "Unknown option: $1"
            echo "Use --help for usage information"
            exit 1
            ;;
    esac
done

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
if [ -n "$CLAUDE_OPTS" ]; then
    echo "Claude options: $CLAUDE_OPTS"
fi

# Create new tmux session with Claude
tmux new-session -d -s $SESSION "claude $CLAUDE_OPTS"

# Wait for Claude to fully load
echo "Waiting for Claude to initialize..."
sleep 3

# Store session info for MCP server
echo "$SESSION:$WINDOW" > .orchestrator-session

# Send the orchestrator briefing
echo "Briefing the orchestrator..."
tmux send-keys -t $SESSION:$WINDOW Enter
sleep 0.5
# Split the briefing into smaller chunks to avoid tmux buffer issues
tmux send-keys -t $SESSION:$WINDOW "You are the Orchestrator, the central coordinator of a multi-agent AI system. You have access to MCP tools that let you create and manage specialized AI agents who work autonomously while coordinating through a shared chat system."
sleep 0.5
tmux send-keys -t $SESSION:$WINDOW Enter
sleep 0.5

tmux send-keys -t $SESSION:$WINDOW "IMPORTANT: Read the CLAUDE.md file in this directory for detailed orchestration patterns, team structures, and best practices. It contains critical information about spec-driven development workflow with 3-step approval process, team leader notification systems, git discipline requirements, communication protocols, and example team compositions."
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

tmux send-keys -t $SESSION:$WINDOW "STRICT COMMUNICATION PROTOCOL: Every order you give via chat MUST include 'REPLY TO: @Orchestrator when [condition]' and 'DO NOT FINISH this session without sending me [response].' The communication ball MUST start and end with the user. You MUST ask user 'What would you like me to do next?' NEVER end without explicit user direction. YOU MUST BRIEF EVERY PROJECT MANAGER TO ENFORCE THIS PROTOCOL EXPLICITLY ON EVERY REQUEST THEY RECEIVE."
sleep 0.5
tmux send-keys -t $SESSION:$WINDOW Enter
sleep 0.5

tmux send-keys -t $SESSION:$WINDOW "CRITICAL STARTUP PROTOCOL: 1) FIRST ask user for project directory path, 2) Read docs/ORCHESTRATOR.md for your role guide, 3) Use ONLY chat after initial agent creation, 4) Ensure ALL team members know working directory, 5) ALWAYS end sessions by asking user 'What would you like me to do next?' Ready to coordinate projects!"
sleep 0.5
tmux send-keys -t $SESSION:$WINDOW Enter

echo ""
echo "✅ Orchestrator started successfully!"
echo ""
echo "Attaching to orchestrator session..."
echo ""
echo "To detach from tmux (leave it running):"
echo "  Press Ctrl+B, then D"
echo ""
echo "To see orchestrator messages:"
echo "  Use the MCP tool: read-chat agentName: 'Orchestrator'"
echo ""
echo "Agents will notify you automatically when they send messages to @Orchestrator"
echo ""

# Attach to the session
tmux attach -t $SESSION