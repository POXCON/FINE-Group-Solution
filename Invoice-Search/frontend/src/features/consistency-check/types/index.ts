import { z } from "zod";

export const csvRowSchema = z.object({
  invoiceNumber: z.string(),
  companyName: z.string(),
  address: z.string(),
});

export type CsvRow = z.infer<typeof csvRowSchema>;

export interface ConsistencyRow extends CsvRow {
  id: string;
  isValidFormat: boolean;
  apiCompanyName: string | null;
  apiAddress: string | null;
  isConsistent: boolean;
}

export const RAW_CSV_COLUMNS = {
  invoiceNumber: "インボイス番号",
  companyName: "会社名",
  address: "住所",
} as const;
