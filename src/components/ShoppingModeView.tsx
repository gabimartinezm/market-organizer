import React, { useState, useMemo } from 'react';
import { GroceryItem, StoreLayout } from '../types';
import { groupAndSortItemsByStoreAisle, isItemAvailableAtStore } from '../utils/categoryHelpers';
import { zoneStyle } from '../utils/zones';
import { AisleRail } from './AisleRail';
import { ChevronRight, ChevronLeft, Check } from 'lucide-react';

interface ShoppingModeViewProps {
  items: GroceryItem[];
  stores: StoreLayout[];
  activeStoreId: string;
  onChangeActiveStore: (storeId: string) => void;
  onMarkBought: (itemId: string, isBought: boolean) => void;
  onClearBought: () => void;
  onGoToWeeklyList: () => void;
}

/** A pick target sized for one thumb in a busy aisle. */
const PickRow: React.FC<{
  item: GroceryItem;
  large?: boolean;
  onMarkBought: (itemId: string, isBought: boolean) => void;
}> = ({ item, large, onMarkBought }) => (
  <li>
    <button
      onClick={() => onMarkBought(item.id, !item.isBought)}
      aria-pressed={item.isBought}
      className={`w-full flex items-center gap-3.5 px-4 text-left border-b border-edge last:border-b-0 transition-colors ${
        large ? 'py-4' : 'py-3'
      } ${item.isBought ? 'bg-surface-sunk' : 'hover:bg-surface-sunk'}`}
    >
      <span
        aria-hidden="true"
        className={`shrink-0 rounded-edge border flex items-center justify-center ${
          large ? 'w-7 h-7' : 'w-5 h-5'
        } ${item.isBought ? 'bg-ink border-ink text-paper' : 'border-edge-strong'}`}
      >
        {item.isBought && <Check className={large ? 'w-4 h-4 stroke-3' : 'w-3.5 h-3.5 stroke-3'} />}
      </span>

      <span className="min-w-0 flex-1">
        <span
          className={`block font-medium ${large ? 'text-h2' : 'text-body'} ${
            item.isBought ? 'line-through text-ink-3' : 'text-ink'
          }`}
        >
          {item.name}
        </span>
        {item.notes && <span className="block text-sm text-ink-3 truncate">{item.notes}</span>}
      </span>

      <span
        className={`font-mono shrink-0 ${large ? 'text-body' : 'text-data'} ${
          item.isBought ? 'text-ink-3' : 'text-ink-2'
        }`}
      >
        {item.weeklyQty} {item.weeklyUnit}
      </span>
    </button>
  </li>
);

export const ShoppingModeView: React.FC<ShoppingModeViewProps> = ({
  items,
  stores,
  activeStoreId,
  onChangeActiveStore,
  onMarkBought,
  onClearBought,
  onGoToWeeklyList,
}) => {
  const [currentAisleIdx, setCurrentAisleIdx] = useState(0);
  const [viewAllAisles, setViewAllAisles] = useState(false);

  const activeStore = useMemo(
    () => stores.find((s) => s.id === activeStoreId) || stores[0],
    [stores, activeStoreId]
  );

  const weeklyItems = useMemo(
    () => items.filter((i) => i.inWeeklyList && isItemAvailableAtStore(i, activeStoreId)),
    [items, activeStoreId]
  );

  const totalCount = weeklyItems.length;
  const boughtCount = weeklyItems.filter((i) => i.isBought).length;
  const remainingCount = totalCount - boughtCount;

  const groupedAisles = useMemo(
    () => groupAndSortItemsByStoreAisle(weeklyItems, activeStore),
    [weeklyItems, activeStore]
  );

  // The list can shrink under us while shopping, so never index past the end.
  const safeIdx = Math.min(currentAisleIdx, Math.max(0, groupedAisles.length - 1));
  const currentAisle = groupedAisles[safeIdx];
  const isTripComplete = totalCount > 0 && remainingCount === 0;

  const goToAisle = (_aisleId: string, idx: number) => {
    setCurrentAisleIdx(idx);
    setViewAllAisles(false);
  };

  return (
    <div className="space-y-5 max-w-3xl mx-auto">
      <header className="px-4 sm:px-0 space-y-4">
        <div className="flex flex-wrap items-end justify-between gap-x-6 gap-y-3">
          <h1 className="text-h1">
            {totalCount === 0
              ? 'Nothing to shop for.'
              : isTripComplete
                ? 'Trip complete.'
                : <>
                    <span className="font-mono">{remainingCount}</span> to go.
                  </>}
          </h1>

          <div className="flex flex-col gap-1">
            <label htmlFor="store-mode-select" className="eyebrow">
              Walking
            </label>
            <select
              id="store-mode-select"
              value={activeStoreId}
              onChange={(e) => onChangeActiveStore(e.target.value)}
              className="field w-auto font-medium"
            >
              {stores.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {groupedAisles.length > 0 && (
          <div className="space-y-1.5">
            <AisleRail
              aisles={groupedAisles}
              currentAisleId={viewAllAisles ? undefined : currentAisle?.aisleId}
              onSelectAisle={goToAisle}
            />
            <div className="flex items-center justify-between">
              <span className="eyebrow">Entrance</span>
              <span className="eyebrow">
                {boughtCount} of {totalCount} picked up
              </span>
              <span className="eyebrow">Checkout</span>
            </div>
          </div>
        )}
      </header>

      {totalCount === 0 ? (
        <div className="sheet px-6 py-14 text-center">
          <h2 className="sign text-h2">The list is empty</h2>
          <p className="text-sm text-ink-2 mt-2 mb-5 max-w-sm mx-auto">
            Put items on this week's list and they'll appear here in the order you walk the aisles.
          </p>
          <button onClick={onGoToWeeklyList} className="btn btn-action">
            Go to this week's list
          </button>
        </div>
      ) : isTripComplete ? (
        <div className="sheet px-6 py-14 text-center">
          <h2 className="sign text-h2">Everything's in the cart</h2>
          <p className="text-sm text-ink-2 mt-2 mb-5 max-w-sm mx-auto">
            All {totalCount} items picked up at {activeStore?.name}. Clearing them empties this week's
            list and leaves the catalog untouched.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-2">
            <button onClick={onClearBought} className="btn btn-action">
              Clear the list
            </button>
            <button onClick={onGoToWeeklyList} className="btn btn-quiet">
              Back to the list
            </button>
          </div>
        </div>
      ) : (
        <>
          <div className="flex items-center justify-between px-4 sm:px-0">
            <div
              className="flex border border-edge rounded-box overflow-hidden"
              role="group"
              aria-label="How to walk the list"
            >
              <button
                onClick={() => setViewAllAisles(false)}
                aria-pressed={!viewAllAisles}
                className={`btn rounded-none border-0 ${!viewAllAisles ? 'btn-action' : 'btn-bare px-3'}`}
              >
                One aisle at a time
              </button>
              <button
                onClick={() => setViewAllAisles(true)}
                aria-pressed={viewAllAisles}
                className={`btn rounded-none border-0 ${viewAllAisles ? 'btn-action' : 'btn-bare px-3'}`}
              >
                Whole trip
              </button>
            </div>

            {!viewAllAisles && (
              <span className="eyebrow">
                Aisle {safeIdx + 1} of {groupedAisles.length}
              </span>
            )}
          </div>

          {!viewAllAisles && currentAisle ? (
            <div className="space-y-4">
              <div className="sheet overflow-hidden">
                <div className="flex items-center gap-3 px-4 py-3 border-b border-edge">
                  <span
                    className="tick self-stretch min-h-8"
                    style={zoneStyle(currentAisle.zone)}
                    aria-hidden="true"
                  />
                  <div className="min-w-0">
                    {/* Read at arm's length, so it wraps rather than truncates. */}
                    <h2 className="sign text-h1 sm:text-sign text-balance">{currentAisle.aisleLabel}</h2>
                    <p className="text-sm text-ink-3">
                      {currentAisle.items.filter((i) => !i.isBought).length} of{' '}
                      {currentAisle.items.length} still here
                    </p>
                  </div>
                </div>

                <ul>
                  {currentAisle.items.map((item) => (
                    <PickRow key={item.id} item={item} large onMarkBought={onMarkBought} />
                  ))}
                </ul>
              </div>

              {/* Thumb-reachable, and stays put while the aisle scrolls. */}
              <div className="sticky bottom-0 flex items-center justify-between gap-3 bg-paper-veil backdrop-blur-sm py-3 px-4 sm:px-0">
                <button
                  disabled={safeIdx === 0}
                  onClick={() => setCurrentAisleIdx(safeIdx - 1)}
                  className="btn btn-quiet"
                >
                  <ChevronLeft className="w-4 h-4" />
                  Previous
                </button>
                <button
                  disabled={safeIdx >= groupedAisles.length - 1}
                  onClick={() => setCurrentAisleIdx(safeIdx + 1)}
                  className="btn btn-action"
                >
                  Next aisle
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          ) : (
            <div className="sheet overflow-clip">
              {groupedAisles.map((aisle, idx) => (
                <section key={aisle.aisleId}>
                  <h2 className="sticky top-24 z-10 flex items-center gap-3 px-4 py-2.5 bg-surface-veil backdrop-blur-sm border-y border-edge">
                    <span className="font-mono text-label text-ink-3 min-w-4 text-right tabular-nums">
                      {idx + 1}
                    </span>
                    <span
                      className="tick self-stretch min-h-4"
                      style={zoneStyle(aisle.zone)}
                      aria-hidden="true"
                    />
                    <span className="sign text-h2 min-w-0">{aisle.aisleLabel}</span>
                    <span className="font-mono text-label text-ink-3 ms-auto shrink-0">
                      {aisle.items.filter((i) => !i.isBought).length}/{aisle.items.length}
                    </span>
                  </h2>
                  <ul>
                    {aisle.items.map((item) => (
                      <PickRow key={item.id} item={item} onMarkBought={onMarkBought} />
                    ))}
                  </ul>
                </section>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
};
