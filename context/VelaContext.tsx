import { createContext, useContext, ReactNode } from 'react';
import { useVelaStore } from '../hooks/useVelaStore';

type VelaStore = ReturnType<typeof useVelaStore>;

const VelaContext = createContext<VelaStore | null>(null);

export function VelaProvider({ children }: { children: ReactNode }) {
  const store = useVelaStore();
  return <VelaContext.Provider value={store}>{children}</VelaContext.Provider>;
}

export function useVela() {
  const ctx = useContext(VelaContext);
  if (!ctx) throw new Error('useVela must be used within a VelaProvider');
  return ctx;
}
