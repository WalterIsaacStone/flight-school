"use client";

// =============================================================================
// BookingDrawer - Drawer Container (Logic + Orchestration)
// =============================================================================

import { useMemo } from "react";
import { StudentTab } from "../components/StudentTab";
import { TagsDateTab } from "../components/TagsDateTab";
import { ActionsTab } from "../components/ActionsTab";
import { HistoryTab } from "../components/HistoryTab";
import type { DrawerState } from "../hooks/useDrawerState";
import type { Student, BillingTag, ActionItem, BookingHistoryItem } from "@/types";
import type { DrawerTab } from "@/types";

type Props = {
  drawer: DrawerState;
  students: Student[];
  billingTags: BillingTag[];
  courseTypeChips: string[];
  
  // Actions data
  actions: ActionItem[];
  actionsLoading: boolean;
  
  // History data
  history: BookingHistoryItem[];
  historyLoading: boolean;
  
  // Mutation states
  isSaving: boolean;
  isCreatingStudent: boolean;
  isAddingAction: boolean;
  
  // Handlers
  onSave: () => void;
  onDelete: () => void;
  onAddAction: () => void;
  onToggleAction: (actionId: string, currentCompleted: boolean, title: string) => void;
  onDeleteAction: (actionId: string) => void;
};

const TABS: { key: DrawerTab; label: string }[] = [
  { key: "student", label: "Student" },
  { key: "tags", label: "Tags & dates" },
  { key: "actions", label: "Actions" },
  { key: "history", label: "History" },
];

export function BookingDrawer({
  drawer,
  students,
  billingTags,
  courseTypeChips,
  actions,
  actionsLoading,
  history,
  historyLoading,
  isSaving,
  isCreatingStudent,
  isAddingAction,
  onSave,
  onDelete,
  onAddAction,
  onToggleAction,
  onDeleteAction,
}: Props) {
  const { isOpen, mode, activeTab, setActiveTab, draft, activeBooking } = drawer;

  // Find selected student
  const selectedStudent = useMemo(() => {
    if (!draft?.student_id) return null;
    return students.find((s) => s.id === draft.student_id) ?? null;
  }, [draft?.student_id, students]);

  if (!isOpen || !draft) return null;

  const isEditMode = mode === "edit";
  const title = isEditMode ? "Edit Booking" : "Create Booking";

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60"
        onClick={drawer.close}
      />

      {/* Drawer panel */}
      <div className="relative w-full max-w-md bg-slate-900 border-l border-slate-700 p-4 overflow-y-auto flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">{title}</h2>
          <button
            onClick={drawer.close}
            className="text-slate-400 hover:text-slate-200 text-xl"
            aria-label="Close"
          >
            ×
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 border-b border-slate-700 mb-4">
          {TABS.map((tab) => (
            <button
              key={tab.key}
              type="button"
              onClick={() => setActiveTab(tab.key)}
              className={
                "px-3 py-1.5 text-xs rounded-t-md border-b-2 transition-colors " +
                (activeTab === tab.key
                  ? "border-sky-500 text-sky-400 bg-slate-800/50"
                  : "border-transparent text-slate-400 hover:text-slate-200")
              }
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab content */}
        <div className="flex-1 overflow-y-auto">
          {activeTab === "student" && (
            <StudentTab
              students={students}
              selectedStudentId={draft.student_id}
              selectedStudent={selectedStudent}
              onStudentChange={(id) => drawer.updateDraft("student_id", id)}
              newStudent={drawer.newStudent}
              onNewStudentChange={drawer.updateNewStudent}
              isCreatingStudent={isCreatingStudent}
            />
          )}

          {activeTab === "tags" && (
            <TagsDateTab
              draft={draft}
              courseTypeChips={courseTypeChips}
              billingTags={billingTags}
              onDraftChange={drawer.updateDraft}
            />
          )}

          {activeTab === "actions" && (
            <ActionsTab
              isEditMode={isEditMode}
              actions={actions}
              actionsLoading={actionsLoading}
              newAction={drawer.newAction}
              onNewActionChange={drawer.updateNewAction}
              onAddAction={onAddAction}
              onToggleAction={onToggleAction}
              onDeleteAction={onDeleteAction}
              isAddingAction={isAddingAction}
            />
          )}

          {activeTab === "history" && (
            <HistoryTab
              isEditMode={isEditMode}
              history={history}
              historyLoading={historyLoading}
            />
          )}
        </div>

        {/* Footer */}
        <div className="mt-4 pt-4 border-t border-slate-700 flex justify-between gap-2">
          {isEditMode ? (
            <button
              type="button"
              onClick={onDelete}
              disabled={isSaving}
              className="px-3 py-1.5 text-sm rounded-md border border-red-500 text-red-300 hover:bg-red-500/10 disabled:opacity-50"
            >
              Delete booking
            </button>
          ) : (
            <span />
          )}

          <div className="flex gap-2">
            <button
              type="button"
              onClick={drawer.close}
              disabled={isSaving}
              className="px-3 py-1.5 text-sm rounded-md border border-slate-600 hover:bg-slate-800 disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={onSave}
              disabled={isSaving}
              className="px-4 py-1.5 text-sm rounded-md bg-emerald-500 text-slate-900 font-semibold hover:bg-emerald-400 disabled:opacity-60"
            >
              {isSaving
                ? "Saving…"
                : isEditMode
                ? "Save changes"
                : "Create booking"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
