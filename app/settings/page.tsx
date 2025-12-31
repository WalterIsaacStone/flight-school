"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import {
  useCourseTypes,
  useBillingTags,
  useStudents,
  useStudentTags,
  useCreateCourseType,
  useUpdateCourseType,
  useDeleteCourseType,
  useCreateBillingTag,
  useUpdateBillingTag,
  useDeleteBillingTag,
  useCreateStudentTag,
  useDeleteStudentTag,
} from "@/hooks/useData";
import { useToast } from "@/components/ui/Toast";
import { useConfirm } from "@/components/ui/ConfirmDialog";
import { SettingsListSkeleton } from "@/components/ui/Skeleton";

// =============================================================================
// Settings Page
// =============================================================================

export default function SettingsPage() {
  // Data fetching
  const { data: courseTypes = [], isLoading: courseTypesLoading } = useCourseTypes();
  const { data: billingTags = [], isLoading: billingTagsLoading } = useBillingTags();
  const { data: students = [], isLoading: studentsLoading } = useStudents();
  const { data: studentTags = [], isLoading: studentTagsLoading } = useStudentTags();

  // Mutations
  const createCourseTypeMutation = useCreateCourseType();
  const updateCourseTypeMutation = useUpdateCourseType();
  const deleteCourseTypeMutation = useDeleteCourseType();
  const createBillingTagMutation = useCreateBillingTag();
  const updateBillingTagMutation = useUpdateBillingTag();
  const deleteBillingTagMutation = useDeleteBillingTag();
  const createStudentTagMutation = useCreateStudentTag();
  const deleteStudentTagMutation = useDeleteStudentTag();

  // UI helpers
  const { showToast } = useToast();
  const confirm = useConfirm();

  // ---------------------------------------------------------------------------
  // Course Type State
  // ---------------------------------------------------------------------------
  const [newCourseName, setNewCourseName] = useState("");
  const [newCourseDesc, setNewCourseDesc] = useState("");
  const [newCourseCapacity, setNewCourseCapacity] = useState("");

  const [editingCourseId, setEditingCourseId] = useState<string | null>(null);
  const [editingCourseName, setEditingCourseName] = useState("");
  const [editingCourseDesc, setEditingCourseDesc] = useState("");
  const [editingCourseCapacity, setEditingCourseCapacity] = useState("");

  // ---------------------------------------------------------------------------
  // Billing Tag State
  // ---------------------------------------------------------------------------
  const [newBillingName, setNewBillingName] = useState("");
  const [newBillingDesc, setNewBillingDesc] = useState("");

  const [editingBillingId, setEditingBillingId] = useState<string | null>(null);
  const [editingBillingName, setEditingBillingName] = useState("");
  const [editingBillingDesc, setEditingBillingDesc] = useState("");

  // ---------------------------------------------------------------------------
  // Student Tag State
  // ---------------------------------------------------------------------------
  const [newTagTextByStudent, setNewTagTextByStudent] = useState<Record<string, string>>({});

  const tagsByStudent = useMemo(() => {
    return studentTags.reduce<Record<string, typeof studentTags>>((acc, tag) => {
      if (!acc[tag.student_id]) acc[tag.student_id] = [];
      acc[tag.student_id].push(tag);
      return acc;
    }, {});
  }, [studentTags]);

  // ---------------------------------------------------------------------------
  // Course Type Handlers
  // ---------------------------------------------------------------------------
  async function addCourseType() {
    if (!newCourseName.trim()) return;

    let capacity: number | null = null;
    if (newCourseCapacity.trim()) {
      const parsed = Number.parseInt(newCourseCapacity.trim(), 10);
      if (Number.isNaN(parsed) || parsed < 0) {
        showToast("Weekly capacity must be a non-negative number", "warning");
        return;
      }
      capacity = parsed;
    }

    try {
      await createCourseTypeMutation.mutateAsync({
        name: newCourseName.trim(),
        description: newCourseDesc || null,
        weekly_capacity: capacity,
      });
      setNewCourseName("");
      setNewCourseDesc("");
      setNewCourseCapacity("");
      showToast("Course type added", "success");
    } catch (err) {
      showToast("Could not add course type", "error");
    }
  }

  async function deleteCourseType(id: string) {
    const confirmed = await confirm({
      title: "Delete Course Type",
      message: "Delete this course type? Existing bookings will keep their text value.",
      confirmLabel: "Delete",
      variant: "danger",
    });

    if (!confirmed) return;

    try {
      await deleteCourseTypeMutation.mutateAsync(id);
      showToast("Course type deleted", "success");
    } catch (err) {
      showToast("Could not delete course type", "error");
    }
  }

  function startEditCourseType(id: string, name: string, desc: string | null, capacity: number | null) {
    setEditingCourseId(id);
    setEditingCourseName(name);
    setEditingCourseDesc(desc || "");
    setEditingCourseCapacity(capacity != null ? String(capacity) : "");
  }

  function cancelEditCourseType() {
    setEditingCourseId(null);
    setEditingCourseName("");
    setEditingCourseDesc("");
    setEditingCourseCapacity("");
  }

  async function saveEditCourseType() {
    if (!editingCourseId) return;
    const name = editingCourseName.trim();
    if (!name) {
      showToast("Course name cannot be empty", "warning");
      return;
    }

    let capacity: number | null = null;
    if (editingCourseCapacity.trim()) {
      const parsed = Number.parseInt(editingCourseCapacity.trim(), 10);
      if (Number.isNaN(parsed) || parsed < 0) {
        showToast("Weekly capacity must be a non-negative number", "warning");
        return;
      }
      capacity = parsed;
    }

    try {
      await updateCourseTypeMutation.mutateAsync({
        id: editingCourseId,
        payload: {
          name,
          description: editingCourseDesc.trim() || null,
          weekly_capacity: capacity,
        },
      });
      cancelEditCourseType();
      showToast("Course type updated", "success");
    } catch (err) {
      showToast("Could not update course type", "error");
    }
  }

  // ---------------------------------------------------------------------------
  // Billing Tag Handlers
  // ---------------------------------------------------------------------------
  async function addBillingTag() {
    if (!newBillingName.trim()) return;

    try {
      await createBillingTagMutation.mutateAsync({
        name: newBillingName.trim(),
        description: newBillingDesc || null,
      });
      setNewBillingName("");
      setNewBillingDesc("");
      showToast("Billing tag added", "success");
    } catch (err) {
      showToast("Could not add billing tag", "error");
    }
  }

  async function deleteBillingTag(id: string) {
    const confirmed = await confirm({
      title: "Delete Billing Tag",
      message: "Delete this billing tag? Existing bookings will keep their text value.",
      confirmLabel: "Delete",
      variant: "danger",
    });

    if (!confirmed) return;

    try {
      await deleteBillingTagMutation.mutateAsync(id);
      showToast("Billing tag deleted", "success");
    } catch (err) {
      showToast("Could not delete billing tag", "error");
    }
  }

  function startEditBillingTag(id: string, name: string, desc: string | null) {
    setEditingBillingId(id);
    setEditingBillingName(name);
    setEditingBillingDesc(desc || "");
  }

  function cancelEditBillingTag() {
    setEditingBillingId(null);
    setEditingBillingName("");
    setEditingBillingDesc("");
  }

  async function saveEditBillingTag() {
    if (!editingBillingId) return;
    const name = editingBillingName.trim();
    if (!name) {
      showToast("Billing tag name cannot be empty", "warning");
      return;
    }

    try {
      await updateBillingTagMutation.mutateAsync({
        id: editingBillingId,
        payload: {
          name,
          description: editingBillingDesc.trim() || null,
        },
      });
      cancelEditBillingTag();
      showToast("Billing tag updated", "success");
    } catch (err) {
      showToast("Could not update billing tag", "error");
    }
  }

  // ---------------------------------------------------------------------------
  // Student Tag Handlers
  // ---------------------------------------------------------------------------
  function updateNewTagText(studentId: string, value: string) {
    setNewTagTextByStudent((prev) => ({ ...prev, [studentId]: value }));
  }

  async function addStudentTag(studentId: string) {
    const label = (newTagTextByStudent[studentId] || "").trim();
    if (!label) return;

    try {
      await createStudentTagMutation.mutateAsync({ studentId, label });
      updateNewTagText(studentId, "");
      showToast("Tag added", "success");
    } catch (err) {
      showToast("Could not add tag", "error");
    }
  }

  async function deleteStudentTag(tagId: string) {
    const confirmed = await confirm({
      title: "Delete Tag",
      message: "Delete this student tag?",
      confirmLabel: "Delete",
      variant: "danger",
    });

    if (!confirmed) return;

    try {
      await deleteStudentTagMutation.mutateAsync(tagId);
      showToast("Tag deleted", "success");
    } catch (err) {
      showToast("Could not delete tag", "error");
    }
  }

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------
  const loading = courseTypesLoading || billingTagsLoading || studentsLoading || studentTagsLoading;

  return (
    <main className="min-h-screen bg-slate-900 text-slate-50">
      <div className="max-w-5xl mx-auto py-6 px-4 space-y-6">
        <header className="flex items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold">Setup & Maintenance</h1>
            <p className="text-sm text-slate-300">
              Define reusable course types, billing tags, and student tags.
            </p>
          </div>
          <div className="flex flex-col items-end gap-1 text-xs">
            <Link href="/calendar" className="text-slate-300 hover:text-white underline">
              ← Back to calendar
            </Link>
            <Link href="/" className="text-slate-400 hover:text-white underline">
              Back to dashboard
            </Link>
          </div>
        </header>

        {/* Course Types */}
        <section className="bg-slate-800/70 border border-slate-700 rounded-xl p-4 space-y-3 text-sm">
          <h2 className="font-semibold text-base">Course types</h2>
          <p className="text-xs text-slate-300">
            These show up as preset chips when creating a booking.
          </p>

          {courseTypesLoading ? (
            <SettingsListSkeleton />
          ) : (
            <div className="space-y-2">
              {courseTypes.length === 0 ? (
                <p className="text-xs text-slate-400">No course types yet. Add some below.</p>
              ) : (
                <ul className="space-y-1">
                  {courseTypes.map((ct) => {
                    const isEditing = editingCourseId === ct.id;
                    return (
                      <li
                        key={ct.id}
                        className="flex items-start justify-between gap-2 bg-slate-900/60 border border-slate-700 rounded-md px-2 py-1"
                      >
                        {isEditing ? (
                          <>
                            <div className="flex-1 space-y-1">
                              <input
                                className="w-full bg-slate-900 border border-slate-600 rounded-md px-2 py-1 text-xs"
                                value={editingCourseName}
                                onChange={(e) => setEditingCourseName(e.target.value)}
                              />
                              <textarea
                                className="w-full bg-slate-900 border border-slate-600 rounded-md px-2 py-1 text-[11px] min-h-[40px]"
                                value={editingCourseDesc}
                                onChange={(e) => setEditingCourseDesc(e.target.value)}
                              />
                              <input
                                type="number"
                                min={0}
                                className="w-full bg-slate-900 border border-slate-600 rounded-md px-2 py-1 text-[11px]"
                                placeholder="Weekly capacity (optional)"
                                value={editingCourseCapacity}
                                onChange={(e) => setEditingCourseCapacity(e.target.value)}
                              />
                            </div>
                            <div className="flex flex-col gap-1 text-[11px]">
                              <button
                                onClick={saveEditCourseType}
                                disabled={updateCourseTypeMutation.isPending}
                                className="px-2 py-1 rounded-md bg-emerald-500 text-slate-900 font-semibold hover:bg-emerald-400 disabled:opacity-50"
                              >
                                Save
                              </button>
                              <button
                                onClick={cancelEditCourseType}
                                className="px-2 py-1 rounded-md border border-slate-600 hover:bg-slate-800"
                              >
                                Cancel
                              </button>
                            </div>
                          </>
                        ) : (
                          <>
                            <div className="flex-1">
                              <div className="font-medium text-xs">{ct.name}</div>
                              {ct.description && (
                                <div className="text-[11px] text-slate-400">{ct.description}</div>
                              )}
                              {ct.weekly_capacity != null && (
                                <div className="text-[11px] text-slate-300 mt-0.5">
                                  Weekly capacity: {ct.weekly_capacity}
                                </div>
                              )}
                            </div>
                            <div className="flex flex-col gap-1 text-[11px]">
                              <button
                                onClick={() =>
                                  startEditCourseType(ct.id, ct.name, ct.description, ct.weekly_capacity)
                                }
                                className="text-sky-300 hover:text-sky-400"
                              >
                                Edit
                              </button>
                              <button
                                onClick={() => deleteCourseType(ct.id)}
                                className="text-red-300 hover:text-red-400"
                              >
                                Delete
                              </button>
                            </div>
                          </>
                        )}
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          )}

          <div className="border-t border-slate-700 pt-3 mt-2 space-y-2">
            <div className="text-xs font-semibold text-slate-200">Add course type</div>
            <div className="flex flex-col gap-2">
              <input
                className="bg-slate-900 border border-slate-600 rounded-md px-2 py-1 text-xs"
                placeholder='Name (e.g. "CFI Initial – 10 Day")'
                value={newCourseName}
                onChange={(e) => setNewCourseName(e.target.value)}
              />
              <textarea
                className="bg-slate-900 border border-slate-600 rounded-md px-2 py-1 text-xs min-h-[48px]"
                placeholder="Optional description"
                value={newCourseDesc}
                onChange={(e) => setNewCourseDesc(e.target.value)}
              />
              <input
                type="number"
                min={0}
                className="bg-slate-900 border border-slate-600 rounded-md px-2 py-1 text-xs"
                placeholder="Weekly capacity (optional)"
                value={newCourseCapacity}
                onChange={(e) => setNewCourseCapacity(e.target.value)}
              />
              <button
                onClick={addCourseType}
                disabled={!newCourseName.trim() || createCourseTypeMutation.isPending}
                className="self-start px-3 py-1 rounded-md bg-emerald-500 text-slate-900 font-semibold text-xs hover:bg-emerald-400 disabled:opacity-60"
              >
                Add course type
              </button>
            </div>
          </div>
        </section>

        {/* Billing Tags */}
        <section className="bg-slate-800/70 border border-slate-700 rounded-xl p-4 space-y-3 text-sm">
          <h2 className="font-semibold text-base">Billing tags</h2>
          <p className="text-xs text-slate-300">
            Status chips like &quot;Downpayment invoiced&quot;, &quot;Paid in full&quot;.
          </p>

          {billingTagsLoading ? (
            <SettingsListSkeleton />
          ) : (
            <div className="space-y-2">
              {billingTags.length === 0 ? (
                <p className="text-xs text-slate-400">No billing tags yet. Add some below.</p>
              ) : (
                <ul className="space-y-1">
                  {billingTags.map((bt) => {
                    const isEditing = editingBillingId === bt.id;
                    return (
                      <li
                        key={bt.id}
                        className="flex items-start justify-between gap-2 bg-slate-900/60 border border-slate-700 rounded-md px-2 py-1"
                      >
                        {isEditing ? (
                          <>
                            <div className="flex-1 space-y-1">
                              <input
                                className="w-full bg-slate-900 border border-slate-600 rounded-md px-2 py-1 text-xs"
                                value={editingBillingName}
                                onChange={(e) => setEditingBillingName(e.target.value)}
                              />
                              <textarea
                                className="w-full bg-slate-900 border border-slate-600 rounded-md px-2 py-1 text-[11px] min-h-[40px]"
                                value={editingBillingDesc}
                                onChange={(e) => setEditingBillingDesc(e.target.value)}
                              />
                            </div>
                            <div className="flex flex-col gap-1 text-[11px]">
                              <button
                                onClick={saveEditBillingTag}
                                disabled={updateBillingTagMutation.isPending}
                                className="px-2 py-1 rounded-md bg-emerald-500 text-slate-900 font-semibold hover:bg-emerald-400 disabled:opacity-50"
                              >
                                Save
                              </button>
                              <button
                                onClick={cancelEditBillingTag}
                                className="px-2 py-1 rounded-md border border-slate-600 hover:bg-slate-800"
                              >
                                Cancel
                              </button>
                            </div>
                          </>
                        ) : (
                          <>
                            <div className="flex-1">
                              <div className="font-medium text-xs">{bt.name}</div>
                              {bt.description && (
                                <div className="text-[11px] text-slate-400">{bt.description}</div>
                              )}
                            </div>
                            <div className="flex flex-col gap-1 text-[11px]">
                              <button
                                onClick={() => startEditBillingTag(bt.id, bt.name, bt.description)}
                                className="text-sky-300 hover:text-sky-400"
                              >
                                Edit
                              </button>
                              <button
                                onClick={() => deleteBillingTag(bt.id)}
                                className="text-red-300 hover:text-red-400"
                              >
                                Delete
                              </button>
                            </div>
                          </>
                        )}
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          )}

          <div className="border-t border-slate-700 pt-3 mt-2 space-y-2">
            <div className="text-xs font-semibold text-slate-200">Add billing tag</div>
            <div className="flex flex-col gap-2">
              <input
                className="bg-slate-900 border border-slate-600 rounded-md px-2 py-1 text-xs"
                placeholder='Name (e.g. "Downpayment invoiced")'
                value={newBillingName}
                onChange={(e) => setNewBillingName(e.target.value)}
              />
              <textarea
                className="bg-slate-900 border border-slate-600 rounded-md px-2 py-1 text-xs min-h-[48px]"
                placeholder="Optional description"
                value={newBillingDesc}
                onChange={(e) => setNewBillingDesc(e.target.value)}
              />
              <button
                onClick={addBillingTag}
                disabled={!newBillingName.trim() || createBillingTagMutation.isPending}
                className="self-start px-3 py-1 rounded-md bg-emerald-500 text-slate-900 font-semibold text-xs hover:bg-emerald-400 disabled:opacity-60"
              >
                Add billing tag
              </button>
            </div>
          </div>
        </section>

        {/* Student Tags */}
        <section className="bg-slate-800/70 border border-slate-700 rounded-xl p-4 space-y-3 text-sm">
          <h2 className="font-semibold text-base">Student tags</h2>
          <p className="text-xs text-slate-300">
            Tags live on the student, not the booking. Use for &quot;Local&quot;, &quot;Needs
            lodging&quot;, etc.
          </p>

          {studentsLoading || studentTagsLoading ? (
            <SettingsListSkeleton />
          ) : students.length === 0 ? (
            <p className="text-xs text-slate-400">
              No students yet. Create students by making bookings first.
            </p>
          ) : (
            <div className="space-y-2 max-h-[360px] overflow-y-auto pr-1">
              {students.map((stu) => {
                const tags = tagsByStudent[stu.id] || [];
                const inputValue = newTagTextByStudent[stu.id] || "";
                return (
                  <div
                    key={stu.id}
                    className="bg-slate-900/50 border border-slate-700 rounded-md px-3 py-2 space-y-1"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-semibold">{stu.full_name}</span>
                    </div>
                    <div className="flex flex-wrap gap-1 text-[11px]">
                      {tags.length === 0 ? (
                        <span className="text-slate-500">No tags yet.</span>
                      ) : (
                        tags.map((tag) => (
                          <span
                            key={tag.id}
                            className="inline-flex items-center gap-1 rounded-full bg-sky-500/20 border border-sky-500/60 px-2 py-[2px]"
                          >
                            <span>{tag.label}</span>
                            <button
                              className="text-[10px] text-red-300 hover:text-red-400"
                              onClick={() => deleteStudentTag(tag.id)}
                            >
                              ×
                            </button>
                          </span>
                        ))
                      )}
                    </div>
                    <div className="flex items-center gap-2 mt-1 text-[11px]">
                      <input
                        className="flex-1 bg-slate-900 border border-slate-600 rounded-md px-2 py-1"
                        placeholder="Add tag (e.g. Local, Needs lodging)"
                        value={inputValue}
                        onChange={(e) => updateNewTagText(stu.id, e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault();
                            addStudentTag(stu.id);
                          }
                        }}
                      />
                      <button
                        className="px-2 py-1 rounded-md bg-sky-500 text-slate-900 font-semibold hover:bg-sky-400 disabled:opacity-60"
                        onClick={() => addStudentTag(stu.id)}
                        disabled={!inputValue.trim() || createStudentTagMutation.isPending}
                      >
                        Add
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
