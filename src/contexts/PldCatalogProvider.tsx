import React, { useMemo } from 'react';
import { PLD_ITEM_OPTIONS } from '../types/pld';
import { PldCatalogContext } from './pld-catalog-context';
import type { PldCatalog } from './pld-catalog-context';

export function PldCatalogProvider({ children }: { children: React.ReactNode }) {
  const value = useMemo<PldCatalog>(
    () => ({
      itemOptions: PLD_ITEM_OPTIONS,
    }),
    [],
  );

  return <PldCatalogContext.Provider value={value}>{children}</PldCatalogContext.Provider>;
}
