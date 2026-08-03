import React, { useState, useMemo } from 'react';
import { GroceryItem } from '../types';
import { CATEGORIES } from '../data/initialData';
import { getCategoryInfo } from '../utils/categoryHelpers';
import { zoneStyle } from '../utils/zones';
import { Dialog } from './Dialog';
import { Plus, Search, Star, Edit2, Trash2, Check } from 'lucide-react';

interface MasterCatalogViewProps {
  items: GroceryItem[];
  onToggleWeekly: (itemId: string, inWeeklyList: boolean) => void;
  onAddItem: (item: Omit<GroceryItem, 'id' | 'timesBought'>) => void;
  onEditItem: (item: GroceryItem) => void;
  onDeleteItem: (itemId: string) => void;
}

const UNITS = ['pcs', 'lbs', 'bunch', 'gal', 'carton', 'box', 'bag', 'pack', 'tub', 'jar', 'bottle'];

const BLANK_FORM = {
  name: '',
  category: 'Produce',
  defaultQty: 1,
  defaultUnit: 'pcs',
  notes: '',
  isFavorite: false,
  inWeeklyList: true,
};

export const MasterCatalogView: React.FC<MasterCatalogViewProps> = ({
  items,
  onToggleWeekly,
  onAddItem,
  onEditItem,
  onDeleteItem,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [favoritesOnly, setFavoritesOnly] = useState(false);
  const [weeklyOnly, setWeeklyOnly] = useState(false);

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<GroceryItem | null>(null);
  const [formData, setFormData] = useState(BLANK_FORM);

  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      const q = searchQuery.toLowerCase();
      const matchesSearch =
        item.name.toLowerCase().includes(q) || (item.notes && item.notes.toLowerCase().includes(q));
      const matchesCategory = selectedCategory === 'ALL' || item.category === selectedCategory;
      const matchesFav = !favoritesOnly || item.isFavorite;
      const matchesWeekly = !weeklyOnly || item.inWeeklyList;
      return matchesSearch && matchesCategory && matchesFav && matchesWeekly;
    });
  }, [items, searchQuery, selectedCategory, favoritesOnly, weeklyOnly]);

  /** Grouped by aisle so the catalog reads in the same language as the list. */
  const grouped = useMemo(() => {
    const byCategory = new Map<string, GroceryItem[]>();
    filteredItems.forEach((item) => {
      const key = item.category || 'Pantry';
      if (!byCategory.has(key)) byCategory.set(key, []);
      byCategory.get(key)!.push(item);
    });

    const order = CATEGORIES.map((c) => c.id);
    return [...byCategory.entries()]
      .sort(([a], [b]) => {
        const ia = order.indexOf(a);
        const ib = order.indexOf(b);
        return (ia === -1 ? order.length : ia) - (ib === -1 ? order.length : ib);
      })
      .map(([categoryId, groupItems]) => ({
        info: getCategoryInfo(categoryId),
        items: groupItems.sort((a, b) => a.name.localeCompare(b.name)),
      }));
  }, [filteredItems]);

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) return;

    onAddItem({
      name: formData.name.trim(),
      category: formData.category,
      defaultQty: formData.defaultQty,
      defaultUnit: formData.defaultUnit,
      notes: formData.notes.trim() || undefined,
      isFavorite: formData.isFavorite,
      inWeeklyList: formData.inWeeklyList,
      weeklyQty: formData.defaultQty,
      weeklyUnit: formData.defaultUnit,
      isBought: false,
    });

    setIsAddModalOpen(false);
  };

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingItem || !editingItem.name.trim()) return;
    onEditItem(editingItem);
    setEditingItem(null);
  };

  const formatLastBought = (timestamp?: number) => {
    if (!timestamp) return '—';
    const days = Math.floor((Date.now() - timestamp) / (1000 * 60 * 60 * 24));
    if (days === 0) return 'today';
    if (days === 1) return 'yesterday';
    if (days < 7) return `${days}d ago`;
    if (days < 60) return `${Math.floor(days / 7)}w ago`;
    return `${Math.floor(days / 30)}mo ago`;
  };

  return (
    <div className="space-y-6">
      <header className="px-4 sm:px-0 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-h1">Catalog</h1>
          <p className="text-sm text-ink-2 mt-1 max-w-md">
            Everything the household buys. Tick an item to put it on this week's list.
          </p>
        </div>
        <button
          onClick={() => {
            setFormData(BLANK_FORM);
            setIsAddModalOpen(true);
          }}
          className="btn btn-action"
        >
          <Plus className="w-3.5 h-3.5" />
          Add item
        </button>
      </header>

      <div className="border-y border-edge px-4 sm:px-0">
        <div className="flex flex-wrap items-center gap-2 py-3">
          <div className="relative">
            <Search
              className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-ink-3"
              aria-hidden="true"
            />
            <input
              type="search"
              placeholder="Search the catalog"
              aria-label="Search the catalog"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="field ps-8 w-52"
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

          <button
            onClick={() => setFavoritesOnly(!favoritesOnly)}
            aria-pressed={favoritesOnly}
            className={`btn ${favoritesOnly ? 'btn-action' : 'btn-quiet'}`}
          >
            <Star className={`w-3.5 h-3.5 ${favoritesOnly ? 'fill-current' : ''}`} />
            Staples
          </button>

          <button
            onClick={() => setWeeklyOnly(!weeklyOnly)}
            aria-pressed={weeklyOnly}
            className={`btn ${weeklyOnly ? 'btn-action' : 'btn-quiet'}`}
          >
            On this week's list
          </button>

          <span className="eyebrow ms-auto">
            {filteredItems.length} of {items.length} items
          </span>
        </div>
      </div>

      {grouped.length === 0 ? (
        <div className="sheet px-6 py-14 text-center">
          <h2 className="sign text-h2">No matches</h2>
          <p className="text-sm text-ink-2 mt-2 mb-5 max-w-sm mx-auto">
            Nothing in the catalog matches the current search and filters.
          </p>
          <button
            onClick={() => {
              setSearchQuery('');
              setSelectedCategory('ALL');
              setFavoritesOnly(false);
              setWeeklyOnly(false);
            }}
            className="btn btn-quiet"
          >
            Clear filters
          </button>
        </div>
      ) : (
        <div className="sheet overflow-hidden">
          {grouped.map(({ info, items: groupItems }) => (
            <section key={info.id}>
              <h2 className="sticky top-24 z-10 flex items-center gap-3 px-4 py-2.5 bg-surface-veil backdrop-blur-sm border-y border-edge">
                <span className="tick self-stretch min-h-4" style={zoneStyle(info.zone)} aria-hidden="true" />
                <span className="sign text-h2 truncate">{info.name}</span>
                <span className="font-mono text-label text-ink-3 ms-auto shrink-0">{groupItems.length}</span>
              </h2>

              <ul>
                {groupItems.map((item) => (
                  <li
                    key={item.id}
                    className="flex items-center gap-3 px-4 py-2.5 border-b border-edge last:border-b-0"
                  >
                    <button
                      role="checkbox"
                      aria-checked={item.inWeeklyList}
                      onClick={() => onToggleWeekly(item.id, !item.inWeeklyList)}
                      aria-label={`${item.name} on this week's list`}
                      className={`w-5 h-5 shrink-0 rounded-edge border flex items-center justify-center transition-colors ${
                        item.inWeeklyList
                          ? 'bg-ink border-ink text-paper'
                          : 'border-edge-strong hover:border-ink'
                      }`}
                    >
                      {item.inWeeklyList && <Check className="w-3.5 h-3.5 stroke-3" aria-hidden="true" />}
                    </button>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5">
                        <span className="text-body font-medium truncate">{item.name}</span>
                        <button
                          onClick={() => onEditItem({ ...item, isFavorite: !item.isFavorite })}
                          aria-pressed={item.isFavorite}
                          aria-label={`${item.name} as a staple`}
                          className="btn btn-bare p-0.5 shrink-0"
                        >
                          <Star
                            className={`w-3.5 h-3.5 ${
                              item.isFavorite ? 'fill-ink text-ink' : 'text-ink-3'
                            }`}
                          />
                        </button>
                      </div>
                      {item.notes && <p className="text-sm text-ink-3 truncate">{item.notes}</p>}
                    </div>

                    {/* Aligned in columns so the numbers can actually be compared. */}
                    <span className="font-mono text-data text-ink-2 w-20 text-right shrink-0 hidden sm:block">
                      {item.defaultQty} {item.defaultUnit}
                    </span>
                    <span className="font-mono text-data text-ink-3 w-14 text-right shrink-0 hidden md:block">
                      {item.timesBought || 0}×
                    </span>
                    <span className="font-mono text-data text-ink-3 w-20 text-right shrink-0 hidden lg:block">
                      {formatLastBought(item.lastBoughtAt)}
                    </span>

                    <div className="flex items-center shrink-0">
                      <button
                        onClick={() => setEditingItem(item)}
                        className="btn btn-bare"
                        aria-label={`Edit ${item.name}`}
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => onDeleteItem(item.id)}
                        className="btn btn-bare hover:text-danger"
                        aria-label={`Delete ${item.name} from the catalog`}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      )}

      {isAddModalOpen && (
        <Dialog
          title="Add to the catalog"
          description="Saved for next time, so you only type it once."
          onClose={() => setIsAddModalOpen(false)}
        >
          <form onSubmit={handleCreateSubmit} className="space-y-4">
            <div className="flex flex-col gap-1">
              <label htmlFor="new-name" className="eyebrow">
                Item
              </label>
              <input
                id="new-name"
                type="text"
                required
                placeholder="Greek yoghurt"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="field"
                autoFocus
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1">
                <label htmlFor="new-aisle" className="eyebrow">
                  Aisle
                </label>
                <select
                  id="new-aisle"
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="field"
                >
                  {CATEGORIES.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex flex-col gap-1">
                <label htmlFor="new-qty" className="eyebrow">
                  Usual quantity
                </label>
                <div className="flex gap-1.5">
                  <input
                    id="new-qty"
                    type="number"
                    min="0.25"
                    step="0.25"
                    value={formData.defaultQty}
                    onChange={(e) =>
                      setFormData({ ...formData, defaultQty: parseFloat(e.target.value) || 1 })
                    }
                    className="field font-mono"
                  />
                  <select
                    value={formData.defaultUnit}
                    onChange={(e) => setFormData({ ...formData, defaultUnit: e.target.value })}
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
            </div>

            <div className="flex flex-col gap-1">
              <label htmlFor="new-notes" className="eyebrow">
                Notes
              </label>
              <input
                id="new-notes"
                type="text"
                placeholder="Organic, or the 2% one"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                className="field"
              />
            </div>

            <div className="space-y-2">
              <label className="flex items-center gap-2 text-sm cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.inWeeklyList}
                  onChange={(e) => setFormData({ ...formData, inWeeklyList: e.target.checked })}
                  className="accent-ink"
                />
                Put it on this week's list now
              </label>
              <label className="flex items-center gap-2 text-sm cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.isFavorite}
                  onChange={(e) => setFormData({ ...formData, isFavorite: e.target.checked })}
                  className="accent-ink"
                />
                Mark as a staple
              </label>
            </div>

            <div className="flex items-center justify-end gap-2 pt-1">
              <button type="button" onClick={() => setIsAddModalOpen(false)} className="btn btn-bare">
                Cancel
              </button>
              <button type="submit" className="btn btn-action">
                Add item
              </button>
            </div>
          </form>
        </Dialog>
      )}

      {editingItem && (
        <Dialog title={`Edit ${editingItem.name}`} onClose={() => setEditingItem(null)}>
          <form onSubmit={handleEditSubmit} className="space-y-4">
            <div className="flex flex-col gap-1">
              <label htmlFor="edit-name" className="eyebrow">
                Item
              </label>
              <input
                id="edit-name"
                type="text"
                required
                value={editingItem.name}
                onChange={(e) => setEditingItem({ ...editingItem, name: e.target.value })}
                className="field"
                autoFocus
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1">
                <label htmlFor="edit-aisle" className="eyebrow">
                  Aisle
                </label>
                <select
                  id="edit-aisle"
                  value={editingItem.category}
                  onChange={(e) => setEditingItem({ ...editingItem, category: e.target.value })}
                  className="field"
                >
                  {CATEGORIES.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex flex-col gap-1">
                <label htmlFor="edit-unit" className="eyebrow">
                  Unit
                </label>
                <select
                  id="edit-unit"
                  value={editingItem.defaultUnit}
                  onChange={(e) => setEditingItem({ ...editingItem, defaultUnit: e.target.value })}
                  className="field"
                >
                  {UNITS.map((u) => (
                    <option key={u} value={u}>
                      {u}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex flex-col gap-1">
              <label htmlFor="edit-notes" className="eyebrow">
                Notes
              </label>
              <input
                id="edit-notes"
                type="text"
                value={editingItem.notes || ''}
                onChange={(e) => setEditingItem({ ...editingItem, notes: e.target.value })}
                className="field"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-1">
              <button type="button" onClick={() => setEditingItem(null)} className="btn btn-bare">
                Cancel
              </button>
              <button type="submit" className="btn btn-action">
                Save changes
              </button>
            </div>
          </form>
        </Dialog>
      )}
    </div>
  );
};
