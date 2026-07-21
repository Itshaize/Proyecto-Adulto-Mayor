export const APP_TIME_ZONE = 'America/Guayaquil';

export function dateInTimeZone(date = new Date(), timeZone = APP_TIME_ZONE) {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone, year: 'numeric', month: '2-digit', day: '2-digit'
  }).formatToParts(date);
  const value = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return `${value.year}-${value.month}-${value.day}`;
}

export function dateDaysAgo(days, timeZone = APP_TIME_ZONE) {
  const date = new Date();
  date.setUTCDate(date.getUTCDate() - Math.max(0, Number(days) || 0));
  return dateInTimeZone(date, timeZone);
}
