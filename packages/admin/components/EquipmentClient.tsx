'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Search, Plus, Package, AlertTriangle, CheckCircle, Wrench, Clock } from 'lucide-react';
import { format, differenceInDays } from 'date-fns';
import { AddEquipmentModal } from './modals/AddEquipmentModal';
import { AddCategoryModal } from './modals/AddCategoryModal';

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
  const router = useRouter();

  const today = new Date();
  const availableCount = equipment?.filter((e) => e.status === 'available').length || 0;
  const maintenanceCount = equipment?.filter((e) => e.status === 'maintenance').length || 0;
  const expiredCount = equipment?.filter((e) => e.status === 'expired').length || 0;
  const inspectionDueCount = equipment?.filter((e) => {
    if (!e.next_inspection_due) return false;
    const daysUntil = differenceInDays(new Date(e.next_inspection_due), today);
    return daysUntil >= 0 && daysUntil <= 30;
  }).length || 0;

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
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {(!equipment || equipment.length === 0) ? (
              <tr><td colSpan={5} className="px-6 py-12 text-center"><Package className="h-12 w-12 mx-auto text-gray-300 mb-4" /><p className="text-gray-500">No equipment found</p></td></tr>
            ) : (
              equipment.map((item) => {
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
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      <AddEquipmentModal isOpen={isEquipmentModalOpen} onClose={() => setIsEquipmentModalOpen(false)} onSuccess={() => router.refresh()} categories={categories} stations={stations} apparatus={apparatus} departmentId={departmentId} />
      <AddCategoryModal isOpen={isCategoryModalOpen} onClose={() => setIsCategoryModalOpen(false)} onSuccess={() => router.refresh()} departmentId={departmentId} />
    </div>
  );
}
