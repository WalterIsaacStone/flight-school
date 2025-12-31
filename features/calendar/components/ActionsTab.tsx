// =============================================================================
// ActionsTab - Actions/To-Do CRUD (Presentational)
// =============================================================================

import type { ActionItem } from "@/types";
import type { NewActionForm } from "../hooks/useDrawerState";

type Props = {
  isEditMode: boolean; // false = creating new booking, can't add actions yet
  actions: ActionItem[];
  actionsLoading: boolean;
  newAction: NewActionForm;
  onNewActionChange: <K extends keyof NewActionForm>(field: K, value: string) => void;
  onAddAction: () => void;
  onToggleAction: (actionId: string, currentCompleted: boolean, title: string) => void;
  onDeleteAction: (actionId: string) => void;
  isAddingAction: boolean;
};

export function ActionsTab({
  isEditMode,
  actions,
  actionsLoading,
  newAction,
  onNewActionChange,
  onAddAction,
  onToggleAction,
  onDeleteAction,
  isAddingAction,
}: Props) {
  if (!isEditMode) {
    return (
      <p className="text-xs text-slate-400">
        Save this booking first, then you can attach actions.
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      <h3 className="text-sm font-semibold">Actions / To-Dos</h3>

      {/* Actions list */}
      {actionsLoading ? (
        <p className="text-xs text-slate-400">Loading actions…</p>
      ) : actions.length === 0 ? (
        <p className="text-xs text-slate-400">No actions yet.</p>
      ) : (
        <ul className="space-y-1 max-h-40 overflow-y-auto pr-1">
          {actions.map((action) => (
            <li
              key={action.id}
              className="flex items-center justify-between gap-2 text-xs bg-slate-800/70 rounded-md px-2 py-1.5"
            >
              <label className="flex items-center gap-2 flex-1 cursor-pointer">
                <input
                  type="checkbox"
                  checked={action.completed}
                  onChange={() =>
                    onToggleAction(action.id, action.completed, action.title)
                  }
                  className="rounded border-slate-600"
                />
                <span
                  className={
                    "truncate " +
                    (action.completed ? "line-through text-slate-400" : "")
                  }
                >
                  {action.title}
                </span>
              </label>

              {action.due_date && (
                <span className="text-[10px] text-slate-300 whitespace-nowrap">
                  {action.due_date}
                </span>
              )}

              <button
                type="button"
                className="text-[10px] text-red-300 hover:text-red-400"
                onClick={() => onDeleteAction(action.id)}
              >
                Delete
              </button>
            </li>
          ))}
        </ul>
      )}

      {/* Add action form */}
      <div className="flex flex-col gap-2 text-xs pt-2 border-t border-slate-700">
        <span className="text-slate-300">Add new action</span>
        <div className="flex gap-2">
          <input
            className="flex-1 bg-slate-800 border border-slate-600 rounded-md px-2 py-1.5"
            placeholder="e.g. Send welcome email"
            value={newAction.title}
            onChange={(e) => onNewActionChange("title", e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && newAction.title.trim()) {
                onAddAction();
              }
            }}
          />
          <input
            type="date"
            className="w-32 bg-slate-800 border border-slate-600 rounded-md px-2 py-1"
            value={newAction.dueDate}
            onChange={(e) => onNewActionChange("dueDate", e.target.value)}
          />
        </div>
        <button
          type="button"
          onClick={onAddAction}
          disabled={isAddingAction || !newAction.title.trim()}
          className="self-start px-3 py-1 rounded-md bg-sky-500 text-slate-900 font-semibold hover:bg-sky-400 disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {isAddingAction ? "Adding…" : "Add action"}
        </button>
      </div>
    </div>
  );
}
