export interface GroceryItem {
  id: string;
  name: string;
  category: string; // e.g. 'Produce', 'Bakery', 'Dairy & Eggs', 'Meat & Seafood', 'Pantry', 'Snacks', 'Frozen', 'Beverages', 'Household', 'Personal Care'
  defaultQty: number;
  defaultUnit: string; // e.g. 'pcs', 'lbs', 'gal', 'bag', 'carton', 'pack', 'oz', 'kg', 'can'
  notes?: string;
  storeId?: string; // Set when the item is only sold at one store; unset means available anywhere.
  isFavorite: boolean;
  inWeeklyList: boolean;
  weeklyQty: number;
  weeklyUnit: string;
  isBought: boolean;
  boughtAt?: number;
  timesBought: number;
  lastBoughtAt?: number;
  addedBy?: string;
}

/** Region of the shop a category sits in. Drives the wayfinding colour. */
export type Zone = 'fresh' | 'bake' | 'butcher' | 'cold' | 'dry';

export interface AisleCategory {
  id: string;
  name: string;
  defaultAisle: string;
  iconName: string;
  zone: Zone;
}

export interface StoreLayout {
  id: string;
  name: string;
  description: string;
  aisleOrder: string[]; // Order of category IDs/names for this store
  customAisleLabels?: Record<string, string>; // Maps Category ID/Name to custom aisle label e.g., 'Produce' -> 'Aisle 1 - Produce'
}

export interface ActivityLog {
  id: string;
  userName: string;
  action: 'add_weekly' | 'remove_weekly' | 'create_item' | 'mark_bought' | 'mark_unbought' | 'update_qty' | 'clear_bought' | 'store_change' | 'reorder_aisles' | 'edit_item' | 'delete_item' | 'edit_store' | 'delete_store';
  itemTitle?: string;
  details?: string;
  timestamp: number;
}

export interface FamilyMember {
  id: string;
  name: string;
  lastActive: number;
}

export interface HouseholdState {
  roomCode: string;
  items: GroceryItem[];
  stores: StoreLayout[];
  activeStoreId: string;
  activity: ActivityLog[];
  activeUsers?: FamilyMember[];
}

export type WSClientMessage =
  | { type: 'JOIN_ROOM'; roomCode: string; userName: string; userId: string }
  | { type: 'TOGGLE_WEEKLY'; roomCode: string; itemId: string; inWeeklyList: boolean; userName: string }
  | { type: 'UPDATE_QTY'; roomCode: string; itemId: string; weeklyQty: number; weeklyUnit?: string; userName: string }
  | { type: 'MARK_BOUGHT'; roomCode: string; itemId: string; isBought: boolean; userName: string }
  | { type: 'ADD_ITEM'; roomCode: string; item: Omit<GroceryItem, 'id' | 'timesBought'>; userName: string }
  | { type: 'EDIT_ITEM'; roomCode: string; item: GroceryItem; userName: string }
  | { type: 'DELETE_ITEM'; roomCode: string; itemId: string; userName: string }
  | { type: 'SELECT_ALL_FAVORITES'; roomCode: string; userName: string }
  | { type: 'CLEAR_BOUGHT'; roomCode: string; userName: string }
  | { type: 'RESET_WEEKLY_LIST'; roomCode: string; userName: string }
  | { type: 'CHANGE_STORE'; roomCode: string; storeId: string; userName: string }
  | { type: 'UPDATE_STORE_LAYOUT'; roomCode: string; store: StoreLayout; userName: string }
  | { type: 'CREATE_STORE'; roomCode: string; store: StoreLayout; userName: string }
  | { type: 'DELETE_STORE'; roomCode: string; storeId: string; userName: string }
  | { type: 'PING' };

export type WSServerMessage =
  | { type: 'INIT_STATE'; payload: HouseholdState }
  | { type: 'STATE_UPDATED'; payload: HouseholdState; activity?: ActivityLog }
  | { type: 'USER_PRESENCE'; users: FamilyMember[] }
  | { type: 'PONG' };
