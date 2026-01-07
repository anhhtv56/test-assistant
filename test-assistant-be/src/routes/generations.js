import { Router } from 'express'
import JiraService from '../services/jiraService.js'
import { requireAuth } from '../middleware/auth.js';
import { logger } from '../utils/logger.js';
import OpenAIService from '../services/openaiService.js';
import { extractProject, findOrCreateProject } from '../utils/projectUtils.js';
import Generation from '../models/Generation.js';

const router = Router();

let jiraService = null;
let openAiService = null;

export function getJiraService() {
  if (!jiraService) {
    try {
      jiraService = new JiraService();
    } catch (error) {
      throw new Error('Failed to initialize Jira Service: ' + error.message);
    }
  }
  return jiraService;
}

export function getOpenAIService() {
  if (!openAiService) {
    try {
      openAiService = new OpenAIService();
    } catch (error) {
      throw new Error('Failed to initialize OpenAI Service: ' + error.message);
    }
  }
  return openAiService;
}

router.post('/prelight', requireAuth, async (req, res, next) => {
  try {
    const { issueKey } = req.body;
    if (!issueKey) {
      return res.status(400).json({ success: false, message: 'issueKey required' });
    }
    // Fetch issue from jira
    const jira = getJiraService();
    const issueResult = await jira.getIssue(issueKey);
    console.log('Issue Result:', issueResult);
    if (!issueResult.success) {
      // Return appropriate status code based on error type
      const statusCode = issueResult.error.includes('authentication') || issueResult.error.includes('forbidden')
        ? 401
        : issueResult.error.includes('not found')
          ? 404
          : 500;
      return res.status(statusCode).json({ success: false, error: issueResult.error || 'Issue not found in JIRA' });
    }

    const issue = issueResult.issue;
    const fields = issue.fields;
    const summary = fields.summary || '';
    const description = jira.extractTextFromADF(fields.description) || '';

    // Count attachments
    const attachments = fields.attachment || [];
    const imageAttachments = attachments.filter(att => att.mimeType?.startsWith('image/'));

    // Estimate tokens
    const context = `${summary} ${description}`;
    const contextCharacters = context.length;
    const estimatedTokens = contextCharacters / 4 + imageAttachments.length * 200; // Rough estimate

    // Estimate cost (gpt-4o-mini pricing: $0.15/1M input tokens, $0.60/1M output tokens)
    const estimatedCost = (estimatedTokens / 1000000) * 0.15 + (8000 / 1000000) * 0.60; // Assume ~8k output tokens
    // return prelight data
    return res.json({
      isUiStory: true,
      issueKey,
      title: summary || 'NA',
      description,
      attachments: attachments.length,
      estimatedTokens,
      estimatedCost: estimatedCost.toFixed(4)
    });
  } catch (error) {
    next(error);
  }

});

router.post('/testcases', requireAuth, async (req, res, next) => {
  try {
    const { issueKey, autoMode } = req.body || {};
    if (!issueKey) {
      return res.status(400).json({ success: false, message: 'issueKey required' });
    }

    const projectKey = extractProject(issueKey);
    let project = null;
    if (projectKey) {
      try {
        project = await findOrCreateProject(projectKey, req.user.email);
        logger.info(`Project ${projectKey} found or created successfully.`);
      } catch (projectError) {
        logger.warn(`Failed to find or create project ${projectKey}:`, projectError);
      }
    }

    // Create generation document
    const generation = new Generation({
      issueKey,
      email: req.user.email,
      project: project ? project._id : null,
      mode: 'manual',
      startedAt: new Date(),
    });
    await generation.save();

    // Update project status
    if (project) {
      const Project = (await import('../models/Project.js')).default;
      const updateProject = await Project.findById(project._id);
      if (updateProject) {
        updateProject.totalGenerations = await Generation.countDocuments({ project: project._id });
        await updateProject.save();
      }
    }
    const startTime = Date.now();

    // Fetch issue from jira
    const jira = getJiraService();
    const issueResult = await jira.getIssue(issueKey);
    if (!issueResult.success) {
      generation.status = 'failed';
      generation.error = issueResult.error || 'Issue not found in JIRA';
      generation.completedAt = new Date();
      await generation.save();
      return res.status(404).json({ success: false, error: issueResult.error || 'Issue not found in JIRA' });
    }

    const issue = issueResult.issue;
    const fields = issue.fields;
    const summary = fields.summary || '';
    const description = jira.extractTextFromADF(fields.description) || '';

    const context = `Title: ${summary} Description: ${description}`;

    let markdownContent = '';
    let tokenUsage = null;
    let cost = null;
    try {
      const openAi = getOpenAIService();
      logger.info(`Starting test case generation for issue ${issueKey} in manual`);
      const result = await openAi.generateTestCases(context, issueKey);

      // Handle response format
      if (typeof result === 'string') {
        markdownContent = result;
        tokenUsage = result.tokenUsage;
        cost = result.cost;
      } else {
        markdownContent = result.content;
        tokenUsage = result.tokenUsage;
        cost = result.cost;
      }

      // Ensure we have a proper title
      if (!markdownContent.startsWith('#')) {
        markdownContent = `# Test Cases for ${issueKey}: ${summary || 'Untitled'}\n\n ` + markdownContent;
      }
    } catch (error) {
      logger.error(`OpenAI generation failed: ${error.message}`);
      generation.status = 'failed';
      generation.error = `OpenAI generation failed: ${error.message}`;
      generation.completedAt = new Date();
      await generation.save();
      return res.status(500).json({ success: false, error: error.message || 'Failed to generate test cases' });
    }

    // Calculate generate time
    const generationTimeSeconds = (Date.now() - startTime) / 1000;

    // Update generation document
    generation.status = 'completed';
    generation.completedAt = new Date();
    generation.generationTimeSeconds = Math.round(generationTimeSeconds * 100) / 100; // Round to 2 decimals
    generation.cost = cost;
    generation.tokenUsage = tokenUsage;
    generation.result = {
      markdown: {
        filename: `${issueKey}_testcases_${generation._id}.md`,
        content: markdownContent
      }
    };

    // Initialize version tracking
    generation.currentVersion = 1;
    generation.versions = []; // Versions array will be populated on first edit

    await generation.save();
    logger.info({
      success: true,
      data: {
        generationId: String(generation._id),
        issueKey,
        markdown: generation.result.markdown,
        generationTimeSeconds: generation.generationTimeSeconds,
        cost: generation.cost
      }
    });
    return res.json({
      success: true,
      data: {
        generationId: String(generation._id),
        issueKey,
        markdown: generation.result.markdown,
        generationTimeSeconds: generation.generationTimeSeconds,
        cost: generation.cost
      }
    });
  } catch (error) {
    next(error);
  }
});

router.get('/:id/view', requireAuth, async (req, res, next) => {
  try {
    const gen = await Generation.findById(req.params.id);
    if (!gen) {
      return res.status(404).json({ success: false, error: 'Not found' });
    }

    const isOwner = gen.email === req.user.email;
    const isPublishedAndCompleted = gen.published && gen.status === 'completed';

    if (!isOwner && !isPublishedAndCompleted) {
      return res.status(403).json({ success: false, error: 'Access denied' });
    }

    const latestVersion = gen.versions && gen.versions.length > 0
      ? gen.versions[gen.versions.length - 1]
      : null;
    return res.json({
      success: true,
      data: {
        content: gen.result?.markdown?.content || '',
        filename: gen.result?.markdown?.filename || 'output.md',
        format: 'markdown',
        published: gen.published || false,
        publishedAt: gen.publishedAt,
        publishedBy: gen.publishedBy,
        currentVersion: gen.currentVersion || 1,
        versions: gen.versions || [],
        lastUpdatedBy: latestVersion?.updatedBy || gen.email,
        lastUpdatedAt: latestVersion?.updatedAt || gen.updatedAt || gen.createdAt
      }
    });
  } catch (error) {
    next(error);
  }
});

export default router;