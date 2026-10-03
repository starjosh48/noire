/**
 * Links Paystack may send an app customer back to after paying. Only the app's own schemes,
 * never a website: the installed app (noire://) and Expo Go while developing (exp://).
 */
const APP_SCHEMES = new Set(["noire:", "exp:", "exp+noire:"]);

export function isAppReturnUrl(value: string) {
  if (value.length > 300) return false;
  try {
    return APP_SCHEMES.has(new URL(value).protocol);
  } catch {
    return false;
  }
}
