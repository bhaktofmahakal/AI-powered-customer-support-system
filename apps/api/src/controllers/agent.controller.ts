import { Context } from 'hono';
import prisma from '../lib/db';
import { AppError } from '../middleware/error.middleware';

export class AgentController {
  static async listAgents(c: Context) {
    try {
      const agents = await prisma.agent.findMany({
        include: {
          tools: {
            select: {
              name: true
            }
          }
        }
      });

      return c.json({
        agents: agents.map((agent: any) => ({
          type: agent.type,
          name: agent.name,
          description: agent.description,
          capabilities: agent.tools.map((t: any) => t.name)
        }))
      });
    } catch (error: any) {
      console.error('[AgentController] Error listing agents:', error);
      throw new AppError(500, 'Failed to fetch agents');
    }
  }

  static async getCapabilities(c: Context) {
    const agentType = c.req.param('type');

    try {
      const agent = await prisma.agent.findUnique({
        where: { type: agentType },
        include: {
          tools: true
        }
      });

      if (!agent) {
        throw new AppError(404, 'Agent type not found');
      }

      return c.json({
        type: agent.type,
        name: agent.name,
        description: agent.description,
        tools: agent.tools.map((tool: any) => ({
          name: tool.name,
          description: tool.description,
          parameters: tool.parameters
        }))
      });
    } catch (error: any) {
      console.error('[AgentController] Error getting capabilities:', error);
      if (error instanceof AppError) throw error;
      throw new AppError(500, 'Failed to fetch capabilities');
    }
  }
}
