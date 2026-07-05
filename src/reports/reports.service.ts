import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AuthService } from '../auth/auth.service';
import { GraphqlContext } from '../common/interfaces';
import { userManagementRoles } from '../common/utils';
import { SaleEntity } from '../sales';
import { SalesReportRow } from './interfaces';

const groupOptions = ['day', 'month', 'year'] as const;
const reportTimeZone = 'America/Cancun';
const reportTimeZoneOffsetMinutes = -300;

type ReportGroup = (typeof groupOptions)[number];

@Injectable()
export class ReportsService {
  constructor(
    @InjectRepository(SaleEntity)
    private readonly sales: Repository<SaleEntity>,
    private readonly authService: AuthService,
  ) {}

  async salesReport(
    context: GraphqlContext,
    groupByInput?: string,
    startDateInput?: string,
    endDateInput?: string,
  ) {
    await this.authService.requireRole(context, userManagementRoles);
    const groupBy = this.resolveGroupBy(groupByInput);
    const { startDate, endDate } = this.resolveDateRange(
      startDateInput,
      endDateInput,
    );
    const rows = await this.getSalesReportRows(groupBy, startDate, endDate);
    const items = rows.map((row) => this.mapReportRow(row));
    const summary = this.buildSummary(items);

    return {
      groupBy,
      startDate: startDateInput ?? this.toLocalDateInput(startDate),
      endDate: endDateInput ?? this.toLocalDateInput(endDate),
      summary,
      items,
    };
  }

  private resolveGroupBy(groupByInput?: string): ReportGroup {
    return groupOptions.includes(groupByInput as ReportGroup)
      ? (groupByInput as ReportGroup)
      : 'day';
  }

  private resolveDateRange(startDateInput?: string, endDateInput?: string) {
    const today = this.toLocalDateInput(new Date());
    const startDate = this.getUtcDateFromLocalDate(
      startDateInput ?? today,
      0,
      0,
      0,
      0,
    );
    const endDate = endDateInput
      ? this.getUtcDateFromLocalDate(endDateInput, 23, 59, 59, 999)
      : new Date();

    return { startDate, endDate };
  }

  private getPeriodExpression(groupBy: ReportGroup) {
    const localCreatedAt = `sale."createdAt" AT TIME ZONE 'UTC' AT TIME ZONE '${reportTimeZone}'`;
    if (groupBy === 'year') return `date_trunc('year', ${localCreatedAt})`;
    if (groupBy === 'month') return `date_trunc('month', ${localCreatedAt})`;
    return `date_trunc('day', ${localCreatedAt})`;
  }

  private getUtcDateFromLocalDate(
    dateInput: string,
    hours: number,
    minutes: number,
    seconds: number,
    milliseconds: number,
  ) {
    const [year, month, day] = dateInput.split('-').map(Number);
    if (!year || !month || !day) return new Date();

    return new Date(
      Date.UTC(year, month - 1, day, hours, minutes, seconds, milliseconds) -
        reportTimeZoneOffsetMinutes * 60 * 1000,
    );
  }

  private toLocalDateInput(date: Date) {
    return new Intl.DateTimeFormat('en-CA', {
      timeZone: reportTimeZone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).format(date);
  }

  private getSalesReportRows(
    groupBy: ReportGroup,
    startDate: Date,
    endDate: Date,
  ) {
    return this.sales
      .createQueryBuilder('sale')
      .select(this.getPeriodExpression(groupBy), 'period')
      .addSelect(
        `COUNT(*) FILTER (WHERE sale."canceledAt" IS NULL)`,
        'salesCount',
      )
      .addSelect(
        `COUNT(*) FILTER (WHERE sale."canceledAt" IS NOT NULL)`,
        'canceledCount',
      )
      .addSelect(
        `COALESCE(SUM(COALESCE(sale."paymentTotal", sale.total)) FILTER (WHERE sale."canceledAt" IS NULL), 0)`,
        'grossTotal',
      )
      .addSelect(
        `COALESCE(SUM(COALESCE(sale."paymentTotal", sale.total)) FILTER (WHERE sale."canceledAt" IS NULL AND sale."paymentMethod" = 'CASH'), 0)`,
        'cashTotal',
      )
      .addSelect(
        `COALESCE(SUM(COALESCE(sale."paymentTotal", sale.total)) FILTER (WHERE sale."canceledAt" IS NULL AND sale."paymentMethod" = 'CARD'), 0)`,
        'cardTotal',
      )
      .addSelect(
        `COALESCE(SUM(sale.total) FILTER (WHERE sale."canceledAt" IS NULL AND sale."paymentMethod" = 'TRANSFER'), 0)`,
        'transferTotal',
      )
      .addSelect(
        `COALESCE(SUM(sale.total) FILTER (WHERE sale."canceledAt" IS NULL AND sale."paymentMethod" = 'CREDIT'), 0)`,
        'creditTotal',
      )
      .addSelect(
        `COALESCE(SUM(sale.total) FILTER (WHERE sale."canceledAt" IS NULL AND sale."paymentMethod" = 'CREDIT' AND sale."creditPaidAt" IS NULL), 0)`,
        'creditPendingTotal',
      )
      .addSelect(
        `COALESCE(SUM(sale.total) FILTER (WHERE sale."canceledAt" IS NULL AND sale."paymentMethod" = 'CREDIT' AND sale."creditPaidAt" IS NOT NULL), 0)`,
        'creditPaidTotal',
      )
      .where('sale."createdAt" BETWEEN :startDate AND :endDate', {
        startDate,
        endDate,
      })
      .groupBy('period')
      .orderBy('period', 'ASC')
      .getRawMany<SalesReportRow>();
  }

  private mapReportRow(row: SalesReportRow) {
    const grossTotal = Number(row.grossTotal ?? 0);
    const salesCount = Number(row.salesCount);

    return {
      period: this.getUtcDateFromLocalDate(
        row.period.toISOString().slice(0, 10),
        0,
        0,
        0,
        0,
      ).toISOString(),
      salesCount,
      canceledCount: Number(row.canceledCount),
      grossTotal,
      cashTotal: Number(row.cashTotal ?? 0),
      cardTotal: Number(row.cardTotal ?? 0),
      transferTotal: Number(row.transferTotal ?? 0),
      creditTotal: Number(row.creditTotal ?? 0),
      creditPendingTotal: Number(row.creditPendingTotal ?? 0),
      creditPaidTotal: Number(row.creditPaidTotal ?? 0),
      creditCollectedCashTotal: 0,
      creditCollectedCardTotal: 0,
      creditCollectedTransferTotal: 0,
      creditCollectedTotal: 0,
      averageTicket: salesCount > 0 ? grossTotal / salesCount : 0,
    };
  }

  private buildSummary(items: ReturnType<ReportsService['mapReportRow']>[]) {
    const summary = items.reduce(
      (totals, item) => ({
        ...totals,
        salesCount: totals.salesCount + item.salesCount,
        canceledCount: totals.canceledCount + item.canceledCount,
        grossTotal: totals.grossTotal + item.grossTotal,
        cashTotal: totals.cashTotal + item.cashTotal,
        cardTotal: totals.cardTotal + item.cardTotal,
        transferTotal: totals.transferTotal + item.transferTotal,
        creditTotal: totals.creditTotal + item.creditTotal,
        creditPendingTotal: totals.creditPendingTotal + item.creditPendingTotal,
        creditPaidTotal: totals.creditPaidTotal + item.creditPaidTotal,
      }),
      {
        period: 'summary',
        salesCount: 0,
        canceledCount: 0,
        grossTotal: 0,
        cashTotal: 0,
        cardTotal: 0,
        transferTotal: 0,
        creditTotal: 0,
        creditPendingTotal: 0,
        creditPaidTotal: 0,
        creditCollectedCashTotal: 0,
        creditCollectedCardTotal: 0,
        creditCollectedTransferTotal: 0,
        creditCollectedTotal: 0,
        averageTicket: 0,
      },
    );
    summary.averageTicket =
      summary.salesCount > 0 ? summary.grossTotal / summary.salesCount : 0;

    return summary;
  }
}
