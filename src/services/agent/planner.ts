import { AgentTask } from '@/models/AgentTask';
import mongoose from 'mongoose';

/**
 * Generates an execution plan based on the user's objective.
 * This represents the "Planner Agent" phase.
 */
export async function generateTaskPlan(objective: string): Promise<Array<{ name: string; status: 'pending'; agentType: string }>> {
  // In a real implementation, this would call the LLM to break down the task.
  // For now, we return a deterministic template based on keywords or a default full-stack plan.

  const isFrontendApp = objective.toLowerCase().includes('react') || objective.toLowerCase().includes('portfolio');
  
  if (isFrontendApp) {
    return [
      { name: 'Initialize React Project', status: 'pending', agentType: 'Planner' },
      { name: 'Create UI Components', status: 'pending', agentType: 'UI' },
      { name: 'Wire State Management', status: 'pending', agentType: 'Coder' },
      { name: 'Run UI Tests', status: 'pending', agentType: 'Testing' },
    ];
  }

  return [
    { name: 'Understand Requirements', status: 'pending', agentType: 'Planner' },
    { name: 'Create Database Schema', status: 'pending', agentType: 'Coder' },
    { name: 'Implement Authentication', status: 'pending', agentType: 'Coder' },
    { name: 'Build Core API Routes', status: 'pending', agentType: 'Coder' },
    { name: 'Develop Frontend Views', status: 'pending', agentType: 'UI' },
    { name: 'Execute Integration Tests', status: 'pending', agentType: 'Testing' },
  ];
}
