'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Search, Plus, Package, AlertTriangle, CheckCircle, Wrench, Clock, Pencil, Trash2 } from 'lucide-react';
import { format, differenceInDays } from 'date-fns';
import { createBrowserClient } from '@supabase/ssr';
import { AddEquipmentModal } from './modals/AddEquipmentModal';
import { AddCategoryModal } from './modals/AddCategoryModal';
import { EditEquipmentModal } from './modals/EditEquipmentModal';

const statusColors = {
  available: 'bg-green-100 text-green-700',
  in_use: 'bg-blue-100 text-blue-700',
  maintenance: 'bg-yellow-100 text-yellow-700',
  expired: 'bg-red-100 text-red-700',
  retired: 'bg-gray-100 text-gray-500',
};

interface EquipmentClientProps {
  equipment: any[];
  categories: { id: string; name: string }[];
  stations: { id: string; name: string }[];
  apparatus: { id: string; name: string; unit_number: string }[];
  departmentId: string;
}

export function EquipmentClient({ equipment, categories, stations, apparatus, departmentId }: EquipmentClientProps) {
  const [isEquipmentModalOpen, setIsEquipmentModalOpen] = useState(false);
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [editingEquipment, setEditingEquipment] = useState<any | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [stationFilter, setStationFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const router = useRouter();

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  async function deleteEquipment(equipmentId: string, equipmentName: string) {
    if (!confirm(`Are you sure you want to delete "${equipmentName}"? This action cannot be undone.`)) {
      return;
    }

    const { error } = await supabase.from('equipment').delete().eq('id', equipmentId);

    if (!error) {
      router.refresh();
    }
  }

  const today = new Date();
  const availableCount = equipment?.filter((e) => e.status === 'available').length || 0;
  const maintenanceCount = equipment?.filter((e) => e.status === 'maintenance').length || 0;
  const expiredCount = equipment?.filter((e) => e.status === 'expired').length || 0;
  const inspectionDueCount = equipment?.filter((e) => {
    if (!e.next_inspection_due) return false;
    const daysUntil = differenceInDays(new Date(e.next_inspection_due), today);
    return daysUntil >= 0 && daysUntil <= 30;
  }).length || 0;

  // Apply filters
  const filteredEquipment = equipment?.filter((item) => {
    const matchesSearch = searchQuery === '' ||
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.serial_number?.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesCategory = categoryFilter === '' || item.category_id === categoryFilter;

    const matchesStation = stationFilter === '' ||
      item.station_id === stationFilter ||
      (stationFilter === 'apparatus' && item.apparatus_id);

    const matchesStatus = statusFilter === '' || item.status === statusFilter;

    return matchesSearch && matchesCategory && matchesStation && matchesStatus;
  }) || [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Equipment</h1>
          <p className="text-gray-600">Track and manage department equipment and inventory</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setIsCategoryModalOpen(true)} className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">
            <Plus className="h-4 w-4" />Add Category
          </button>
          <button onClick={() => setIsEquipmentModalOpen(true)} className="flex items-center gap-2 px-4 py-2 bg-fire-600 text-white rounded-lg hover:bg-fire-700 transition-colors">
            <Plus className="h-4 w-4" />Add Equipment
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg"><Package className="h-6 w-6 text-blue-600" /></div>
            <div><p className="text-2xl font-bold">{equipment?.length || 0}</p><p className="text-sm text-gray-500">Total Items</p></div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 rounded-lg"><CheckCircle className="h-6 w-6 text-green-600" /></div>
            <div><p className="text-2xl font-bold">{availableCount}</p><p className="text-sm text-gray-500">Available</p></div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-yellow-100 rounded-lg"><Wrench className="h-6 w-6 text-yellow-600" /></div>
            <div><p className="text-2xl font-bold">{maintenanceCount}</p><p className="text-sm text-gray-500">Maintenance</p></div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-red-100 rounded-lg"><AlertTriangle className="h-6 w-6 text-red-600" /></div>
            <div><p className="text-2xl font-bold">{expiredCount}</p><p className="text-sm text-gray-500">Expired</p></div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-orange-100 rounded-lg"><Clock className="h-6 w-6 text-orange-600" /></div>
            <div><p className="text-2xl font-bold">{inspectionDueCount}</p><p className="text-sm text-gray-500">Inspection Due</p></div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-4">
        <div className="flex flex-wrap gap-4">
          <div className="flex-1 min-w-[200px]">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search equipment..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-fire-500 focus:border-transparent"
              />
            </div>
          </div>
          <select
            value={stationFilter}
            onChange={(e) => setStationFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-fire-500"
          >
            <option value="">All Locations</option>
            <option value="apparatus">On Apparatus</option>
            {stations.map((station) => (
              <option key={station.id} value={station.id}>{station.name}</option>
            ))}
          </select>
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-fire-500"
          >
            <option value="">All Categories</option>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.id}>{cat.name}</option>
            ))}
          </select>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-fire-500"
          >
            <option value="">All Statuses</option>
            <option value="available">Available</option>
            <option value="in_use">In Use</option>
            <option value="maintenance">Maintenance</option>
            <option value="expired">Expired</option>
            <option value="retired">Retired</option>
          </select>
        </div>
        {(searchQuery || categoryFilter || stationFilter || statusFilter) && (
          <div className="mt-3 text-sm text-gray-500">
            Showing {filteredEquipment.length} of {equipment?.length || 0} items
          </div>
        )}
      </div>

      {/* Equipment Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Item</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Location</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Next Inspection</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredEquipment.length === 0 ? (
              <tr><td colSpan={6} className="px-6 py-12 text-center"><Package className="h-12 w-12 mx-auto text-gray-300 mb-4" /><p className="text-gray-500">{equipment?.length === 0 ? 'No equipment found' : 'No equipment matches your filters'}</p></td></tr>
            ) : (
              filteredEquipment.map((item) => {
                const daysUntilInspection = item.next_inspection_due ? differenceInDays(new Date(item.next_inspection_due), today) : null;
                return (
                  <tr key={item.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <p className="font-medium text-gray-900">{item.name}</p>
                      {item.serial_number && <p className="text-xs text-gray-500">SN: {item.serial_number}</p>}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">{item.category?.name || '--'}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">{item.apparatus?.name || item.station?.name || '--'}</td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex px-2 py-1 text-xs font-medium rounded ${statusColors[item.status as keyof typeof statusColors]}`}>
                        {item.status.replace(/_/g, ' ')}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm">
                      {item.next_inspection_due ? (
                        <p className={daysUntilInspection !== null && daysUntilInspection < 0 ? 'text-red-600 font-medium' : daysUntilInspection !== null && daysUntilInspection <= 30 ? 'text-orange-600' : 'text-gray-600'}>
                          {format(new Date(item.next_inspection_due), 'MMM d, yyyy')}
                        </p>
                      ) : <span className="text-gray-400">--</span>}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => setEditingEquipment(item)}
                          className="p-1.5 text-gray-400 hover:text-fire-600 hover:bg-fire-50 rounded"
                          title="Edit"
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => deleteEquipment(item.id, item.name)}
                          className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded"
                          title="Delete"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      <AddEquipmentModal isOpen={isEquipmentModalOpen} onClose={() => setIsEquipmentModalOpen(false)} onSuccess={() => router.refresh()} categories={categories} stations={stations} apparatus={apparatus} departmentId={departmentId} />
      <AddCategoryModal isOpen={isCategoryModalOpen} onClose={() => setIsCategoryModalOpen(false)} onSuccess={() => router.refresh()} departmentId={departmentId} />

      {editingEquipment && (
        <EditEquipmentModal
          isOpen={true}
          onClose={() => setEditingEquipment(null)}
          onSuccess={() => {
            setEditingEquipment(null);
            router.refresh();
          }}
          equipment={editingEquipment}
          categories={categories}
          stations={stations}
          apparatus={apparatus}
        />
      )}
    </div>
  );
}
