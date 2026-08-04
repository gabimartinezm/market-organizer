import React, { useState } from 'react';
import { AisleCategory, StoreLayout, Zone } from '../types';
import { getCategoryInfo } from '../utils/categoryHelpers';
import { ZONES, zoneStyle } from '../utils/zones';
import { Dialog } from './Dialog';
import { Plus, ArrowUp, ArrowDown, Edit2, Check, X, Trash2 } from 'lucide-react';

interface StoreLayoutManagerProps {
  stores: StoreLayout[];
  categories: AisleCategory[];
  activeStoreId: string;
  onChangeActiveStore: (storeId: string) => void;
  onUpdateStoreLayout: (
    store: StoreLayout,
    activity?: { action: 'reorder_aisles' | 'edit_store'; details: string }
  ) => void;
  onCreateStoreLayout: (store: StoreLayout) => void;
  onDeleteStoreLayout: (storeId: string) => void;
  onCreateCategory: (category: AisleCategory) => void;
  onUpdateCategory: (category: AisleCategory) => void;
}

/** The five zones are a closed palette — this picks among them, it doesn't invent new ones. */
const ZonePicker: React.FC<{ value: Zone; onChange: (zone: Zone) => void }> = ({ value, onChange }) => (
  <div className="flex items-center gap-1.5">
    {(Object.keys(ZONES) as Zone[]).map((z) => (
      <button
        key={z}
        type="button"
        onClick={() => onChange(z)}
        aria-label={ZONES[z].label}
        aria-pressed={value === z}
        title={ZONES[z].label}
        className={`w-6 h-6 rounded-edge border-2 transition-colors ${
          value === z ? 'border-ink' : 'border-transparent'
        }`}
        style={{ backgroundColor: ZONES[z].color }}
      />
    ))}
  </div>
);

export const StoreLayoutManager: React.FC<StoreLayoutManagerProps> = ({
  stores,
  categories,
  activeStoreId,
  onChangeActiveStore,
  onUpdateStoreLayout,
  onCreateStoreLayout,
  onDeleteStoreLayout,
  onCreateCategory,
  onUpdateCategory,
}) => {
  const [selectedStoreId, setSelectedStoreId] = useState<string>(activeStoreId);
  const [isCreatingNew, setIsCreatingNew] = useState(false);
  const [editingLabelCat, setEditingLabelCat] = useState<string | null>(null);
  const [tempLabel, setTempLabel] = useState('');
  const [tempCategoryName, setTempCategoryName] = useState('');
  const [tempCategoryZone, setTempCategoryZone] = useState<Zone>('dry');

  const [newStoreName, setNewStoreName] = useState('');
  const [newStoreDesc, setNewStoreDesc] = useState('');

  const [editingStoreId, setEditingStoreId] = useState<string | null>(null);
  const [editStoreName, setEditStoreName] = useState('');
  const [editStoreDesc, setEditStoreDesc] = useState('');

  const [isCreatingAisle, setIsCreatingAisle] = useState(false);
  const [newAisleName, setNewAisleName] = useState('');
  const [newAisleZone, setNewAisleZone] = useState<Zone>('dry');

  const currentStore = stores.find((s) => s.id === selectedStoreId) || stores[0];
  const availableToAdd = currentStore
    ? categories.filter((c) => !currentStore.aisleOrder.includes(c.id))
    : [];

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

  const handleSaveAisleEdit = (catId: string) => {
    if (!currentStore) return;
    const custom = { ...(currentStore.customAisleLabels || {}) };
    if (tempLabel.trim()) {
      custom[catId] = tempLabel.trim();
    } else {
      delete custom[catId];
    }
    onUpdateStoreLayout({ ...currentStore, customAisleLabels: custom });

    const category = categories.find((c) => c.id === catId);
    if (category && (tempCategoryName.trim() !== category.name || tempCategoryZone !== category.zone)) {
      onUpdateCategory({ ...category, name: tempCategoryName.trim() || category.name, zone: tempCategoryZone });
    }

    setEditingLabelCat(null);
  };

  const handleRemoveAisle = (catId: string) => {
    if (!currentStore || currentStore.aisleOrder.length <= 1) return;
    onUpdateStoreLayout({
      ...currentStore,
      aisleOrder: currentStore.aisleOrder.filter((id) => id !== catId),
    });
  };

  const handleAddExistingAisle = (catId: string) => {
    if (!currentStore || !catId) return;
    onUpdateStoreLayout({ ...currentStore, aisleOrder: [...currentStore.aisleOrder, catId] });
  };

  const handleCreateAisleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentStore || !newAisleName.trim()) return;

    const id = crypto.randomUUID();
    onCreateCategory({
      id,
      name: newAisleName.trim(),
      defaultAisle: newAisleName.trim(),
      iconName: 'Package',
      zone: newAisleZone,
    });
    onUpdateStoreLayout({ ...currentStore, aisleOrder: [...currentStore.aisleOrder, id] });

    setIsCreatingAisle(false);
    setNewAisleName('');
    setNewAisleZone('dry');
  };

  const handleCreateStoreSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStoreName.trim()) return;

    const newStore: StoreLayout = {
      id: `store-${Date.now()}`,
      name: newStoreName.trim(),
      description: newStoreDesc.trim() || 'Custom store layout',
      aisleOrder: categories.map((c) => c.id),
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
              const info = getCategoryInfo(catId, categories);
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
                        handleSaveAisleEdit(catId);
                      }}
                      className="flex-1 min-w-0 flex flex-wrap items-end gap-2 py-1"
                    >
                      <div className="flex flex-col gap-1 flex-1 min-w-32">
                        <label htmlFor={`store-label-${catId}`} className="eyebrow">
                          Label for this store
                        </label>
                        <input
                          id={`store-label-${catId}`}
                          type="text"
                          value={tempLabel}
                          onChange={(e) => setTempLabel(e.target.value)}
                          className="field"
                          autoFocus
                        />
                      </div>

                      <div className="flex flex-col gap-1 flex-1 min-w-32">
                        <label htmlFor={`aisle-name-${catId}`} className="eyebrow">
                          Aisle name
                        </label>
                        <input
                          id={`aisle-name-${catId}`}
                          type="text"
                          required
                          value={tempCategoryName}
                          onChange={(e) => setTempCategoryName(e.target.value)}
                          className="field"
                        />
                      </div>

                      <div className="flex flex-col gap-1">
                        <span className="eyebrow">Zone</span>
                        <ZonePicker value={tempCategoryZone} onChange={setTempCategoryZone} />
                      </div>

                      <div className="flex items-center gap-1">
                        <button type="submit" className="btn btn-action" aria-label="Save aisle">
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
                      </div>
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
                          setTempCategoryName(info.name);
                          setTempCategoryZone(info.zone);
                        }}
                        className="btn btn-bare shrink-0"
                        aria-label={`Edit the ${info.name} aisle`}
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
                        <button
                          onClick={() => handleRemoveAisle(catId)}
                          disabled={currentStore.aisleOrder.length <= 1}
                          className="btn btn-bare hover:text-danger disabled:opacity-40 disabled:hover:text-ink-2"
                          aria-label={`Remove ${info.name} from this store's walking order`}
                          title={
                            currentStore.aisleOrder.length <= 1
                              ? 'A store needs at least one aisle'
                              : `Remove ${info.name} from this store`
                          }
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </>
                  )}
                </li>
              );
            })}
          </ol>

          <div className="flex flex-wrap items-center gap-2 px-4 py-3 border-t border-edge">
            {availableToAdd.length > 0 && (
              <select
                value=""
                onChange={(e) => handleAddExistingAisle(e.target.value)}
                aria-label="Add an existing aisle to this store"
                className="field w-auto"
              >
                <option value="">Add existing aisle…</option>
                {availableToAdd.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            )}
            <button type="button" onClick={() => setIsCreatingAisle(true)} className="btn btn-quiet">
              <Plus className="w-3.5 h-3.5" />
              New aisle
            </button>
          </div>
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

      {isCreatingAisle && (
        <Dialog
          title="New aisle"
          description="Added to this store's walking order right away. Every store can add it later too."
          onClose={() => setIsCreatingAisle(false)}
        >
          <form onSubmit={handleCreateAisleSubmit} className="space-y-4">
            <div className="flex flex-col gap-1">
              <label htmlFor="new-aisle-name" className="eyebrow">
                Name
              </label>
              <input
                id="new-aisle-name"
                type="text"
                required
                placeholder="Seasonal & holiday"
                value={newAisleName}
                onChange={(e) => setNewAisleName(e.target.value)}
                className="field"
                autoFocus
              />
            </div>

            <div className="flex flex-col gap-1">
              <span className="eyebrow">Zone</span>
              <ZonePicker value={newAisleZone} onChange={setNewAisleZone} />
            </div>

            <div className="flex items-center justify-end gap-2 pt-1">
              <button type="button" onClick={() => setIsCreatingAisle(false)} className="btn btn-bare">
                Cancel
              </button>
              <button type="submit" className="btn btn-action">
                Add aisle
              </button>
            </div>
          </form>
        </Dialog>
      )}
    </div>
  );
};
