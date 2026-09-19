// All timestamps are stored in UTC in the database (timestamptz). These
// helpers convert to a display timezone using the built-in Intl API only —
// no date library needed for this.

export const DEFAULT_TIMEZONE = 'Africa/Lagos';

export function formatDateTime(isoString, timeZone = DEFAULT_TIMEZONE, locale = 'en') {
  if (!isoString) return '';
  const date = new Date(isoString);
  return new Intl.DateTimeFormat(locale === 'ar' ? 'ar' : 'en-GB', {
    timeZone,
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
}

export function formatDate(isoString, timeZone = DEFAULT_TIMEZONE, locale = 'en') {
  if (!isoString) return '';
  const date = new Date(isoString);
  return new Intl.DateTimeFormat(locale === 'ar' ? 'ar' : 'en-GB', {
    timeZone,
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(date);
}

// Returns { days, hours, minutes, totalMs, isPast } counting down to isoString.
export function getCountdown(isoString, now = new Date()) {
  const target = new Date(isoString).getTime();
  const totalMs = target - now.getTime();
  const isPast = totalMs <= 0;
  const abs = Math.abs(totalMs);
  const days = Math.floor(abs / (1000 * 60 * 60 * 24));
  const hours = Math.floor((abs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((abs % (1000 * 60 * 60)) / (1000 * 60));
  return { days, hours, minutes, totalMs, isPast };
}

export function formatCountdown(isoString, now = new Date()) {
  const { days, hours, minutes, isPast } = getCountdown(isoString, now);
  if (isPast) return 'Published';
  const parts = [];
  if (days) parts.push(`${days}d`);
  if (hours || days) parts.push(`${hours}h`);
  parts.push(`${minutes}m`);
  return parts.join(' ');
}
