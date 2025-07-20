#!/usr/bin/env npx tsx

export const initPromptTool = {
  name: "init",
  description: "Initialize project by comprehensively scanning codebase and creating professional steering documents in specs/ directory. BEHAVIOR: Performs deep codebase analysis, identifies existing features, creates specs/project-overview/, specs/existing-features/, and specs/proposed-features/ with requirements.md, design.md, and tasks.md for each. Creates development-standards.md with project conventions. CRITICAL: Creates production-ready documentation for immediate team use.",
  inputSchema: {
    type: "object",
    properties: {
      projectName: { type: "string", description: "Official project name - will be used in all generated documentation" },
      workingDirectory: { type: "string", description: "Full absolute path to project root directory - must contain source code" },
      projectType: { type: "string", description: "Project type for context (web app, API, mobile, AI/ML, etc.) - affects analysis focus", default: "web app" },
      analysisDepth: { type: "string", enum: ["quick", "comprehensive"], description: "Analysis depth - comprehensive recommended for new teams", default: "comprehensive" }
    },
    required: ["projectName", "workingDirectory"]
  }
};