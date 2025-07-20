#!/usr/bin/env npx tsx

export const assemblePromptTool = {
  name: "assemble",
  description: "Prompt the orchestrator to assemble a team for a project",
  inputSchema: {
    type: "object",
    properties: {
      projectName: { type: "string", description: "Name of the project" },
      projectType: { type: "string", description: "Type of project (web app, API, mobile, etc.)", default: "web app" },
      teamSize: { type: "number", description: "Number of developers needed", default: 3 },
      workingDirectory: { type: "string", description: "Full path to project directory" },
      requirements: { type: "string", description: "Brief overview of project requirements" }
    },
    required: ["projectName", "workingDirectory", "requirements"]
  }
};