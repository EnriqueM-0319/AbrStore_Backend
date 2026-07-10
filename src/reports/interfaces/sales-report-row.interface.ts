export interface SalesReportRow {
  period: Date;
  salesCount: string;
  canceledCount: string;
  grossTotal: string | null;
  cashTotal: string | null;
  cardTotal: string | null;
  transferTotal: string | null;
  creditTotal: string | null;
  creditPendingTotal: string | null;
  creditPaidTotal: string | null;
  creditCollectedCashTotal?: string | null;
  creditCollectedCardTotal?: string | null;
  creditCollectedTransferTotal?: string | null;
  creditCollectedTotal?: string | null;
}
