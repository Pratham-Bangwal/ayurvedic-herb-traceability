export async function fetchHerbs() {
  const res = await fetch('/api/herbs');
  return res.json();
}
