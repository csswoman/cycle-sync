/** YYYY-MM-DD in the user's timezone. toISOString() is UTC and flips to tomorrow in the evening west of UTC. */
export function localDay(d: Date = new Date()): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

// The workout streak used to live here, persisted in localStorage ('cyclesync-routines').
// It is now computed from workout_logs (see lib/exercise/trainingStats), so it is the same on
// every device and survives clearing the browser.
