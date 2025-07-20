#!/usr/bin/env npx tsx

import { readdirSync } from 'fs';
import { join, basename, extname } from 'path';

interface ToolDefinition {
  name: string;
  description: string;
  inputSchema: any;
}

interface CommandClass {
  new(sessionManager: any): any;
}

/**
 * Automatically discover and load all MCP tools from the mcp-tools directory
 */
export async function discoverMCPTools(): Promise<ToolDefinition[]> {
  const tools: ToolDefinition[] = [];
  const toolsDir = join(__dirname, 'mcp-tools');
  
  try {
    const files = readdirSync(toolsDir);
    
    for (const file of files) {
      if (file.endsWith('.ts') && file !== 'index.ts') {
        const moduleName = basename(file, extname(file));
        const modulePath = join(toolsDir, file);
        
        try {
          // Dynamic import the tool module
          const module = await import(modulePath);
          
          // Look for exported tool (naming convention: moduleNameTool)
          const toolExportName = moduleName.replace(/-([a-z])/g, (_, letter) => letter.toUpperCase()) + 'Tool';
          
          if (module[toolExportName]) {
            tools.push(module[toolExportName]);
            console.log(`✓ Discovered MCP tool: ${module[toolExportName].name}`);
          }
        } catch (error) {
          console.warn(`⚠ Failed to load MCP tool from ${file}:`, error instanceof Error ? error.message : String(error));
        }
      }
    }
  } catch (error) {
    console.error('Failed to scan mcp-tools directory:', error);
  }
  
  return tools;
}

/**
 * Automatically discover and load all slash command classes from the slash-commands directory
 */
export async function discoverSlashCommands(sessionManager: any): Promise<Map<string, any>> {
  const commands = new Map<string, any>();
  const commandsDir = join(__dirname, 'slash-commands');
  
  try {
    const files = readdirSync(commandsDir);
    
    for (const file of files) {
      if (file.endsWith('-command.ts')) {
        const commandName = basename(file, '-command.ts');
        const modulePath = join(commandsDir, file);
        
        try {
          // Dynamic import the command module
          const module = await import(modulePath);
          
          // Look for exported command class (naming convention: CommandNameCommand)
          const className = commandName.split('-').map(part => 
            part.charAt(0).toUpperCase() + part.slice(1)
          ).join('') + 'Command';
          
          if (module[className]) {
            const commandInstance = new module[className](sessionManager);
            commands.set(commandName, commandInstance);
            console.log(`✓ Discovered slash command: /${commandName}`);
          }
        } catch (error) {
          console.warn(`⚠ Failed to load slash command from ${file}:`, error instanceof Error ? error.message : String(error));
        }
      }
    }
  } catch (error) {
    console.error('Failed to scan slash-commands directory:', error);
  }
  
  return commands;
}

/**
 * Get all available tool and command names for help/debugging
 */
export async function getDiscoveredItems(): Promise<{tools: string[], commands: string[]}> {
  const tools = await discoverMCPTools();
  const commands = await discoverSlashCommands(null); // null sessionManager for discovery only
  
  return {
    tools: tools.map(t => t.name),
    commands: Array.from(commands.keys())
  };
}