import React, { useState } from 'react';
import { StoreLayout } from '../types';
import { CATEGORIES } from '../data/initialData';
import { getCategoryInfo } from '../utils/categoryHelpers';
import { zoneStyle } from '../utils/zones';
import { Dialog } from './Dialog';
import { Plus, ArrowUp, ArrowDown, Edit2, Check, X, Trash2 } from 'lucide-react';

interface StoreLayoutManagerProps {
  stores: StoreLayout[];
  activeStoreId: string;
  onChangeActiveStore: (storeId: string) => void;
  onUpdateStoreLayout: (
    store: StoreLayout,
    activity?: { action: 'reorder_aisles' | 'edit_store'; details: string }
  ) => void;
  onCreateStoreLayout: (store: StoreLayout) => void;
  onDeleteStoreLayout: (storeId: string) => void;
}

export const StoreLayoutManager: React.FC<StoreLayoutManagerProps> = ({
  stores,
  activeStoreId,
  onChangeActiveStore,
  onUpdateStoreLayout,
  onCreateStoreLayout,
  onDeleteStoreLayout,
}) => {
  const [selectedStoreId, setSelectedStoreId] = useState<string>(activeStoreId);
  const [isCreatingNew, setIsCreatingNew] = useState(false);
  const [editingLabelCat, setEditingLabelCat] = useState<string | null>(null);
  const [tempLabel, setTempLabel] = useState('');

  const [newStoreName, setNewStoreName] = useState('');
  const [newStoreDesc, setNewStoreDesc] = useState('');

  const [editingStoreId, setEditingStoreId] = useState<string | null>(null);
  const [editStoreName, setEditStoreName] = useState('');
  const [editStoreDesc, setEditStoreDesc] = useState('');

  const currentStore = stores.find((s) => s.id === selectedStoreId) || stores[0];

  const handleMoveAisle = (index: number, direction: 'up' | 'down') => {
    if (!currentStore) return;
    const order = [...currentStore.aisleOrder];
    const targetIdx = direction === 'up' ? index - 1 : index + 1;

    if (targetIdx < 0 || targetIdx >= order.length) return;

    const temp = order[index];
    order[index] = order[targetIdx];
    order[targetIdx] = temp;

    onUpdateStoreLayout({ ...currentStore, aisleOrder: order });
  };

  const handleSaveCustomLabel = (catId: string) => {
    if (!currentStore) return;
    const custom = { ...(currentStore.customAisleLabels || {}) };
    if (tempLabel.trim()) {
      custom[catId] = tempLabel.trim();
    } else {
      delete custom[catId];
    }

    onUpdateStoreLayout({ ...currentStore, customAisleLabels: custom });
    setEditingLabelCat(null);
  };

  const handleCreateStoreSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStoreName.trim()) return;

    const newStore: StoreLayout = {
      id: `store-${Date.now()}`,
      name: newStoreName.trim(),
      description: newStoreDesc.trim() || 'Custom store layout',
      aisleOrder: CATEGORIES.map((c) => c.id),
      customAisleLabels: {},
    };

    onCreateStoreLayout(newStore);
    setSelectedStoreId(newStore.id);
    setIsCreatingNew(false);
    setNewStoreName('');
    setNewStoreDesc('');
  };

  const openEditStore = (store: StoreLayout) => {
    setEditingStoreId(store.id);
    setEditStoreName(store.name);
    setEditStoreDesc(store.description);
  };

  const handleEditStoreSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const store = stores.find((s) => s.id === editingStoreId);
    if (!store || !editStoreName.trim()) return;

    onUpdateStoreLayout(
      { ...store, name: editStoreName.trim(), description: editStoreDesc.trim() || 'Custom store layout' },
      { action: 'edit_store', details: 'Updated store name and description' }
    );
    setEditingStoreId(null);
  };

  return (
    <div className="space-y-6">
      <header className="px-4 sm:px-0 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-h1">Store layouts</h1>
          <p className="text-sm text-ink-2 mt-1 max-w-lg">
            Put the aisles in the order you actually walk them, and your list sorts itself from the
            entrance to the checkout.
          </p>
        </div>
        <button onClick={() => setIsCreatingNew(true)} className="btn btn-action">
          <Plus className="w-3.5 h-3.5" />
          New store
        </button>
      </header>

      {/* Which layout you're editing. A list, not a row of matching cards. */}
      <div className="sheet overflow-hidden" role="radiogroup" aria-label="Store to edit">
        {stores.map((store) => {
          const isSelected = store.id === currentStore?.id;
          const isActive = store.id === activeStoreId;

          return (
            <div
              key={store.id}
              className="flex items-center gap-3 border-b border-edge last:border-b-0"
            >
              <button
                role="radio"
                aria-checked={isSelected}
                onClick={() => setSelectedStoreId(store.id)}
                className="flex-1 min-w-0 flex items-center gap-3 px-4 py-3 text-left hover:bg-surface-sunk transition-colors"
              >
                <span
                  aria-hidden="true"
                  className={`w-4 h-4 shrink-0 rounded-full border flex items-center justify-center ${
                    isSelected ? 'border-ink' : 'border-edge-strong'
                  }`}
                >
                  {isSelected && <span className="w-2 h-2 rounded-full bg-ink" />}
                </span>
                <span className="min-w-0">
                  <span className="flex items-center gap-2">
                    <span className="text-body font-medium min-w-0">{store.name}</span>
                    {isActive && <span className="eyebrow shrink-0">In use</span>}
                  </span>
                  <span className="block text-sm text-ink-3 truncate">{store.description}</span>
                </span>
                <span className="font-mono text-data text-ink-3 ms-auto shrink-0 hidden sm:block">
                  {store.aisleOrder.length} aisles
                </span>
              </button>

              {!isActive && (
                <button
                  onClick={() => onChangeActiveStore(store.id)}
                  className="btn btn-quiet shrink-0"
                >
                  Use for trips
                </button>
              )}

              <button
                onClick={() => openEditStore(store)}
                className="btn btn-bare shrink-0"
                aria-label={`Edit ${store.name}`}
                title="Edit name and notes"
              >
                <Edit2 className="w-3.5 h-3.5" />
              </button>

              <button
                onClick={() => onDeleteStoreLayout(store.id)}
                disabled={stores.length <= 1}
                className="btn btn-bare shrink-0 me-4 hover:text-danger disabled:opacity-40 disabled:hover:text-ink-2"
                aria-label={`Delete ${store.name}`}
                title={stores.length <= 1 ? 'You need at least one store' : `Delete ${store.name}`}
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          );
        })}
      </div>

      {currentStore && (
        <section className="sheet overflow-hidden">
          <div className="px-4 py-3 border-b border-edge">
            <h2 className="sign text-h2">{currentStore.name}</h2>
            <p className="text-sm text-ink-3">
              Walking order, entrance first. Rename an aisle to match the store's own signs.
            </p>
          </div>

          <ol>
            {currentStore.aisleOrder.map((catId, index) => {
              const info = getCategoryInfo(catId);
              const label = currentStore.customAisleLabels?.[catId] || info.defaultAisle;
              const isEditing = editingLabelCat === catId;

              return (
                <li
                  key={catId}
                  className="flex items-center gap-3 px-4 py-2.5 border-b border-edge last:border-b-0"
                >
                  <span className="font-mono text-label text-ink-3 min-w-4 text-right tabular-nums shrink-0">
                    {index + 1}
                  </span>
                  <span
                    className="tick self-stretch min-h-6"
                    style={zoneStyle(info.zone)}
                    aria-hidden="true"
                  />

                  {isEditing ? (
                    <form
                      onSubmit={(e) => {
                        e.preventDefault();
                        handleSaveCustomLabel(catId);
                      }}
                      className="flex items-center gap-1.5 flex-1 min-w-0"
                    >
                      <input
                        type="text"
                        value={tempLabel}
                        onChange={(e) => setTempLabel(e.target.value)}
                        className="field"
                        aria-label={`Name for the ${info.name} aisle`}
                        autoFocus
                      />
                      <button type="submit" className="btn btn-action" aria-label="Save aisle name">
                        <Check className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setEditingLabelCat(null)}
                        className="btn btn-bare"
                        aria-label="Cancel"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </form>
                  ) : (
                    <>
                      <div className="min-w-0 flex-1">
                        <span className="text-body font-medium block">{label}</span>
                        <span className="text-sm text-ink-3">{info.name}</span>
                      </div>

                      <button
                        onClick={() => {
                          setEditingLabelCat(catId);
                          setTempLabel(label);
                        }}
                        className="btn btn-bare shrink-0"
                        aria-label={`Rename the ${info.name} aisle`}
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>

                      <div className="flex items-center shrink-0">
                        <button
                          disabled={index === 0}
                          onClick={() => handleMoveAisle(index, 'up')}
                          className="btn btn-bare"
                          aria-label={`Move ${info.name} earlier in the trip`}
                        >
                          <ArrowUp className="w-4 h-4" />
                        </button>
                        <button
                          disabled={index === currentStore.aisleOrder.length - 1}
                          onClick={() => handleMoveAisle(index, 'down')}
                          className="btn btn-bare"
                          aria-label={`Move ${info.name} later in the trip`}
                        >
                          <ArrowDown className="w-4 h-4" />
                        </button>
                      </div>
                    </>
                  )}
                </li>
              );
            })}
          </ol>
        </section>
      )}

      {isCreatingNew && (
        <Dialog
          title="New store"
          description="It starts with the standard aisle order; rearrange it afterwards."
          onClose={() => setIsCreatingNew(false)}
        >
          <form onSubmit={handleCreateStoreSubmit} className="space-y-4">
            <div className="flex flex-col gap-1">
              <label htmlFor="store-name" className="eyebrow">
                Name
              </label>
              <input
                id="store-name"
                type="text"
                required
                placeholder="Farmers market"
                value={newStoreName}
                onChange={(e) => setNewStoreName(e.target.value)}
                className="field"
                autoFocus
              />
            </div>

            <div className="flex flex-col gap-1">
              <label htmlFor="store-desc" className="eyebrow">
                Notes
              </label>
              <input
                id="store-desc"
                type="text"
                placeholder="Downtown branch, produce by the door"
                value={newStoreDesc}
                onChange={(e) => setNewStoreDesc(e.target.value)}
                className="field"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-1">
              <button type="button" onClick={() => setIsCreatingNew(false)} className="btn btn-bare">
                Cancel
              </button>
              <button type="submit" className="btn btn-action">
                Create store
              </button>
            </div>
          </form>
        </Dialog>
      )}

      {editingStoreId && (
        <Dialog
          title="Edit store"
          description="Rename it or update the notes. The aisle order stays as you set it."
          onClose={() => setEditingStoreId(null)}
        >
          <form onSubmit={handleEditStoreSubmit} className="space-y-4">
            <div className="flex flex-col gap-1">
              <label htmlFor="edit-store-name" className="eyebrow">
                Name
              </label>
              <input
                id="edit-store-name"
                type="text"
                required
                value={editStoreName}
                onChange={(e) => setEditStoreName(e.target.value)}
                className="field"
                autoFocus
              />
            </div>

            <div className="flex flex-col gap-1">
              <label htmlFor="edit-store-desc" className="eyebrow">
                Notes
              </label>
              <input
                id="edit-store-desc"
                type="text"
                placeholder="Downtown branch, produce by the door"
                value={editStoreDesc}
                onChange={(e) => setEditStoreDesc(e.target.value)}
                className="field"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-1">
              <button type="button" onClick={() => setEditingStoreId(null)} className="btn btn-bare">
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
