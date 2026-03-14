export const SEVERITY_LEVELS = ['Critical', 'Warning', 'Minor']

export function normalizeSeverity(severity) {
  const value = String(severity || '').trim().toLowerCase()

  if (value === 'critical') return 'Critical'
  if (value === 'warning') return 'Warning'
  return 'Minor'
}
