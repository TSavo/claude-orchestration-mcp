#!/usr/bin/env npx tsx

export const makeNewAgentTool = {
  name: "make-new-agent",
  description: "Create a new Claude agent with a given name. USAGE: Only for Orchestrator and Project Managers creating team members. Agents should be given themed names (Matrix, Ex Machina, etc.) and will receive comprehensive role-specific briefings automatically. Each agent gets individual history files for conversation persistence.",
  inputSchema: {
    type: "object",
    properties: {
      name: { type: "string", description: "Themed name for the new agent (e.g. Neo, Trinity, Morpheus for Matrix theme)" },
      model: { type: "string", enum: ["sonnet", "haiku", "opus"], default: "sonnet", description: "AI model - sonnet recommended for development work" },
      tools: { type: "array", items: { type: "string" }, description: "MCP tools to enable - leave empty for default set" }
    },
    required: ["name"]
  }
};