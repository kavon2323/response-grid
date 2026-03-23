'use client';

import { useState } from 'react';
import { X, CheckCircle, XCircle, AlertTriangle } from 'lucide-react';
import { createBrowserClient } from '@supabase/ssr';

interface LogCheckModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  apparatusId: string;
  departmentId: string;
}

interface ChecklistItem {
  id: string;
  name: string;
  category: string;
  passed: boolean | null;
  notes: string;
}

const DEFAULT_CHECKLIST: Omit<ChecklistItem, 'passed' | 'notes'>[] = [
  // Exterior
  { id: 'lights_emergency', name: 'Emergency Lights Working', category: 'Exterior' },
  { id: 'lights_headlights', name: 'Headlights Working', category: 'Exterior' },
  { id: 'lights_taillights', name: 'Taillights/Brake Lights', category: 'Exterior' },
  { id: 'sirens', name: 'Sirens Working', category: 'Exterior' },
  { id: 'tires', name: 'Tire Condition/Pressure', category: 'Exterior' },
  { id: 'body_damage', name: 'No Body Damage', category: 'Exterior' },
  { id: 'mirrors', name: 'Mirrors Intact', category: 'Exterior' },

  // Fluids
  { id: 'fuel_level', name: 'Fuel Level Adequate', category: 'Fluids' },
  { id: 'oil_level', name: 'Oil Level', category: 'Fluids' },
  { id: 'coolant_level', name: 'Coolant Level', category: 'Fluids' },
  { id: 'windshield_fluid', name: 'Windshield Washer Fluid', category: 'Fluids' },
  { id: 'hydraulic_fluid', name: 'Hydraulic Fluid (if applicable)', category: 'Fluids' },

  // Interior
  { id: 'radio', name: 'Radio Check', category: 'Interior' },
  { id: 'gauges', name: 'Dashboard Gauges', category: 'Interior' },
  { id: 'hvac', name: 'HVAC System', category: 'Interior' },
  { id: 'seat_belts', name: 'Seat Belts', category: 'Interior' },
  { id: 'mdt', name: 'MDT/Computer (if equipped)', category: 'Interior' },

  // Equipment
  { id: 'scba', name: 'SCBA Bottles Full', category: 'Equipment' },
  { id: 'tools', name: 'Tools Secured', category: 'Equipment' },
  { id: 'hose', name: 'Hose Load Intact', category: 'Equipment' },
  { id: 'medical', name: 'Medical Equipment', category: 'Equipment' },
  { id: 'extinguisher', name: 'Fire Extinguisher', category: 'Equipment' },
  { id: 'inventory', name: 'Equipment Inventory Complete', category: 'Equipment' },
];

export function LogCheckModal({
  isOpen,
  onClose,
  onSuccess,
  apparatusId,
  departmentId,
}: LogCheckModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [checklist, setChecklist] = useState<ChecklistItem[]>(
    DEFAULT_CHECKLIST.map((item) => ({ ...item, passed: null, notes: '' }))
  );
  const [checkType, setCheckType] = useState('daily');
  const [fuelLevel, setFuelLevel] = useState<string>('');
  const [odometer, setOdometer] = useState<string>('');
  const [overallNotes, setOverallNotes] = useState('');

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const updateChecklistItem = (id: string, field: 'passed' | 'notes', value: any) => {
    setChecklist((prev) =>
      prev.map((item) => (item.id === id ? { ...item, [field]: value } : item))
    );
  };

  const setAllPassed = () => {
    setChecklist((prev) => prev.map((item) => ({ ...item, passed: true })));
  };

  const calculateStatus = (): 'passed' | 'failed' | 'needs_attention' => {
    const checkedItems = checklist.filter((item) => item.passed !== null);
    if (checkedItems.length === 0) return 'passed';

    const failedItems = checkedItems.filter((item) => item.passed === false);
    if (failedItems.length === 0) return 'passed';

    // Check if any critical items failed
    const criticalItems = ['lights_emergency', 'sirens', 'radio', 'scba', 'fuel_level'];
    const criticalFailed = failedItems.some((item) => criticalItems.includes(item.id));

    return criticalFailed ? 'failed' : 'needs_attention';
  };

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    // Get current user
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setError('You must be logged in to log a check');
      setIsLoading(false);
      return;
    }

    // Get user profile
    const { data: userProfile } = await supabase
      .from('users')
      .select('id')
      .eq('auth_id', user.id)
      .single();

    if (!userProfile) {
      setError('User profile not found');
      setIsLoading(false);
      return;
    }

    const status = calculateStatus();
    const checklistItems = checklist
      .filter((item) => item.passed !== null)
      .map((item) => ({
        item: item.name,
        category: item.category,
        passed: item.passed,
        notes: item.notes || null,
      }));

    const issuesFound = checklist
      .filter((item) => item.passed === false)
      .map((item) => ({
        description: `${item.name} - ${item.notes || 'Failed check'}`,
        severity: ['lights_emergency', 'sirens', 'radio', 'scba'].includes(item.id)
          ? 'high'
          : 'medium',
      }));

    const { error: insertError } = await supabase.from('apparatus_checks').insert({
      apparatus_id: apparatusId,
      department_id: departmentId,
      check_type: checkType,
      performed_by_user_id: userProfile.id,
      check_date: new Date().toISOString().split('T')[0],
      odometer_reading: odometer ? parseInt(odometer) : null,
      fuel_level: fuelLevel ? parseInt(fuelLevel) : null,
      status,
      checklist_items: checklistItems,
      overall_notes: overallNotes || null,
      issues_found: issuesFound,
    });

    if (insertError) {
      setError(insertError.message);
      setIsLoading(false);
      return;
    }

    setIsLoading(false);
    // Reset form
    setChecklist(DEFAULT_CHECKLIST.map((item) => ({ ...item, passed: null, notes: '' })));
    setFuelLevel('');
    setOdometer('');
    setOverallNotes('');
    onSuccess();
    onClose();
  }

  if (!isOpen) return null;

  const categories = Array.from(new Set(checklist.map((item) => item.category)));
  const passedCount = checklist.filter((item) => item.passed === true).length;
  const failedCount = checklist.filter((item) => item.passed === false).length;
  const uncheckedCount = checklist.filter((item) => item.passed === null).length;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-screen items-center justify-center p-4">
        <div className="fixed inset-0 bg-black/50" onClick={onClose} />
        <div className="relative bg-white rounded-lg shadow-xl max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold">Log Apparatus Check</h2>
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
            {/* Check Type and Readings */}
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Check Type *
                </label>
                <select
                  value={checkType}
                  onChange={(e) => setCheckType(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-fire-500"
                >
                  <option value="daily">Daily</option>
                  <option value="weekly">Weekly</option>
                  <option value="monthly">Monthly</option>
                  <option value="annual">Annual</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Fuel Level (%)
                </label>
                <input
                  type="number"
                  value={fuelLevel}
                  onChange={(e) => setFuelLevel(e.target.value)}
                  min="0"
                  max="100"
                  placeholder="0-100"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-fire-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Odometer
                </label>
                <input
                  type="number"
                  value={odometer}
                  onChange={(e) => setOdometer(e.target.value)}
                  min="0"
                  placeholder="Miles"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-fire-500"
                />
              </div>
            </div>

            {/* Quick Actions */}
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-4 text-sm">
                <span className="flex items-center gap-1 text-green-600">
                  <CheckCircle className="h-4 w-4" />
                  {passedCount} Passed
                </span>
                <span className="flex items-center gap-1 text-red-600">
                  <XCircle className="h-4 w-4" />
                  {failedCount} Failed
                </span>
                <span className="flex items-center gap-1 text-gray-500">
                  <AlertTriangle className="h-4 w-4" />
                  {uncheckedCount} Unchecked
                </span>
              </div>
              <button
                type="button"
                onClick={setAllPassed}
                className="px-3 py-1 text-sm bg-green-100 text-green-700 rounded hover:bg-green-200"
              >
                Mark All Passed
              </button>
            </div>

            {/* Checklist by Category */}
            <div className="space-y-4">
              {categories.map((category) => (
                <div key={category} className="border border-gray-200 rounded-lg">
                  <div className="px-4 py-2 bg-gray-50 border-b border-gray-200">
                    <h3 className="font-medium text-gray-900">{category}</h3>
                  </div>
                  <div className="divide-y divide-gray-100">
                    {checklist
                      .filter((item) => item.category === category)
                      .map((item) => (
                        <div key={item.id} className="p-3">
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-gray-700">{item.name}</span>
                            <div className="flex items-center gap-2">
                              <button
                                type="button"
                                onClick={() =>
                                  updateChecklistItem(
                                    item.id,
                                    'passed',
                                    item.passed === true ? null : true
                                  )
                                }
                                className={`p-1.5 rounded ${
                                  item.passed === true
                                    ? 'bg-green-100 text-green-600'
                                    : 'bg-gray-100 text-gray-400 hover:bg-green-50'
                                }`}
                              >
                                <CheckCircle className="h-5 w-5" />
                              </button>
                              <button
                                type="button"
                                onClick={() =>
                                  updateChecklistItem(
                                    item.id,
                                    'passed',
                                    item.passed === false ? null : false
                                  )
                                }
                                className={`p-1.5 rounded ${
                                  item.passed === false
                                    ? 'bg-red-100 text-red-600'
                                    : 'bg-gray-100 text-gray-400 hover:bg-red-50'
                                }`}
                              >
                                <XCircle className="h-5 w-5" />
                              </button>
                            </div>
                          </div>
                          {item.passed === false && (
                            <input
                              type="text"
                              value={item.notes}
                              onChange={(e) =>
                                updateChecklistItem(item.id, 'notes', e.target.value)
                              }
                              placeholder="Describe the issue..."
                              className="mt-2 w-full px-3 py-1.5 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-fire-500"
                            />
                          )}
                        </div>
                      ))}
                  </div>
                </div>
              ))}
            </div>

            {/* Overall Notes */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Overall Notes
              </label>
              <textarea
                value={overallNotes}
                onChange={(e) => setOverallNotes(e.target.value)}
                rows={2}
                placeholder="Any additional notes about this check..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-fire-500"
              />
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t">
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
                {isLoading ? 'Submitting...' : 'Submit Check'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
