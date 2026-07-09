"use client";

import { useMemo, useState } from "react";
import { AppMobileHeader } from "./app/AppMobileHeader";
import { AppMobileNav } from "./app/AppMobileNav";
import { AppSidebar } from "./app/AppSidebar";
import { NavIcon } from "./app/NavIcon";
import type { AppNavIconType } from "./app/nav-config";

type ReportFormat = "PDF" | "Excel";
type ReportStatus = "Ready" | "Generating" | "Failed";
type ReportType =
  | "Daily Feeding Report"
  | "Water Quality Report"
  | "Harvest Report"
  | "Feed Inventory Report"
  | "Fish Batch Report"
  | "Pond Summary Report";

interface GeneratedReport {
  id: string;
  name: string;
  type: ReportType;
  generatedOn: string;
  generatedBy: string;
  format: ReportFormat;
  status: ReportStatus;
  dateFrom: string;
  dateTo: string;
  pond?: string;
  batch?: string;
  downloadCount: number;
}

interface GenerateFormState {
  type: ReportType;
  dateFrom: string;
  dateTo: string;
  pond: string;
  batch: string;
  format: ReportFormat;
}

const PONDS = ["Pond A", "Pond B", "Pond C", "Pond D", "Pond E", "Pond F"] as const;
const BATCHES = ["BAT-001", "BAT-002", "BAT-003", "BAT-004", "BAT-005", "BAT-006", "BAT-007"] as const;

const REPORT_TYPES: { type: ReportType; description: string; icon: string }[] = [
  { type: "Daily Feeding Report", description: "View all feeding activities for a selected date.", icon: "feed" },
  { type: "Water Quality Report", description: "View water records for selected ponds.", icon: "water" },
  { type: "Harvest Report", description: "Harvest history and harvest summaries.", icon: "harvest" },
  { type: "Feed Inventory Report", description: "Current feed stock and usage.", icon: "inventory" },
  { type: "Fish Batch Report", description: "Batch information and stocking records.", icon: "batch" },
  { type: "Pond Summary Report", description: "Overview of all ponds.", icon: "pond" },
];

const INITIAL_REPORTS: GeneratedReport[] = [
  {
    id: "RPT-001",
    name: "Daily Feeding Report — Jul 2026",
    type: "Daily Feeding Report",
    generatedOn: "2026-07-05T09:14:00",
    generatedBy: "Ayo",
    format: "PDF",
    status: "Ready",
    dateFrom: "2026-07-01",
    dateTo: "2026-07-05",
    downloadCount: 12,
  },
  {
    id: "RPT-002",
    name: "Water Quality Report — Pond A",
    type: "Water Quality Report",
    generatedOn: "2026-07-04T14:30:00",
    generatedBy: "Ngozi",
    format: "Excel",
    status: "Ready",
    dateFrom: "2026-06-01",
    dateTo: "2026-07-04",
    pond: "Pond A",
    downloadCount: 8,
  },
  {
    id: "RPT-003",
    name: "Harvest Report — Q2 2026",
    type: "Harvest Report",
    generatedOn: "2026-07-02T11:00:00",
    generatedBy: "Tunde",
    format: "PDF",
    status: "Ready",
    dateFrom: "2026-04-01",
    dateTo: "2026-06-30",
    downloadCount: 15,
  },
  {
    id: "RPT-004",
    name: "Feed Inventory Report",
    type: "Feed Inventory Report",
    generatedOn: "2026-07-01T08:45:00",
    generatedBy: "Ayo",
    format: "Excel",
    status: "Ready",
    dateFrom: "2026-07-01",
    dateTo: "2026-07-01",
    downloadCount: 5,
  },
];

const EMPTY_FORM: GenerateFormState = {
  type: "Daily Feeding Report",
  dateFrom: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().slice(0, 10),
  dateTo: new Date().toISOString().slice(0, 10),
  pond: "",
  batch: "",
  format: "PDF",
};

function ReportTypeIcon({ type }: { type: string }): React.JSX.Element {
  const iconMap: Record<string, AppNavIconType> = {
    feed: "feed",
    water: "water",
    harvest: "harvest",
    inventory: "inventory",
    batch: "batch",
    pond: "pond",
  };
  return (
    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--color-accent-light)] text-[var(--color-accent)]">
      <NavIcon type={iconMap[type] ?? "reports"} />
    </div>
  );
}

function StatusBadge({ status }: { status: ReportStatus }): React.JSX.Element {
  const styles = {
    Ready: "bg-[var(--color-accent-light)] text-[var(--color-accent)]",
    Generating: "bg-amber-50 text-amber-700",
    Failed: "bg-red-50 text-[var(--color-danger)]",
  };

  return (
    <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${styles[status]}`}>
      {status}
    </span>
  );
}

function FormatBadge({ format }: { format: ReportFormat }): React.JSX.Element {
  return (
    <span className="inline-flex rounded-md border border-[var(--color-border)] bg-[var(--color-surface)] px-2 py-0.5 text-xs font-semibold text-[var(--color-text-secondary)]">
      {format}
    </span>
  );
}

function formatDate(date: string): string {
  return new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", year: "numeric" }).format(new Date(date));
}

function formatDateTime(iso: string): string {
  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(iso));
}

function buildReportName(form: GenerateFormState): string {
  const range = form.dateFrom === form.dateTo
    ? formatDate(form.dateFrom)
    : `${formatDate(form.dateFrom)} – ${formatDate(form.dateTo)}`;
  const suffix = form.pond ? ` — ${form.pond}` : form.batch ? ` — ${form.batch}` : "";
  return `${form.type}${suffix} (${range})`;
}

export default function ReportsModule(): React.JSX.Element {
  const [reports, setReports] = useState<GeneratedReport[]>(INITIAL_REPORTS);
  const [query, setQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState<"All" | ReportType>("All");
  const [formatFilter, setFormatFilter] = useState<"All" | ReportFormat>("All");
  const [dateFromFilter, setDateFromFilter] = useState("");
  const [dateToFilter, setDateToFilter] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState<GenerateFormState>(EMPTY_FORM);
  const [detailReport, setDetailReport] = useState<GeneratedReport | null>(null);
  const [expandedMobile, setExpandedMobile] = useState<string | null>(null);

  const currentMonth = new Date().toISOString().slice(0, 7);

  const summary = useMemo(() => {
    const thisMonth = reports.filter((r) => r.generatedOn.startsWith(currentMonth));
    const sorted = [...reports].sort((a, b) => b.generatedOn.localeCompare(a.generatedOn));
    const mostDownloaded = reports.reduce(
      (best, r) => (r.downloadCount > (best?.downloadCount ?? 0) ? r : best),
      reports[0] ?? null,
    );

    return {
      total: reports.length,
      thisMonth: thisMonth.length,
      lastGenerated: sorted[0] ? formatDateTime(sorted[0].generatedOn) : "—",
      mostDownloaded: mostDownloaded?.name ?? "—",
    };
  }, [reports, currentMonth]);

  const filteredReports = useMemo(() => {
    const term = query.toLowerCase();
    return reports.filter((report) => {
      const matchesQuery =
        report.name.toLowerCase().includes(term) ||
        report.generatedOn.slice(0, 10).includes(term);
      const matchesType = typeFilter === "All" || report.type === typeFilter;
      const matchesFormat = formatFilter === "All" || report.format === formatFilter;
      const reportDate = report.generatedOn.slice(0, 10);
      const matchesDateFrom = !dateFromFilter || reportDate >= dateFromFilter;
      const matchesDateTo = !dateToFilter || reportDate <= dateToFilter;
      return matchesQuery && matchesType && matchesFormat && matchesDateFrom && matchesDateTo;
    });
  }, [reports, query, typeFilter, formatFilter, dateFromFilter, dateToFilter]);

  const openGenerateModal = (prefillType?: ReportType): void => {
    setForm(prefillType ? { ...EMPTY_FORM, type: prefillType } : { ...EMPTY_FORM });
    setModalOpen(true);
  };

  const generateReport = (): void => {
    const newReport: GeneratedReport = {
      id: `RPT-${Date.now()}`,
      name: buildReportName(form),
      type: form.type,
      generatedOn: new Date().toISOString(),
      generatedBy: "Ayo",
      format: form.format,
      status: "Ready",
      dateFrom: form.dateFrom,
      dateTo: form.dateTo,
      pond: form.pond || undefined,
      batch: form.batch || undefined,
      downloadCount: 0,
    };
    setReports((current) => [newReport, ...current]);
    setModalOpen(false);
    setForm(EMPTY_FORM);
  };

  const deleteReport = (id: string): void => {
    setReports((current) => current.filter((r) => r.id !== id));
    if (detailReport?.id === id) setDetailReport(null);
  };

  const downloadReport = (report: GeneratedReport): void => {
    setReports((current) =>
      current.map((r) => (r.id === report.id ? { ...r, downloadCount: r.downloadCount + 1 } : r)),
    );
  };

  const isEmpty = reports.length === 0;

  return (
    <main className="min-h-screen overflow-x-hidden bg-[var(--color-surface)] pb-24 text-[var(--color-text-primary)] lg:pb-0">
      <AppSidebar activeKey="reports" />

      <div className="min-w-0 overflow-x-hidden lg:pl-[256px]">
        <AppMobileHeader activeKey="reports" />

        <div className="mx-auto max-w-[1440px] px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
          <header className="mb-6 rounded-2xl border border-[var(--color-border)] bg-white p-5 sm:p-6">
            <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
              <div>
                <h1 className="text-[clamp(28px,4vw,44px)] font-bold tracking-[-0.04em]">Reports</h1>
                <p className="mt-2 text-base leading-7 text-[var(--color-text-secondary)]">
                  Generate and download reports for your farm.
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => openGenerateModal()}
                  className="min-h-11 rounded-lg bg-[var(--color-accent)] px-4 py-2 text-sm font-medium text-white transition-all duration-200 hover:bg-emerald-900"
                >
                  Generate Report
                </button>
                <button
                  type="button"
                  onClick={() => openGenerateModal()}
                  className="min-h-11 rounded-lg border border-[var(--color-border)] bg-white px-4 py-2 text-sm font-medium text-[var(--color-text-secondary)]"
                >
                  Export PDF
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setForm({ ...EMPTY_FORM, format: "Excel" });
                    setModalOpen(true);
                  }}
                  className="min-h-11 rounded-lg border border-[var(--color-border)] bg-white px-4 py-2 text-sm font-medium text-[var(--color-text-secondary)]"
                >
                  Export Excel
                </button>
              </div>
            </div>
          </header>

          {isEmpty ? (
            <div className="flex flex-col items-center rounded-2xl border border-[var(--color-border)] bg-white px-6 py-20 text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[var(--color-accent-light)] text-2xl text-[var(--color-accent)]">
                <NavIcon type="reports" />
              </div>
              <p className="mt-6 text-lg font-semibold">No reports generated yet.</p>
              <p className="mt-2 max-w-sm text-sm text-[var(--color-text-secondary)]">
                Generate your first report to export feeding, water, harvest, and inventory data.
              </p>
              <button
                type="button"
                onClick={() => openGenerateModal()}
                className="mt-6 min-h-12 rounded-lg bg-[var(--color-accent)] px-6 py-3 text-sm font-medium text-white"
              >
                Generate First Report
              </button>
            </div>
          ) : (
            <>
              <section className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {[
                  { label: "Total Reports Generated", value: String(summary.total), detail: "All time" },
                  { label: "Reports This Month", value: String(summary.thisMonth), detail: "Current month" },
                  { label: "Last Generated Report", value: summary.lastGenerated, detail: "Most recent", small: true },
                  { label: "Most Downloaded Report", value: summary.mostDownloaded, detail: "By download count", small: true },
                ].map((card) => (
                  <div key={card.label} className="rounded-2xl border border-[var(--color-border)] bg-white p-5 transition-all duration-200 hover:shadow-[0_4px_16px_rgba(0,0,0,0.06)]">
                    <p className="text-[11px] font-medium uppercase tracking-widest text-[var(--color-text-muted)]">{card.label}</p>
                    <p className={`mt-3 font-bold tracking-[-0.04em] ${card.small ? "text-sm leading-6" : "text-3xl"}`}>
                      {card.value}
                    </p>
                    <p className="mt-1 text-xs text-[var(--color-text-muted)]">{card.detail}</p>
                  </div>
                ))}
              </section>

              <section className="mb-6 rounded-2xl border border-[var(--color-border)] bg-white p-5 sm:p-6">
                <h2 className="text-lg font-bold tracking-[-0.03em]">Report Types</h2>
                <p className="mt-1 text-sm text-[var(--color-text-secondary)]">Select a report type to generate quickly.</p>
                <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {REPORT_TYPES.map((item) => (
                    <button
                      key={item.type}
                      type="button"
                      onClick={() => openGenerateModal(item.type)}
                      className="rounded-xl border border-[var(--color-border)] p-5 text-left transition-all duration-200 hover:border-[var(--color-accent-border)] hover:shadow-[0_4px_16px_rgba(0,0,0,0.06)]"
                    >
                      <ReportTypeIcon type={item.icon} />
                      <p className="mt-4 font-semibold">{item.type}</p>
                      <p className="mt-1.5 text-sm leading-6 text-[var(--color-text-secondary)]">{item.description}</p>
                    </button>
                  ))}
                </div>
              </section>

              <section className="mb-6 rounded-2xl border border-[var(--color-border)] bg-white p-4 sm:p-5">
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-6">
                  <input
                    type="search"
                    placeholder="Search report name or date…"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    className="h-11 rounded-lg border border-[var(--color-border)] px-3 text-sm outline-none focus:border-[var(--color-accent)] focus:ring-2 focus:ring-[var(--color-accent-border)] lg:col-span-2"
                  />
                  <input
                    type="date"
                    value={dateFromFilter}
                    onChange={(e) => setDateFromFilter(e.target.value)}
                    className="h-11 rounded-lg border border-[var(--color-border)] px-3 text-sm outline-none focus:border-[var(--color-accent)]"
                    aria-label="Date from"
                  />
                  <input
                    type="date"
                    value={dateToFilter}
                    onChange={(e) => setDateToFilter(e.target.value)}
                    className="h-11 rounded-lg border border-[var(--color-border)] px-3 text-sm outline-none focus:border-[var(--color-accent)]"
                    aria-label="Date to"
                  />
                  <select
                    value={typeFilter}
                    onChange={(e) => setTypeFilter(e.target.value as "All" | ReportType)}
                    className="h-11 rounded-lg border border-[var(--color-border)] bg-white px-3 text-sm outline-none focus:border-[var(--color-accent)]"
                  >
                    <option value="All">All report types</option>
                    {REPORT_TYPES.map((item) => (
                      <option key={item.type} value={item.type}>{item.type}</option>
                    ))}
                  </select>
                  <select
                    value={formatFilter}
                    onChange={(e) => setFormatFilter(e.target.value as "All" | ReportFormat)}
                    className="h-11 rounded-lg border border-[var(--color-border)] bg-white px-3 text-sm outline-none focus:border-[var(--color-accent)]"
                  >
                    <option value="All">All formats</option>
                    <option value="PDF">PDF</option>
                    <option value="Excel">Excel</option>
                  </select>
                </div>
              </section>

              <section className="rounded-2xl border border-[var(--color-border)] bg-white">
                <div className="border-b border-[var(--color-border)] p-5 sm:p-6">
                  <h2 className="text-lg font-bold tracking-[-0.03em]">Recent Reports</h2>
                </div>

                {filteredReports.length === 0 ? (
                  <p className="px-6 py-12 text-center text-sm text-[var(--color-text-secondary)]">No reports match your filters.</p>
                ) : (
                  <>
                    <div className="hidden overflow-x-auto md:block">
                      <table className="w-full min-w-[900px] border-collapse">
                        <thead className="bg-[var(--color-surface)]">
                          <tr className="text-left text-[11px] font-medium uppercase tracking-widest text-[var(--color-text-muted)]">
                            <th className="px-5 py-3">Report Name</th>
                            <th className="px-5 py-3">Generated On</th>
                            <th className="px-5 py-3">Generated By</th>
                            <th className="px-5 py-3">Format</th>
                            <th className="px-5 py-3">Status</th>
                            <th className="px-5 py-3">Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {filteredReports.map((report) => (
                            <tr key={report.id} className="border-t border-[var(--color-border)] transition-colors hover:bg-[var(--color-surface)]">
                              <td className="px-5 py-4 text-sm font-semibold">{report.name}</td>
                              <td className="px-5 py-4 text-sm">{formatDateTime(report.generatedOn)}</td>
                              <td className="px-5 py-4 text-sm">{report.generatedBy}</td>
                              <td className="px-5 py-4"><FormatBadge format={report.format} /></td>
                              <td className="px-5 py-4"><StatusBadge status={report.status} /></td>
                              <td className="px-5 py-4">
                                <div className="flex gap-2">
                                  <button type="button" onClick={() => downloadReport(report)} className="text-xs font-medium text-[var(--color-accent)] hover:underline">Download</button>
                                  <button type="button" onClick={() => setDetailReport(report)} className="text-xs font-medium text-[var(--color-text-secondary)] hover:underline">View</button>
                                  <button type="button" onClick={() => deleteReport(report.id)} className="text-xs font-medium text-[var(--color-danger)] hover:underline">Delete</button>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    <div className="grid gap-3 p-4 md:hidden">
                      {filteredReports.map((report) => {
                        const expanded = expandedMobile === report.id;
                        return (
                          <div key={report.id} className="overflow-hidden rounded-xl border border-[var(--color-border)]">
                            <button
                              type="button"
                              onClick={() => setExpandedMobile(expanded ? null : report.id)}
                              className="flex w-full items-center justify-between p-4 text-left"
                            >
                              <div className="min-w-0 pr-3">
                                <p className="truncate font-semibold">{report.name}</p>
                                <p className="mt-1 text-xs text-[var(--color-text-muted)]">
                                  {formatDateTime(report.generatedOn)} · {report.format}
                                </p>
                              </div>
                              <span className="shrink-0 text-lg text-[var(--color-text-muted)]">{expanded ? "−" : "+"}</span>
                            </button>
                            {expanded && (
                              <div className="border-t border-[var(--color-border)] bg-[var(--color-surface)] p-4">
                                <dl className="grid grid-cols-2 gap-3 text-xs">
                                  <div><dt className="text-[var(--color-text-muted)]">Generated by</dt><dd className="font-semibold">{report.generatedBy}</dd></div>
                                  <div><dt className="text-[var(--color-text-muted)]">Status</dt><dd><StatusBadge status={report.status} /></dd></div>
                                  <div className="col-span-2"><dt className="text-[var(--color-text-muted)]">Type</dt><dd className="font-semibold">{report.type}</dd></div>
                                </dl>
                                <div className="mt-4 flex flex-col gap-2">
                                  <button
                                    type="button"
                                    onClick={() => downloadReport(report)}
                                    className="min-h-12 w-full rounded-lg bg-[var(--color-accent)] text-sm font-medium text-white"
                                  >
                                    Download {report.format}
                                  </button>
                                  <div className="flex gap-2">
                                    <button type="button" onClick={() => setDetailReport(report)} className="min-h-11 flex-1 rounded-lg border border-[var(--color-border)] bg-white text-sm font-medium">View</button>
                                    <button type="button" onClick={() => deleteReport(report.id)} className="min-h-11 rounded-lg border border-red-200 px-4 text-sm font-medium text-[var(--color-danger)]">Delete</button>
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </>
                )}
              </section>
            </>
          )}
        </div>
      </div>

      <div className="fixed bottom-24 right-6 z-40 lg:bottom-6 lg:hidden">
        <button
          type="button"
          onClick={() => openGenerateModal()}
          className="min-h-12 rounded-full bg-[var(--color-accent)] px-5 py-3 text-sm font-medium text-white shadow-[0_4px_16px_rgba(13,122,95,0.3)]"
        >
          Generate Report
        </button>
      </div>

      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-4 sm:items-center">
          <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl border border-[var(--color-border)] bg-white p-6 shadow-[0_24px_64px_rgba(0,0,0,0.15)]">
            <h2 className="text-xl font-bold tracking-[-0.03em]">Generate Report</h2>
            <div className="mt-6 space-y-4">
              <label className="block text-sm">
                <span className="font-medium">Select Report Type</span>
                <select
                  value={form.type}
                  onChange={(e) => setForm((f) => ({ ...f, type: e.target.value as ReportType }))}
                  className="mt-1.5 h-11 w-full rounded-lg border border-[var(--color-border)] px-3 outline-none focus:border-[var(--color-accent)]"
                >
                  {REPORT_TYPES.map((item) => (
                    <option key={item.type} value={item.type}>{item.type}</option>
                  ))}
                </select>
              </label>
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="block text-sm">
                  <span className="font-medium">Date From</span>
                  <input
                    type="date"
                    value={form.dateFrom}
                    onChange={(e) => setForm((f) => ({ ...f, dateFrom: e.target.value }))}
                    className="mt-1.5 h-11 w-full rounded-lg border border-[var(--color-border)] px-3 outline-none focus:border-[var(--color-accent)]"
                  />
                </label>
                <label className="block text-sm">
                  <span className="font-medium">Date To</span>
                  <input
                    type="date"
                    value={form.dateTo}
                    onChange={(e) => setForm((f) => ({ ...f, dateTo: e.target.value }))}
                    className="mt-1.5 h-11 w-full rounded-lg border border-[var(--color-border)] px-3 outline-none focus:border-[var(--color-accent)]"
                  />
                </label>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="block text-sm">
                  <span className="font-medium">Select Pond <span className="font-normal text-[var(--color-text-muted)]">(Optional)</span></span>
                  <select
                    value={form.pond}
                    onChange={(e) => setForm((f) => ({ ...f, pond: e.target.value }))}
                    className="mt-1.5 h-11 w-full rounded-lg border border-[var(--color-border)] px-3 outline-none focus:border-[var(--color-accent)]"
                  >
                    <option value="">All ponds</option>
                    {PONDS.map((pond) => (
                      <option key={pond} value={pond}>{pond}</option>
                    ))}
                  </select>
                </label>
                <label className="block text-sm">
                  <span className="font-medium">Select Batch <span className="font-normal text-[var(--color-text-muted)]">(Optional)</span></span>
                  <select
                    value={form.batch}
                    onChange={(e) => setForm((f) => ({ ...f, batch: e.target.value }))}
                    className="mt-1.5 h-11 w-full rounded-lg border border-[var(--color-border)] px-3 outline-none focus:border-[var(--color-accent)]"
                  >
                    <option value="">All batches</option>
                    {BATCHES.map((batch) => (
                      <option key={batch} value={batch}>{batch}</option>
                    ))}
                  </select>
                </label>
              </div>
              <fieldset>
                <legend className="text-sm font-medium">Report Format</legend>
                <div className="mt-2 flex gap-4">
                  {(["PDF", "Excel"] as ReportFormat[]).map((fmt) => (
                    <label key={fmt} className="flex cursor-pointer items-center gap-2 text-sm">
                      <input
                        type="radio"
                        name="format"
                        value={fmt}
                        checked={form.format === fmt}
                        onChange={() => setForm((f) => ({ ...f, format: fmt }))}
                        className="accent-[var(--color-accent)]"
                      />
                      {fmt}
                    </label>
                  ))}
                </div>
              </fieldset>
            </div>
            <div className="mt-6 flex gap-3">
              <button type="button" onClick={() => setModalOpen(false)} className="min-h-11 flex-1 rounded-lg border border-[var(--color-border)] text-sm font-medium">Cancel</button>
              <button type="button" onClick={generateReport} className="min-h-11 flex-1 rounded-lg bg-[var(--color-accent)] text-sm font-medium text-white">Generate</button>
            </div>
          </div>
        </div>
      )}

      {detailReport && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/40">
          <div className="h-full w-full max-w-md overflow-y-auto bg-white shadow-[-8px_0_32px_rgba(0,0,0,0.1)]">
            <div className="sticky top-0 flex items-center justify-between border-b border-[var(--color-border)] bg-white px-5 py-4">
              <div className="min-w-0 pr-4">
                <h2 className="truncate text-lg font-bold">{detailReport.name}</h2>
                <p className="text-sm text-[var(--color-text-secondary)]">Report details</p>
              </div>
              <button type="button" onClick={() => setDetailReport(null)} className="shrink-0 rounded-lg border border-[var(--color-border)] px-3 py-1.5 text-sm">Close</button>
            </div>
            <div className="space-y-0 divide-y divide-[var(--color-border)] px-5">
              {[
                { label: "Report Type", value: detailReport.type },
                { label: "Generated On", value: formatDateTime(detailReport.generatedOn) },
                { label: "Generated By", value: detailReport.generatedBy },
                { label: "Format", value: detailReport.format },
                { label: "Status", value: detailReport.status },
                { label: "Date Range", value: `${formatDate(detailReport.dateFrom)} – ${formatDate(detailReport.dateTo)}` },
                ...(detailReport.pond ? [{ label: "Pond", value: detailReport.pond }] : []),
                ...(detailReport.batch ? [{ label: "Batch", value: detailReport.batch }] : []),
                { label: "Downloads", value: String(detailReport.downloadCount) },
              ].map((row) => (
                <div key={row.label} className="flex justify-between gap-4 py-4 text-sm">
                  <span className="text-[var(--color-text-muted)]">{row.label}</span>
                  <span className="text-right font-semibold">{row.value}</span>
                </div>
              ))}
            </div>
            <div className="border-t border-[var(--color-border)] p-5">
              <button
                type="button"
                onClick={() => downloadReport(detailReport)}
                className="flex min-h-12 w-full items-center justify-center rounded-lg bg-[var(--color-accent)] text-sm font-medium text-white"
              >
                Download {detailReport.format}
              </button>
            </div>
          </div>
        </div>
      )}

      <AppMobileNav activeKey="reports" />
    </main>
  );
}
