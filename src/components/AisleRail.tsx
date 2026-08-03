import React from 'react';
import { AisleGroup } from '../utils/categoryHelpers';
import { zoneStyle } from '../utils/zones';

interface AisleRailProps {
  aisles: AisleGroup[];
  /** Aisle the shopper is standing in, outlined on the rail. */
  currentAisleId?: string;
  onSelectAisle: (aisleId: string, index: number) => void;
}

/**
 * The trip seen from above: one segment per aisle in the order you walk them,
 * each as wide as the number of items waiting there and coloured by its zone,
 * filling up as things go in the cart.
 *
 * It stands in for a progress bar, an aisle picker and a "what's left where"
 * summary at once, which is why the view has no stat cards.
 */
export const AisleRail: React.FC<AisleRailProps> = ({ aisles, currentAisleId, onSelectAisle }) => {
  if (aisles.length === 0) return null;

  return (
    <div
      role="group"
      aria-label="Trip by aisle, in walking order"
      className="flex items-stretch gap-1 h-9 sm:h-11"
    >
      {aisles.map((aisle, idx) => {
        const total = aisle.items.length;
        const bought = aisle.items.filter((i) => i.isBought).length;
        const remaining = total - bought;
        const isCurrent = aisle.aisleId === currentAisleId;

        return (
          <button
            key={aisle.aisleId}
            type="button"
            onClick={() => onSelectAisle(aisle.aisleId, idx)}
            style={{ ...zoneStyle(aisle.zone), flexGrow: total }}
            aria-current={isCurrent ? 'step' : undefined}
            aria-label={`Aisle ${idx + 1}, ${aisle.aisleLabel}: ${remaining} of ${total} still to pick up`}
            title={`${aisle.aisleLabel} — ${remaining} of ${total} left`}
            className={`relative min-w-6 flex-1 basis-0 overflow-hidden rounded-edge shadow-[inset_0_0_0_1px_rgb(17_17_17/0.14)] ${
              isCurrent ? 'outline-2 outline-offset-2 outline-ink' : ''
            }`}
          >
            {/* Track: the zone colour, held back so the fill can read against it. */}
            <span
              aria-hidden="true"
              className="absolute inset-0 opacity-30"
              style={{ backgroundColor: 'var(--tick-color)' }}
            />
            {/* Fill: how much of this aisle is already in the cart. */}
            <span
              aria-hidden="true"
              className="absolute inset-y-0 left-0 transition-[width] duration-200 ease-out"
              style={{
                width: `${total > 0 ? (bought / total) * 100 : 0}%`,
                backgroundColor: 'var(--tick-color)',
              }}
            />
          </button>
        );
      })}
    </div>
  );
};
