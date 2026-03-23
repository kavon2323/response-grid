'use client';

import { useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';

export function useUnsavedChanges(hasChanges: boolean, message?: string) {
  const defaultMessage = 'You have unsaved changes. Are you sure you want to leave?';
  const warningMessage = message || defaultMessage;

  // Handle browser close/refresh
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasChanges) {
        e.preventDefault();
        e.returnValue = warningMessage;
        return warningMessage;
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [hasChanges, warningMessage]);

  // Handle link clicks within the app
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (!hasChanges) return;

      const target = e.target as HTMLElement;
      const anchor = target.closest('a');

      if (anchor && anchor.href && !anchor.href.startsWith('mailto:') && !anchor.href.startsWith('tel:')) {
        const isSameOrigin = anchor.href.startsWith(window.location.origin);

        if (isSameOrigin) {
          const confirmed = window.confirm(warningMessage);
          if (!confirmed) {
            e.preventDefault();
            e.stopPropagation();
          }
        }
      }
    };

    document.addEventListener('click', handleClick, true);
    return () => document.removeEventListener('click', handleClick, true);
  }, [hasChanges, warningMessage]);

  // Return a function to check before programmatic navigation
  const confirmNavigation = useCallback(() => {
    if (hasChanges) {
      return window.confirm(warningMessage);
    }
    return true;
  }, [hasChanges, warningMessage]);

  return { confirmNavigation };
}
