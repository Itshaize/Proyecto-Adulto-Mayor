const DEFAULT_TIME_ZONE = 'America/Bogota';

function dateInTimeZone(date = new Date(), timeZone = DEFAULT_TIME_ZONE) {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone, year: 'numeric', month: '2-digit', day: '2-digit',
  }).formatToParts(date);
  const value = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return `${value.year}-${value.month}-${value.day}`;
}

function dateDaysAgo(days, timeZone = DEFAULT_TIME_ZONE) {
  const date = new Date();
  date.setUTCDate(date.getUTCDate() - Math.max(0, days));
  return dateInTimeZone(date, timeZone);
}

module.exports = { dateInTimeZone, dateDaysAgo, DEFAULT_TIME_ZONE };
