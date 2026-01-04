import { useState } from 'react';
import api from '../lib/api';

export default function GeneratePage() {

  const [issueKey, setIssueKey] = useState('');
  const [prelight, setPrelight] = useState<any | null>(null);
  const [analyzing, setAnalyzing] = useState(false);

  async function analyze() {
    setAnalyzing(true);
    setPrelight(null);
    if (!issueKey.trim()) return;
    try {
      const res = await api.post('/generations/prelight', { issueKey: issueKey.trim() });
      console.log('Analysis result:', res);
      setPrelight(res);
    } catch (err: any) {
      console.log('Come to try catch error');
      console.log('Analysis error:', err);
      setPrelight({ error: err?.response?.data?.error || 'Analysis failed' });
    } finally {
      setAnalyzing(false);
    }
  }
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bo ld text-gray-900">Generate Test Cases</h1>
        <p className="mt-2 text-gray-600">Enter a JIRA issue key to analyze and generate comprehensive test cases</p>
      </div>

      {/* Input Card */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex gap-3">
          <input
            type="text"
            value={issueKey}
            onChange={(e) => setIssueKey(e.target.value)}
            placeholder="Enter JIRA issue key (e.g., SDETPRO-123)"
            className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all"
          />
          <button
            onClick={analyze}
            disabled={analyzing || !issueKey.trim()}
            className="px-6 py-3 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"

          >
            {analyzing ? 'Analyzing...' : 'Analyze'}
          </button>
          <button
            onClick={() => console.log('Generate clicked:', issueKey)}
            disabled={!issueKey.trim()}
            className="px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg font-medium hover:from-indigo-700 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Generate
          </button>
        </div>
      </div>
      {/* prelight Results */}
      {prelight && (
        <div>
          <h2> Analysis results</h2>
          {prelight.error ? (
            <div>{prelight.error}</div>
          ) : (
            <div>RESULT</div>
          )}
        </div>
      )}
    </div>
  )
}