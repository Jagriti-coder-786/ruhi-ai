export function getCurrentDateTime() {
  const now = new Date();
  
  // Format for India (Asia/Kolkata)
  const options: Intl.DateTimeFormatOptions = {
    timeZone: 'Asia/Kolkata',
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: 'numeric',
    minute: 'numeric',
    second: 'numeric',
    hour12: true,
  };

  const formatter = new Intl.DateTimeFormat('en-IN', options);
  const parts = formatter.formatToParts(now);
  
  const formattedString = formatter.format(now);
  
  return {
    utcTimestamp: now.getTime(),
    isoString: now.toISOString(),
    timezone: 'Asia/Kolkata',
    formatted: formattedString,
    dateOnly: formattedString.split(', ')[1], // Rough extraction, but system prompt will use 'formatted'
    weekday: parts.find(p => p.type === 'weekday')?.value || '',
    temporalAnchor: `${parts.find(p => p.type === 'month')?.value} ${parts.find(p => p.type === 'year')?.value}`
  };
}
