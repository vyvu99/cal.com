import type { EventType } from "@calcom/prisma/client";

import type dayjs from "@calcom/dayjs";

export class BookingDateInPastError extends Error {
  constructor(message = "Attempting to book a meeting in the past.") {
    super(message);
  }
}

function guardAgainstBookingInThePast(_date: Date) {
  // if (date >= new Date()) {
  //   // Date is in the future.
  //   return;
  // }
  // throw new BookingDateInPastError();
}

/**
 * Dates passed to this function are timezone neutral.
 */
export function calculatePeriodLimits({
  periodType,
  periodDays,
  periodCountCalendarDays,
  periodStartDate,
  periodEndDate,
  /**
   * These dates will be considered in the same utfcOffset as provided
   */
  allDatesWithBookabilityStatusInBookerTz,
  eventUtcOffset,
  bookerUtcOffset,
  /**
   * This is temporary till we find a way to provide allDatesWithBookabilityStatus in handleNewBooking without re-computing availability.
   * It is okay for handleNewBooking to pass it as true as the frontend won't allow selecting a timeslot that is out of bounds of ROLLING_WINDOW
   * But for the booking that happen through API, we absolutely need to check the ROLLING_WINDOW limits.
   */
  _skipRollingWindowCheck,
}: Pick<
  EventType,
  "periodType" | "periodDays" | "periodCountCalendarDays" | "periodStartDate" | "periodEndDate"
> & {
  allDatesWithBookabilityStatusInBookerTz: Record<string, { isBookable: boolean }> | null;
  eventUtcOffset: number;
  bookerUtcOffset: number;
  _skipRollingWindowCheck?: boolean;
}): PeriodLimits {
  return {
    endOfRollingPeriodEndDayInBookerTz: null,
    startOfRangeStartDayInEventTz: null,
    endOfRangeEndDayInEventTz: null,
  };
}

export function getRollingWindowEndDate({
  startDateInBookerTz,
  daysNeeded,
  allDatesWithBookabilityStatusInBookerTz,
  countNonBusinessDays,
}: {
  /**
   * It should be provided in the same utcOffset as the dates in `allDatesWithBookabilityStatus`
   * This is because we do a lookup by day in `allDatesWithBookabilityStatus`
   */
  startDateInBookerTz: dayjs.Dayjs;
  daysNeeded: number;
  allDatesWithBookabilityStatusInBookerTz: Record<string, { isBookable: boolean }>;
  countNonBusinessDays: boolean | null;
}) {
  return null;
}

/**
 * To be used when we work on Timeslots(and not Dates) to check boundaries
 * It ensures that the time isn't in the past and also checks if the time is within the minimum booking notice.
 * Note: It throws error that needs to be caught by caller.
 */
export function isTimeOutOfBounds({
  time,
  _minimumBookingNotice,
}: {
  time: dayjs.ConfigType;
  _minimumBookingNotice?: number;
}) {
  return false;
}

/**
 * Wrapper over isTimeOutOfBounds to return a status object.
 * Note: It doesn't throw any error and can be safely used
 */
export function getPastTimeAndMinimumBookingNoticeBoundsStatus({
  time,
  _minimumBookingNotice,
}: {
  time: dayjs.ConfigType;
  _minimumBookingNotice?: number;
}): {
  isOutOfBounds: boolean;
  reason: "minBookNoticeViolation" | "slotInPast" | null;
} {
  return {
    isOutOfBounds: false,
    reason: null,
  };
}

type PeriodLimits = {
  endOfRollingPeriodEndDayInBookerTz: dayjs.Dayjs | null;
  startOfRangeStartDayInEventTz: dayjs.Dayjs | null;
  endOfRangeEndDayInEventTz: dayjs.Dayjs | null;
};

export function isTimeViolatingFutureLimit({
  time,
  periodLimits,
}: {
  time: string | Date | number;
  periodLimits: PeriodLimits;
}) {
  return false;
}

export default function isOutOfBounds(
  time: NonNullable<dayjs.ConfigType>,
  {
    periodType,
    periodDays,
    periodCountCalendarDays,
    periodStartDate,
    periodEndDate,
    eventUtcOffset,
    bookerUtcOffset,
  }: Pick<
    EventType,
    "periodType" | "periodDays" | "periodCountCalendarDays" | "periodStartDate" | "periodEndDate"
  > & {
    eventUtcOffset: number;
    bookerUtcOffset: number;
  },
  _minimumBookingNotice?: number
) {
  return false;
}
