import mongoose from 'mongoose';
import connectDB from '@/lib/db/mongoose';
import Project from '@/models/Project';
import DocumentRecord from '@/models/Document';

export async function getUserProjects(userId: string) {
  await connectDB();
  const projects = await Project.find({ userId: new mongoose.Types.ObjectId(userId) })
    .sort({ createdAt: -1 })
    .lean();

  const projectIds = projects.map((p) => p._id);
  const docCounts = await DocumentRecord.aggregate([
    { $match: { projectId: { $in: projectIds } } },
    { $group: { _id: '$projectId', count: { $sum: 1 } } },
  ]);

  const countMap = new Map(docCounts.map((d) => [d._id.toString(), d.count]));

  return projects.map((p) => ({
    ...p,
    _id: p._id.toString(),
    documentCount: countMap.get(p._id.toString()) || 0,
  }));
}

export async function getProjectContextPrompt(projectId?: string, userId?: string): Promise<string> {
  if (!projectId || !userId) return '';
  await connectDB();

  const project = await Project.findOne({
    _id: new mongoose.Types.ObjectId(projectId),
    userId: new mongoose.Types.ObjectId(userId),
  }).lean();

  if (!project) return '';

  return `
=== PROJECT WORKSPACE CONTEXT: "${project.name}" ===
Description: ${project.description || 'No description provided'}
Project Custom Instructions:
${project.customInstructions || 'Follow standard assistant guidelines for this project.'}
=== END OF PROJECT WORKSPACE CONTEXT ===
`.trim();
}

export async function createProject(params: {
  userId: string;
  name: string;
  description?: string;
  customInstructions?: string;
}) {
  await connectDB();
  return await Project.create({
    userId: new mongoose.Types.ObjectId(params.userId),
    name: params.name.trim(),
    description: params.description?.trim() || '',
    customInstructions: params.customInstructions?.trim() || '',
  });
}

export async function deleteProject(projectId: string, userId: string) {
  await connectDB();
  return await Project.findOneAndDelete({
    _id: new mongoose.Types.ObjectId(projectId),
    userId: new mongoose.Types.ObjectId(userId),
  });
}
