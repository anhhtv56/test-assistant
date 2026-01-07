import { useState } from 'react';
import api from '../lib/api';
import { Link } from 'react-router-dom';

export default function GeneratePage() {

  const [issueKey, setIssueKey] = useState('');
  const [prelight, setPrelight] = useState<any | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [genResult, setGenResult] = useState<any | null>(null);

  async function analyze() {
    setAnalyzing(true);
    setPrelight(null);
    if (!issueKey.trim()) return;
    try {
      const res = await api.post('/generations/prelight', { issueKey: issueKey.trim() });
      setPrelight(res.data);
    } catch (err: any) {
      setPrelight({ error: err?.response?.data?.error || 'Analysis failed' });
    } finally {
      setAnalyzing(false);
    }
  }

  async function performGeneration() {
    if (!issueKey.trim()) return;
    setGenerating(true);
    try {
      const response = await api.post('/generations/testcases', { issueKey: issueKey.trim() });
      setGenResult(response.data.data);
    } catch (err: any) {
      setGenResult({ error: err?.response?.data?.error || 'Generation failed' });
    } finally {
      setGenerating(false);
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
            onClick={performGeneration}
            disabled={!issueKey.trim() || generating}
            className="px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg font-medium hover:from-indigo-700 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {generating ? 'Generating...' : 'Generate'}
          </button>
        </div>
      </div>
      {/* Preflight Results */}
      {prelight && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Analysis Results</h2>
          {prelight.error ? (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
              {prelight.error}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-3">
                <div>
                  <span className="text-sm font-medium text-gray-500">Issue Key</span>
                  <p className="text-lg font-semibold text-gray-900">{prelight.issueKey}</p>
                </div>
                <div>
                  <span className="text-sm font-medium text-gray-500">Title</span>
                  <p className="text-gray-900">{prelight.title}</p>
                </div>
                <div>
                  <span className="text-sm font-medium text-gray-500">UI Story</span>
                  <p className={`font-semibold ${prelight.isUiStory ? 'text-green-600' : 'text-gray-600'}`}>
                    {prelight.isUiStory ? 'Yes' : 'No'}
                  </p>
                </div>
              </div>
              <div className="space-y-3">
                <div>
                  <span className="text-sm font-medium text-gray-500">Attachments</span>
                  <p className="text-gray-900">{prelight.attachments || 0}</p>
                </div>
                <div>
                  <span className="text-sm font-medium text-gray-500">Estimated Tokens</span>
                  <p className="text-gray-900">{prelight.estimatedTokens || 0}</p>
                </div>
                <div>
                  <span className="text-sm font-medium text-gray-500">Estimated Cost</span>
                  <p className="text-gray-900">${typeof prelight.estimatedCost === 'string' ? prelight.estimatedCost : (Number(prelight.estimatedCost) || 0).toFixed(4)}</p>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
      {/* Generation Results */}
      {genResult && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Generation Complete</h2>
          {genResult.error ? (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
              {genResult.error}
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-sm font-medium text-gray-500">Issue Key</span>
                  <p className="text-lg font-semibold text-gray-900">{genResult.issueKey}</p>
                </div>
                <div className="text-right">
                  <span className="text-sm font-medium text-gray-500">Generation Time</span>
                  <p className="text-lg font-semibold text-gray-900">
                    {typeof genResult.generationTimeSeconds === 'string'
                      ? `${genResult.generationTimeSeconds}s`
                      : `${(Number(genResult.generationTimeSeconds) || 0).toFixed(1)}s`}
                  </p>
                </div>
              </div>
              {genResult.markdown && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <p className="text-sm text-green-800">
                    ✅ Test cases generated successfully! <Link to={`/view/${genResult.generationId}`} className="font-semibold underline hover:text-green-900">View Test Cases</Link>
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}