'use client';

import { useState } from 'react';
import {
  BarChart3,
  TrendingUp,
  Users,
  Clock,
  Calendar,
  Download,
  FileText,
  PieChart,
} from 'lucide-react';

const reportTypes = [
  {
    id: 'incident-summary',
    name: 'Incident Summary',
    description: 'Overview of all incidents by type, priority, and status',
    icon: FileText,
  },
  {
    id: 'response-times',
    name: 'Response Times',
    description: 'Analysis of response times and performance metrics',
    icon: Clock,
  },
  {
    id: 'member-activity',
    name: 'Member Activity',
    description: 'Individual and team response statistics',
    icon: Users,
  },
  {
    id: 'apparatus-usage',
    name: 'Apparatus Usage',
    description: 'Vehicle deployment and utilization reports',
    icon: TrendingUp,
  },
];

export default function ReportsPage() {
  const [dateRange, setDateRange] = useState('30d');
  const [selectedReport, setSelectedReport] = useState('incident-summary');

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Reports</h1>
          <p className="text-gray-600">
            Generate and view department analytics and reports
          </p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 bg-fire-600 text-white rounded-lg hover:bg-fire-700 transition-colors">
          <Download className="h-4 w-4" />
          Export Report
        </button>
      </div>

      {/* Date Range Selector */}
      <div className="bg-white rounded-lg shadow p-4">
        <div className="flex items-center gap-4">
          <Calendar className="h-5 w-5 text-gray-400" />
          <div className="flex gap-2">
            {[
              { value: '7d', label: 'Last 7 Days' },
              { value: '30d', label: 'Last 30 Days' },
              { value: '90d', label: 'Last 90 Days' },
              { value: 'ytd', label: 'Year to Date' },
              { value: 'custom', label: 'Custom Range' },
            ].map((option) => (
              <button
                key={option.value}
                onClick={() => setDateRange(option.value)}
                className={`px-4 py-2 text-sm rounded-lg transition-colors ${
                  dateRange === option.value
                    ? 'bg-fire-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Report Types */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {reportTypes.map((report) => (
          <button
            key={report.id}
            onClick={() => setSelectedReport(report.id)}
            className={`p-4 rounded-lg border-2 text-left transition-all ${
              selectedReport === report.id
                ? 'border-fire-500 bg-fire-50'
                : 'border-gray-200 bg-white hover:border-gray-300'
            }`}
          >
            <report.icon
              className={`h-8 w-8 mb-3 ${
                selectedReport === report.id ? 'text-fire-600' : 'text-gray-400'
              }`}
            />
            <h3 className="font-semibold text-gray-900">{report.name}</h3>
            <p className="text-sm text-gray-500 mt-1">{report.description}</p>
          </button>
        ))}
      </div>

      {/* Report Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Chart Area */}
        <div className="lg:col-span-2 bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-gray-900">
              {reportTypes.find((r) => r.id === selectedReport)?.name}
            </h2>
            <select className="px-3 py-1 border border-gray-300 rounded text-sm">
              <option>By Day</option>
              <option>By Week</option>
              <option>By Month</option>
            </select>
          </div>

          {/* Chart Placeholder */}
          <div className="h-80 bg-gray-50 rounded-lg flex items-center justify-center">
            <div className="text-center text-gray-400">
              <BarChart3 className="h-16 w-16 mx-auto mb-4" />
              <p className="text-lg font-medium">Chart Visualization</p>
              <p className="text-sm">
                Connect to analytics library (Chart.js, Recharts, etc.)
              </p>
            </div>
          </div>
        </div>

        {/* Summary Stats */}
        <div className="space-y-4">
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Quick Stats
            </h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded">
                <span className="text-gray-600">Total Incidents</span>
                <span className="text-2xl font-bold text-gray-900">--</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded">
                <span className="text-gray-600">Avg Response Time</span>
                <span className="text-2xl font-bold text-gray-900">-- min</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded">
                <span className="text-gray-600">Active Responders</span>
                <span className="text-2xl font-bold text-gray-900">--</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded">
                <span className="text-gray-600">Response Rate</span>
                <span className="text-2xl font-bold text-gray-900">--%</span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Top Incident Types
            </h3>
            <div className="space-y-3">
              {['Medical Emergency', 'Fire Alarm', 'MVA', 'Structure Fire', 'Other'].map(
                (type, index) => (
                  <div key={type} className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-fire-100 flex items-center justify-center text-sm font-medium text-fire-700">
                      {index + 1}
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium">{type}</p>
                      <div className="w-full bg-gray-200 rounded-full h-2 mt-1">
                        <div
                          className="bg-fire-500 h-2 rounded-full"
                          style={{ width: `${100 - index * 20}%` }}
                        />
                      </div>
                    </div>
                  </div>
                )
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Recent Reports */}
      <div className="bg-white rounded-lg shadow">
        <div className="p-6 border-b">
          <h2 className="text-lg font-semibold text-gray-900">
            Saved Reports
          </h2>
        </div>
        <div className="p-6">
          <div className="text-center py-8 text-gray-500">
            <FileText className="h-12 w-12 mx-auto text-gray-300 mb-4" />
            <p>No saved reports yet</p>
            <p className="text-sm">Generate and save reports to access them here</p>
          </div>
        </div>
      </div>
    </div>
  );
}
