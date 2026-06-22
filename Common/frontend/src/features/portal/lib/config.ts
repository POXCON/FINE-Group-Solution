/** インボイス番号検索アプリの暫定遷移先（env 未設定時のフォールバック）。 */
const DEFAULT_INVOICE_SEARCH_URL = "https://d2f2iacxluod2n.cloudfront.net";

/** 遷移先 URL を env から解決する。未設定なら既定値。 */
export function resolveInvoiceSearchUrl(): string {
  const fromEnv = import.meta.env.VITE_INVOICE_SEARCH_URL;
  return fromEnv && fromEnv.length > 0 ? fromEnv : DEFAULT_INVOICE_SEARCH_URL;
}
