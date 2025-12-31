// =============================================================================
// Calendar Feature - Public API
// =============================================================================

// Main entry point
export { CalendarPage } from "./containers/CalendarPage";

// Hooks (for advanced usage)
export {
  useCalendarState,
  useDrawerState,
  useCalendarData,
  useBookingDetails,
} from "./hooks";

// Schemas (for external validation)
export {
  BookingDraftSchema,
  BookingSubmissionSchema,
  NewStudentSchema,
  NewActionSchema,
  validateBookingDraft,
  validateBookingSubmission,
} from "./schemas/booking";

// Types
export type { BookingDraft, BookingSubmission } from "./schemas/booking";
export type { CalendarState, FilterState } from "./hooks/useCalendarState";
export type { DrawerState, BookingForEdit } from "./hooks/useDrawerState";
