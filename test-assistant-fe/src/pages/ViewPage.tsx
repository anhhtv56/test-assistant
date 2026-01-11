import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import api from "../lib/api";

export default function ViewPage() {
  const { id } = useParams<{ id: string }>();
  const [content, setContent] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const setup = () => {
    (async () => {
      if (!id) return;

      setLoading(true);
      setError(null);

      try {
        const res = await api.get(`/generations/${id}/view`);
        setContent(res.data.data.content);
      } catch (err: any) {
        setError(err?.response?.data?.error || 'Failed to load content');
        setContent('');
      } finally {
        setLoading(false);
      }
    })();
  }

  useEffect(setup, [id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-10 w-10 border-2 border-indigo-200 border-t-indigo-600 mx-auto"></div>
          <p className="mt-4 text-sm text-gray-500">Loading content...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 max-w-md w-full">
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
            {error}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="p-8 prose prose-sm max-w-none 
            prose-p:text-gray-700 prose-p:leading-relaxed prose-p:mb-4
            prose-ul:list-disc prose-ul:ml-6 prose-ul:my-4
            prose-ol:list-decimal prose-ol:ml-6 prose-ol:my-4
            prose-li:text-gray-700 prose-li:my-1.5
            prose-strong:text-gray-900 prose-strong:font-semibold 
            prose-a:text-indigo-600 prose-a:no-underline hover:prose-a:underline
            prose-headings:text-gray-900 prose-headings:font-semibold prose-headings:mb-3 prose-headings:mt-6">
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              components={{
                // Custom styling for inline code
                code({ className, children, ...props }: any) {
                  const match = /language-(\w+)/.exec(className || '');
                  const isInlineCode = !match;

                  return isInlineCode ? (
                    <code className="bg-indigo-50 text-indigo-600 px-1.5 py-0.5 rounded text-sm font-mono" {...props}>
                      {children}
                    </code>
                  ) : (
                    <code className={className} {...props}>
                      {children}
                    </code>
                  );
                },
                // Custom styling for code blocks
                pre({ children, ...props }: any) {
                  return (
                    <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto my-4 text-sm font-mono" {...props}>
                      {children}
                    </pre>
                  );
                },
                // Custom styling for headings
                h1({ children }) {
                  return <h1 className="text-3xl font-bold text-gray-900 border-b border-gray-200 pb-2 mb-4 mt-6">{children}</h1>;
                },
                h2({ children }) {
                  return <h2 className="text-2xl font-bold text-gray-900 mt-6 mb-4">{children}</h2>;
                },
                h3({ children }) {
                  return <h3 className="text-xl font-bold text-gray-900 mt-4 mb-3">{children}</h3>;
                },
              }}
            >
              {content}
            </ReactMarkdown>
          </div>
        </div>
      </div>
    </div>
  );
}