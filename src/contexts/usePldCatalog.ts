import { useContext } from 'react';
import { PldCatalogContext } from './pld-catalog-context';

export function usePldCatalog() {
  const ctx = useContext(PldCatalogContext);
  if (!ctx) {
    throw new Error('usePldCatalog must be used within a PldCatalogProvider');
  }
  return ctx;
}
