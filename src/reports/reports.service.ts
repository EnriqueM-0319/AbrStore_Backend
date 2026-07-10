import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AuthService } from '../auth/auth.service';
import { GraphqlContext } from '../common/interfaces';
import { userManagementRoles } from '../common/utils';
import { SaleEntity, SaleItemEntity } from '../sales';
import {
  ProductSalesPeriodReportRow,
  ProductSalesReportRow,
  SalesReportRow,
} from './interfaces';

const groupOptions = ['day', 'month', 'year'] as const;
const productReportLimits = [5, 10, 20, 50] as const;
const reportTimeZone = 'America/Cancun';
const reportTimeZoneOffsetMinutes = -300;

type ReportGroup = (typeof groupOptions)[number];
type SalesReportItemModel = ReturnType<ReportsService['mapReportRow']>;

@Injectable()
export class ReportsService {
  constructor(
    @InjectRepository(SaleEntity)
    private readonly sales: Repository<SaleEntity>,
    @InjectRepository(SaleItemEntity)
    private readonly saleItems: Repository<SaleItemEntity>,
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
    const [salesRows, collectionRows] = await Promise.all([
      this.getSalesReportRows(groupBy, startDate, endDate),
      this.getCreditCollectionRows(groupBy, startDate, endDate),
    ]);
    const items = this.mergeReportItems(salesRows, collectionRows);
    const summary = this.buildSummary(items);

    return {
      groupBy,
      startDate: startDateInput ?? this.toLocalDateInput(startDate),
      endDate: endDateInput ?? this.toLocalDateInput(endDate),
      summary,
      items,
    };
  }

  async productSalesReport(
    context: GraphqlContext,
    groupByInput?: string,
    startDateInput?: string,
    endDateInput?: string,
    limitInput?: number,
  ) {
    await this.authService.requireRole(context, userManagementRoles);
    const groupBy = this.resolveGroupBy(groupByInput);
    const limit = this.resolveProductReportLimit(limitInput);
    const { startDate, endDate } = this.resolveDateRange(
      startDateInput,
      endDateInput,
    );
    const [rows, allRows, periodRows] = await Promise.all([
      this.getProductSalesRows(startDate, endDate, limit),
      this.getProductSalesRows(startDate, endDate),
      this.getProductSalesPeriodRows(groupBy, startDate, endDate),
    ]);
    const totalAmount = periodRows.reduce(
      (sum, row) => sum + Number(row.total ?? 0),
      0,
    );
    const totalQuantity = periodRows.reduce(
      (sum, row) => sum + Number(row.quantity ?? 0),
      0,
    );
    const items = this.mapProductSalesItems(rows, totalQuantity);
    const allItems = this.mapProductSalesItems(allRows, totalQuantity);

    return {
      groupBy,
      startDate: startDateInput ?? this.toLocalDateInput(startDate),
      endDate: endDateInput ?? this.toLocalDateInput(endDate),
      totalQuantity,
      totalAmount,
      topProduct: this.getTopProductByQuantity(allItems),
      lowestProduct: this.getLowestProductByQuantity(allItems),
      items,
      periodItems: periodRows.map((row) => ({
        period: this.getUtcDateFromLocalDate(
          row.period.toISOString().slice(0, 10),
          0,
          0,
          0,
          0,
        ).toISOString(),
        quantity: Number(row.quantity ?? 0),
        total: Number(row.total ?? 0),
      })),
    };
  }

  private resolveGroupBy(groupByInput?: string): ReportGroup {
    return groupOptions.includes(groupByInput as ReportGroup)
      ? (groupByInput as ReportGroup)
      : 'day';
  }

  private resolveProductReportLimit(limitInput?: number) {
    return productReportLimits.includes(
      limitInput as (typeof productReportLimits)[number],
    )
      ? Number(limitInput)
      : 5;
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

  private getPeriodExpression(groupBy: ReportGroup, column: string) {
    const localDate = `${column} AT TIME ZONE 'UTC' AT TIME ZONE '${reportTimeZone}'`;
    if (groupBy === 'year') return `date_trunc('year', ${localDate})`;
    if (groupBy === 'month') return `date_trunc('month', ${localDate})`;
    return `date_trunc('day', ${localDate})`;
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
      .select(this.getPeriodExpression(groupBy, 'sale."createdAt"'), 'period')
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
        `0`,
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

  private getProductSalesRows(startDate: Date, endDate: Date, limit?: number) {
    const query = this.saleItems
      .createQueryBuilder('item')
      .innerJoin('item.sale', 'sale')
      .select('item."productId"', 'productId')
      .addSelect('item.sku', 'sku')
      .addSelect('item.name', 'name')
      .addSelect('COALESCE(SUM(item.quantity), 0)', 'quantity')
      .addSelect('COALESCE(SUM(item."lineTotal"), 0)', 'total')
      .where('sale."createdAt" BETWEEN :startDate AND :endDate', {
        startDate,
        endDate,
      })
      .andWhere('sale."canceledAt" IS NULL')
      .andWhere('item."canceledAt" IS NULL')
      .groupBy('item."productId"')
      .addGroupBy('item.sku')
      .addGroupBy('item.name')
      .orderBy('quantity', 'DESC')
      .addOrderBy('total', 'DESC');

    if (limit) query.limit(limit);

    return query.getRawMany<ProductSalesReportRow>();
  }

  private mapProductSalesItems(
    rows: ProductSalesReportRow[],
    totalQuantity: number,
  ) {
    return rows
      .map((row) => ({
        productId: row.productId,
        sku: row.sku,
        name: row.name,
        quantity: Number(row.quantity ?? 0),
        total: Number(row.total ?? 0),
        share:
          totalQuantity > 0
            ? (Number(row.quantity ?? 0) / totalQuantity) * 100
            : 0,
      }))
      .sort(
        (first, second) =>
          first.quantity - second.quantity || first.total - second.total,
      );
  }

  private getLowestProductByQuantity(
    items: Array<{
      quantity: number;
      total: number;
    }>,
  ) {
    return (
      [...items]
        .filter((item) => item.quantity > 0)
        .sort(
          (first, second) =>
            first.quantity - second.quantity || first.total - second.total,
        )[0] ?? null
    );
  }

  private getTopProductByQuantity(
    items: Array<{
      quantity: number;
      total: number;
    }>,
  ) {
    return (
      [...items]
        .filter((item) => item.quantity > 0)
        .sort(
          (first, second) =>
            second.quantity - first.quantity || second.total - first.total,
        )[0] ?? null
    );
  }

  private getProductSalesPeriodRows(
    groupBy: ReportGroup,
    startDate: Date,
    endDate: Date,
  ) {
    return this.saleItems
      .createQueryBuilder('item')
      .innerJoin('item.sale', 'sale')
      .select(this.getPeriodExpression(groupBy, 'sale."createdAt"'), 'period')
      .addSelect('COALESCE(SUM(item.quantity), 0)', 'quantity')
      .addSelect('COALESCE(SUM(item."lineTotal"), 0)', 'total')
      .where('sale."createdAt" BETWEEN :startDate AND :endDate', {
        startDate,
        endDate,
      })
      .andWhere('sale."canceledAt" IS NULL')
      .andWhere('item."canceledAt" IS NULL')
      .groupBy('period')
      .orderBy('period', 'ASC')
      .getRawMany<ProductSalesPeriodReportRow>();
  }

  private getCreditCollectionRows(
    groupBy: ReportGroup,
    startDate: Date,
    endDate: Date,
  ) {
    return this.sales
      .createQueryBuilder('sale')
      .select(
        this.getPeriodExpression(groupBy, 'sale."creditPaidAt"'),
        'period',
      )
      .addSelect(`0`, 'salesCount')
      .addSelect(`0`, 'canceledCount')
      .addSelect(`0`, 'grossTotal')
      .addSelect(`0`, 'cashTotal')
      .addSelect(`0`, 'cardTotal')
      .addSelect(`0`, 'transferTotal')
      .addSelect(`0`, 'creditTotal')
      .addSelect(`0`, 'creditPendingTotal')
      .addSelect(
        `COALESCE(SUM(COALESCE(sale."paymentTotal", sale.total)), 0)`,
        'creditPaidTotal',
      )
      .addSelect(
        `COALESCE(SUM(COALESCE(sale."paymentTotal", sale.total)) FILTER (WHERE sale."creditPaymentMethod" = 'CASH'), 0)`,
        'creditCollectedCashTotal',
      )
      .addSelect(
        `COALESCE(SUM(COALESCE(sale."paymentTotal", sale.total)) FILTER (WHERE sale."creditPaymentMethod" = 'CARD'), 0)`,
        'creditCollectedCardTotal',
      )
      .addSelect(
        `COALESCE(SUM(COALESCE(sale."paymentTotal", sale.total)) FILTER (WHERE sale."creditPaymentMethod" = 'TRANSFER'), 0)`,
        'creditCollectedTransferTotal',
      )
      .addSelect(
        `COALESCE(SUM(COALESCE(sale."paymentTotal", sale.total)), 0)`,
        'creditCollectedTotal',
      )
      .where('sale."paymentMethod" = :paymentMethod', {
        paymentMethod: 'CREDIT',
      })
      .andWhere('sale."canceledAt" IS NULL')
      .andWhere('sale."creditPaidAt" BETWEEN :startDate AND :endDate', {
        startDate,
        endDate,
      })
      .groupBy('period')
      .orderBy('period', 'ASC')
      .getRawMany<SalesReportRow>();
  }

  private mergeReportItems(
    salesRows: SalesReportRow[],
    collectionRows: SalesReportRow[],
  ) {
    const itemsByPeriod = new Map<string, SalesReportItemModel>();

    for (const row of salesRows) {
      const item = this.mapReportRow(row);
      itemsByPeriod.set(item.period, item);
    }

    for (const row of collectionRows) {
      const item = this.mapReportRow(row);
      const existing = itemsByPeriod.get(item.period);
      itemsByPeriod.set(
        item.period,
        existing ? this.mergeReportItem(existing, item) : item,
      );
    }

    return [...itemsByPeriod.values()].sort((first, second) =>
      first.period.localeCompare(second.period),
    );
  }

  private mergeReportItem(
    first: SalesReportItemModel,
    second: SalesReportItemModel,
  ) {
    const grossTotal = first.grossTotal + second.grossTotal;
    const salesCount = first.salesCount + second.salesCount;

    return {
      period: first.period,
      salesCount,
      canceledCount: first.canceledCount + second.canceledCount,
      grossTotal,
      cashTotal: first.cashTotal + second.cashTotal,
      cardTotal: first.cardTotal + second.cardTotal,
      transferTotal: first.transferTotal + second.transferTotal,
      creditTotal: first.creditTotal + second.creditTotal,
      creditPendingTotal: first.creditPendingTotal + second.creditPendingTotal,
      creditPaidTotal: first.creditPaidTotal + second.creditPaidTotal,
      creditCollectedCashTotal:
        first.creditCollectedCashTotal + second.creditCollectedCashTotal,
      creditCollectedCardTotal:
        first.creditCollectedCardTotal + second.creditCollectedCardTotal,
      creditCollectedTransferTotal:
        first.creditCollectedTransferTotal +
        second.creditCollectedTransferTotal,
      creditCollectedTotal:
        first.creditCollectedTotal + second.creditCollectedTotal,
      averageTicket: salesCount > 0 ? grossTotal / salesCount : 0,
    };
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
      creditCollectedCashTotal: Number(row.creditCollectedCashTotal ?? 0),
      creditCollectedCardTotal: Number(row.creditCollectedCardTotal ?? 0),
      creditCollectedTransferTotal: Number(
        row.creditCollectedTransferTotal ?? 0,
      ),
      creditCollectedTotal: Number(row.creditCollectedTotal ?? 0),
      averageTicket: salesCount > 0 ? grossTotal / salesCount : 0,
    };
  }

  private buildSummary(items: SalesReportItemModel[]) {
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
        creditCollectedCashTotal:
          totals.creditCollectedCashTotal + item.creditCollectedCashTotal,
        creditCollectedCardTotal:
          totals.creditCollectedCardTotal + item.creditCollectedCardTotal,
        creditCollectedTransferTotal:
          totals.creditCollectedTransferTotal +
          item.creditCollectedTransferTotal,
        creditCollectedTotal:
          totals.creditCollectedTotal + item.creditCollectedTotal,
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
