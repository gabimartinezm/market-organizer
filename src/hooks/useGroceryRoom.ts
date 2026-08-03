import { useCallback, useEffect, useRef, useState } from 'react';
import type { RealtimeChannel } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import {
  ActivityRow,
  ItemRow,
  StoreRow,
  activityFromRow,
  itemFromRow,
  itemToRow,
  storeFromRow,
  storeToRow,
} from '../lib/mappers';
import { ActivityLog, FamilyMember, GroceryItem, HouseholdState, StoreLayout } from '../types';
import { INITIAL_ITEMS, INITIAL_STORES } from '../data/initialData';

const DEFAULT_ROOM = 'FAMILY-LIST';
const ACTIVITY_LIMIT = 50;

/**
 * Room codes are interpolated into Realtime filters (`room_code=eq.<CODE>`), where
 * characters like `.` and `,` are separators — an unsanitized code would silently
 * stop delivering live updates. Restrict codes to a charset that is safe there.
 */
function normalizeRoomCode(raw: string): string {
  const cleaned = raw
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  return cleaned || DEFAULT_ROOM;
}

/** Generate or retrieve stored family member identity */
export function getStoredUser(): { userId: string; userName: string } {
  try {
    let userId = localStorage.getItem('family_user_id');
    let userName = localStorage.getItem('family_user_name');
    if (!userId) {
      userId = `user-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
      localStorage.setItem('family_user_id', userId);
    }
    if (!userName) {
      const defaultNames = ['Mom', 'Dad', 'Gabi', 'Alex', 'Jordan', 'Sam'];
      userName = defaultNames[Math.floor(Math.random() * defaultNames.length)];
      localStorage.setItem('family_user_name', userName);
    }
    return { userId, userName };
  } catch {
    return { userId: 'user-fallback', userName: 'Family Member' };
  }
}

/**
 * Creates the room and seeds it with the starter catalog the first time a code is used.
 * The `ignoreDuplicates` upsert only returns rows it actually inserted, so when two
 * family members open a brand-new room at the same moment exactly one of them seeds it.
 */
async function ensureRoomExists(roomCode: string): Promise<void> {
  const { data: created, error } = await supabase
    .from('rooms')
    .upsert({ code: roomCode }, { onConflict: 'code', ignoreDuplicates: true })
    .select('code');

  if (error) throw error;
  if (!created || created.length === 0) return; // Room already existed.

  // Seeded rows get explicit, staggered timestamps so the catalog and store list
  // come back in the same order they appear in initialData.ts.
  const now = Date.now();

  const storeRows = INITIAL_STORES.map((store, i) => ({
    id: crypto.randomUUID(),
    ...storeToRow(store, roomCode),
    created_at: new Date(now + i * 1000).toISOString(),
  }));

  const itemRows = INITIAL_ITEMS.map((item, i) => ({
    ...itemToRow(item, roomCode),
    created_at: new Date(now - i * 1000).toISOString(),
  }));

  const [storeResult, itemResult] = await Promise.all([
    supabase.from('stores').insert(storeRows),
    supabase.from('items').insert(itemRows),
  ]);
  if (storeResult.error) throw storeResult.error;
  if (itemResult.error) throw itemResult.error;

  await Promise.all([
    supabase.from('rooms').update({ active_store_id: storeRows[0].id }).eq('code', roomCode),
    supabase.from('activity').insert({
      room_code: roomCode,
      user_name: 'System',
      action: 'create_item',
      item_title: `Family List created for ${roomCode}`,
      details: 'Starter catalog and store layouts loaded',
    }),
  ]);
}

async function fetchRoomState(roomCode: string): Promise<HouseholdState> {
  const [room, stores, items, activity] = await Promise.all([
    supabase.from('rooms').select('code, active_store_id').eq('code', roomCode).single(),
    supabase
      .from('stores')
      .select('*')
      .eq('room_code', roomCode)
      .order('created_at', { ascending: true })
      .order('name', { ascending: true }),
    supabase
      .from('items')
      .select('*')
      .eq('room_code', roomCode)
      .order('created_at', { ascending: false })
      .order('name', { ascending: true }),
    supabase
      .from('activity')
      .select('*')
      .eq('room_code', roomCode)
      .order('created_at', { ascending: false })
      .limit(ACTIVITY_LIMIT),
  ]);

  const storeList = (stores.data ?? []).map((row) => storeFromRow(row as StoreRow));

  return {
    roomCode,
    items: (items.data ?? []).map((row) => itemFromRow(row as ItemRow)),
    stores: storeList,
    activeStoreId: room.data?.active_store_id ?? storeList[0]?.id ?? '',
    activity: (activity.data ?? []).map((row) => activityFromRow(row as ActivityRow)),
    activeUsers: [],
  };
}

export function useGroceryRoom(initialRoomCode: string) {
  const [roomCode, setRoomCode] = useState<string>(() => {
    const paramRoom = new URLSearchParams(window.location.search).get('room');
    return normalizeRoomCode(paramRoom || initialRoomCode || DEFAULT_ROOM);
  });

  const [userInfo, setUserInfo] = useState<{ userId: string; userName: string }>(getStoredUser);
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [lastActivityToast, setLastActivityToast] = useState<{ message: string; timestamp: number } | null>(null);

  const [householdState, setHouseholdState] = useState<HouseholdState>({
    roomCode,
    items: [],
    stores: [],
    activeStoreId: '',
    activity: [],
    activeUsers: [],
  });

  const channelRef = useRef<RealtimeChannel | null>(null);

  const updateUserName = useCallback((newName: string) => {
    const trimmed = newName.trim() || 'Family Member';
    localStorage.setItem('family_user_name', trimmed);
    setUserInfo((prev) => ({ ...prev, userName: trimmed }));
  }, []);

  const changeRoom = useCallback((newRoomCode: string) => {
    const norm = normalizeRoomCode(newRoomCode);
    setRoomCode(norm);
    const url = new URL(window.location.href);
    url.searchParams.set('room', norm);
    window.history.replaceState({}, '', url.toString());
  }, []);

  // Load the room, then keep it live via Postgres change events + presence.
  useEffect(() => {
    let isCancelled = false;
    const roomFilter = `room_code=eq.${roomCode}`;

    (async () => {
      try {
        await ensureRoomExists(roomCode);
        const state = await fetchRoomState(roomCode);
        if (!isCancelled) setHouseholdState(state);
      } catch (err) {
        console.error('[Supabase] Failed to load room:', err);
        return;
      }
      if (isCancelled) return;

      const channel = supabase
        .channel(`room:${roomCode}`, { config: { presence: { key: userInfo.userId } } })
        .on<ItemRow>(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'items', filter: roomFilter },
          (payload) => {
            setHouseholdState((prev) => {
              if (payload.eventType === 'DELETE') {
                return { ...prev, items: prev.items.filter((i) => i.id !== (payload.old as ItemRow).id) };
              }
              const item = itemFromRow(payload.new as ItemRow);
              const exists = prev.items.some((i) => i.id === item.id);
              return {
                ...prev,
                items: exists ? prev.items.map((i) => (i.id === item.id ? item : i)) : [item, ...prev.items],
              };
            });
          }
        )
        .on<StoreRow>(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'stores', filter: roomFilter },
          (payload) => {
            setHouseholdState((prev) => {
              if (payload.eventType === 'DELETE') {
                return { ...prev, stores: prev.stores.filter((s) => s.id !== (payload.old as StoreRow).id) };
              }
              const store = storeFromRow(payload.new as StoreRow);
              const exists = prev.stores.some((s) => s.id === store.id);
              return {
                ...prev,
                stores: exists ? prev.stores.map((s) => (s.id === store.id ? store : s)) : [...prev.stores, store],
              };
            });
          }
        )
        .on<{ code: string; active_store_id: string | null }>(
          'postgres_changes',
          { event: 'UPDATE', schema: 'public', table: 'rooms', filter: `code=eq.${roomCode}` },
          (payload) => {
            setHouseholdState((prev) => ({
              ...prev,
              activeStoreId: payload.new.active_store_id ?? prev.activeStoreId,
            }));
          }
        )
        .on<ActivityRow>(
          'postgres_changes',
          { event: 'INSERT', schema: 'public', table: 'activity', filter: roomFilter },
          (payload) => {
            const log = activityFromRow(payload.new as ActivityRow);
            setHouseholdState((prev) => ({
              ...prev,
              activity: [log, ...prev.activity.filter((a) => a.id !== log.id)].slice(0, ACTIVITY_LIMIT),
            }));
            setLastActivityToast({
              // Skip the empty parts so actions without an item don't render as "Gabi:  - ".
              message: [log.userName, log.itemTitle, log.details].filter(Boolean).join(' · '),
              timestamp: Date.now(),
            });
          }
        )
        .on('presence', { event: 'sync' }, () => {
          const presences = Object.values(channel.presenceState<{ userId: string; userName: string }>()).flat();
          const members = new Map<string, FamilyMember>();
          presences.forEach((p) => {
            members.set(p.userId, {
              id: p.userId,
              name: p.userName,
              lastActive: Date.now(),
            });
          });
          setHouseholdState((prev) => ({ ...prev, activeUsers: Array.from(members.values()) }));
        });

      channelRef.current = channel;

      channel.subscribe((status) => {
        if (isCancelled) return;
        setIsConnected(status === 'SUBSCRIBED');
        if (status === 'SUBSCRIBED') {
          channel.track({ userId: userInfo.userId, userName: userInfo.userName });
        }
      });
    })();

    return () => {
      isCancelled = true;
      setIsConnected(false);
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, [roomCode, userInfo.userId, userInfo.userName]);

  // --- Write helpers -------------------------------------------------------

  const logActivity = useCallback(
    (action: ActivityLog['action'], itemTitle?: string, details?: string) => {
      void supabase
        .from('activity')
        .insert({ room_code: roomCode, user_name: userInfo.userName, action, item_title: itemTitle, details })
        .then(({ error }) => {
          if (error) console.error('[Supabase] Failed to log activity:', error);
        });
    },
    [roomCode, userInfo.userName]
  );

  const patchItem = useCallback(
    async (itemId: string, patch: Partial<ItemRow>) => {
      const { error } = await supabase.from('items').update(patch).eq('id', itemId);
      if (error) console.error('[Supabase] Failed to update item:', error);
      return !error;
    },
    []
  );

  /** Optimistically apply a change locally; realtime confirms it moments later. */
  const patchLocalItem = useCallback((itemId: string, patch: Partial<GroceryItem>) => {
    setHouseholdState((prev) => ({
      ...prev,
      items: prev.items.map((i) => (i.id === itemId ? { ...i, ...patch } : i)),
    }));
  }, []);

  const findItem = useCallback(
    (itemId: string) => householdState.items.find((i) => i.id === itemId),
    [householdState.items]
  );

  // --- Actions -------------------------------------------------------------

  const toggleWeekly = useCallback(
    async (itemId: string, inWeeklyList: boolean) => {
      const item = findItem(itemId);
      if (!item) return;

      const weeklyQty = inWeeklyList && item.weeklyQty <= 0 ? item.defaultQty || 1 : item.weeklyQty;
      patchLocalItem(itemId, { inWeeklyList, isBought: inWeeklyList ? false : item.isBought, weeklyQty });

      const ok = await patchItem(itemId, {
        in_weekly_list: inWeeklyList,
        ...(inWeeklyList ? { is_bought: false, weekly_qty: weeklyQty } : {}),
      });
      if (!ok) return;

      logActivity(
        inWeeklyList ? 'add_weekly' : 'remove_weekly',
        item.name,
        inWeeklyList ? `Added ${weeklyQty} ${item.weeklyUnit} to list` : 'Removed from this week list'
      );
    },
    [findItem, patchLocalItem, patchItem, logActivity]
  );

  const updateQuantity = useCallback(
    async (itemId: string, weeklyQty: number, weeklyUnit?: string) => {
      const item = findItem(itemId);
      if (!item) return;

      const qty = Math.max(1, weeklyQty);
      const unit = weeklyUnit || item.weeklyUnit;
      patchLocalItem(itemId, { weeklyQty: qty, weeklyUnit: unit });

      const ok = await patchItem(itemId, { weekly_qty: qty, weekly_unit: unit });
      if (ok) logActivity('update_qty', item.name, `Quantity set to ${qty} ${unit}`);
    },
    [findItem, patchLocalItem, patchItem, logActivity]
  );

  const markBought = useCallback(
    async (itemId: string, isBought: boolean) => {
      const item = findItem(itemId);
      if (!item) return;

      const now = Date.now();
      patchLocalItem(itemId, { isBought, boughtAt: isBought ? now : undefined });

      const ok = await patchItem(
        itemId,
        isBought
          ? {
              is_bought: true,
              bought_at: new Date(now).toISOString(),
              times_bought: (item.timesBought || 0) + 1,
              last_bought_at: new Date(now).toISOString(),
            }
          : { is_bought: false, bought_at: null }
      );
      if (!ok) return;

      logActivity(
        isBought ? 'mark_bought' : 'mark_unbought',
        item.name,
        isBought ? 'In the cart' : 'Back on the shelf'
      );
    },
    [findItem, patchLocalItem, patchItem, logActivity]
  );

  const addItem = useCallback(
    async (item: Omit<GroceryItem, 'id' | 'timesBought'>) => {
      const row = {
        ...itemToRow({ ...item, timesBought: item.inWeeklyList ? 1 : 0, addedBy: userInfo.userName }, roomCode),
      };
      const { error } = await supabase.from('items').insert(row);
      if (error) {
        console.error('[Supabase] Failed to add item:', error);
        return;
      }
      logActivity(
        'create_item',
        item.name,
        item.inWeeklyList
          ? `Added new item directly to weekly list (${item.weeklyQty} ${item.weeklyUnit})`
          : 'Saved to master catalog'
      );
    },
    [roomCode, userInfo.userName, logActivity]
  );

  const editItem = useCallback(
    async (item: GroceryItem) => {
      const { id, ...rest } = item;
      const { error } = await supabase.from('items').update(itemToRow(rest, roomCode)).eq('id', id);
      if (error) {
        console.error('[Supabase] Failed to edit item:', error);
        return;
      }
      logActivity('edit_item', item.name, 'Updated details in catalog');
    },
    [roomCode, logActivity]
  );

  const deleteItem = useCallback(
    async (itemId: string) => {
      const item = findItem(itemId);
      const { error } = await supabase.from('items').delete().eq('id', itemId);
      if (error) {
        console.error('[Supabase] Failed to delete item:', error);
        return;
      }
      logActivity('delete_item', item?.name, 'Removed from catalog');
    },
    [findItem, logActivity]
  );

  const addAllFavorites = useCallback(async () => {
    // weekly_qty has to be copied from each item's own default_qty, which a single
    // filtered UPDATE can't express, so the changed rows are upserted in one batch.
    const toAdd = householdState.items.filter((i) => i.isFavorite && !i.inWeeklyList);
    if (toAdd.length === 0) return;

    const { error } = await supabase.from('items').upsert(
      toAdd.map((i) => ({
        id: i.id,
        ...itemToRow(
          { ...i, inWeeklyList: true, isBought: false, weeklyQty: i.defaultQty || 1, boughtAt: undefined },
          roomCode
        ),
      }))
    );
    if (error) {
      console.error('[Supabase] Failed to add favorites:', error);
      return;
    }
    logActivity('add_weekly', 'All Favorites', `Added ${toAdd.length} favorite items to this week's list`);
  }, [householdState.items, roomCode, logActivity]);

  const clearBought = useCallback(async () => {
    const count = householdState.items.filter((i) => i.inWeeklyList && i.isBought).length;
    if (count === 0) return;

    const { error } = await supabase
      .from('items')
      .update({ in_weekly_list: false, is_bought: false })
      .eq('room_code', roomCode)
      .eq('in_weekly_list', true)
      .eq('is_bought', true);
    if (error) {
      console.error('[Supabase] Failed to clear bought items:', error);
      return;
    }
    logActivity('clear_bought', 'Completed Items', `Cleared ${count} purchased items from active list`);
  }, [householdState.items, roomCode, logActivity]);

  const resetWeeklyList = useCallback(async () => {
    const { error } = await supabase
      .from('items')
      .update({ in_weekly_list: false, is_bought: false })
      .eq('room_code', roomCode)
      .or('in_weekly_list.eq.true,is_bought.eq.true');
    if (error) {
      console.error('[Supabase] Failed to reset weekly list:', error);
      return;
    }
    logActivity('clear_bought', 'Weekly List Reset', 'Reset all items for new grocery run');
  }, [roomCode, logActivity]);

  const changeActiveStore = useCallback(
    async (storeId: string) => {
      const store = householdState.stores.find((s) => s.id === storeId);
      if (!store) return;

      setHouseholdState((prev) => ({ ...prev, activeStoreId: storeId }));
      const { error } = await supabase.from('rooms').update({ active_store_id: storeId }).eq('code', roomCode);
      if (error) {
        console.error('[Supabase] Failed to change store:', error);
        return;
      }
      logActivity('store_change', store.name, `Active shopping store changed to ${store.name}`);
    },
    [householdState.stores, roomCode, logActivity]
  );

  const updateStoreLayout = useCallback(
    async (store: StoreLayout) => {
      const { id, ...rest } = store;
      const { error } = await supabase.from('stores').update(storeToRow(rest, roomCode)).eq('id', id);
      if (error) {
        console.error('[Supabase] Failed to update store layout:', error);
        return;
      }
      logActivity('reorder_aisles', store.name, 'Updated store aisle sequence');
    },
    [roomCode, logActivity]
  );

  const createStoreLayout = useCallback(
    async (store: StoreLayout) => {
      const id = crypto.randomUUID();
      const { error } = await supabase.from('stores').insert({ id, ...storeToRow(store, roomCode) });
      if (error) {
        console.error('[Supabase] Failed to create store:', error);
        return;
      }
      await supabase.from('rooms').update({ active_store_id: id }).eq('code', roomCode);
      setHouseholdState((prev) => ({ ...prev, activeStoreId: id }));
      logActivity('store_change', store.name, 'Created new custom store layout');
    },
    [roomCode, logActivity]
  );

  return {
    roomCode,
    changeRoom,
    userInfo,
    updateUserName,
    isConnected,
    householdState,
    lastActivityToast,
    // Actions
    toggleWeekly,
    updateQuantity,
    markBought,
    addItem,
    editItem,
    deleteItem,
    addAllFavorites,
    clearBought,
    resetWeeklyList,
    changeActiveStore,
    updateStoreLayout,
    createStoreLayout,
  };
}
