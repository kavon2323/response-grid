'use client';

import { useState } from 'react';
import { X, Copy, Check } from 'lucide-react';
import { createBrowserClient } from '@supabase/ssr';

interface AddCADSourceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  departmentId: string;
}

const sourceTypes = [
  { value: 'webhook', label: 'Webhook', description: 'Receive POST requests from CAD system' },
  { value: 'email', label: 'Email Parsing', description: 'Parse forwarded dispatch emails' },
  { value: 'api_poll', label: 'API Polling', description: 'Poll external API for new incidents' },
  { value: 'manual', label: 'Manual Entry', description: 'Manually enter incidents' },
];

export function AddCADSourceModal({ isOpen, onClose, onSuccess, departmentId }: AddCADSourceModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sourceType, setSourceType] = useState('webhook');
  const [copied, setCopied] = useState(false);

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  // Generate a webhook URL for this department
  const webhookUrl = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/cad-webhook?dept=${departmentId}`;

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    const formData = new FormData(e.currentTarget);

    const config: Record<string, any> = {};

    if (sourceType === 'webhook') {
      config.api_key = crypto.randomUUID();
    } else if (sourceType === 'email') {
      config.email_address = formData.get('email_address');
      config.parsing_rules = formData.get('parsing_rules') || 'default';
    } else if (sourceType === 'api_poll') {
      config.endpoint = formData.get('endpoint');
      config.api_key = formData.get('api_key');
      config.poll_interval = parseInt(formData.get('poll_interval') as string) || 60;
    }

    const { error: insertError } = await supabase.from('cad_sources').insert({
      department_id: departmentId,
      name: formData.get('name'),
      source_type: sourceType,
      config,
      is_active: true,
    });

    if (insertError) {
      setError(insertError.message);
      setIsLoading(false);
      return;
    }

    setIsLoading(false);
    onSuccess();
  }

  function copyToClipboard(text: string) {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-screen items-center justify-center p-4">
        <div className="fixed inset-0 bg-black/50" onClick={onClose} />
        <div className="relative bg-white rounded-lg shadow-xl max-w-lg w-full p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold">Add CAD Source</h2>
            <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded">
              <X className="h-5 w-5" />
            </button>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Source Name *</label>
              <input
                type="text"
                name="name"
                required
                placeholder="County CAD System"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-fire-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Integration Type *</label>
              <div className="grid grid-cols-2 gap-3">
                {sourceTypes.map((type) => (
                  <button
                    key={type.value}
                    type="button"
                    onClick={() => setSourceType(type.value)}
                    className={`p-3 text-left border-2 rounded-lg transition-colors ${
                      sourceType === type.value
                        ? 'border-fire-500 bg-fire-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <p className="font-medium text-sm">{type.label}</p>
                    <p className="text-xs text-gray-500 mt-1">{type.description}</p>
                  </button>
                ))}
              </div>
            </div>

            {/* Webhook Config */}
            {sourceType === 'webhook' && (
              <div className="p-4 bg-blue-50 rounded-lg space-y-3">
                <p className="text-sm font-medium text-blue-900">Webhook Configuration</p>
                <p className="text-xs text-blue-700">
                  Your CAD system will POST incident data to this endpoint. An API key will be generated automatically.
                </p>
                <div>
                  <label className="block text-xs font-medium text-blue-800 mb-1">Webhook URL</label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      readOnly
                      value={webhookUrl}
                      className="flex-1 px-3 py-2 bg-white border border-blue-200 rounded-lg text-sm"
                    />
                    <button
                      type="button"
                      onClick={() => copyToClipboard(webhookUrl)}
                      className="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                    >
                      {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Email Config */}
            {sourceType === 'email' && (
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Forwarding Email</label>
                  <input
                    type="email"
                    name="email_address"
                    placeholder="dispatch@yourdept.fireresponse.app"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-fire-500"
                  />
                  <p className="text-xs text-gray-500 mt-1">Forward dispatch emails to this address</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Parsing Template</label>
                  <select
                    name="parsing_rules"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-fire-500"
                  >
                    <option value="default">Default (Auto-detect)</option>
                    <option value="active911">Active911 Format</option>
                    <option value="iamresponding">IamResponding Format</option>
                    <option value="custom">Custom Template</option>
                  </select>
                </div>
              </div>
            )}

            {/* API Polling Config */}
            {sourceType === 'api_poll' && (
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">API Endpoint *</label>
                  <input
                    type="url"
                    name="endpoint"
                    required
                    placeholder="https://api.yourcad.com/incidents"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-fire-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">API Key</label>
                  <input
                    type="password"
                    name="api_key"
                    placeholder="Your CAD system API key"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-fire-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Poll Interval (seconds)</label>
                  <input
                    type="number"
                    name="poll_interval"
                    defaultValue={60}
                    min={30}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-fire-500"
                  />
                </div>
              </div>
            )}

            {/* Manual Entry Info */}
            {sourceType === 'manual' && (
              <div className="p-4 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-600">
                  Manual entry allows command staff to create incidents directly from the dashboard.
                  No additional configuration required.
                </p>
              </div>
            )}

            <div className="flex justify-end gap-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isLoading}
                className="px-4 py-2 bg-fire-600 text-white rounded-lg hover:bg-fire-700 disabled:opacity-50"
              >
                {isLoading ? 'Adding...' : 'Add CAD Source'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
