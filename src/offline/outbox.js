// Types of writes that can be saved offline and synced later.
// Each payload is POSTed as-is with a client_id, which the backend uses to
// ignore retries of a record it has already saved.
export const OUTBOX_TYPES = {
  eggCollection: {
    label: 'Egg collection',
    url: '/egg-collections/',
    icon: 'egg-outline',
    summary: (p) => `${p.quantity_collected} eggs · ${p.date}`,
  },
  feedLog: {
    label: 'Feed log',
    url: '/feed-logs/',
    icon: 'food-drumstick-outline',
    summary: (p) => `${p.quantity_kg} kg ${p.feed_type} · ${p.date}`,
  },
  healthLog: {
    label: 'Health log',
    url: '/health-logs/',
    icon: 'medical-bag',
    summary: (p) => `${p.log_type}${p.affected_birds ? ` (${p.affected_birds} birds)` : ''} · ${p.date}`,
  },
  dailyReport: {
    label: 'Daily report',
    url: '/reports/submissions/',
    icon: 'clipboard-text-outline',
    summary: (p) => `Report for ${p.reference_date}`,
  },
};

// 'retry' = keep the item queued and try again later (offline, timeout, server
// down, or the session needs refreshing). 'reject' = the server refused this
// entry, so retrying it unchanged won't help.
export const classifyError = (error) => {
  const status = error?.response?.status;
  if (!status || status >= 500 || status === 401 || status === 408 || status === 429) {
    return 'retry';
  }
  return 'reject';
};

export const errorMessage = (error, type) => {
  const data = error?.response?.data;
  if (!error?.response) return 'Could not reach the server.';
  if (!data || typeof data !== 'object') return `Server error (${error.response.status}).`;

  let message;
  if (data.detail) {
    message = String(data.detail);
  } else {
    const [field, value] = Object.entries(data)[0] || [];
    const first = Array.isArray(value) ? value[0] : value;
    if (first) message = field === 'non_field_errors' ? String(first) : `${field}: ${first}`;
  }
  if (type === 'dailyReport' && /unique|already been submitted/i.test(message || '')) {
    return 'A report for this date has already been submitted.';
  }
  return message || 'The server rejected this entry.';
};

export class OutboxRejectedError extends Error {}
