import { createContext } from 'react';

export type PldCatalog = {
  itemOptions: readonly string[];
};

export const PldCatalogContext = createContext<PldCatalog | null>(null);
