// =============================================================================
// StudentTab - Student Selection & Inline Creation (Presentational)
// =============================================================================

import type { Student } from "@/types";
import type { NewStudentForm } from "../hooks/useDrawerState";

type Props = {
  students: Student[];
  selectedStudentId: string;
  selectedStudent: Student | null;
  onStudentChange: (studentId: string) => void;
  
  // New student form
  newStudent: NewStudentForm;
  onNewStudentChange: <K extends keyof NewStudentForm>(field: K, value: string) => void;
  isCreatingStudent: boolean;
};

export function StudentTab({
  students,
  selectedStudentId,
  selectedStudent,
  onStudentChange,
  newStudent,
  onNewStudentChange,
  isCreatingStudent,
}: Props) {
  return (
    <div className="flex flex-col gap-4">
      {/* Student selector */}
      <div className="flex flex-col gap-1">
        <label className="text-slate-300">Select student</label>
        <select
          className="bg-slate-800 border border-slate-600 rounded-md px-2 py-2"
          value={selectedStudentId}
          onChange={(e) => onStudentChange(e.target.value)}
          disabled={isCreatingStudent}
        >
          <option value="">— Select existing student —</option>
          {students.map((s) => (
            <option key={s.id} value={s.id}>
              {s.full_name}
            </option>
          ))}
        </select>
      </div>

      {/* Selected student info */}
      {selectedStudent && !newStudent.name.trim() && (
        <div className="bg-slate-800/70 rounded-lg p-3 text-xs space-y-1">
          <div>
            <span className="text-slate-400">Name:</span>{" "}
            <span className="text-slate-100">{selectedStudent.full_name}</span>
          </div>
          {selectedStudent.email && (
            <div>
              <span className="text-slate-400">Email:</span>{" "}
              <span className="text-slate-100">{selectedStudent.email}</span>
            </div>
          )}
          {selectedStudent.phone && (
            <div>
              <span className="text-slate-400">Phone:</span>{" "}
              <span className="text-slate-100">{selectedStudent.phone}</span>
            </div>
          )}
          {selectedStudent.notes && (
            <div>
              <span className="text-slate-400">Notes:</span>{" "}
              <span className="text-slate-100">{selectedStudent.notes}</span>
            </div>
          )}
        </div>
      )}

      {/* Divider */}
      <div className="flex items-center gap-2">
        <div className="flex-1 border-t border-slate-700" />
        <span className="text-xs text-slate-400">or create new</span>
        <div className="flex-1 border-t border-slate-700" />
      </div>

      {/* New student form */}
      <div className="space-y-3 text-xs">
        <label className="flex flex-col gap-1">
          <span className="text-slate-300">
            New student name {newStudent.name.trim() && "✓"}
          </span>
          <input
            className="bg-slate-800 border border-slate-600 rounded-md px-2 py-1.5"
            placeholder="Full name"
            value={newStudent.name}
            onChange={(e) => onNewStudentChange("name", e.target.value)}
            disabled={isCreatingStudent}
          />
        </label>

        <label className="flex flex-col gap-1">
          <span className="text-slate-300">Email (optional)</span>
          <input
            type="email"
            className="bg-slate-800 border border-slate-600 rounded-md px-2 py-1.5"
            placeholder="email@example.com"
            value={newStudent.email}
            onChange={(e) => onNewStudentChange("email", e.target.value)}
            disabled={isCreatingStudent}
          />
        </label>

        <label className="flex flex-col gap-1">
          <span className="text-slate-300">Phone (optional)</span>
          <input
            type="tel"
            className="bg-slate-800 border border-slate-600 rounded-md px-2 py-1.5"
            placeholder="555-123-4567"
            value={newStudent.phone}
            onChange={(e) => onNewStudentChange("phone", e.target.value)}
            disabled={isCreatingStudent}
          />
        </label>

        <label className="flex flex-col gap-1">
          <span className="text-slate-300">Notes (optional)</span>
          <textarea
            className="bg-slate-800 border border-slate-600 rounded-md px-2 py-1.5 min-h-[60px]"
            placeholder="Any notes about this student..."
            value={newStudent.notes}
            onChange={(e) => onNewStudentChange("notes", e.target.value)}
            disabled={isCreatingStudent}
          />
        </label>

        {newStudent.name.trim() && (
          <p className="text-emerald-400 text-[11px]">
            ✓ A new student will be created when you save the booking
          </p>
        )}
      </div>
    </div>
  );
}
