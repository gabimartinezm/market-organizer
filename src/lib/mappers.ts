import { ActivityLog, AisleCategory, GroceryItem, StoreLayout, Zone } from '../types';

/**
 * Postgres uses snake_case columns and timestamptz; the app's types use camelCase
 * and epoch milliseconds. These mappers are the only place that boundary is crossed,
 * so `src/types.ts` and every view component stay unchanged.
 */

export interface ItemRow {
  id: string;
  room_code: string;
  name: string;
  category: string;
  default_qty: number;
  default_unit: string;
  notes: string | null;
  store_id: string | null;
  is_favorite: boolean;
  in_weekly_list: boolean;
  weekly_qty: number;
  weekly_unit: string;
  is_bought: boolean;
  bought_at: string | null;
  times_bought: number;
  last_bought_at: string | null;
  added_by: string | null;
}

export interface StoreRow {
  id: string;
  room_code: string;
  name: string;
  description: string;
  aisle_order: string[];
  custom_aisle_labels: Record<string, string> | null;
}

export interface CategoryRow {
  id: string;
  room_code: string;
  name: string;
  default_aisle: string;
  icon_name: string;
  zone: string;
}

export interface ActivityRow {
  id: string;
  room_code: string;
  user_name: string;
  action: string;
  item_title: string | null;
  details: string | null;
  created_at: string;
}

const toMillis = (ts: string | null): number | undefined => (ts ? new Date(ts).getTime() : undefined);
const toIso = (ms: number | undefined): string | null => (ms ? new Date(ms).toISOString() : null);

export function itemFromRow(row: ItemRow): GroceryItem {
  return {
    id: row.id,
    name: row.name,
    category: row.category,
    defaultQty: Number(row.default_qty),
    defaultUnit: row.default_unit,
    notes: row.notes ?? undefined,
    storeId: row.store_id ?? undefined,
    isFavorite: row.is_favorite,
    inWeeklyList: row.in_weekly_list,
    weeklyQty: Number(row.weekly_qty),
    weeklyUnit: row.weekly_unit,
    isBought: row.is_bought,
    boughtAt: toMillis(row.bought_at),
    timesBought: row.times_bought,
    lastBoughtAt: toMillis(row.last_bought_at),
    addedBy: row.added_by ?? undefined,
  };
}

export function itemToRow(item: Omit<GroceryItem, 'id'>, roomCode: string): Omit<ItemRow, 'id'> {
  return {
    room_code: roomCode,
    name: item.name,
    category: item.category,
    default_qty: item.defaultQty,
    default_unit: item.defaultUnit,
    notes: item.notes ?? null,
    store_id: item.storeId ?? null,
    is_favorite: item.isFavorite,
    in_weekly_list: item.inWeeklyList,
    weekly_qty: item.weeklyQty,
    weekly_unit: item.weeklyUnit,
    is_bought: item.isBought,
    bought_at: toIso(item.boughtAt),
    times_bought: item.timesBought,
    last_bought_at: toIso(item.lastBoughtAt),
    added_by: item.addedBy ?? null,
  };
}

export function storeFromRow(row: StoreRow): StoreLayout {
  return {
    id: row.id,
    name: row.name,
    description: row.description,
    aisleOrder: row.aisle_order ?? [],
    customAisleLabels: row.custom_aisle_labels ?? undefined,
  };
}

export function storeToRow(store: Omit<StoreLayout, 'id'>, roomCode: string): Omit<StoreRow, 'id'> {
  return {
    room_code: roomCode,
    name: store.name,
    description: store.description,
    aisle_order: store.aisleOrder,
    custom_aisle_labels: store.customAisleLabels ?? {},
  };
}

export function categoryFromRow(row: CategoryRow): AisleCategory {
  return {
    id: row.id,
    name: row.name,
    defaultAisle: row.default_aisle,
    iconName: row.icon_name,
    zone: row.zone as Zone,
  };
}

export function categoryToRow(category: AisleCategory, roomCode: string): CategoryRow {
  return {
    id: category.id,
    room_code: roomCode,
    name: category.name,
    default_aisle: category.defaultAisle,
    icon_name: category.iconName,
    zone: category.zone,
  };
}

export function activityFromRow(row: ActivityRow): ActivityLog {
  return {
    id: row.id,
    userName: row.user_name,
    action: row.action as ActivityLog['action'],
    itemTitle: row.item_title ?? undefined,
    details: row.details ?? undefined,
    timestamp: new Date(row.created_at).getTime(),
  };
}
