

/**
 * Converts a Jalali (Shamsi) date to a Gregorian date.
 * This is a standard algorithm for date conversion.
 * @param j_y - Jalali year
 * @param j_m - Jalali month
 * @param j_d - Jalali day
 * @returns A JavaScript Date object representing the Gregorian date.
 */
const jalaliToGregorian = (j_y: number, j_m: number, j_d: number): Date => {
  const g_days_in_month = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
  const j_days_in_month = [31, 31, 31, 31, 31, 31, 30, 30, 30, 30, 30, 29];

  let j_y_temp = j_y;
  let j_m_temp = j_m;
  let j_d_temp = j_d;

  j_y_temp = j_y_temp - 979;
  j_m_temp = j_m_temp - 1;
  j_d_temp = j_d_temp - 1;

  let j_day_no = 365 * j_y_temp + Math.floor(j_y_temp / 33) * 8 + Math.floor(((j_y_temp % 33) + 3) / 4);
  for (let i = 0; i < j_m_temp; ++i) {
    j_day_no += j_days_in_month[i];
  }

  j_day_no += j_d_temp;

  let g_day_no = j_day_no + 79;

  let g_y = 1600 + 400 * Math.floor(g_day_no / 146097); /* 146097 = 365*400 + 400/4 - 400/100 + 400/400 */
  g_day_no = g_day_no % 146097;

  let leap = true;
  if (g_day_no >= 36525) { /* 36525 = 365*100 + 100/4 */
    g_day_no--;
    g_y += 100 * Math.floor(g_day_no / 36524); /* 36524 = 365*100 + 100/4 - 100/100 */
    g_day_no = g_day_no % 36524;

    if (g_day_no >= 365)
      g_day_no++;
    else
      leap = false;
  }

  g_y += 4 * Math.floor(g_day_no / 1461); /* 1461 = 365*4 + 4/4 */
  g_day_no %= 1461;

  if (g_day_no >= 366) {
    leap = false;
    g_day_no--;
    g_y += Math.floor(g_day_no / 365);
    g_day_no = g_day_no % 365;
  }
  
  let i = 0;
  for (; g_day_no >= g_days_in_month[i] + (i === 1 && leap ? 1 : 0); i++) {
    g_day_no -= g_days_in_month[i] + (i === 1 && leap ? 1 : 0);
  }
  const g_m = i + 1;
  const g_d = g_day_no + 1;

  return new Date(g_y, g_m - 1, g_d);
}


/**
 * Parses a Jalali date string and converts it to a Gregorian Date object.
 * @param dateStr - The date string, expected format 'YYYY/MM/DD' or 'YYYY-MM-DD'.
 * @returns A JavaScript Date object or null if parsing fails.
 */
export const parseJalaliDate = (dateStr: string): Date | null => {
  if (!dateStr || typeof dateStr !== 'string') return null;
  const parts = dateStr.split(/[-/]/);
  if (parts.length !== 3) return null;

  const [j_y, j_m, j_d] = parts.map(p => parseInt(p, 10));

  if (isNaN(j_y) || isNaN(j_m) || isNaN(j_d)) return null;
  // Basic validation
  if (j_y < 1000 || j_y > 1500) return null; // Reasonable year range
  if (j_m < 1 || j_m > 12) return null;
  if (j_d < 1 || j_d > 31) return null;
  if (j_m > 6 && j_d > 30) return null; // Months 7-11 have 30 days
  // More complex leap year validation for Esfand could be added if needed

  return jalaliToGregorian(j_y, j_m, j_d);
};

/**
 * Parses a Gregorian date string and converts it to a Date object.
 * @param dateStr - The date string.
 * @returns A JavaScript Date object or null if parsing fails.
 */
export const parseGregorianDate = (dateStr: string): Date | null => {
  if (!dateStr || typeof dateStr !== 'string') return null;
  
  // The Date constructor can be unreliable for some formats, 
  // but it's generally good with ISO 8601 (YYYY-MM-DD) and common formats.
  // We add a check to ensure it doesn't create an invalid date.
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) {
      return null;
  }
  return date;
};