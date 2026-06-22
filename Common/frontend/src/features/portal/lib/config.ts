/**
 * インボイス番号検索アプリの遷移先（env 未設定時のフォールバック）。
 *
 * 同一オリジン統合（1 CloudFront）後は `/invoice-search/` サブパスで配信されるため、
 * 既定値は同一オリジン相対パスとする。外部 URL を使う場合は
 * `VITE_INVOICE_SEARCH_URL` で上書きできる。
 */
const DEFAULT_INVOICE_SEARCH_URL = "/invoice-search/";

/** 遷移先 URL を env から解決する。未設定なら既定値。 */
export function resolveInvoiceSearchUrl(): string {
  const fromEnv = import.meta.env.VITE_INVOICE_SEARCH_URL;
  return fromEnv && fromEnv.length > 0 ? fromEnv : DEFAULT_INVOICE_SEARCH_URL;
}
