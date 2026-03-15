"use client";

import { AlertCircle, Loader2, Trash2 } from "lucide-react";
import Button from "@/app/components/Button";

interface DeleteModalProps {
  label: string,
  isOpen: boolean;
  isDeleting: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

export const DeleteModal = ({
  label,
  isOpen,
  isDeleting,
  onClose,
  onConfirm,
}: DeleteModalProps) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl border border-gray-200 shadow-xl max-w-sm w-full mx-auto overflow-hidden">
        <div className="p-6 space-y-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-red-50 flex items-center justify-center flex-shrink-0">
              <AlertCircle size={18} className="text-red-500" />
            </div>
            <div>
              <p className="text-base font-extrabold text-gray-900">
                Delete {label}
              </p>
              <p className="text-xs text-gray-400">
                This action cannot be undone
              </p>
            </div>
          </div>

          <div className="flex gap-3">
            <Button
              onClick={onClose}
              variant="outline"
              className="flex-1 rounded-xl"
            >
              Cancel
            </Button>
            <button
              onClick={onConfirm}
              disabled={isDeleting}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-red-500 hover:bg-red-600 text-white text-sm font-semibold rounded-xl transition-colors disabled:opacity-60"
            >
              {isDeleting ? (
                <>
                  <Loader2 size={13} className="animate-spin" /> Deleting…
                </>
              ) : (
                <>
                  <Trash2 size={13} /> Delete
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
