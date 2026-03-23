'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Wrench, ClipboardCheck, AlertTriangle } from 'lucide-react';
import { AddMaintenanceModal } from './modals/AddMaintenanceModal';
import { LogCheckModal } from './modals/LogCheckModal';
import { ReportIssueModal } from './modals/ReportIssueModal';

interface ApparatusDetailClientProps {
  apparatusId: string;
  departmentId: string;
}

export function ApparatusDetailClient({ apparatusId, departmentId }: ApparatusDetailClientProps) {
  const [isMaintenanceModalOpen, setIsMaintenanceModalOpen] = useState(false);
  const [isCheckModalOpen, setIsCheckModalOpen] = useState(false);
  const [isIssueModalOpen, setIsIssueModalOpen] = useState(false);
  const router = useRouter();

  const handleSuccess = () => {
    router.refresh();
  };

  return (
    <>
      <div className="flex gap-2">
        <button
          onClick={() => setIsIssueModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
        >
          <AlertTriangle className="h-4 w-4" />
          Report Issue
        </button>
        <button
          onClick={() => setIsCheckModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
        >
          <ClipboardCheck className="h-4 w-4" />
          Log Check
        </button>
        <button
          onClick={() => setIsMaintenanceModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2 bg-fire-600 text-white rounded-lg hover:bg-fire-700"
        >
          <Wrench className="h-4 w-4" />
          Add Maintenance
        </button>
      </div>

      <AddMaintenanceModal
        isOpen={isMaintenanceModalOpen}
        onClose={() => setIsMaintenanceModalOpen(false)}
        onSuccess={handleSuccess}
        apparatusId={apparatusId}
        departmentId={departmentId}
      />

      <LogCheckModal
        isOpen={isCheckModalOpen}
        onClose={() => setIsCheckModalOpen(false)}
        onSuccess={handleSuccess}
        apparatusId={apparatusId}
        departmentId={departmentId}
      />

      <ReportIssueModal
        isOpen={isIssueModalOpen}
        onClose={() => setIsIssueModalOpen(false)}
        onSuccess={handleSuccess}
        apparatusId={apparatusId}
        departmentId={departmentId}
      />
    </>
  );
}
