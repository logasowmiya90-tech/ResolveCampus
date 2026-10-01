export function formatDateTime(value) {
  if (!value) return 'Not available'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return 'Not available'

  return new Intl.DateTimeFormat(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(date)
}


export function formatStatus(value) {
  return value
    .toLowerCase()
    .split('_')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
}


export function statusClass(value) {
  return value.toLowerCase().replaceAll('_', '-')
}


export function formatPriority(value) {
  return value.charAt(0) + value.slice(1).toLowerCase()
}