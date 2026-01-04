import { Router } from 'express'
import JiraService from '../services/jiraServices.js'
import { requireAuth } from '../middleware/auth.js';
import { logger } from '../utils/logger.js';

const router = Router();

let jiraService = null;

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

export default router;