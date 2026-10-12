// YYYY-MM-DD in the device's local timezone. toISOString() uses UTC, which gives
// the previous day for entries made just after midnight in timezones ahead of UTC.
export const toLocalDateString = (date = new Date()) => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
};
