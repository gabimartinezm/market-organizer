import React, { useState, useMemo } from 'react';
import { GroceryItem, StoreLayout } from '../types';
import { groupAndSortItemsByStoreAisle } from '../utils/categoryHelpers';
import { zoneStyle } from '../utils/zones';
import { CATEGORIES } from '../data/initialData';
import { AisleRail } from './AisleRail';
import { Plus, Minus, Star, Search, ArrowRight, X, Check } from 'lucide-react';

interface WeeklyListViewProps {
  items: GroceryItem[];
  stores: StoreLayout[];
  activeStoreId: string;
  onChangeActiveStore: (storeId: string) => void;
  onToggleWeekly: (itemId: string, inWeeklyList: boolean) => void;
  onUpdateQuantity: (itemId: string, weeklyQty: number, weeklyUnit?: string) => void;
  onMarkBought: (itemId: string, isBought: boolean) => void;
  onAddItem: (item: Omit<GroceryItem, 'id' | 'timesBought'>) => void;
  onEditItem: (item: GroceryItem) => void;
  onDeleteItemGroup: (itemId: string) => void;
  onAddAllFavorites: () => void;
  onClearBought: () => void;
  onResetWeeklyList: () => void;
  onGoToShoppingMode: () => void;
  onGoToCatalog: () => void;
}

const UNITS = ['pcs', 'lbs', 'bunch', 'gal', 'carton', 'box', 'bag', 'pack', 'jar'];

export const WeeklyListView: React.FC<WeeklyListViewProps> = ({
  items,
  stores,
  activeStoreId,
  onChangeActiveStore,
  onToggleWeekly,
  onUpdateQuantity,
  onMarkBought,
  onAddItem,
  onAddAllFavorites,
  onClearBought,
  onGoToShoppingMode,
  onGoToCatalog,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [hideBought, setHideBought] = useState(false);

  const [quickName, setQuickName] = useState('');
  const [quickCategory, setQuickCategory] = useState('Produce');
  const [quickQty, setQuickQty] = useState(1);
  const [quickUnit, setQuickUnit] = useState('pcs');
  const [showQuickAddForm, setShowQuickAddForm] = useState(false);

  const activeStore = useMemo(() => {
    return (
      stores.find((s) => s.id === activeStoreId) ||
      stores[0] || {
        id: 'store-default',
        name: 'Default Store',
        description: '',
        aisleOrder: CATEGORIES.map((c) => c.id),
      }
    );
  }, [stores, activeStoreId]);

  const weeklyItems = useMemo(() => items.filter((item) => item.inWeeklyList), [items]);

  const filteredWeeklyItems = useMemo(() => {
    return weeklyItems.filter((item) => {
      const q = searchQuery.toLowerCase();
      const matchesSearch =
        item.name.toLowerCase().includes(q) || (item.notes && item.notes.toLowerCase().includes(q));
      const matchesCategory = selectedCategory === 'ALL' || item.category === selectedCategory;
      const matchesHideBought = !hideBought || !item.isBought;
      return matchesSearch && matchesCategory && matchesHideBought;
    });
  }, [weeklyItems, searchQuery, selectedCategory, hideBought]);

  const totalCount = weeklyItems.length;
  const boughtCount = weeklyItems.filter((i) => i.isBought).length;
  const remainingCount = totalCount - boughtCount;
  const favoriteCount = items.filter((i) => i.isFavorite).length;
  const isFiltered = searchQuery !== '' || selectedCategory !== 'ALL' || hideBought;

  // The rail always maps the whole trip; the list below it is what's filtered.
  const allAisles = useMemo(
    () => groupAndSortItemsByStoreAisle(weeklyItems, activeStore),
    [weeklyItems, activeStore]
  );
  const groupedAisles = useMemo(
    () => groupAndSortItemsByStoreAisle(filteredWeeklyItems, activeStore),
    [filteredWeeklyItems, activeStore]
  );
  const aislesWithItemsLeft = allAisles.filter((a) => a.items.some((i) => !i.isBought)).length;

  const handleQuickAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickName.trim()) return;

    const existing = items.find((i) => i.name.toLowerCase().trim() === quickName.toLowerCase().trim());

    if (existing) {
      onToggleWeekly(existing.id, true);
      if (quickQty !== existing.weeklyQty) {
        onUpdateQuantity(existing.id, quickQty, quickUnit);
      }
    } else {
      onAddItem({
        name: quickName.trim(),
        category: quickCategory,
        defaultQty: quickQty,
        defaultUnit: quickUnit,
        isFavorite: false,
        inWeeklyList: true,
        weeklyQty: quickQty,
        weeklyUnit: quickUnit,
        isBought: false,
      });
    }

    setQuickName('');
    setShowQuickAddForm(false);
  };

  const scrollToAisle = (aisleId: string) => {
    document.getElementById(`aisle-${aisleId}`)?.scrollIntoView({ block: 'start', behavior: 'smooth' });
  };

  return (
    <div className="space-y-6">
      {/* The trip, stated plainly and then drawn. No stat cards: the rail says
          how much is left, where it is, and in what order you'll reach it. */}
      <header className="px-4 sm:px-0 space-y-4">
        <div className="flex flex-wrap items-end justify-between gap-x-6 gap-y-3">
          <h1 className="text-h1 max-w-md">
            {totalCount === 0
              ? 'Nothing on the list yet.'
              : remainingCount === 0
                ? 'Everything on the list is in the cart.'
                : <>
                    <span className="font-mono">{remainingCount}</span>
                    {remainingCount === 1 ? ' item left' : ' items left'}, across{' '}
                    <span className="font-mono">{aislesWithItemsLeft}</span>
                    {aislesWithItemsLeft === 1 ? ' aisle' : ' aisles'}.
                  </>}
          </h1>

          <div className="flex flex-col gap-1">
            <label htmlFor="trip-store" className="eyebrow">
              Walking
            </label>
            <select
              id="trip-store"
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

        {allAisles.length > 0 && (
          <div className="space-y-1.5">
            <AisleRail aisles={allAisles} onSelectAisle={scrollToAisle} />
            {/* Labelling the ends is what makes the rail a route rather than a chart. */}
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

      {/* Toolbar */}
      <div className="border-y border-edge px-4 sm:px-0 sm:border-x-0">
        <div className="flex flex-wrap items-center gap-2 py-3">
          <button onClick={onGoToShoppingMode} className="btn btn-action" disabled={remainingCount === 0}>
            Start walkthrough
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
          <button onClick={() => setShowQuickAddForm(!showQuickAddForm)} className="btn btn-quiet">
            <Plus className="w-3.5 h-3.5" />
            Add item
          </button>
          <button onClick={onAddAllFavorites} className="btn btn-quiet" disabled={favoriteCount === 0}>
            <Star className="w-3.5 h-3.5" />
            Add {favoriteCount} staples
          </button>
          {boughtCount > 0 && (
            <button onClick={onClearBought} className="btn btn-bare text-sm">
              Clear {boughtCount} picked up
            </button>
          )}

          <div className="flex flex-wrap items-center gap-2 ms-auto">
            <div className="relative">
              <Search
                className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-ink-3"
                aria-hidden="true"
              />
              <input
                type="search"
                placeholder="Search the list"
                aria-label="Search this week's list"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="field ps-8 w-44"
              />
            </div>

            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              aria-label="Filter by aisle"
              className="field w-auto"
            >
              <option value="ALL">All aisles</option>
              {CATEGORIES.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>

            <label className="btn btn-quiet font-normal cursor-pointer">
              <input
                type="checkbox"
                checked={hideBought}
                onChange={(e) => setHideBought(e.target.checked)}
                className="accent-ink"
              />
              Hide picked up
            </label>
          </div>
        </div>

        {showQuickAddForm && (
          <form onSubmit={handleQuickAddSubmit} className="pb-4 flex flex-wrap items-end gap-2">
            <div className="flex flex-col gap-1 flex-1 min-w-48">
              <label htmlFor="qa-name" className="eyebrow">
                Item
              </label>
              <input
                id="qa-name"
                type="text"
                placeholder="Avocado"
                value={quickName}
                onChange={(e) => setQuickName(e.target.value)}
                className="field"
                autoFocus
                required
              />
            </div>
            <div className="flex flex-col gap-1">
              <label htmlFor="qa-aisle" className="eyebrow">
                Aisle
              </label>
              <select
                id="qa-aisle"
                value={quickCategory}
                onChange={(e) => setQuickCategory(e.target.value)}
                className="field w-auto"
              >
                {CATEGORIES.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex flex-col gap-1">
              <label htmlFor="qa-qty" className="eyebrow">
                Quantity
              </label>
              <div className="flex gap-1.5">
                <input
                  id="qa-qty"
                  type="number"
                  min="0.25"
                  step="0.25"
                  value={quickQty}
                  onChange={(e) => setQuickQty(parseFloat(e.target.value) || 1)}
                  className="field font-mono w-20"
                />
                <select
                  value={quickUnit}
                  onChange={(e) => setQuickUnit(e.target.value)}
                  aria-label="Unit"
                  className="field w-auto"
                >
                  {UNITS.map((u) => (
                    <option key={u} value={u}>
                      {u}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <button type="submit" className="btn btn-action">
              Add to list
            </button>
            <button type="button" onClick={() => setShowQuickAddForm(false)} className="btn btn-bare text-sm">
              Cancel
            </button>
          </form>
        )}
      </div>

      {/* The run: one sheet, walked top to bottom. */}
      {groupedAisles.length === 0 ? (
        <div className="sheet px-6 py-14 text-center">
          <h2 className="text-h2 sign">{totalCount === 0 ? 'Nothing on the list' : 'No matches'}</h2>
          <p className="text-sm text-ink-2 mt-2 mb-5 max-w-sm mx-auto">
            {totalCount === 0
              ? 'Add your regular staples in one go, or pick items from the catalog.'
              : 'Nothing on the list matches the current search and filters.'}
          </p>
          <div className="flex flex-wrap items-center justify-center gap-2">
            {totalCount === 0 ? (
              <>
                <button onClick={onAddAllFavorites} className="btn btn-action" disabled={favoriteCount === 0}>
                  <Star className="w-3.5 h-3.5" />
                  Add {favoriteCount} staples
                </button>
                <button onClick={onGoToCatalog} className="btn btn-quiet">
                  Open catalog
                </button>
              </>
            ) : (
              <button
                onClick={() => {
                  setSearchQuery('');
                  setSelectedCategory('ALL');
                  setHideBought(false);
                }}
                className="btn btn-quiet"
                disabled={!isFiltered}
              >
                Clear filters
              </button>
            )}
          </div>
        </div>
      ) : (
        <div className="sheet overflow-hidden">
          {groupedAisles.map((aisle, idx) => {
            const remainingHere = aisle.items.filter((i) => !i.isBought).length;

            return (
              <section key={aisle.aisleId} id={`aisle-${aisle.aisleId}`} className="scroll-mt-28">
                {/* The hanging sign, which stays overhead while you're in the aisle. */}
                <h2 className="sticky top-24 z-10 flex items-center gap-3 px-4 py-2.5 bg-surface-veil backdrop-blur-sm border-y border-edge">
                  <span className="font-mono text-label text-ink-3 min-w-4 text-right tabular-nums">
                    {idx + 1}
                  </span>
                  <span className="tick self-stretch min-h-4" style={zoneStyle(aisle.zone)} aria-hidden="true" />
                  <span className="sign text-h2 truncate">{aisle.aisleLabel}</span>
                  <span className="font-mono text-label text-ink-3 ms-auto shrink-0">
                    {remainingHere}/{aisle.items.length}
                  </span>
                </h2>

                <ul>
                  {aisle.items.map((item) => (
                    <li
                      key={item.id}
                      className="flex items-center gap-3 px-4 py-2.5 border-b border-edge last:border-b-0"
                    >
                      <button
                        role="checkbox"
                        aria-checked={item.isBought}
                        onClick={() => onMarkBought(item.id, !item.isBought)}
                        aria-label={`${item.name}, ${item.isBought ? 'in the cart' : 'still to pick up'}`}
                        className={`w-5 h-5 shrink-0 rounded-edge border flex items-center justify-center transition-colors ${
                          item.isBought
                            ? 'bg-ink border-ink text-paper'
                            : 'border-edge-strong hover:border-ink'
                        }`}
                      >
                        {item.isBought && <Check className="w-3.5 h-3.5 stroke-3" aria-hidden="true" />}
                      </button>

                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5">
                          <span
                            className={`text-body font-medium truncate ${
                              item.isBought ? 'line-through text-ink-3' : 'text-ink'
                            }`}
                          >
                            {item.name}
                          </span>
                          {item.isFavorite && (
                            <Star
                              className="w-3 h-3 shrink-0 fill-ink-3 text-ink-3"
                              aria-label="Staple"
                            />
                          )}
                        </div>
                        {item.notes && <p className="text-sm text-ink-3 truncate">{item.notes}</p>}
                      </div>

                      <div className="flex items-center border border-edge rounded-box shrink-0">
                        <button
                          onClick={() => onUpdateQuantity(item.id, Math.max(1, item.weeklyQty - 1))}
                          className="btn btn-bare rounded-none p-1.5"
                          aria-label={`Less ${item.name}`}
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="font-mono text-data px-1 min-w-16 text-center">
                          {item.weeklyQty} {item.weeklyUnit}
                        </span>
                        <button
                          onClick={() => onUpdateQuantity(item.id, item.weeklyQty + 1)}
                          className="btn btn-bare rounded-none p-1.5"
                          aria-label={`More ${item.name}`}
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>

                      <button
                        onClick={() => onToggleWeekly(item.id, false)}
                        className="btn btn-bare hover:text-danger shrink-0"
                        aria-label={`Take ${item.name} off this week's list`}
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </li>
                  ))}
                </ul>
              </section>
            );
          })}
        </div>
      )}
    </div>
  );
};
