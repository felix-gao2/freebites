import {
  addDays,
  addMonths,
  addWeeks,
  eachDayOfInterval,
  endOfMonth,
  startOfMonth,
  subDays,
} from "date-fns";

export type ValidityWindow =
  | { type: "birthday_only" }
  | { type: "days_around"; before: number; after: number }
  | { type: "birthday_month" }
  | { type: "days_from_birthday"; before: number; days: number }
  | { type: "weeks_after"; weeks: number }
  | { type: "month_from_birthday" };

/**
 * Returns every date on which a deal is redeemable, given the deal's validity
 * window and the user's birthday set to the correct calendar year.
 * Caller is responsible for passing birthday with the right year
 * (e.g. this year's occurrence of the user's birth month/day).
 */
export function computeValidityRange(window: ValidityWindow, birthday: Date): Date[] {
  switch (window.type) {
    case "birthday_only":
      return [birthday];

    case "days_around":
      return eachDayOfInterval({
        start: subDays(birthday, window.before),
        end: addDays(birthday, window.after),
      });

    case "birthday_month":
      return eachDayOfInterval({
        start: startOfMonth(birthday),
        end: endOfMonth(birthday),
      });

    case "days_from_birthday": {
      // Window starts `before` days before birthday and lasts `days` total days.
      const start = subDays(birthday, window.before);
      return eachDayOfInterval({
        start,
        end: addDays(start, window.days - 1),
      });
    }

    case "weeks_after":
      return eachDayOfInterval({
        start: birthday,
        end: addWeeks(birthday, window.weeks),
      });

    case "month_from_birthday":
      return eachDayOfInterval({
        start: birthday,
        end: addMonths(birthday, 1),
      });
  }
}
