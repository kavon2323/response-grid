'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Webhook,
  Mail,
  RefreshCw,
  Edit2,
  Plus,
  Trash2,
  CheckCircle,
  XCircle,
  Play,
  Copy,
  Check,
} from 'lucide-react';
import { createBrowserClient } from '@supabase/ssr';
import { AddCADSourceModal } from './modals/AddCADSourceModal';
import { TestIncidentModal } from './modals/TestIncidentModal';

interface CADSource {
  id: string;
  name: string;
  source_type: string;
  config: Record<string, any>;
  is_active: boolean;
  created_at: string;
}

interface CADSourcesManagerProps {
  departmentId: string;
}

const sourceTypeIcons: Record<string, any> = {
  webhook: Webhook,
  email: Mail,
  api_poll: RefreshCw,
  manual: Edit2,
};

const sourceTypeLabels: Record<string, string> = {
  webhook: 'Webhook',
  email: 'Email Parsing',
  api_poll: 'API Polling',
  manual: 'Manual Entry',
};

export function CADSourcesManager({ departmentId }: CADSourcesManagerProps) {
  const [sources, setSources] = useState<CADSource[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isTestModalOpen, setIsTestModalOpen] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const router = useRouter();

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  useEffect(() => {
    loadSources();
  }, []);

  async function loadSources() {
    const { data } = await supabase
      .from('cad_sources')
      .select('*')
      .eq('department_id', departmentId)
      .order('created_at', { ascending: false });

    setSources(data || []);
    setIsLoading(false);
  }

  async function toggleActive(sourceId: string, currentState: boolean) {
    await supabase
      .from('cad_sources')
      .update({ is_active: !currentState })
      .eq('id', sourceId);

    loadSources();
  }

  async function deleteSource(sourceId: string) {
    if (!confirm('Are you sure you want to delete this CAD source?')) return;

    await supabase.from('cad_sources').delete().eq('id', sourceId);
    loadSources();
  }

  function copyApiKey(apiKey: string, sourceId: string) {
    navigator.clipboard.writeText(apiKey);
    setCopiedId(sourceId);
    setTimeout(() => setCopiedId(null), 2000);
  }

  if (isLoading) {
    return <div className="animate-pulse h-48 bg-gray-100 rounded-lg" />;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-medium text-gray-900">CAD Sources</h3>
          <p className="text-sm text-gray-500">Connect your dispatch system to receive incidents</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setIsTestModalOpen(true)}
            className="flex items-center gap-2 px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 text-sm"
          >
            <Play className="h-4 w-4" />
            Test Incident
          </button>
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="flex items-center gap-2 px-3 py-2 bg-fire-600 text-white rounded-lg hover:bg-fire-700 text-sm"
          >
            <Plus className="h-4 w-4" />
            Add Source
          </button>
        </div>
      </div>

      {sources.length === 0 ? (
        <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
          <Webhook className="h-12 w-12 mx-auto text-gray-400 mb-4" />
          <h3 className="font-medium text-gray-900 mb-2">No CAD Sources Configured</h3>
          <p className="text-sm text-gray-500 mb-4">
            Connect your CAD system via webhook, email parsing, or API polling
          </p>
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="px-4 py-2 bg-fire-600 text-white rounded-lg hover:bg-fire-700"
          >
            Add CAD Source
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {sources.map((source) => {
            const Icon = sourceTypeIcons[source.source_type] || Webhook;
            return (
              <div
                key={source.id}
                className={`border rounded-lg p-4 ${
                  source.is_active ? 'border-gray-200' : 'border-gray-200 bg-gray-50'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3">
                    <div className={`p-2 rounded-lg ${source.is_active ? 'bg-fire-100' : 'bg-gray-200'}`}>
                      <Icon className={`h-5 w-5 ${source.is_active ? 'text-fire-600' : 'text-gray-500'}`} />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="font-medium text-gray-900">{source.name}</h4>
                        {source.is_active ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-green-100 text-green-700 text-xs rounded-full">
                            <CheckCircle className="h-3 w-3" />
                            Active
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-gray-100 text-gray-600 text-xs rounded-full">
                            <XCircle className="h-3 w-3" />
                            Inactive
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-500">{sourceTypeLabels[source.source_type]}</p>

                      {/* Show API key for webhooks */}
                      {source.source_type === 'webhook' && source.config?.api_key && (
                        <div className="mt-2 flex items-center gap-2">
                          <span className="text-xs text-gray-500">API Key:</span>
                          <code className="text-xs bg-gray-100 px-2 py-1 rounded">
                            {source.config.api_key.slice(0, 8)}...
                          </code>
                          <button
                            onClick={() => copyApiKey(source.config.api_key, source.id)}
                            className="p-1 hover:bg-gray-100 rounded"
                          >
                            {copiedId === source.id ? (
                              <Check className="h-3 w-3 text-green-600" />
                            ) : (
                              <Copy className="h-3 w-3 text-gray-400" />
                            )}
                          </button>
                        </div>
                      )}

                      {/* Show endpoint for API polling */}
                      {source.source_type === 'api_poll' && source.config?.endpoint && (
                        <div className="mt-2">
                          <span className="text-xs text-gray-500">Endpoint: </span>
                          <code className="text-xs bg-gray-100 px-2 py-1 rounded">
                            {source.config.endpoint}
                          </code>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => toggleActive(source.id, source.is_active)}
                      className={`px-3 py-1 text-sm rounded-lg ${
                        source.is_active
                          ? 'text-gray-600 hover:bg-gray-100'
                          : 'text-green-600 hover:bg-green-50'
                      }`}
                    >
                      {source.is_active ? 'Disable' : 'Enable'}
                    </button>
                    <button
                      onClick={() => deleteSource(source.id)}
                      className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <div className="mt-4 p-4 bg-blue-50 rounded-lg">
        <h4 className="font-medium text-blue-900 mb-2">Supported Integrations</h4>
        <ul className="text-sm text-blue-700 space-y-1">
          <li>• <strong>Webhook:</strong> Receive POST requests from any CAD system</li>
          <li>• <strong>Email Parsing:</strong> Forward dispatch emails for automatic parsing</li>
          <li>• <strong>Active911 / IamResponding:</strong> Direct API integration</li>
          <li>• <strong>Manual Entry:</strong> Create incidents directly from dashboard</li>
        </ul>
      </div>

      <AddCADSourceModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSuccess={() => {
          setIsAddModalOpen(false);
          loadSources();
        }}
        departmentId={departmentId}
      />

      <TestIncidentModal
        isOpen={isTestModalOpen}
        onClose={() => setIsTestModalOpen(false)}
        onSuccess={() => {
          router.push('/incidents');
        }}
        departmentId={departmentId}
      />
    </div>
  );
}
