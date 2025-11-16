import { createContext, ReactNode, useContext, useState } from "react";
import {
  GenericStringInMemoryStorage,
  GenericStringStorage,
} from "@/fhevm/GenericStringStorage";

interface UseInMemoryStorageState {
  storage: GenericStringStorage;
}

const InMemoryStorageContext = createContext<UseInMemoryStorageState | undefined>(undefined);

export function InMemoryStorageProvider({ children }: { children: ReactNode }) {
  const [storage] = useState<GenericStringStorage>(
    new GenericStringInMemoryStorage()
  );

  return (
    <InMemoryStorageContext.Provider value={{ storage }}>
      {children}
    </InMemoryStorageContext.Provider>
  );
}

export function useInMemoryStorage() {
  const context = useContext(InMemoryStorageContext);
  if (context === undefined) {
    throw new Error("useInMemoryStorage must be used within InMemoryStorageProvider");
  }
  return context;
}

