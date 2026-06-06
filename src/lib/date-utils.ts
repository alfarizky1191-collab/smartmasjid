export type DateInput = Date | number | string;

const JAKARTA_TIME_ZONE = "Asia/Jakarta";
const DATE_ONLY_PATTERN = /^(\d{4})-(\d{2})-(\d{2})$/;

const indonesianDateWithDayFormatter = new Intl.DateTimeFormat("id-ID", {
  timeZone: JAKARTA_TIME_ZONE,
  weekday: "long",
  day: "2-digit",
  month: "long",
  year: "numeric",
});

const jakartaDateKeyFormatter = new Intl.DateTimeFormat("en-CA", {
  timeZone: JAKARTA_TIME_ZONE,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

const toJakartaDate = (date: DateInput) => {
  if (date instanceof Date) {
    return date;
  }

  if (typeof date === "string") {
    const value = date.trim();
    const dateOnlyMatch = value.match(DATE_ONLY_PATTERN);

    if (dateOnlyMatch) {
      return new Date(`${value}T00:00:00+07:00`);
    }

    return new Date(value);
  }

  return new Date(date);
};

export function formatIndonesianDateWithDay(date: DateInput) {
  const parsedDate = toJakartaDate(date);

  if (Number.isNaN(parsedDate.getTime())) {
    return "";
  }

  return indonesianDateWithDayFormatter.format(parsedDate);
}

export function getJakartaDateKey(date: DateInput = new Date()) {
  return jakartaDateKeyFormatter.format(toJakartaDate(date));
}

export const indonesianDateWithDayExamples = [
  {
    input: "2026-06-05",
    expected: "Jumat, 05 Juni 2026",
  },
  {
    input: "2026-06-06",
    expected: "Sabtu, 06 Juni 2026",
  },
  {
    input: "2026-06-07",
    expected: "Minggu, 07 Juni 2026",
  },
] as const;
