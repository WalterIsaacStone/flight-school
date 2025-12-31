"use client";

import { useState, useCallback } from "react";
import { toDateString } from "@/lib/utils/dates";
import type { BookingDraft } from "../schemas/booking";
import type { DrawerTab, PanelMode } from "@/types";

// =============================================================================
// Drawer State Hook
// =============================================================================

// Extended booking type for editing
export type BookingForEdit = {
  id: string;
  line_id: string;
  student_id: string;
  course_type: string;
  start_date: string;
  end_date: string;
  billing_tag: string | null;
  note: string | null;
  students?: { full_name: string | null } | null;
};

export type NewStudentForm = {
  name: string;
  email: string;
  phone: string;
  notes: string;
};

export type NewActionForm = {
  title: string;
  dueDate: string;
};

export type DrawerState = {
  // Panel state
  isOpen: boolean;
  mode: PanelMode;
  activeTab: DrawerTab;
  setActiveTab: (tab: DrawerTab) => void;

  // Booking being edited (null for create)
  activeBooking: BookingForEdit | null;

  // Form draft
  draft: BookingDraft | null;
  updateDraft: <K extends keyof BookingDraft>(field: K, value: BookingDraft[K]) => void;

  // New student form (inline creation)
  newStudent: NewStudentForm;
  updateNewStudent: <K extends keyof NewStudentForm>(field: K, value: string) => void;
  resetNewStudent: () => void;
  hasNewStudent: boolean;

  // New action form
  newAction: NewActionForm;
  updateNewAction: <K extends keyof NewActionForm>(field: K, value: string) => void;
  resetNewAction: () => void;

  // Actions
  openCreate: (lineId: string, date: Date, defaultStudentId?: string) => void;
  openEdit: (booking: BookingForEdit) => void;
  close: () => void;
};

const EMPTY_NEW_STUDENT: NewStudentForm = {
  name: "",
  email: "",
  phone: "",
  notes: "",
};

const EMPTY_NEW_ACTION: NewActionForm = {
  title: "",
  dueDate: "",
};

export function useDrawerState(): DrawerState {
  // ---------------------------------------------------------------------------
  // Core State
  // ---------------------------------------------------------------------------
  const [isOpen, setIsOpen] = useState(false);
  const [mode, setMode] = useState<PanelMode>("create");
  const [activeTab, setActiveTab] = useState<DrawerTab>("student");
  const [activeBooking, setActiveBooking] = useState<BookingForEdit | null>(null);
  const [draft, setDraft] = useState<BookingDraft | null>(null);

  // ---------------------------------------------------------------------------
  // New Student Form
  // ---------------------------------------------------------------------------
  const [newStudent, setNewStudent] = useState<NewStudentForm>(EMPTY_NEW_STUDENT);

  const updateNewStudent = useCallback(<K extends keyof NewStudentForm>(
    field: K,
    value: string
  ) => {
    setNewStudent((prev) => ({ ...prev, [field]: value }));
  }, []);

  const resetNewStudent = useCallback(() => {
    setNewStudent(EMPTY_NEW_STUDENT);
  }, []);

  const hasNewStudent = newStudent.name.trim().length > 0;

  // ---------------------------------------------------------------------------
  // New Action Form
  // ---------------------------------------------------------------------------
  const [newAction, setNewAction] = useState<NewActionForm>(EMPTY_NEW_ACTION);

  const updateNewAction = useCallback(<K extends keyof NewActionForm>(
    field: K,
    value: string
  ) => {
    setNewAction((prev) => ({ ...prev, [field]: value }));
  }, []);

  const resetNewAction = useCallback(() => {
    setNewAction(EMPTY_NEW_ACTION);
  }, []);

  // ---------------------------------------------------------------------------
  // Draft Management
  // ---------------------------------------------------------------------------
  const updateDraft = useCallback(<K extends keyof BookingDraft>(
    field: K,
    value: BookingDraft[K]
  ) => {
    setDraft((prev) => (prev ? { ...prev, [field]: value } : prev));
  }, []);

  // ---------------------------------------------------------------------------
  // Open/Close Actions
  // ---------------------------------------------------------------------------
  const openCreate = useCallback((
    lineId: string,
    date: Date,
    defaultStudentId: string = ""
  ) => {
    setMode("create");
    setActiveBooking(null);
    setActiveTab("student");
    setDraft({
      line_id: lineId,
      student_id: defaultStudentId,
      course_type: "",
      billing_tag: "",
      start_date: toDateString(date),
      end_date: toDateString(date),
      note: "",
    });
    setNewStudent(EMPTY_NEW_STUDENT);
    setNewAction(EMPTY_NEW_ACTION);
    setIsOpen(true);
  }, []);

  const openEdit = useCallback((booking: BookingForEdit) => {
    setMode("edit");
    setActiveBooking(booking);
    setActiveTab("student");
    setDraft({
      id: booking.id,
      line_id: booking.line_id,
      student_id: booking.student_id,
      course_type: booking.course_type,
      billing_tag: booking.billing_tag ?? "",
      start_date: booking.start_date,
      end_date: booking.end_date,
      note: booking.note ?? "",
    });
    setNewStudent(EMPTY_NEW_STUDENT);
    setNewAction(EMPTY_NEW_ACTION);
    setIsOpen(true);
  }, []);

  const close = useCallback(() => {
    setIsOpen(false);
    setDraft(null);
    setActiveBooking(null);
    setNewStudent(EMPTY_NEW_STUDENT);
    setNewAction(EMPTY_NEW_ACTION);
  }, []);

  // ---------------------------------------------------------------------------
  // Return
  // ---------------------------------------------------------------------------
  return {
    isOpen,
    mode,
    activeTab,
    setActiveTab,
    activeBooking,
    draft,
    updateDraft,
    newStudent,
    updateNewStudent,
    resetNewStudent,
    hasNewStudent,
    newAction,
    updateNewAction,
    resetNewAction,
    openCreate,
    openEdit,
    close,
  };
}
