/** Today's date in the user's timezone as yyyy-mm-dd (the format of <input type="date">). */
export function todayIso(now: Date = new Date()) {
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${now.getFullYear()}-${month}-${day}`;
}
