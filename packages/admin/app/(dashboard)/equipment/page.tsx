import { createClient } from '@/lib/supabase/server';
import { Search, Plus, Package, AlertTriangle, CheckCircle, Wrench, Clock } from 'lucide-react';
import { format, differenceInDays } from 'date-fns';

const statusColors = {
  available: 'bg-green-100 text-green-700',
  in_use: 'bg-blue-100 text-blue-700',
  maintenance: 'bg-yellow-100 text-yellow-700',
  expired: 'bg-red-100 text-red-700',
  retired: 'bg-gray-100 text-gray-500',
};

export default async function EquipmentPage() {
  const supabase = createClient();

  const { data: equipment } = await supabase
    .from('equipment')
    .select(`
      *,
      category:equipment_categories(id, name),
      station:stations(id, name),
      apparatus:apparatus(id, name, unit_number)
    `)
    .order('name', { ascending: true });

  const { data: categories } = await supabase
    .from('equipment_categories')
    .select('*')
    .order('name');

  const availableCount = equipment?.filter((e) => e.status === 'available').length || 0;
  const maintenanceCount = equipment?.filter((e) => e.status === 'maintenance').length || 0;
  const expiredCount = equipment?.filter((e) => e.status === 'expired').length || 0;

  // Find items due for inspection soon
  const today = new Date();
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
          <p className="text-gray-600">
            Track and manage department equipment and inventory
          </p>
        </div>
        <div className="flex gap-2">
          <button className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">
            <Plus className="h-4 w-4" />
            Add Category
          </button>
          <button className="flex items-center gap-2 px-4 py-2 bg-fire-600 text-white rounded-lg hover:bg-fire-700 transition-colors">
            <Plus className="h-4 w-4" />
            Add Equipment
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Package className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{equipment?.length || 0}</p>
              <p className="text-sm text-gray-500">Total Items</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <CheckCircle className="h-6 w-6 text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{availableCount}</p>
              <p className="text-sm text-gray-500">Available</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <Wrench className="h-6 w-6 text-yellow-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{maintenanceCount}</p>
              <p className="text-sm text-gray-500">Maintenance</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-red-100 rounded-lg">
              <AlertTriangle className="h-6 w-6 text-red-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{expiredCount}</p>
              <p className="text-sm text-gray-500">Expired</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-orange-100 rounded-lg">
              <Clock className="h-6 w-6 text-orange-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{inspectionDueCount}</p>
              <p className="text-sm text-gray-500">Inspection Due</p>
            </div>
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
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-fire-500 focus:border-transparent"
              />
            </div>
          </div>
          <select className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-fire-500">
            <option value="">All Categories</option>
            {categories?.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.name}
              </option>
            ))}
          </select>
          <select className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-fire-500">
            <option value="">All Status</option>
            <option value="available">Available</option>
            <option value="in_use">In Use</option>
            <option value="maintenance">Maintenance</option>
            <option value="expired">Expired</option>
          </select>
        </div>
      </div>

      {/* Equipment Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Item
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Category
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Location
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Next Inspection
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {(!equipment || equipment.length === 0) ? (
              <tr>
                <td colSpan={6} className="px-6 py-12 text-center">
                  <Package className="h-12 w-12 mx-auto text-gray-300 mb-4" />
                  <p className="text-gray-500">No equipment found</p>
                </td>
              </tr>
            ) : (
              equipment.map((item) => {
                const daysUntilInspection = item.next_inspection_due
                  ? differenceInDays(new Date(item.next_inspection_due), today)
                  : null;

                return (
                  <tr key={item.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div>
                        <p className="font-medium text-gray-900">{item.name}</p>
                        {item.serial_number && (
                          <p className="text-xs text-gray-500">SN: {item.serial_number}</p>
                        )}
                        {item.asset_tag && (
                          <p className="text-xs text-gray-500">Tag: {item.asset_tag}</p>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {(item.category as any)?.name || '--'}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {(item.apparatus as any)?.name
                        ? `${(item.apparatus as any).name} (#${(item.apparatus as any).unit_number})`
                        : (item.station as any)?.name || '--'}
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex px-2 py-1 text-xs font-medium rounded ${
                          statusColors[item.status as keyof typeof statusColors]
                        }`}
                      >
                        {item.status.replace(/_/g, ' ')}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm">
                      {item.next_inspection_due ? (
                        <div>
                          <p className={
                            daysUntilInspection !== null && daysUntilInspection < 0
                              ? 'text-red-600 font-medium'
                              : daysUntilInspection !== null && daysUntilInspection <= 30
                              ? 'text-orange-600'
                              : 'text-gray-600'
                          }>
                            {format(new Date(item.next_inspection_due), 'MMM d, yyyy')}
                          </p>
                          {daysUntilInspection !== null && daysUntilInspection < 0 && (
                            <p className="text-xs text-red-500">Overdue</p>
                          )}
                        </div>
                      ) : (
                        <span className="text-gray-400">--</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <button className="text-fire-600 hover:text-fire-700 mr-3">
                        View
                      </button>
                      <button className="text-gray-600 hover:text-gray-900">
                        Log
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
