'use client';

import { useState } from 'react';
import { X, AlertTriangle, Flame, Heart, Car, HelpCircle } from 'lucide-react';
import { createBrowserClient } from '@supabase/ssr';

interface TestIncidentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  departmentId: string;
}

const incidentTemplates = [
  {
    id: 'structure_fire',
    label: 'Structure Fire',
    icon: Flame,
    color: 'text-red-600 bg-red-100',
    data: {
      incident_type: 'Structure Fire',
      priority: 'high',
      address: '123 Main Street',
      city: 'Hillside',
      cross_street: 'Oak Ave & Main St',
      notes: 'Working fire reported. Multiple callers.',
    },
  },
  {
    id: 'medical',
    label: 'Medical Emergency',
    icon: Heart,
    color: 'text-pink-600 bg-pink-100',
    data: {
      incident_type: 'Medical Emergency',
      priority: 'high',
      address: '456 Oak Avenue',
      city: 'Hillside',
      notes: 'Chest pain. Patient is conscious.',
    },
  },
  {
    id: 'mva',
    label: 'Motor Vehicle Accident',
    icon: Car,
    color: 'text-orange-600 bg-orange-100',
    data: {
      incident_type: 'MVA',
      priority: 'medium',
      address: 'Highway 9 @ Mile Marker 42',
      city: 'Hillside',
      notes: '2 vehicle accident. Unknown injuries.',
    },
  },
  {
    id: 'alarm',
    label: 'Fire Alarm',
    icon: AlertTriangle,
    color: 'text-yellow-600 bg-yellow-100',
    data: {
      incident_type: 'Fire Alarm',
      priority: 'low',
      address: '789 Commercial Blvd',
      city: 'Hillside',
      notes: 'Commercial fire alarm activation. No visible smoke.',
    },
  },
  {
    id: 'other',
    label: 'Other / Custom',
    icon: HelpCircle,
    color: 'text-gray-600 bg-gray-100',
    data: {
      incident_type: 'Service Call',
      priority: 'low',
      address: '321 Elm Street',
      city: 'Hillside',
      notes: '',
    },
  },
];

export function TestIncidentModal({ isOpen, onClose, onSuccess, departmentId }: TestIncidentModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedTemplate, setSelectedTemplate] = useState('structure_fire');
  const [formData, setFormData] = useState(incidentTemplates[0].data);

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  function handleTemplateChange(templateId: string) {
    setSelectedTemplate(templateId);
    const template = incidentTemplates.find(t => t.id === templateId);
    if (template) {
      setFormData(template.data);
    }
  }

  function handleInputChange(field: string, value: string) {
    setFormData(prev => ({ ...prev, [field]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    // Generate a CAD ID
    const cadId = `TEST-${Date.now().toString(36).toUpperCase()}`;

    const { error: insertError } = await supabase.from('incidents').insert({
      department_id: departmentId,
      cad_incident_id: cadId,
      incident_type: formData.incident_type,
      priority: formData.priority,
      status: 'dispatched',
      address: formData.address,
      city: formData.city,
      cross_street: formData.cross_street || null,
      notes: formData.notes || null,
      dispatched_at: new Date().toISOString(),
    });

    if (insertError) {
      setError(insertError.message);
      setIsLoading(false);
      return;
    }

    setIsLoading(false);
    onSuccess();
    onClose();
  }

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-screen items-center justify-center p-4">
        <div className="fixed inset-0 bg-black/50" onClick={onClose} />
        <div className="relative bg-white rounded-lg shadow-xl max-w-lg w-full p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-xl font-semibold">Send Test Incident</h2>
              <p className="text-sm text-gray-500">Create a test incident to verify your setup</p>
            </div>
            <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded">
              <X className="h-5 w-5" />
            </button>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
              {error}
            </div>
          )}

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">Quick Templates</label>
            <div className="grid grid-cols-5 gap-2">
              {incidentTemplates.map((template) => (
                <button
                  key={template.id}
                  type="button"
                  onClick={() => handleTemplateChange(template.id)}
                  className={`p-3 rounded-lg border-2 transition-colors flex flex-col items-center gap-1 ${
                    selectedTemplate === template.id
                      ? 'border-fire-500 bg-fire-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className={`p-2 rounded-lg ${template.color}`}>
                    <template.icon className="h-4 w-4" />
                  </div>
                  <span className="text-xs text-center">{template.label}</span>
                </button>
              ))}
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Incident Type *</label>
                <input
                  type="text"
                  value={formData.incident_type}
                  onChange={(e) => handleInputChange('incident_type', e.target.value)}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-fire-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Priority *</label>
                <select
                  value={formData.priority}
                  onChange={(e) => handleInputChange('priority', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-fire-500"
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                  <option value="critical">Critical</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Address *</label>
              <input
                type="text"
                value={formData.address}
                onChange={(e) => handleInputChange('address', e.target.value)}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-fire-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">City</label>
                <input
                  type="text"
                  value={formData.city}
                  onChange={(e) => handleInputChange('city', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-fire-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Cross Street</label>
                <input
                  type="text"
                  value={formData.cross_street || ''}
                  onChange={(e) => handleInputChange('cross_street', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-fire-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Notes / Details</label>
              <textarea
                value={formData.notes}
                onChange={(e) => handleInputChange('notes', e.target.value)}
                rows={2}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-fire-500"
              />
            </div>

            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
              <p className="text-sm text-amber-800">
                <strong>Test Mode:</strong> This will create a real incident in your system.
                Members will receive notifications if alerts are enabled.
              </p>
            </div>

            <div className="flex justify-end gap-3 pt-2">
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
                {isLoading ? 'Sending...' : 'Send Test Incident'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
