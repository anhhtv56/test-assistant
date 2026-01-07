export function extractProject(issueKey) {
  if(!issueKey || typeof issueKey !== 'string') {
    return null;
  }
  const match = issueKey.match(/^([A-Z][A-Z0-9]+)-\d+/i);
  return match ? match[1].toUpperCase() : null;
}

export async function findOrCreateProject(projectKey, userEmail){
  const Project = (await import('../models/Project.js')).default;
  if(!projectKey) {
    throw new Error('Project key is required');
  }
  const normalizedKey = projectKey.toUpperCase();
  let project = await Project.findOne({ projectKey: normalizedKey });
  if(!project) {
    project = new Project({
      projectKey: normalizedKey,
      createdBy: userEmail,
      firstGeneratedAt: new Date(),
      lastGeneratedAt: new Date(),
      totalGenerations: 0
    });
    await project.save();
  } else {
    project.lastGeneratedAt = new Date();
    await project.save();
  }
  return project;
}