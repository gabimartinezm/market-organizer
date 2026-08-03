import { CSSProperties } from 'react';
import { Zone } from '../types';

/**
 * The five palette colours, each bound to one region of the shop. A colour
 * appears in the UI only to say where something lives, which is why zones are
 * defined here rather than as class names on the category data.
 */
export const ZONES: Record<Zone, { label: string; color: string }> = {
  fresh: { label: 'Fresh', color: 'var(--zone-fresh)' },
  bake: { label: 'Bakery', color: 'var(--zone-bake)' },
  butcher: { label: 'Counter', color: 'var(--zone-butcher)' },
  cold: { label: 'Chilled', color: 'var(--zone-cold)' },
  dry: { label: 'Dry goods', color: 'var(--zone-dry)' },
};

/** Sets `--tick-color`, which `.tick` and `.zone-chip` read. */
export function zoneStyle(zone: Zone): CSSProperties {
  return { '--tick-color': ZONES[zone].color } as CSSProperties;
}
