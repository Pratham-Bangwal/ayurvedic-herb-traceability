const BASE = 'http://localhost:4000';

export async function fetchHerbs() {
  const res = await fetch(`${BASE}/api/herbs`);
  return res.json();
}

export async function fetchTrace(batchId) {
  const res = await fetch(`${BASE}/api/trace/${batchId}`);
  if (!res.ok) throw new Error('not_found');
  return res.json();
}
