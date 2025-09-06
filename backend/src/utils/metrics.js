// Simple in-memory metrics recorder (Prometheus-style exposition)
// Backward compatible counters retained; new histogram + labeled counters added.
const DURATION_BUCKETS = [5, 10, 25, 50, 100, 250, 500, 1000, 2500, 5000]; // ms

const state = {
  // aggregate counters (legacy)
  requests_total: 0,
  errors_total: 0,
  duration_ms_sum: 0,
  duration_ms_count: 0,
  // labeled status code counts
  status_codes: {}, // { '200': n, '404': n, ... }
  // histogram buckets (store counts per upper bound + +Inf)
  duration_buckets: DURATION_BUCKETS.map(() => 0),
  duration_inf: 0,
};

function record(durationMs, status) {
  state.requests_total += 1;
  state.duration_ms_sum += durationMs;
  state.duration_ms_count += 1;

  const codeKey = String(status);
  state.status_codes[codeKey] = (state.status_codes[codeKey] || 0) + 1;

  if (status >= 500) state.errors_total += 1;

  // histogram bucket increment
  let bucketed = false;
  for (let i = 0; i < DURATION_BUCKETS.length; i += 1) {
    if (durationMs <= DURATION_BUCKETS[i]) {
      state.duration_buckets[i] += 1;
      bucketed = true;
      break;
    }
  }
  if (!bucketed) state.duration_inf += 1; // +Inf bucket
}

function exposition() {
  const lines = [];
  // Aggregate request counter
  lines.push('# HELP app_requests_total Total HTTP requests');
  lines.push('# TYPE app_requests_total counter');
  lines.push(`app_requests_total ${state.requests_total}`);

  // Labeled per-status requests
  lines.push('# HELP app_requests_total_status Total HTTP requests by status code');
  lines.push('# TYPE app_requests_total_status counter');
  Object.entries(state.status_codes).forEach(([code, val]) => {
    lines.push(`app_requests_total{code="${code}"} ${val}`);
  });

  // Errors
  lines.push('# HELP app_errors_total Total 5xx errors');
  lines.push('# TYPE app_errors_total counter');
  lines.push(`app_errors_total ${state.errors_total}`);

  // Duration histogram (Prometheus format)
  lines.push('# HELP app_request_duration_ms Request duration histogram in milliseconds');
  lines.push('# TYPE app_request_duration_ms histogram');
  let cumulative = 0;
  for (let i = 0; i < DURATION_BUCKETS.length; i += 1) {
    cumulative += state.duration_buckets[i];
    lines.push(`app_request_duration_ms_bucket{le="${DURATION_BUCKETS[i]}"} ${cumulative}`);
  }
  // +Inf bucket is total count
  const totalHistogramCount = cumulative + state.duration_inf;
  lines.push(`app_request_duration_ms_bucket{le="+Inf"} ${totalHistogramCount}`);
  lines.push(`app_request_duration_ms_sum ${state.duration_ms_sum}`);
  lines.push(`app_request_duration_ms_count ${state.duration_ms_count}`);

  // Legacy individual counters (keep for compatibility; may deprecate later)
  lines.push('# HELP app_request_duration_ms_sum Cumulative request duration in ms (legacy)');
  lines.push('# TYPE app_request_duration_ms_sum counter');
  lines.push(`app_request_duration_ms_sum ${state.duration_ms_sum}`);
  lines.push('# HELP app_request_duration_ms_count Total counted request durations (legacy)');
  lines.push('# TYPE app_request_duration_ms_count counter');
  lines.push(`app_request_duration_ms_count ${state.duration_ms_count}`);

  return lines.join('\n');
}

module.exports = { record, exposition, __state: state, __buckets: DURATION_BUCKETS };
