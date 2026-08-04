import { AisleCategory, GroceryItem, StoreLayout, Zone } from '../types';

export interface AisleGroup {
  aisleId: string;
  aisleLabel: string;
  zone: Zone;
  items: GroceryItem[];
}

/** Items with no storeId are sold everywhere; a set storeId narrows to one store. */
export function isItemAvailableAtStore(item: GroceryItem, storeId: string): boolean {
  return !item.storeId || item.storeId === storeId;
}

export function getCategoryInfo(categoryName: string, categories: AisleCategory[]): AisleCategory {
  const found = categories.find(
    (c) => c.id.toLowerCase() === categoryName.toLowerCase() || c.name.toLowerCase() === categoryName.toLowerCase()
  );
  if (found) return found;

  return {
    id: categoryName,
    name: categoryName,
    defaultAisle: categoryName,
    iconName: 'Package',
    zone: 'dry',
  };
}

/**
 * Sorts grocery items according to the store's configured aisle order.
 * Items belonging to the first aisle in store.aisleOrder come first!
 */
export function groupAndSortItemsByStoreAisle(
  items: GroceryItem[],
  store: StoreLayout,
  categories: AisleCategory[]
): AisleGroup[] {
  // Create a map of categories present in items
  const itemMap = new Map<string, GroceryItem[]>();
  items.forEach((item) => {
    const cat = item.category || 'Pantry';
    if (!itemMap.has(cat)) {
      itemMap.set(cat, []);
    }
    itemMap.get(cat)!.push(item);
  });

  const result: AisleGroup[] = [];

  // 1. First append categories in the store's configured aisle order
  store.aisleOrder.forEach((catId) => {
    if (itemMap.has(catId)) {
      const aisleItems = itemMap.get(catId)!;
      // Sort items within aisle alphabetically or by bought status
      aisleItems.sort((a, b) => a.name.localeCompare(b.name));

      const info = getCategoryInfo(catId, categories);

      result.push({
        aisleId: catId,
        aisleLabel: store.customAisleLabels?.[catId] || info.defaultAisle,
        zone: info.zone,
        items: aisleItems,
      });

      itemMap.delete(catId);
    }
  });

  // 2. Append any remaining categories not explicitly in store aisle order
  itemMap.forEach((aisleItems, catId) => {
    aisleItems.sort((a, b) => a.name.localeCompare(b.name));
    const info = getCategoryInfo(catId, categories);
    result.push({
      aisleId: catId,
      aisleLabel: store.customAisleLabels?.[catId] || info.defaultAisle,
      zone: info.zone,
      items: aisleItems,
    });
  });

  return result;
}
