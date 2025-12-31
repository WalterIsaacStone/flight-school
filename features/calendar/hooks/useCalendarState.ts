"use client";

import { useState, useMemo, useCallback } from "react";
import {
  startOfWeek,
  addDays,
  startOfMonth,
  addMonths,
  toDateString,
  getWeekDays,
  getMonthGridDays,
} from "@/lib/utils/dates";
import type { ViewMode } from "@/types";

// =============================================================================
// Calendar State Hook
// =============================================================================

export type FilterState = {
  lineId: "all" | string;
  courseType: string;
  billingTag: string;
};

export type CalendarState = {
  // View mode
  viewMode: ViewMode;
  setViewMode: (mode: ViewMode) => void;

  // Week view
  weekBaseDate: Date;
  setWeekBaseDate: (date: Date) => void;
  weekStart: Date;
  weekEnd: Date;
  days: Date[];
  dayKeys: string[];
  goToPrevWeek: () => void;
  goToNextWeek: () => void;
  goToToday: () => void;

  // Month view
  monthBaseDate: Date;
  setMonthBaseDate: (date: Date) => void;
  monthStart: Date;
  monthDays: Date[];
  goToPrevMonth: () => void;
  goToNextMonth: () => void;
  goToCurrentMonth: () => void;
  jumpToWeek: (date: Date) => void;

  // Filters
  filters: FilterState;
  setFilterLineId: (id: "all" | string) => void;
  setFilterCourseType: (type: string) => void;
  setFilterBillingTag: (tag: string) => void;
  clearFilters: () => void;
};

export function useCalendarState(): CalendarState {
  // ---------------------------------------------------------------------------
  // View Mode
  // ---------------------------------------------------------------------------
  const [viewMode, setViewMode] = useState<ViewMode>("week");

  // ---------------------------------------------------------------------------
  // Week View State
  // ---------------------------------------------------------------------------
  const [weekBaseDate, setWeekBaseDate] = useState<Date>(() => new Date());

  const weekStart = useMemo(() => startOfWeek(weekBaseDate), [weekBaseDate]);
  const weekEnd = useMemo(() => addDays(weekStart, 6), [weekStart]);
  const days = useMemo(() => getWeekDays(weekStart), [weekStart]);
  const dayKeys = useMemo(() => days.map((d) => toDateString(d)), [days]);

  const goToPrevWeek = useCallback(() => {
    setWeekBaseDate((prev) => addDays(prev, -7));
  }, []);

  const goToNextWeek = useCallback(() => {
    setWeekBaseDate((prev) => addDays(prev, 7));
  }, []);

  const goToToday = useCallback(() => {
    setWeekBaseDate(new Date());
  }, []);

  // ---------------------------------------------------------------------------
  // Month View State
  // ---------------------------------------------------------------------------
  const [monthBaseDate, setMonthBaseDate] = useState<Date>(() => new Date());

  const monthStart = useMemo(() => startOfMonth(monthBaseDate), [monthBaseDate]);
  const monthDays = useMemo(() => getMonthGridDays(monthStart), [monthStart]);

  const goToPrevMonth = useCallback(() => {
    setMonthBaseDate((prev) => addMonths(prev, -1));
  }, []);

  const goToNextMonth = useCallback(() => {
    setMonthBaseDate((prev) => addMonths(prev, 1));
  }, []);

  const goToCurrentMonth = useCallback(() => {
    setMonthBaseDate(new Date());
  }, []);

  const jumpToWeek = useCallback((date: Date) => {
    setWeekBaseDate(date);
    setViewMode("week");
  }, []);

  // ---------------------------------------------------------------------------
  // Filters
  // ---------------------------------------------------------------------------
  const [filters, setFilters] = useState<FilterState>({
    lineId: "all",
    courseType: "",
    billingTag: "",
  });

  const setFilterLineId = useCallback((id: "all" | string) => {
    setFilters((prev) => ({ ...prev, lineId: id }));
  }, []);

  const setFilterCourseType = useCallback((type: string) => {
    setFilters((prev) => ({ ...prev, courseType: type }));
  }, []);

  const setFilterBillingTag = useCallback((tag: string) => {
    setFilters((prev) => ({ ...prev, billingTag: tag }));
  }, []);

  const clearFilters = useCallback(() => {
    setFilters({ lineId: "all", courseType: "", billingTag: "" });
  }, []);

  // ---------------------------------------------------------------------------
  // Return
  // ---------------------------------------------------------------------------
  return {
    viewMode,
    setViewMode,

    weekBaseDate,
    setWeekBaseDate,
    weekStart,
    weekEnd,
    days,
    dayKeys,
    goToPrevWeek,
    goToNextWeek,
    goToToday,

    monthBaseDate,
    setMonthBaseDate,
    monthStart,
    monthDays,
    goToPrevMonth,
    goToNextMonth,
    goToCurrentMonth,
    jumpToWeek,

    filters,
    setFilterLineId,
    setFilterCourseType,
    setFilterBillingTag,
    clearFilters,
  };
}
