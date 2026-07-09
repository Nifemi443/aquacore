"use client";

import { useMemo, useState } from "react";
import { AppMobileHeader } from "./app/AppMobileHeader";
import { AppMobileNav } from "./app/AppMobileNav";
import { AppSidebar } from "./app/AppSidebar";
import type { AppNavIconType } from "./app/nav-config";

type StockStatus = "Healthy" | "Low Stock" | "Critical" | "Out of Stock" | "Expired";
type PoStatus = "Pending" | "Approved" | "Delivered" | "Cancelled";

interface FeedItem {
  id: string;
  name: string;
  brand: string;
  feedType: string;
  pelletSize: string;
  protein: string;
  fat: string;
  manufacturer: string;
  supplier: string;
  warehouse: string;
  storageLocation: string;
  quantity: number;
  unit: string;
  reserved: number;
  minStock: number;
  maxStock: number;
  unitPrice: string;
  value: string;
  purchaseCost: string;
  expiry: string;
  productionDate: string;
  batchNumber: string;
  status: StockStatus;
  notes: string;
}

interface KpiCard {
  label: string;
  value: string;
  detail: string;
  trend: string;
  trendTone: "up" | "down" | "flat";
  spark: "up" | "down" | "flat";
  icon: IconType;
  comparison: string;
}

interface Movement {
  date: string;
  type: "Purchase" | "Consumption" | "Transfer" | "Adjustment" | "Spoilage" | "Return";
  quantity: string;
  reason: string;
  staff: string;
  warehouse: string;
  remaining: string;
}

interface Supplier {
  name: string;
  contact: string;
  rating: number;
  performance: string;
  products: string;
  lastDelivery: string;
  avgCost: string;
  outstanding: number;
}

interface Warehouse {
  name: string;
  capacity: number;
  stored: string;
  temperature: string;
  humidity: string;
  health: "Optimal" | "Monitor";
  value: string;
  manager: string;
}

interface LowStockItem {
  name: string;
  remaining: string;
  days: string;
  recommended: string;
  cost: string;
  supplier: string;
  priority: "High" | "Medium";
}

interface ExpiryItem {
  name: string;
  expiry: string;
  days: number;
  warehouse: string;
  quantity: string;
  loss: string;
  action: string;
}

interface PurchaseOrder {
  po: string;
  supplier: string;
  items: string;
  quantity: string;
  cost: string;
  status: PoStatus;
  delivery: string;
  payment: "Paid" | "Pending" | "Part-paid" | "—";
}

interface NotificationItem {
  tone: "danger" | "warning" | "info" | "success";
  text: string;
  time: string;
}

type IconType = AppNavIconType | "value" | "clock" | "alert" | "score";

const KPI_CARDS: KpiCard[] = [
  { label: "Total Feed Stock", value: "8,450 kg", detail: "Across 2 warehouses", trend: "+6.2%", trendTone: "up", spark: "up", icon: "inventory", comparison: "vs 7,960 kg last month" },
  { label: "Inventory Value", value: "₦8.4M", detail: "At current unit prices", trend: "+₦520k", trendTone: "up", spark: "up", icon: "value", comparison: "vs ₦7.9M last month" },
  { label: "Today's Feed Usage", value: "245 kg", detail: "Of 260 kg planned", trend: "+3.1%", trendTone: "flat", spark: "up", icon: "feed", comparison: "vs 238 kg daily avg" },
  { label: "Feed Remaining", value: "18 Days", detail: "At current consumption", trend: "-2d", trendTone: "down", spark: "down", icon: "clock", comparison: "vs 20 days last month" },
  { label: "Low Stock Items", value: "3 Items", detail: "1 critical", trend: "+1", trendTone: "down", spark: "flat", icon: "alert", comparison: "vs 2 last month" },
  { label: "Incoming Deliveries", value: "5 Orders", detail: "Next arrives in 3 days", trend: "+2", trendTone: "up", spark: "up", icon: "delivery", comparison: "vs 3 last month" },
  { label: "Avg Daily Consumption", value: "260 kg/day", detail: "Rolling 14 days", trend: "+4.8%", trendTone: "flat", spark: "up", icon: "reports", comparison: "biomass growth driven" },
  { label: "Monthly Feed Cost", value: "₦4.8M", detail: "July to date", trend: "-4%", trendTone: "up", spark: "down", icon: "value", comparison: "vs ₦5.0M in June" },
  { label: "AI Inventory Score", value: "96/100", detail: "Excellent management", trend: "+2", trendTone: "up", spark: "up", icon: "score", comparison: "vs 94 last month" },
];

const SPARK_POINTS: Record<"up" | "down" | "flat", string> = {
  up: "0,18 10,15 20,16 30,11 40,9 50,6 60,2",
  down: "0,4 10,6 20,5 30,9 40,12 50,14 60,18",
  flat: "0,10 10,9 20,11 30,10 40,10 50,9 60,10",
};

const FEED_ITEMS: FeedItem[] = [
  {
    id: "FI-001", name: "Coppens Grower 4mm", brand: "Coppens", feedType: "Floating pellet", pelletSize: "4mm",
    protein: "42%", fat: "12%", manufacturer: "Alltech Coppens", supplier: "AquaFeed Nigeria Ltd",
    warehouse: "Warehouse 1", storageLocation: "Rack A2", quantity: 3200, unit: "kg", reserved: 400,
    minStock: 1500, maxStock: 6000, unitPrice: "₦1,050/kg", value: "₦3.36M", purchaseCost: "₦980/kg",
    expiry: "Dec 14, 2026", productionDate: "Mar 12, 2026", batchNumber: "CP-2026-0311", status: "Healthy",
    notes: "Keep off floor on pallets, away from direct sunlight.",
  },
  {
    id: "FI-002", name: "Coppens Starter 2mm", brand: "Coppens", feedType: "Floating pellet", pelletSize: "2mm",
    protein: "45%", fat: "12%", manufacturer: "Alltech Coppens", supplier: "AquaFeed Nigeria Ltd",
    warehouse: "Warehouse 1", storageLocation: "Rack A1", quantity: 320, unit: "kg", reserved: 120,
    minStock: 400, maxStock: 2400, unitPrice: "₦1,240/kg", value: "₦396k", purchaseCost: "₦1,150/kg",
    expiry: "Oct 2, 2026", productionDate: "Feb 4, 2026", batchNumber: "CP-2026-0128", status: "Critical",
    notes: "Reserved 120 kg for incoming Batch E fingerlings.",
  },
  {
    id: "FI-003", name: "Skretting Tilapia 5mm", brand: "Skretting", feedType: "Floating pellet", pelletSize: "5mm",
    protein: "38%", fat: "10%", manufacturer: "Skretting Nigeria", supplier: "BlueWave Feeds",
    warehouse: "Warehouse 1", storageLocation: "Rack B1", quantity: 2800, unit: "kg", reserved: 300,
    minStock: 1200, maxStock: 5000, unitPrice: "₦830/kg", value: "₦2.32M", purchaseCost: "₦790/kg",
    expiry: "Nov 20, 2026", productionDate: "Apr 2, 2026", batchNumber: "SK-2026-0402", status: "Healthy",
    notes: "Primary ration for Pond D and Pond F tilapia batches.",
  },
  {
    id: "FI-004", name: "Skretting Catfish 3mm", brand: "Skretting", feedType: "Sinking pellet", pelletSize: "3mm",
    protein: "40%", fat: "11%", manufacturer: "Skretting Nigeria", supplier: "BlueWave Feeds",
    warehouse: "Warehouse 2", storageLocation: "Rack C3", quantity: 980, unit: "kg", reserved: 0,
    minStock: 800, maxStock: 3600, unitPrice: "₦900/kg", value: "₦882k", purchaseCost: "₦860/kg",
    expiry: "Aug 8, 2026", productionDate: "Jan 22, 2026", batchNumber: "SK-2026-0119", status: "Low Stock",
    notes: "Nearing expiry — prioritise for treatment batch feeding.",
  },
  {
    id: "FI-005", name: "Vital Catfish 6mm", brand: "Vital Feed", feedType: "Floating pellet", pelletSize: "6mm",
    protein: "35%", fat: "9%", manufacturer: "Grand Cereals", supplier: "Vital Agro Dealers",
    warehouse: "Warehouse 2", storageLocation: "Rack C1", quantity: 1150, unit: "kg", reserved: 0,
    minStock: 600, maxStock: 3000, unitPrice: "₦640/kg", value: "₦736k", purchaseCost: "₦610/kg",
    expiry: "Jan 30, 2027", productionDate: "May 18, 2026", batchNumber: "VF-2026-0512", status: "Healthy",
    notes: "Finishing ration for pre-harvest catfish.",
  },
  {
    id: "FI-006", name: "Aller Aqua Fry 0.5mm", brand: "Aller Aqua", feedType: "Crumble", pelletSize: "0.5mm",
    protein: "50%", fat: "14%", manufacturer: "Aller Aqua Egypt", supplier: "AquaFeed Nigeria Ltd",
    warehouse: "Warehouse 1", storageLocation: "Cold Store", quantity: 0, unit: "kg", reserved: 0,
    minStock: 100, maxStock: 600, unitPrice: "₦2,100/kg", value: "₦0", purchaseCost: "₦1,950/kg",
    expiry: "Sep 12, 2026", productionDate: "Jan 5, 2026", batchNumber: "AA-2026-0104", status: "Out of Stock",
    notes: "Restock before fingerling delivery on Jul 6.",
  },
];

const TABLE_HEADERS = [
  "Feed ID", "Feed Name", "Brand", "Type", "Pellet", "Protein", "Supplier", "Warehouse", "Qty Available",
  "Min Stock", "Max Stock", "Unit Price", "Value", "Expiry", "Batch No.", "Status", "Actions",
] as const;

const ROW_ACTIONS = ["View", "Edit", "Transfer", "Adjust Stock", "Print Barcode", "Delete"] as const;

const MOVEMENTS: Movement[] = [
  { date: "Today · 06:41", type: "Consumption", quantity: "-245 kg", reason: "Daily feeding · all ponds", staff: "Ayo", warehouse: "Warehouse 1", remaining: "8,450 kg" },
  { date: "Yesterday · 14:20", type: "Purchase", quantity: "+1,500 kg", reason: "PO-2024-116 received", staff: "Ngozi", warehouse: "Warehouse 1", remaining: "8,695 kg" },
  { date: "Yesterday · 09:05", type: "Transfer", quantity: "300 kg", reason: "Warehouse 2 → Warehouse 1", staff: "Tunde", warehouse: "Warehouse 1", remaining: "7,195 kg" },
  { date: "Jul 1 · 16:44", type: "Adjustment", quantity: "-18 kg", reason: "Stock count correction", staff: "Ngozi", warehouse: "Warehouse 2", remaining: "6,895 kg" },
  { date: "Jun 30 · 11:30", type: "Spoilage", quantity: "-42 kg", reason: "Moisture damage · Rack C3", staff: "Tunde", warehouse: "Warehouse 2", remaining: "6,913 kg" },
  { date: "Jun 28 · 10:15", type: "Return", quantity: "+25 kg", reason: "Unused treatment ration returned", staff: "Ayo", warehouse: "Warehouse 1", remaining: "6,955 kg" },
];

const SUPPLIERS: Supplier[] = [
  { name: "AquaFeed Nigeria Ltd", contact: "+234 802 114 5620", rating: 4.8, performance: "98% on-time", products: "Coppens · Aller Aqua", lastDelivery: "Yesterday", avgCost: "₦1,080/kg", outstanding: 2 },
  { name: "BlueWave Feeds", contact: "+234 701 933 8841", rating: 4.5, performance: "92% on-time", products: "Skretting range", lastDelivery: "Jun 24", avgCost: "₦860/kg", outstanding: 1 },
  { name: "Vital Agro Dealers", contact: "+234 803 552 0917", rating: 4.2, performance: "88% on-time", products: "Vital Feed range", lastDelivery: "Jun 18", avgCost: "₦625/kg", outstanding: 0 },
];

const WAREHOUSES: Warehouse[] = [
  { name: "Warehouse 1 · Main Store", capacity: 68, stored: "6,320 kg", temperature: "24.5°C", humidity: "58%", health: "Optimal", value: "₦6.1M", manager: "Ngozi Okafor" },
  { name: "Warehouse 2 · Field Store", capacity: 41, stored: "2,130 kg", temperature: "27.8°C", humidity: "71%", health: "Monitor", value: "₦2.3M", manager: "Tunde Bello" },
];

const LOW_STOCK: LowStockItem[] = [
  { name: "Coppens Starter 2mm", remaining: "320 kg", days: "5 days", recommended: "1,200 kg (80 bags)", cost: "₦1.49M", supplier: "AquaFeed Nigeria Ltd", priority: "High" },
  { name: "Aller Aqua Fry 0.5mm", remaining: "0 kg", days: "Out", recommended: "300 kg (20 bags)", cost: "₦630k", supplier: "AquaFeed Nigeria Ltd", priority: "High" },
  { name: "Skretting Catfish 3mm", remaining: "980 kg", days: "9 days", recommended: "1,800 kg (120 bags)", cost: "₦1.62M", supplier: "BlueWave Feeds", priority: "Medium" },
];

const EXPIRY_ITEMS: ExpiryItem[] = [
  { name: "Skretting Catfish 3mm", expiry: "Aug 8, 2026", days: 36, warehouse: "Warehouse 2", quantity: "980 kg", loss: "₦882k", action: "Consume first — assign to daily rations" },
  { name: "Aller Aqua Fry 0.5mm", expiry: "Sep 12, 2026", days: 71, warehouse: "Warehouse 1", quantity: "0 kg", loss: "—", action: "No stock at risk" },
  { name: "Coppens Starter 2mm", expiry: "Oct 2, 2026", days: 91, warehouse: "Warehouse 1", quantity: "320 kg", loss: "₦396k", action: "On track to consume before expiry" },
];

const PURCHASE_ORDERS: PurchaseOrder[] = [
  { po: "PO-2024-118", supplier: "AquaFeed Nigeria Ltd", items: "Coppens Starter 2mm", quantity: "1,200 kg", cost: "₦1.49M", status: "Approved", delivery: "Jul 6", payment: "Part-paid" },
  { po: "PO-2024-117", supplier: "BlueWave Feeds", items: "Skretting Tilapia 5mm", quantity: "2,000 kg", cost: "₦1.66M", status: "Pending", delivery: "Jul 10", payment: "Pending" },
  { po: "PO-2024-116", supplier: "AquaFeed Nigeria Ltd", items: "Coppens Grower 4mm", quantity: "1,500 kg", cost: "₦1.58M", status: "Delivered", delivery: "Jul 2", payment: "Paid" },
  { po: "PO-2024-114", supplier: "Vital Agro Dealers", items: "Vital Catfish 6mm", quantity: "900 kg", cost: "₦576k", status: "Delivered", delivery: "Jun 18", payment: "Paid" },
  { po: "PO-2024-112", supplier: "BlueWave Feeds", items: "Skretting Catfish 3mm", quantity: "600 kg", cost: "₦540k", status: "Cancelled", delivery: "—", payment: "—" },
];

const AI_RECOMMENDATIONS = [
  "Starter feed will finish in 5 days — place a purchase order this week.",
  "Purchase 120 bags of Skretting 3mm to avoid an August shortage.",
  "BlueWave Feeds offers a 7% lower price on tilapia feed this quarter.",
  "Move 400 kg from Warehouse 2 to Warehouse 1 — humidity is rising in the field store.",
  "Batch C is consuming feed 9% faster than forecast — recheck ration size.",
  "Expected monthly feed cost: ₦5.2M. Switching starter feed supplier saves ₦280,000/month.",
] as const;

const NOTIFICATIONS: NotificationItem[] = [
  { tone: "danger", text: "Aller Aqua Fry 0.5mm is out of stock", time: "07:10 AM" },
  { tone: "danger", text: "Warehouse 2 humidity at 71% — above 65% threshold", time: "08:45 AM" },
  { tone: "warning", text: "Coppens Starter 2mm below minimum stock", time: "06:30 AM" },
  { tone: "success", text: "PO-2024-118 approved — delivery Jul 6", time: "Yesterday" },
  { tone: "info", text: "Stock adjustment of -18 kg recorded in Warehouse 2", time: "Jul 1" },
  { tone: "success", text: "Delivery arrived — 1,500 kg Coppens Grower received", time: "Jul 2" },
];

const CONSUMPTION_TABS = ["By Pond", "By Species", "By Batch", "By Feed Type"] as const;
type ConsumptionTab = (typeof CONSUMPTION_TABS)[number];

const CONSUMPTION_DATA: Record<ConsumptionTab, { label: string; kg: number; share: string }[]> = {
  "By Pond": [
    { label: "Pond D", kg: 92, share: "35%" },
    { label: "Pond A", kg: 76, share: "29%" },
    { label: "Pond B", kg: 68, share: "26%" },
    { label: "Pond F", kg: 42, share: "16%" },
    { label: "Pond C", kg: 60, share: "23%" },
    { label: "Pond E", kg: 26, share: "10%" },
  ],
  "By Species": [
    { label: "Catfish", kg: 158, share: "61%" },
    { label: "Tilapia", kg: 102, share: "39%" },
  ],
  "By Batch": [
    { label: "BAT-003", kg: 92, share: "35%" },
    { label: "BAT-004", kg: 76, share: "29%" },
    { label: "BAT-005", kg: 68, share: "26%" },
    { label: "BAT-007", kg: 42, share: "16%" },
  ],
  "By Feed Type": [
    { label: "Coppens 4mm", kg: 118, share: "45%" },
    { label: "Skretting 5mm", kg: 92, share: "35%" },
    { label: "Skretting 3mm", kg: 30, share: "12%" },
    { label: "Vital 6mm", kg: 20, share: "8%" },
  ],
};

const REPORT_OPTIONS = [
  "Inventory Report", "Stock Valuation", "Consumption Report", "Purchase Report", "Supplier Report",
  "Expiry Report", "Warehouse Report", "PDF", "Excel", "CSV",
] as const;

const FAB_ACTIONS = [
  "Add Inventory", "Record Purchase", "Transfer Feed", "Adjust Stock", "Print Barcode", "Generate Report",
] as const;

function NavIcon({ type }: { type: IconType }): React.JSX.Element {
  const paths: Record<IconType, React.ReactNode> = {
    dashboard: (
      <>
        <rect x="3" y="3" width="7" height="7" rx="1.5" />
        <rect x="14" y="3" width="7" height="7" rx="1.5" />
        <rect x="3" y="14" width="7" height="7" rx="1.5" />
        <rect x="14" y="14" width="7" height="7" rx="1.5" />
      </>
    ),
    pond: (
      <>
        <circle cx="12" cy="12" r="9" />
        <path d="M7 14c2-2 4-2 6 0s4 2 6 0" />
      </>
    ),
    batch: (
      <>
        <path d="M12 3l9 5-9 5-9-5 9-5z" />
        <path d="M3 13l9 5 9-5" />
      </>
    ),
    feed: <path d="M5 12h14M7 8h10M8 16h8" />,
    inventory: (
      <>
        <path d="M21 8l-9-5-9 5 9 5 9-5z" />
        <path d="M3 8v8l9 5 9-5V8" />
      </>
    ),
    water: <path d="M12 3s-6 7-6 11a6 6 0 0 0 12 0c0-4-6-11-6-11z" />,
    harvest: <path d="M4 14c5-8 11-8 16 0M6 14v5h12v-5" />,
    reports: (
      <>
        <path d="M4 19V5" />
        <path d="M4 19h16" />
        <path d="M7 15l4-4 3 3 5-7" />
      </>
    ),
    delivery: (
      <>
        <path d="M3 7h11v9H3z" />
        <path d="M14 10h4l3 3v3h-7z" />
        <circle cx="7" cy="18" r="2" />
        <circle cx="17" cy="18" r="2" />
      </>
    ),
    ai: <path d="M12 2l1.8 6.2L20 10l-6.2 1.8L12 18l-1.8-6.2L4 10l6.2-1.8L12 2z" />,
    settings: (
      <>
        <path d="M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z" />
        <path d="M19.4 15a8 8 0 0 0 .1-2l2-1.5-2-3.5-2.4 1a8 8 0 0 0-1.7-1L15 5.5h-4L10.6 8a8 8 0 0 0-1.7 1l-2.4-1-2 3.5 2 1.5a8 8 0 0 0 .1 2l-2.1 1.5 2 3.5 2.4-1a8 8 0 0 0 1.7 1l.4 2.5h4l.4-2.5a8 8 0 0 0 1.7-1l2.4 1 2-3.5L19.4 15z" />
      </>
    ),
    value: (
      <>
        <circle cx="12" cy="12" r="9" />
        <path d="M12 7v10M9 9.5c0-1 1.3-1.8 3-1.8s3 .8 3 1.8-1.3 1.7-3 2-3 1-3 2 1.3 1.8 3 1.8 3-.8 3-1.8" />
      </>
    ),
    clock: (
      <>
        <circle cx="12" cy="12" r="9" />
        <path d="M12 7v5l3 3" />
      </>
    ),
    alert: (
      <>
        <path d="M12 3l10 18H2L12 3z" />
        <path d="M12 10v5M12 18h.01" />
      </>
    ),
    score: <path d="M12 2l1.8 6.2L20 10l-6.2 1.8L12 18l-1.8-6.2L4 10l6.2-1.8L12 2z" />,
  };

  return (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {paths[type]}
    </svg>
  );
}

function Sparkline({ variant }: { variant: "up" | "down" | "flat" }): React.JSX.Element {
  const stroke = variant === "down" ? "#B45309" : variant === "flat" ? "#A3A3A3" : "#0D7A5F";

  return (
    <svg width="60" height="20" viewBox="0 0 60 20" aria-hidden="true">
      <polyline points={SPARK_POINTS[variant]} fill="none" stroke={stroke} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function stockBadge(status: StockStatus): string {
  if (status === "Healthy") return "bg-[var(--color-accent-light)] text-[var(--color-accent)]";
  if (status === "Low Stock") return "bg-[var(--color-warning-light)] text-[var(--color-warning)]";
  if (status === "Critical") return "bg-orange-50 text-orange-700";
  if (status === "Out of Stock") return "bg-[var(--color-danger-light)] text-[var(--color-danger)]";
  return "bg-neutral-100 text-[var(--color-text-muted)]";
}

function poBadge(status: PoStatus): string {
  if (status === "Delivered") return "bg-[var(--color-accent-light)] text-[var(--color-accent)]";
  if (status === "Approved") return "bg-sky-50 text-sky-700";
  if (status === "Pending") return "bg-[var(--color-warning-light)] text-[var(--color-warning)]";
  return "bg-neutral-100 text-[var(--color-text-muted)]";
}

function movementTone(type: Movement["type"]): string {
  if (type === "Purchase" || type === "Return") return "border-[var(--color-accent-border)] bg-[var(--color-accent)]";
  if (type === "Consumption" || type === "Transfer") return "border-[var(--color-border)] bg-[var(--color-text-muted)]";
  if (type === "Spoilage") return "border-red-200 bg-[var(--color-danger)]";
  return "border-amber-200 bg-[var(--color-warning)]";
}

function notificationDot(tone: NotificationItem["tone"]): string {
  if (tone === "danger") return "bg-[var(--color-danger)]";
  if (tone === "warning") return "bg-[var(--color-warning)]";
  if (tone === "success") return "bg-[var(--color-accent)]";
  return "bg-sky-500";
}

function stockLevel(item: FeedItem): number {
  if (item.maxStock === 0) return 0;
  return Math.min(100, Math.round((item.quantity / item.maxStock) * 100));
}

function stockBarColor(status: StockStatus): string {
  if (status === "Healthy") return "bg-[var(--color-accent)]";
  if (status === "Low Stock" || status === "Critical") return "bg-[var(--color-warning)]";
  return "bg-[var(--color-danger)]";
}

function CircularScore({ score }: { score: number }): React.JSX.Element {
  const radius = 52;
  const circumference = 2 * Math.PI * radius;

  return (
    <svg width="128" height="128" viewBox="0 0 128 128" aria-hidden="true">
      <defs>
        <linearGradient id="inventoryScoreGradient" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#0D7A5F" />
          <stop offset="100%" stopColor="#34D399" />
        </linearGradient>
      </defs>
      <circle cx="64" cy="64" r={radius} fill="none" stroke="#F2F2F2" strokeWidth="10" />
      <circle
        cx="64"
        cy="64"
        r={radius}
        fill="none"
        stroke="url(#inventoryScoreGradient)"
        strokeWidth="10"
        strokeLinecap="round"
        strokeDasharray={circumference}
        strokeDashoffset={circumference * (1 - score / 100)}
        transform="rotate(-90 64 64)"
      />
      <text x="64" y="60" textAnchor="middle" fontSize="28" fontWeight="700" fill="#0A0A0A">
        {score}
      </text>
      <text x="64" y="80" textAnchor="middle" fontSize="12" fill="#A3A3A3">
        /100
      </text>
    </svg>
  );
}

function Info({ label, value }: { label: string; value: string }): React.JSX.Element {
  return (
    <div>
      <p className="text-[11px] uppercase tracking-widest text-[var(--color-text-muted)]">{label}</p>
      <p className="mt-1 text-sm font-semibold text-[var(--color-text-primary)]">{value}</p>
    </div>
  );
}

function InventoryDrawer({ item, onClose }: { item: FeedItem; onClose: () => void }): React.JSX.Element {
  return (
    <div className="fixed inset-0 z-50">
      <button type="button" aria-label="Close inventory details" onClick={onClose} className="absolute inset-0 bg-black/20 backdrop-blur-sm" />
      <aside className="absolute inset-x-0 bottom-0 top-0 overflow-y-auto bg-[var(--color-surface)] shadow-[0_24px_80px_rgba(0,0,0,0.16)] md:inset-x-auto md:right-0 md:w-[560px]">
        <div className="sticky top-0 z-10 border-b border-[var(--color-border)] bg-white/90 px-5 py-4 backdrop-blur-xl">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-3">
                <h2 className="text-xl font-bold tracking-[-0.03em]">{item.name}</h2>
                <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${stockBadge(item.status)}`}>{item.status}</span>
              </div>
              <p className="mt-1 text-sm text-[var(--color-text-secondary)]">
                {item.id} · {item.brand} · {item.warehouse}
              </p>
            </div>
            <button type="button" onClick={onClose} className="flex h-10 w-10 items-center justify-center rounded-md border border-[var(--color-border)] bg-white transition-all duration-200 hover:bg-[var(--color-surface)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent)] focus-visible:ring-offset-2">
              ×
            </button>
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            {["Edit", "Transfer", "Adjust Stock", "Print Barcode"].map((action) => (
              <button key={action} type="button" className="min-h-9 rounded-md border border-[var(--color-border)] bg-white px-3 py-1.5 text-xs font-medium text-[var(--color-text-secondary)] transition-all duration-200 hover:border-[var(--color-border-strong)] hover:text-[var(--color-text-primary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent)] focus-visible:ring-offset-2">
                {action}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-5 p-5">
          <section className="rounded-2xl border border-[var(--color-border)] bg-white p-5">
            <div className="flex items-center gap-4">
              <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] text-3xl" aria-label="Product image placeholder">
                🐟
              </div>
              <div>
                <p className="text-sm font-semibold">{item.name}</p>
                <p className="mt-1 text-xs leading-5 text-[var(--color-text-secondary)]">
                  {item.feedType} · {item.pelletSize} · {item.protein} protein · {item.fat} fat
                </p>
              </div>
            </div>
            <div className="mt-5 grid grid-cols-2 gap-4">
              <Info label="Brand" value={item.brand} />
              <Info label="Manufacturer" value={item.manufacturer} />
              <Info label="Supplier" value={item.supplier} />
              <Info label="Warehouse" value={item.warehouse} />
              <Info label="Storage Location" value={item.storageLocation} />
              <Info label="Batch Number" value={item.batchNumber} />
              <Info label="Production Date" value={item.productionDate} />
              <Info label="Expiry Date" value={item.expiry} />
            </div>
          </section>

          <section className="rounded-2xl border border-[var(--color-border)] bg-white p-5">
            <h3 className="text-sm font-bold">Stock Levels</h3>
            <div className="mt-4 grid grid-cols-2 gap-4">
              <Info label="Quantity On Hand" value={`${item.quantity.toLocaleString()} ${item.unit}`} />
              <Info label="Reserved Quantity" value={`${item.reserved.toLocaleString()} ${item.unit}`} />
              <Info label="Available Quantity" value={`${(item.quantity - item.reserved).toLocaleString()} ${item.unit}`} />
              <Info label="Minimum Stock" value={`${item.minStock.toLocaleString()} ${item.unit}`} />
              <Info label="Maximum Stock" value={`${item.maxStock.toLocaleString()} ${item.unit}`} />
              <Info label="Stock Level" value={`${stockLevel(item)}% of max`} />
            </div>
            <div className="mt-4 h-2.5 rounded-full bg-neutral-100">
              <div
                className={`h-full rounded-full transition-all duration-500 ${stockBarColor(item.status)}`}
                style={{ width: `${stockLevel(item)}%` }}
              />
            </div>
          </section>

          <section className="rounded-2xl border border-[var(--color-border)] bg-white p-5">
            <h3 className="text-sm font-bold">Valuation</h3>
            <div className="mt-4 grid grid-cols-2 gap-4">
              <Info label="Purchase Cost" value={item.purchaseCost} />
              <Info label="Unit Price" value={item.unitPrice} />
              <Info label="Inventory Value" value={item.value} />
              <Info label="Selling Value" value={item.value} />
            </div>
          </section>

          <section className="rounded-2xl border border-[var(--color-border)] bg-white p-5">
            <h3 className="text-sm font-bold">Barcode & QR</h3>
            <div className="mt-4 flex items-center gap-5">
              <div className="grid h-20 w-20 shrink-0 grid-cols-4 gap-0.5 rounded-md border border-[var(--color-border)] bg-white p-1.5" aria-label={`QR code for ${item.id}`}>
                {[1, 0, 1, 1, 0, 1, 0, 1, 1, 0, 1, 0, 1, 1, 0, 1].map((cell, index) => (
                  <span key={index} className={`rounded-[1px] ${cell ? "bg-[var(--color-text-primary)]" : "bg-transparent"}`} />
                ))}
              </div>
              <div className="flex h-14 flex-1 items-end gap-[3px] overflow-hidden rounded-md border border-[var(--color-border)] bg-white px-3 py-2" aria-label={`Barcode for ${item.id}`}>
                {[3, 1, 2, 1, 3, 2, 1, 3, 1, 2, 3, 1, 2, 1, 3, 1, 2, 3, 1, 2].map((width, index) => (
                  <span key={index} className="h-full bg-[var(--color-text-primary)]" style={{ width: `${width}px` }} />
                ))}
              </div>
            </div>
            <p className="mt-3 font-mono text-[11px] text-[var(--color-text-muted)]">{item.batchNumber} · scan to trace this batch</p>
          </section>

          <section className="rounded-2xl border border-[var(--color-border)] bg-white p-5">
            <h3 className="text-sm font-bold">Storage Notes</h3>
            <p className="mt-3 text-sm leading-6 text-[var(--color-text-secondary)]">{item.notes}</p>
          </section>
        </div>
      </aside>
    </div>
  );
}

export default function FeedInventoryModule(): React.JSX.Element {
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"All" | StockStatus>("All");
  const [brandFilter, setBrandFilter] = useState("All");
  const [warehouseFilter, setWarehouseFilter] = useState("All");
  const [selectedItem, setSelectedItem] = useState<FeedItem | null>(null);
  const [openActions, setOpenActions] = useState<string | null>(null);
  const [expandedCard, setExpandedCard] = useState<string | null>(null);
  const [consumptionTab, setConsumptionTab] = useState<ConsumptionTab>("By Pond");
  const [fabOpen, setFabOpen] = useState(false);

  const brands = useMemo(() => ["All", ...Array.from(new Set(FEED_ITEMS.map((item) => item.brand))).sort()], []);
  const warehouses = useMemo(() => ["All", ...Array.from(new Set(FEED_ITEMS.map((item) => item.warehouse))).sort()], []);

  const filteredItems = useMemo(() => {
    const term = query.toLowerCase();
    return FEED_ITEMS.filter(
      (item) =>
        (item.name.toLowerCase().includes(term) ||
          item.brand.toLowerCase().includes(term) ||
          item.supplier.toLowerCase().includes(term) ||
          item.warehouse.toLowerCase().includes(term) ||
          item.batchNumber.toLowerCase().includes(term)) &&
        (statusFilter === "All" || item.status === statusFilter) &&
        (brandFilter === "All" || item.brand === brandFilter) &&
        (warehouseFilter === "All" || item.warehouse === warehouseFilter),
    );
  }, [brandFilter, query, statusFilter, warehouseFilter]);

  const maxConsumption = Math.max(...CONSUMPTION_DATA[consumptionTab].map((item) => item.kg), 1);

  return (
    <main className="min-h-screen bg-[var(--color-surface)] pb-24 text-[var(--color-text-primary)] lg:pb-0">
      <AppSidebar activeKey="inventory" />

      <div className="lg:pl-[256px]">
        <AppMobileHeader activeKey="inventory" />

        <div className="mx-auto max-w-[1440px] px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
          {/* Page header */}
          <header className="mb-6 rounded-2xl border border-[var(--color-border)] bg-white p-5 sm:p-6">
            <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
              <div>
                <h1 className="text-[clamp(30px,4vw,48px)] font-bold tracking-[-0.05em]">Feed Inventory</h1>
                <p className="mt-2 max-w-2xl text-base leading-7 text-[var(--color-text-secondary)]">
                  Monitor feed stock, consumption, suppliers, costs, and replenishment across the entire farm.
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <button type="button" className="min-h-11 rounded-md bg-[var(--color-accent)] px-4 py-2 text-sm font-medium text-white transition-all duration-200 hover:-translate-y-px hover:bg-emerald-900 hover:shadow-[0_2px_8px_rgba(0,0,0,0.08)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent)] focus-visible:ring-offset-2">
                  + Add Feed Stock
                </button>
                {["+ Record Purchase", "+ Transfer Feed", "+ Stock Adjustment", "Generate Report", "Export PDF", "Export Excel"].map((action) => (
                  <button key={action} type="button" className="min-h-11 rounded-md border border-[var(--color-border)] bg-white px-4 py-2 text-sm font-medium text-[var(--color-text-secondary)] transition-all duration-200 hover:-translate-y-px hover:border-[var(--color-border-strong)] hover:text-[var(--color-text-primary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent)] focus-visible:ring-offset-2">
                    {action}
                  </button>
                ))}
              </div>
            </div>
          </header>

          {/* KPI cards */}
          <section className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {KPI_CARDS.map((card) => (
              <div
                key={card.label}
                title={`${card.label}: ${card.detail} · ${card.comparison}`}
                className="rounded-2xl border border-[var(--color-border)] bg-white p-5 transition-all duration-200 hover:-translate-y-px hover:border-[var(--color-border-strong)] hover:shadow-[0_4px_16px_rgba(0,0,0,0.06)]"
              >
                <div className="flex items-start justify-between">
                  <p className="text-[11px] font-medium uppercase tracking-widest text-[var(--color-text-muted)]">{card.label}</p>
                  <span className="text-[var(--color-text-muted)]"><NavIcon type={card.icon} /></span>
                </div>
                <div className="mt-4 flex items-end justify-between gap-2">
                  <p className="text-3xl font-bold tracking-[-0.04em]">{card.value}</p>
                  <Sparkline variant={card.spark} />
                </div>
                <div className="mt-2 flex items-center gap-2">
                  <span
                    className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${
                      card.trendTone === "up"
                        ? "bg-emerald-100 text-[var(--color-accent)]"
                        : card.trendTone === "down"
                          ? "bg-[var(--color-warning-light)] text-[var(--color-warning)]"
                          : "bg-neutral-100 text-[var(--color-text-secondary)]"
                    }`}
                  >
                    {card.trend}
                  </span>
                  <span className="truncate text-xs text-[var(--color-text-muted)]">{card.comparison}</span>
                </div>
              </div>
            ))}
          </section>

          <div className="grid gap-6 2xl:grid-cols-[minmax(0,1fr)_320px]">
            <div className="min-w-0 space-y-6">
              {/* AI inventory summary + recommendations */}
              <section className="grid gap-6 xl:grid-cols-2">
                <div className="rounded-2xl border border-[var(--color-accent-border)] bg-[var(--color-accent-light)] p-5 sm:p-6">
                  <div className="flex items-center justify-between">
                    <h2 className="text-lg font-bold tracking-[-0.03em]">Inventory Health</h2>
                    <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-[var(--color-accent)]">AI Summary</span>
                  </div>
                  <div className="mt-4 flex flex-col items-center gap-5 sm:flex-row">
                    <CircularScore score={96} />
                    <ul className="space-y-1.5 text-sm leading-6 text-[var(--color-text-primary)]">
                      <li>Current inventory can sustain operations for 18 days.</li>
                      <li>Starter feed will run out in 5 days.</li>
                      <li>Consumption is increasing due to biomass growth.</li>
                      <li>Recommend placing a purchase order this week.</li>
                      <li>Potential savings: ₦280,000/month by switching suppliers.</li>
                    </ul>
                  </div>
                </div>

                <div className="rounded-2xl border border-[var(--color-border)] bg-white p-5 sm:p-6">
                  <div className="flex items-center justify-between">
                    <h2 className="text-lg font-bold tracking-[-0.03em]">AI Recommendations</h2>
                    <span className="rounded-full bg-[var(--color-accent-light)] px-3 py-1 text-xs font-semibold text-[var(--color-accent)]">Live</span>
                  </div>
                  <div className="mt-4 divide-y divide-neutral-100">
                    {AI_RECOMMENDATIONS.map((item) => (
                      <p key={item} className="py-2.5 text-sm leading-6 text-[var(--color-text-secondary)]">{item}</p>
                    ))}
                  </div>
                </div>
              </section>

              {/* Search & filters */}
              <section className="rounded-2xl border border-[var(--color-border)] bg-white p-4 sm:p-5">
                <div className="grid gap-3 lg:grid-cols-[1fr_150px_150px_170px]">
                  <input
                    value={query}
                    onChange={(event) => setQuery(event.target.value)}
                    type="search"
                    placeholder="Search feed name, brand, supplier, warehouse, batch number…"
                    className="h-11 rounded-md border border-[var(--color-border)] bg-white px-3 text-sm outline-none transition-all duration-200 focus:border-[var(--color-accent)] focus:ring-2 focus:ring-[var(--color-accent-border)]"
                  />
                  <select
                    value={brandFilter}
                    onChange={(event) => setBrandFilter(event.target.value)}
                    className="h-11 rounded-md border border-[var(--color-border)] bg-white px-3 text-sm outline-none transition-all duration-200 focus:border-[var(--color-accent)] focus:ring-2 focus:ring-[var(--color-accent-border)]"
                    aria-label="Filter by brand"
                  >
                    {brands.map((brand) => (
                      <option key={brand} value={brand}>{brand === "All" ? "All brands" : brand}</option>
                    ))}
                  </select>
                  <select
                    value={warehouseFilter}
                    onChange={(event) => setWarehouseFilter(event.target.value)}
                    className="h-11 rounded-md border border-[var(--color-border)] bg-white px-3 text-sm outline-none transition-all duration-200 focus:border-[var(--color-accent)] focus:ring-2 focus:ring-[var(--color-accent-border)]"
                    aria-label="Filter by warehouse"
                  >
                    {warehouses.map((warehouse) => (
                      <option key={warehouse} value={warehouse}>{warehouse === "All" ? "All warehouses" : warehouse}</option>
                    ))}
                  </select>
                  <select
                    value={statusFilter}
                    onChange={(event) => setStatusFilter(event.target.value as "All" | StockStatus)}
                    className="h-11 rounded-md border border-[var(--color-border)] bg-white px-3 text-sm outline-none transition-all duration-200 focus:border-[var(--color-accent)] focus:ring-2 focus:ring-[var(--color-accent-border)]"
                    aria-label="Filter by status"
                  >
                    {["All", "Healthy", "Low Stock", "Critical", "Out of Stock", "Expired"].map((option) => (
                      <option key={option} value={option}>{option === "All" ? "All statuses" : option}</option>
                    ))}
                  </select>
                </div>
              </section>

              {/* Current inventory table */}
              <section className="rounded-2xl border border-[var(--color-border)] bg-white">
                <div className="border-b border-[var(--color-border)] p-5 sm:p-6">
                  <h2 className="text-lg font-bold tracking-[-0.03em]">Current Inventory</h2>
                  <p className="mt-1 text-sm text-[var(--color-text-secondary)]">
                    {filteredItems.length} of {FEED_ITEMS.length} feed items · click a row for full details.
                  </p>
                </div>

                <div className="hidden overflow-x-auto [-webkit-overflow-scrolling:touch] md:block">
                  <table className="w-full min-w-[1760px] border-collapse">
                    <thead className="bg-[var(--color-surface)]">
                      <tr className="text-left text-[11px] font-medium uppercase tracking-widest text-[var(--color-text-muted)]">
                        {TABLE_HEADERS.map((header) => (
                          <th key={header} className="whitespace-nowrap px-4 py-3">{header}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {filteredItems.map((item) => (
                        <tr
                          key={item.id}
                          onClick={() => setSelectedItem(item)}
                          className="cursor-pointer border-t border-[var(--color-border)] transition-colors duration-150 hover:bg-[var(--color-surface)]"
                        >
                          <td className="whitespace-nowrap px-4 py-4 font-mono text-xs">{item.id}</td>
                          <td className="whitespace-nowrap px-4 py-4 text-sm font-semibold">{item.name}</td>
                          <td className="whitespace-nowrap px-4 py-4 text-sm">{item.brand}</td>
                          <td className="whitespace-nowrap px-4 py-4 text-sm text-[var(--color-text-secondary)]">{item.feedType}</td>
                          <td className="whitespace-nowrap px-4 py-4 text-sm">{item.pelletSize}</td>
                          <td className="whitespace-nowrap px-4 py-4 text-sm">{item.protein}</td>
                          <td className="whitespace-nowrap px-4 py-4 text-sm text-[var(--color-text-secondary)]">{item.supplier}</td>
                          <td className="whitespace-nowrap px-4 py-4 text-sm">{item.warehouse}</td>
                          <td className="whitespace-nowrap px-4 py-4">
                            <div className="text-sm font-medium">{item.quantity.toLocaleString()} {item.unit}</div>
                            <div className="mt-1 h-1 w-20 rounded-full bg-neutral-100">
                              <div className={`h-full rounded-full ${stockBarColor(item.status)}`} style={{ width: `${stockLevel(item)}%` }} />
                            </div>
                          </td>
                          <td className="whitespace-nowrap px-4 py-4 text-sm text-[var(--color-text-secondary)]">{item.minStock.toLocaleString()} {item.unit}</td>
                          <td className="whitespace-nowrap px-4 py-4 text-sm text-[var(--color-text-secondary)]">{item.maxStock.toLocaleString()} {item.unit}</td>
                          <td className="whitespace-nowrap px-4 py-4 text-sm">{item.unitPrice}</td>
                          <td className="whitespace-nowrap px-4 py-4 text-sm font-medium">{item.value}</td>
                          <td className="whitespace-nowrap px-4 py-4 text-sm">{item.expiry}</td>
                          <td className="whitespace-nowrap px-4 py-4 font-mono text-xs text-[var(--color-text-secondary)]">{item.batchNumber}</td>
                          <td className="whitespace-nowrap px-4 py-4">
                            <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${stockBadge(item.status)}`}>{item.status}</span>
                          </td>
                          <td className="whitespace-nowrap px-4 py-4">
                            <div className="relative">
                              <button
                                type="button"
                                onClick={(event) => {
                                  event.stopPropagation();
                                  setOpenActions((current) => (current === item.id ? null : item.id));
                                }}
                                aria-label={`Actions for ${item.name}`}
                                className="flex h-8 w-8 items-center justify-center rounded-md border border-[var(--color-border)] bg-white text-[var(--color-text-secondary)] transition-all duration-200 hover:border-[var(--color-border-strong)] hover:text-[var(--color-text-primary)]"
                              >
                                ⋯
                              </button>
                              {openActions === item.id && (
                                <div className="absolute right-0 top-9 z-20 w-40 rounded-xl border border-[var(--color-border)] bg-white p-1.5 shadow-[0_12px_40px_rgba(0,0,0,0.12)]">
                                  {ROW_ACTIONS.map((action) => (
                                    <button
                                      key={action}
                                      type="button"
                                      onClick={(event) => {
                                        event.stopPropagation();
                                        setOpenActions(null);
                                        if (action === "View") setSelectedItem(item);
                                      }}
                                      className={`flex w-full items-center rounded-md px-3 py-2 text-left text-sm transition-colors duration-150 hover:bg-[var(--color-surface)] ${
                                        action === "Delete" ? "text-[var(--color-danger)]" : "text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]"
                                      }`}
                                    >
                                      {action}
                                    </button>
                                  ))}
                                </div>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Mobile expandable cards */}
                <div className="grid gap-3 p-4 md:hidden">
                  {filteredItems.map((item) => {
                    const expanded = expandedCard === item.id;
                    return (
                      <div key={item.id} className="rounded-xl border border-[var(--color-border)] bg-white">
                        <button
                          type="button"
                          onClick={() => setExpandedCard(expanded ? null : item.id)}
                          className="flex min-h-16 w-full items-center justify-between gap-3 p-4 text-left"
                          aria-expanded={expanded}
                        >
                          <div>
                            <p className="font-semibold">{item.name}</p>
                            <p className="mt-0.5 text-xs text-[var(--color-text-secondary)]">
                              {item.quantity.toLocaleString()} {item.unit} · {item.warehouse}
                            </p>
                          </div>
                          <span className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold ${stockBadge(item.status)}`}>{item.status}</span>
                        </button>
                        {expanded && (
                          <div className="border-t border-[var(--color-border)] p-4">
                            <div className="grid grid-cols-2 gap-3">
                              <Info label="Supplier" value={item.supplier} />
                              <Info label="Unit Price" value={item.unitPrice} />
                              <Info label="Value" value={item.value} />
                              <Info label="Expiry" value={item.expiry} />
                              <Info label="Batch" value={item.batchNumber} />
                              <Info label="Min Stock" value={`${item.minStock.toLocaleString()} ${item.unit}`} />
                            </div>
                            <div className="mt-4 flex gap-2">
                              <button
                                type="button"
                                onClick={() => setSelectedItem(item)}
                                className="min-h-11 flex-1 rounded-md bg-[var(--color-accent)] px-3 py-2 text-sm font-medium text-white transition-all duration-200 hover:bg-emerald-900"
                              >
                                View details
                              </button>
                              <button type="button" className="min-h-11 flex-1 rounded-md border border-[var(--color-border)] bg-white px-3 py-2 text-sm font-medium text-[var(--color-text-secondary)] transition-all duration-200 hover:border-[var(--color-border-strong)]">
                                Adjust stock
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </section>

              {/* Low stock + expiry management */}
              <section className="grid gap-6 xl:grid-cols-2">
                <div className="rounded-2xl border border-amber-200 bg-amber-50/50 p-5 sm:p-6">
                  <div className="flex items-center justify-between">
                    <h2 className="text-lg font-bold tracking-[-0.03em]">Low Stock Center</h2>
                    <span className="rounded-full bg-[var(--color-danger-light)] px-3 py-1 text-xs font-semibold text-[var(--color-danger)]">2 high priority</span>
                  </div>
                  <div className="mt-4 space-y-3">
                    {LOW_STOCK.map((item) => (
                      <div key={item.name} className="rounded-xl border border-[var(--color-border)] bg-white p-4 transition-all duration-200 hover:-translate-y-px hover:shadow-[0_4px_16px_rgba(0,0,0,0.06)]">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="text-sm font-semibold">{item.name}</p>
                            <p className="mt-0.5 text-xs text-[var(--color-text-secondary)]">
                              {item.remaining} left · {item.days} remaining
                            </p>
                          </div>
                          <span className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold ${item.priority === "High" ? "bg-[var(--color-danger-light)] text-[var(--color-danger)]" : "bg-[var(--color-warning-light)] text-[var(--color-warning)]"}`}>
                            {item.priority}
                          </span>
                        </div>
                        <div className="mt-3 grid gap-1 text-xs text-[var(--color-text-secondary)]">
                          <p>Recommended: <span className="font-medium text-[var(--color-text-primary)]">{item.recommended}</span> · {item.cost}</p>
                          <p>Supplier: {item.supplier}</p>
                        </div>
                        <button type="button" className="mt-3 rounded-md bg-[var(--color-accent)] px-3 py-1.5 text-xs font-medium text-white transition-all duration-200 hover:bg-emerald-900">
                          Create purchase order
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="rounded-2xl border border-[var(--color-border)] bg-white p-5 sm:p-6">
                  <h2 className="text-lg font-bold tracking-[-0.03em]">Expiry Management</h2>
                  <p className="mt-1 text-sm text-[var(--color-text-secondary)]">Feeds nearing expiry, ordered by urgency.</p>
                  <div className="mt-4 space-y-3">
                    {EXPIRY_ITEMS.map((item) => (
                      <div key={item.name} className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="text-sm font-semibold">{item.name}</p>
                            <p className="mt-0.5 text-xs text-[var(--color-text-secondary)]">
                              {item.expiry} · {item.warehouse} · {item.quantity}
                            </p>
                          </div>
                          <span className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold ${item.days <= 45 ? "bg-[var(--color-warning-light)] text-[var(--color-warning)]" : "bg-neutral-100 text-[var(--color-text-secondary)]"}`}>
                            {item.days} days
                          </span>
                        </div>
                        <p className="mt-2 text-xs leading-5 text-[var(--color-text-secondary)]">
                          Est. loss if expired: <span className="font-medium text-[var(--color-text-primary)]">{item.loss}</span> · {item.action}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              </section>

              {/* Consumption analytics + cost analytics */}
              <section className="grid gap-6 xl:grid-cols-2">
                <div className="rounded-2xl border border-[var(--color-border)] bg-white p-5 sm:p-6">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <h2 className="text-lg font-bold tracking-[-0.03em]">Consumption Analytics</h2>
                    <div className="flex flex-wrap gap-1.5">
                      {CONSUMPTION_TABS.map((tab) => (
                        <button
                          key={tab}
                          type="button"
                          onClick={() => setConsumptionTab(tab)}
                          className={`rounded-full border px-3 py-1.5 text-xs font-medium transition-all duration-200 ${
                            consumptionTab === tab
                              ? "border-[var(--color-accent-border)] bg-[var(--color-accent-light)] text-[var(--color-accent)]"
                              : "border-[var(--color-border)] bg-white text-[var(--color-text-secondary)] hover:border-[var(--color-border-strong)]"
                          }`}
                        >
                          {tab}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="mt-6 space-y-4">
                    {CONSUMPTION_DATA[consumptionTab].map((item) => (
                      <div key={item.label}>
                        <div className="flex items-baseline justify-between text-sm">
                          <span className="font-medium">{item.label}</span>
                          <span className="text-xs text-[var(--color-text-secondary)]">{item.kg} kg · {item.share}</span>
                        </div>
                        <div className="mt-1.5 h-2.5 rounded-full bg-neutral-100">
                          <div
                            className="h-full rounded-full bg-gradient-to-r from-[var(--color-accent)] to-emerald-400 transition-all duration-500"
                            style={{ width: `${(item.kg / maxConsumption) * 100}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="mt-6 grid grid-cols-3 gap-3 border-t border-neutral-100 pt-4 text-center">
                    <div>
                      <p className="text-[11px] uppercase tracking-widest text-[var(--color-text-muted)]">Daily</p>
                      <p className="mt-1 text-sm font-semibold">260 kg</p>
                    </div>
                    <div>
                      <p className="text-[11px] uppercase tracking-widest text-[var(--color-text-muted)]">Weekly</p>
                      <p className="mt-1 text-sm font-semibold">1,820 kg</p>
                    </div>
                    <div>
                      <p className="text-[11px] uppercase tracking-widest text-[var(--color-text-muted)]">Projected / mo</p>
                      <p className="mt-1 text-sm font-semibold text-[var(--color-warning)]">8,100 kg ↑</p>
                    </div>
                  </div>
                </div>

                <div className="rounded-2xl border border-[var(--color-border)] bg-white p-5 sm:p-6">
                  <h2 className="text-lg font-bold tracking-[-0.03em]">Feed Cost Analytics</h2>
                  <div className="mt-5 grid grid-cols-2 gap-4">
                    <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
                      <p className="text-[11px] uppercase tracking-widest text-[var(--color-text-muted)]">Avg Cost / kg</p>
                      <p className="mt-2 text-2xl font-bold tracking-[-0.04em]">₦994</p>
                    </div>
                    <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
                      <p className="text-[11px] uppercase tracking-widest text-[var(--color-text-muted)]">Monthly Cost</p>
                      <p className="mt-2 text-2xl font-bold tracking-[-0.04em]">₦4.8M</p>
                    </div>
                  </div>
                  <div className="mt-4 grid gap-2.5 text-sm">
                    {[
                      ["Cost by pond (avg)", "₦800k/mo"],
                      ["Cost by batch (avg)", "₦960k/mo"],
                      ["Catfish feed cost", "₦2.9M/mo"],
                      ["Tilapia feed cost", "₦1.9M/mo"],
                      ["Projected monthly cost", "₦5.2M"],
                    ].map(([label, value]) => (
                      <div key={label} className="flex justify-between border-b border-neutral-100 pb-2.5 last:border-0 last:pb-0">
                        <span className="text-[var(--color-text-secondary)]">{label}</span>
                        <span className="font-medium">{value}</span>
                      </div>
                    ))}
                  </div>
                  <p className="mt-4 text-xs text-[var(--color-accent)]">Cost trend ↓ 4% vs June — supplier renegotiation paying off</p>
                </div>
              </section>

              {/* Biomass link + stock movement */}
              <section className="grid gap-6 xl:grid-cols-2">
                <div className="rounded-2xl border border-[var(--color-border)] bg-white p-5 sm:p-6">
                  <h2 className="text-lg font-bold tracking-[-0.03em]">Biomass & Inventory Link</h2>
                  <p className="mt-1 text-sm text-[var(--color-text-secondary)]">Feed demand calculated automatically from live biomass.</p>
                  <div className="mt-5 grid gap-2.5 text-sm">
                    {[
                      ["Current biomass", "7,391 kg"],
                      ["Required daily feed", "260 kg"],
                      ["Required weekly feed", "1,820 kg"],
                      ["Required monthly feed", "7,900 kg"],
                    ].map(([label, value]) => (
                      <div key={label} className="flex justify-between border-b border-neutral-100 pb-2.5">
                        <span className="text-[var(--color-text-secondary)]">{label}</span>
                        <span className="font-medium">{value}</span>
                      </div>
                    ))}
                    <div className="flex justify-between border-b border-neutral-100 pb-2.5">
                      <span className="text-[var(--color-text-secondary)]">Inventory coverage</span>
                      <span className="font-medium text-[var(--color-accent)]">18 days</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[var(--color-text-secondary)]">Feed deficit (30-day)</span>
                      <span className="font-medium text-[var(--color-warning)]">-3,120 kg — order required</span>
                    </div>
                  </div>
                  <div className="mt-5">
                    <div className="flex items-center justify-between text-[11px] text-[var(--color-text-muted)]">
                      <span>30-day coverage</span>
                      <span>60%</span>
                    </div>
                    <div className="mt-1.5 h-2.5 rounded-full bg-neutral-100">
                      <div className="h-full w-[60%] rounded-full bg-gradient-to-r from-[var(--color-accent)] to-emerald-400" />
                    </div>
                  </div>
                </div>

                <div className="rounded-2xl border border-[var(--color-border)] bg-white p-5 sm:p-6">
                  <h2 className="text-lg font-bold tracking-[-0.03em]">Stock Movement History</h2>
                  <div className="mt-5 space-y-0">
                    {MOVEMENTS.map((movement, index) => (
                      <div key={`${movement.date}-${movement.type}`} className="relative flex gap-4 pb-5 last:pb-0">
                        {index < MOVEMENTS.length - 1 && (
                          <span className="absolute left-[7px] top-5 h-full w-px bg-[var(--color-border)]" />
                        )}
                        <span className={`relative mt-1 h-[15px] w-[15px] shrink-0 rounded-full border-4 ${movementTone(movement.type)}`} />
                        <div className="min-w-0 flex-1">
                          <div className="flex items-baseline justify-between gap-3">
                            <p className="text-sm font-semibold">{movement.type} · {movement.quantity}</p>
                            <p className="shrink-0 font-mono text-[11px] text-[var(--color-text-muted)]">{movement.date}</p>
                          </div>
                          <p className="mt-0.5 text-xs leading-5 text-[var(--color-text-secondary)]">
                            {movement.reason} · {movement.staff} · {movement.warehouse} · remaining {movement.remaining}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </section>

              {/* Procurement dashboard + PO table */}
              <section className="rounded-2xl border border-[var(--color-border)] bg-white">
                <div className="flex flex-wrap items-end justify-between gap-3 border-b border-[var(--color-border)] p-5 sm:p-6">
                  <div>
                    <h2 className="text-lg font-bold tracking-[-0.03em]">Procurement Dashboard</h2>
                    <p className="mt-1 text-sm text-[var(--color-text-secondary)]">Purchase orders and supplier deliveries.</p>
                  </div>
                  <button type="button" className="min-h-11 rounded-md bg-[var(--color-accent)] px-4 py-2 text-sm font-medium text-white transition-all duration-200 hover:-translate-y-px hover:bg-emerald-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent)] focus-visible:ring-offset-2">
                    + Create Purchase Order
                  </button>
                </div>
                <div className="grid grid-cols-2 gap-4 border-b border-[var(--color-border)] p-5 sm:grid-cols-3 lg:grid-cols-6 sm:p-6">
                  {[
                    ["Purchase Orders", "12"],
                    ["Pending", "1"],
                    ["Completed", "9"],
                    ["Deliveries (mo)", "6"],
                    ["Avg Delivery Time", "2.4 days"],
                    ["Open Requests", "2"],
                  ].map(([label, value]) => (
                    <div key={label}>
                      <p className="text-[11px] uppercase tracking-widest text-[var(--color-text-muted)]">{label}</p>
                      <p className="mt-1 text-xl font-bold tracking-[-0.03em]">{value}</p>
                    </div>
                  ))}
                </div>
                <div className="overflow-x-auto [-webkit-overflow-scrolling:touch]">
                  <table className="w-full min-w-[880px] border-collapse">
                    <thead className="bg-[var(--color-surface)]">
                      <tr className="text-left text-[11px] font-medium uppercase tracking-widest text-[var(--color-text-muted)]">
                        {["PO Number", "Supplier", "Items", "Quantity", "Cost", "Status", "Delivery", "Payment", "Actions"].map((header) => (
                          <th key={header} className="whitespace-nowrap px-4 py-3">{header}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {PURCHASE_ORDERS.map((order) => (
                        <tr key={order.po} className="border-t border-[var(--color-border)] transition-colors duration-150 hover:bg-[var(--color-surface)]">
                          <td className="whitespace-nowrap px-4 py-4 font-mono text-xs">{order.po}</td>
                          <td className="whitespace-nowrap px-4 py-4 text-sm font-medium">{order.supplier}</td>
                          <td className="whitespace-nowrap px-4 py-4 text-sm text-[var(--color-text-secondary)]">{order.items}</td>
                          <td className="whitespace-nowrap px-4 py-4 text-sm">{order.quantity}</td>
                          <td className="whitespace-nowrap px-4 py-4 text-sm font-medium">{order.cost}</td>
                          <td className="whitespace-nowrap px-4 py-4">
                            <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${poBadge(order.status)}`}>{order.status}</span>
                          </td>
                          <td className="whitespace-nowrap px-4 py-4 text-sm">{order.delivery}</td>
                          <td className="whitespace-nowrap px-4 py-4 text-sm text-[var(--color-text-secondary)]">{order.payment}</td>
                          <td className="whitespace-nowrap px-4 py-4">
                            <button type="button" className="rounded-md border border-[var(--color-border)] bg-white px-3 py-1.5 text-xs font-medium text-[var(--color-text-secondary)] transition-all duration-200 hover:border-[var(--color-border-strong)] hover:text-[var(--color-text-primary)]">
                              View
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </section>

              {/* Suppliers + warehouses */}
              <section className="grid gap-6 xl:grid-cols-2">
                <div className="rounded-2xl border border-[var(--color-border)] bg-white p-5 sm:p-6">
                  <h2 className="text-lg font-bold tracking-[-0.03em]">Supplier Management</h2>
                  <div className="mt-4 space-y-3">
                    {SUPPLIERS.map((supplier) => (
                      <div key={supplier.name} className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4 transition-all duration-200 hover:-translate-y-px hover:shadow-[0_4px_16px_rgba(0,0,0,0.06)]">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="text-sm font-semibold">{supplier.name}</p>
                            <p className="mt-0.5 text-xs text-[var(--color-text-secondary)]">{supplier.products}</p>
                          </div>
                          <span className="shrink-0 text-sm font-semibold">
                            {supplier.rating} <span className="text-[var(--color-warning)]">★</span>
                          </span>
                        </div>
                        <div className="mt-3 grid grid-cols-2 gap-x-3 gap-y-1.5 text-xs text-[var(--color-text-secondary)]">
                          <span>Delivery: <span className="font-medium text-[var(--color-text-primary)]">{supplier.performance}</span></span>
                          <span>Avg cost: <span className="font-medium text-[var(--color-text-primary)]">{supplier.avgCost}</span></span>
                          <span>Last delivery: {supplier.lastDelivery}</span>
                          <span>Outstanding orders: {supplier.outstanding}</span>
                        </div>
                        <div className="mt-3 flex gap-2">
                          <button type="button" className="rounded-md border border-[var(--color-border)] bg-white px-3 py-1.5 text-xs font-medium text-[var(--color-text-secondary)] transition-all duration-200 hover:border-[var(--color-border-strong)] hover:text-[var(--color-text-primary)]">
                            Call
                          </button>
                          <button type="button" className="rounded-md border border-[var(--color-border)] bg-white px-3 py-1.5 text-xs font-medium text-[var(--color-text-secondary)] transition-all duration-200 hover:border-[var(--color-border-strong)] hover:text-[var(--color-text-primary)]">
                            Email
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="rounded-2xl border border-[var(--color-border)] bg-white p-5 sm:p-6">
                  <h2 className="text-lg font-bold tracking-[-0.03em]">Warehouse Management</h2>
                  <div className="mt-4 space-y-3">
                    {WAREHOUSES.map((warehouse) => (
                      <div key={warehouse.name} className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
                        <div className="flex items-start justify-between gap-3">
                          <p className="text-sm font-semibold">{warehouse.name}</p>
                          <span className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold ${warehouse.health === "Optimal" ? "bg-[var(--color-accent-light)] text-[var(--color-accent)]" : "bg-[var(--color-warning-light)] text-[var(--color-warning)]"}`}>
                            {warehouse.health}
                          </span>
                        </div>
                        <div className="mt-3">
                          <div className="flex items-center justify-between text-[11px] text-[var(--color-text-muted)]">
                            <span>Capacity used</span>
                            <span>{warehouse.capacity}%</span>
                          </div>
                          <div className="mt-1.5 h-2 rounded-full bg-neutral-100">
                            <div
                              className={`h-full rounded-full ${warehouse.capacity > 80 ? "bg-[var(--color-warning)]" : "bg-[var(--color-accent)]"}`}
                              style={{ width: `${warehouse.capacity}%` }}
                            />
                          </div>
                        </div>
                        <div className="mt-3 grid grid-cols-2 gap-x-3 gap-y-1.5 text-xs text-[var(--color-text-secondary)]">
                          <span>Stored: <span className="font-medium text-[var(--color-text-primary)]">{warehouse.stored}</span></span>
                          <span>Value: <span className="font-medium text-[var(--color-text-primary)]">{warehouse.value}</span></span>
                          <span>Temp: {warehouse.temperature}</span>
                          <span>Humidity: {warehouse.humidity}</span>
                          <span className="col-span-2">Manager: {warehouse.manager}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                  <p className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs leading-5 text-[var(--color-text-secondary)]">
                    Warehouse 2 humidity is at 71% — above the 65% threshold. Move moisture-sensitive feed to Warehouse 1.
                  </p>
                </div>
              </section>

              {/* Notifications + reports */}
              <section className="grid gap-6 xl:grid-cols-2">
                <div className="rounded-2xl border border-[var(--color-border)] bg-white p-5 sm:p-6">
                  <div className="flex items-center justify-between">
                    <h2 className="text-lg font-bold tracking-[-0.03em]">Notifications</h2>
                    <span className="rounded-full bg-[var(--color-danger-light)] px-3 py-1 text-xs font-semibold text-[var(--color-danger)]">2 critical</span>
                  </div>
                  <div className="mt-5 space-y-4">
                    {NOTIFICATIONS.map((item) => (
                      <div key={item.text} className="flex gap-3">
                        <span className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${notificationDot(item.tone)}`} />
                        <div className="min-w-0">
                          <p className="text-sm font-medium leading-5">{item.text}</p>
                          <p className="mt-0.5 font-mono text-[11px] text-[var(--color-text-muted)]">{item.time}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="rounded-2xl border border-[var(--color-border)] bg-white p-5 sm:p-6">
                  <h2 className="text-lg font-bold tracking-[-0.03em]">Reports & Exports</h2>
                  <p className="mt-1 text-sm text-[var(--color-text-secondary)]">Generate inventory documents for stakeholders and audits.</p>
                  <div className="mt-4 flex flex-wrap gap-2">
                    {REPORT_OPTIONS.map((option) => (
                      <button
                        key={option}
                        type="button"
                        className="rounded-md border border-[var(--color-border)] bg-white px-3 py-2 text-xs font-medium text-[var(--color-text-secondary)] transition-all duration-200 hover:-translate-y-px hover:border-[var(--color-border-strong)] hover:text-[var(--color-text-primary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent)] focus-visible:ring-offset-2"
                      >
                        {option}
                      </button>
                    ))}
                  </div>
                </div>
              </section>
            </div>

            {/* Right sidebar */}
            <aside className="min-w-0 space-y-5">
              <div className="rounded-2xl border border-[var(--color-accent-border)] bg-[var(--color-accent-light)] p-5">
                <h3 className="text-sm font-bold">Inventory Health</h3>
                <div className="mt-3 flex items-center gap-4">
                  <p className="text-4xl font-bold tracking-[-0.04em] text-[var(--color-accent)]">96</p>
                  <p className="text-xs leading-5 text-[var(--color-text-secondary)]">18 days of coverage · valuation up ₦520k this month.</p>
                </div>
              </div>

              <div className="rounded-2xl border border-[var(--color-border)] bg-white p-5">
                <h3 className="text-sm font-bold">Upcoming Deliveries</h3>
                <div className="mt-4 space-y-3">
                  {PURCHASE_ORDERS.filter((order) => order.status === "Approved" || order.status === "Pending").map((order) => (
                    <div key={order.po} className="rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2.5 text-sm">
                      <div className="flex items-center justify-between gap-3">
                        <span className="font-medium">{order.supplier}</span>
                        <span className="font-mono text-[11px] text-[var(--color-text-muted)]">{order.delivery}</span>
                      </div>
                      <p className="mt-0.5 text-xs text-[var(--color-text-secondary)]">{order.items} · {order.quantity}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-2xl border border-[var(--color-border)] bg-white p-5">
                <h3 className="text-sm font-bold">Low Stock Alerts</h3>
                <div className="mt-4 space-y-2.5 text-sm">
                  {LOW_STOCK.map((item) => (
                    <div key={item.name} className="flex items-start justify-between gap-3">
                      <span className="leading-5">{item.name}</span>
                      <span className={`shrink-0 font-mono text-[11px] ${item.days === "Out" ? "text-[var(--color-danger)]" : "text-[var(--color-warning)]"}`}>{item.days}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-2xl border border-[var(--color-border)] bg-white p-5">
                <h3 className="text-sm font-bold">Expiry Alerts</h3>
                <div className="mt-4 space-y-2.5 text-sm">
                  {EXPIRY_ITEMS.filter((item) => item.days <= 90).map((item) => (
                    <div key={item.name} className="flex items-start justify-between gap-3">
                      <span className="leading-5">{item.name}</span>
                      <span className="shrink-0 font-mono text-[11px] text-[var(--color-text-muted)]">{item.days}d</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-2xl border border-[var(--color-border)] bg-white p-5">
                <h3 className="text-sm font-bold">Recent Purchases</h3>
                <div className="mt-4 space-y-2.5 text-sm">
                  {PURCHASE_ORDERS.filter((order) => order.status === "Delivered").map((order) => (
                    <div key={order.po} className="flex items-start justify-between gap-3">
                      <span className="leading-5">{order.items}</span>
                      <span className="shrink-0 font-medium">{order.cost}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-2xl border border-[var(--color-border)] bg-white p-5">
                <h3 className="text-sm font-bold">Quick Statistics</h3>
                <div className="mt-4 grid gap-2.5 text-sm">
                  {[
                    ["Feed items", "6"],
                    ["Warehouses", "2"],
                    ["Suppliers", "3"],
                    ["Open POs", "2"],
                    ["Stock turns / yr", "9.2"],
                  ].map(([label, value]) => (
                    <div key={label} className="flex justify-between border-b border-neutral-100 pb-2.5 last:border-0 last:pb-0">
                      <span className="text-[var(--color-text-secondary)]">{label}</span>
                      <span className="font-medium">{value}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-2xl border border-[var(--color-border)] bg-white p-5">
                <h3 className="text-sm font-bold">AI Recommendations</h3>
                <div className="mt-4 space-y-3 text-xs leading-5 text-[var(--color-text-secondary)]">
                  {AI_RECOMMENDATIONS.slice(0, 3).map((item) => (
                    <p key={item}>{item}</p>
                  ))}
                </div>
              </div>
            </aside>
          </div>
        </div>
      </div>

      {/* Floating action button — mobile only */}
      <div className="fixed bottom-24 right-6 z-40 flex flex-col items-end gap-2 lg:bottom-6 lg:hidden">
        {fabOpen &&
          FAB_ACTIONS.map((action) => (
            <button
              key={action}
              type="button"
              onClick={() => setFabOpen(false)}
              className="min-h-11 rounded-full border border-[var(--color-border)] bg-white px-4 py-2 text-sm font-medium text-[var(--color-text-primary)] shadow-[0_4px_12px_rgba(0,0,0,0.08),0_16px_40px_rgba(0,0,0,0.08)] transition-all duration-200 hover:-translate-y-px hover:border-[var(--color-accent-border)] hover:text-[var(--color-accent)]"
              style={{ animation: "fadeSlideUp 200ms ease-out both" }}
            >
              + {action}
            </button>
          ))}
        <button
          type="button"
          onClick={() => setFabOpen((value) => !value)}
          aria-expanded={fabOpen}
          aria-label="Quick actions"
          className="flex h-14 w-14 items-center justify-center rounded-full bg-[var(--color-accent)] text-2xl font-light text-white shadow-[0_4px_12px_rgba(0,0,0,0.12),0_16px_40px_rgba(0,0,0,0.12)] transition-all duration-200 hover:-translate-y-px hover:bg-emerald-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent)] focus-visible:ring-offset-2"
        >
          <span className={`transition-transform duration-200 ${fabOpen ? "rotate-45" : ""}`}>+</span>
        </button>
      </div>

      {selectedItem && <InventoryDrawer item={selectedItem} onClose={() => setSelectedItem(null)} />}

      <AppMobileNav activeKey="inventory" />
    </main>
  );
}
