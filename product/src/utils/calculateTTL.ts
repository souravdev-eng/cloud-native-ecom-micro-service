export function calculateTTL(value: number, timeUnit: 'seconds' | 'minutes' | 'hours'): number {
  switch (timeUnit) {
    case 'seconds':
      return value;
    case 'minutes':
      return value * 60;
    case 'hours':
      return value * 3600;
    default:
      throw new Error('Invalid time unit. Use "seconds", "minutes", or "hours".');
  }
}
