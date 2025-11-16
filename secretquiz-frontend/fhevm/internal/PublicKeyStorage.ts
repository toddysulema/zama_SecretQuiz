import { openDB, DBSchema, IDBPDatabase } from "idb";

type FhevmStoredPublicKey = {
  publicKeyId: string;
  publicKey: Uint8Array;
};

type FhevmStoredPublicParams = {
  publicParamsId: string;
  publicParams: Uint8Array;
};

interface PublicParamsDB extends DBSchema {
  publicKeyStore: {
    key: string;
    value: {
      acl: `0x${string}`;
      value: FhevmStoredPublicKey;
    };
  };
  paramsStore: {
    key: string;
    value: {
      acl: `0x${string}`;
      value: FhevmStoredPublicParams;
    };
  };
}

let __dbPromise: Promise<IDBPDatabase<PublicParamsDB>> | undefined = undefined;

async function _getDB(): Promise<IDBPDatabase<PublicParamsDB> | undefined> {
  if (__dbPromise) {
    return __dbPromise;
  }
  if (typeof window === "undefined") {
    return undefined;
  }
  __dbPromise = openDB<PublicParamsDB>("fhevm", 1, {
    upgrade(db) {
      if (!db.objectStoreNames.contains("paramsStore")) {
        db.createObjectStore("paramsStore", { keyPath: "acl" });
      }
      if (!db.objectStoreNames.contains("publicKeyStore")) {
        db.createObjectStore("publicKeyStore", { keyPath: "acl" });
      }
    },
  });
  return __dbPromise;
}

export async function publicKeyStorageGet(acl: `0x${string}`): Promise<{
  publicKey: Uint8Array;
  publicParams: Uint8Array;
}> {
  const db = await _getDB();
  if (!db) {
    throw new Error("IndexedDB not available");
  }

  const storedPublicKey = await db.get("publicKeyStore", acl);
  const storedPublicParams = await db.get("paramsStore", acl);

  if (!storedPublicKey || !storedPublicParams) {
    throw new Error("Public key or params not found");
  }

  return {
    publicKey: storedPublicKey.value.publicKey,
    publicParams: storedPublicParams.value.publicParams,
  };
}

export async function publicKeyStorageSet(
  acl: `0x${string}`,
  publicKey: Uint8Array,
  publicParams: Uint8Array
): Promise<void> {
  const db = await _getDB();
  if (!db) {
    throw new Error("IndexedDB not available");
  }

  await db.put("publicKeyStore", {
    acl,
    value: { publicKeyId: acl, publicKey },
  });

  await db.put("paramsStore", {
    acl,
    value: { publicParamsId: acl, publicParams },
  });
}

