export function getFormatBillingPeriod(startDate: Date, endDate: Date): string {
  const optionsDayMonth: Intl.DateTimeFormatOptions = {
    day: 'numeric',
    month: 'long',
  };
  const optionsFull: Intl.DateTimeFormatOptions = {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  };

  const isSameMonth = startDate.getMonth() === endDate.getMonth();
  const isSameYear = startDate.getFullYear() === endDate.getFullYear();

  if (isSameMonth && isSameYear) {
    const startDay = startDate.toLocaleDateString('en-US', { day: 'numeric' });
    const endDay = endDate.toLocaleDateString('en-US', { day: 'numeric' });
    const month = startDate.toLocaleDateString('en-US', { month: 'long' });
    return `${startDay} - ${endDay} ${month}`;
  } else if (isSameYear) {
    const start = startDate.toLocaleDateString('en-US', optionsDayMonth);
    const end = endDate.toLocaleDateString('en-US', optionsDayMonth);
    return `${start} - ${end}`;
  } else {
    const start = startDate.toLocaleDateString('en-US', optionsFull);
    const end = endDate.toLocaleDateString('en-US', optionsFull);
    return `${start} - ${end}`;
  }
}
