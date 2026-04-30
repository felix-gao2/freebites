import { format } from "date-fns";
import { describe, expect, it } from "vitest";
import { computeValidityRange } from "../computeValidityRange";

const d = (iso: string) => {
  const [y, m, day] = iso.split("-").map(Number);
  return new Date(y, m - 1, day);
};
const fmt = (dates: Date[]) => dates.map((d) => format(d, "yyyy-MM-dd"));

describe("birthday_only", () => {
  it("returns just the birthday", () => {
    const result = computeValidityRange({ type: "birthday_only" }, d("2026-04-15"));
    expect(fmt(result)).toEqual(["2026-04-15"]);
  });

  it("edge: Dec 31 is a single day with no rollover", () => {
    const result = computeValidityRange({ type: "birthday_only" }, d("2026-12-31"));
    expect(fmt(result)).toEqual(["2026-12-31"]);
  });
});

describe("days_around", () => {
  it("returns before + birthday + after days", () => {
    const result = computeValidityRange(
      { type: "days_around", before: 2, after: 1 },
      d("2026-04-15"),
    );
    expect(fmt(result)).toEqual(["2026-04-13", "2026-04-14", "2026-04-15", "2026-04-16"]);
  });

  it("edge: Dec 30 with before=3 after=3 crosses into next year", () => {
    const result = computeValidityRange(
      { type: "days_around", before: 3, after: 3 },
      d("2026-12-30"),
    );
    expect(fmt(result)).toEqual([
      "2026-12-27",
      "2026-12-28",
      "2026-12-29",
      "2026-12-30",
      "2026-12-31",
      "2027-01-01",
      "2027-01-02",
    ]);
  });

  it("before=0 after=0 returns just birthday", () => {
    const result = computeValidityRange(
      { type: "days_around", before: 0, after: 0 },
      d("2026-06-01"),
    );
    expect(fmt(result)).toEqual(["2026-06-01"]);
  });
});

describe("birthday_month", () => {
  it("returns every day in the birthday month", () => {
    const result = computeValidityRange({ type: "birthday_month" }, d("2026-04-15"));
    expect(fmt(result)).toHaveLength(30);
    expect(fmt(result)[0]).toBe("2026-04-01");
    expect(fmt(result).at(-1)).toBe("2026-04-30");
  });

  it("edge: Feb in a leap year has 29 days", () => {
    const result = computeValidityRange({ type: "birthday_month" }, d("2024-02-15"));
    expect(fmt(result)).toHaveLength(29);
    expect(fmt(result).at(-1)).toBe("2024-02-29");
  });

  it("edge: Feb in a non-leap year has 28 days", () => {
    const result = computeValidityRange({ type: "birthday_month" }, d("2026-02-15"));
    expect(fmt(result)).toHaveLength(28);
    expect(fmt(result).at(-1)).toBe("2026-02-28");
  });
});

describe("days_from_birthday", () => {
  it("Krispy Kreme example: before=1, days=30 is 30 days total starting day before", () => {
    // Day before Apr 15 = Apr 14; 30 days total → Apr 14 to May 13
    const result = computeValidityRange(
      { type: "days_from_birthday", before: 1, days: 30 },
      d("2026-04-15"),
    );
    expect(fmt(result)).toHaveLength(30);
    expect(fmt(result)[0]).toBe("2026-04-14");
    expect(fmt(result).at(-1)).toBe("2026-05-13");
  });

  it("before=0 is a window starting on birthday", () => {
    const result = computeValidityRange(
      { type: "days_from_birthday", before: 0, days: 14 },
      d("2026-04-15"),
    );
    expect(fmt(result)).toHaveLength(14);
    expect(fmt(result)[0]).toBe("2026-04-15");
    expect(fmt(result).at(-1)).toBe("2026-04-28");
  });

  it("edge: Dec 28 birthday with before=1, days=30 crosses into next year", () => {
    // Start Dec 27; 30 days → Dec 27 to Jan 25
    const result = computeValidityRange(
      { type: "days_from_birthday", before: 1, days: 30 },
      d("2026-12-28"),
    );
    expect(fmt(result)).toHaveLength(30);
    expect(fmt(result)[0]).toBe("2026-12-27");
    expect(fmt(result).at(-1)).toBe("2027-01-25");
  });
});

describe("weeks_after", () => {
  it("Crumbl example: weeks=6 covers birthday through 6 weeks later", () => {
    // Apr 15 + 42 days = May 27; inclusive = 43 days
    const result = computeValidityRange({ type: "weeks_after", weeks: 6 }, d("2026-04-15"));
    expect(fmt(result)).toHaveLength(43);
    expect(fmt(result)[0]).toBe("2026-04-15");
    expect(fmt(result).at(-1)).toBe("2026-05-27");
  });

  it("edge: Dec 20 with weeks=2 crosses into next year", () => {
    // Dec 20 + 14 days = Jan 3; inclusive = 15 days
    const result = computeValidityRange({ type: "weeks_after", weeks: 2 }, d("2026-12-20"));
    expect(fmt(result)).toHaveLength(15);
    expect(fmt(result)[0]).toBe("2026-12-20");
    expect(fmt(result).at(-1)).toBe("2027-01-03");
  });
});

describe("month_from_birthday", () => {
  it("returns birthday through same date next month inclusive", () => {
    // Mar 15 to Apr 15 = 32 days inclusive
    const result = computeValidityRange({ type: "month_from_birthday" }, d("2026-03-15"));
    expect(fmt(result)[0]).toBe("2026-03-15");
    expect(fmt(result).at(-1)).toBe("2026-04-15");
    expect(fmt(result)).toHaveLength(32);
  });

  it("edge: Jan 31 rolls to Feb 28 (date-fns clamps end-of-month overflow)", () => {
    const result = computeValidityRange({ type: "month_from_birthday" }, d("2026-01-31"));
    expect(fmt(result)[0]).toBe("2026-01-31");
    expect(fmt(result).at(-1)).toBe("2026-02-28");
  });

  it("edge: Nov 30 crosses into next year for Dec 30 birthday", () => {
    const result = computeValidityRange({ type: "month_from_birthday" }, d("2026-12-01"));
    expect(fmt(result)[0]).toBe("2026-12-01");
    expect(fmt(result).at(-1)).toBe("2027-01-01");
  });
});
