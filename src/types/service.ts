import { bytes } from "@typeberry/state-merkleization";

/** Service id type. */
export type ServiceId = number;

/** 32-bit unsigned integer. */
export type U32 = number;

/** Storage key type. */
export type StorageKey = bytes.Bytes<32> |  bytes.Bytes<31>;

/** Preimage hash type. */
export type PreimageHash = bytes.Bytes<32>;

/** Bytes blob type. */
export type BytesBlob = bytes.BytesBlob;

/** Lookup history slots type. */
export type LookupHistorySlots = number[];

/** Service account information. */
export interface ServiceAccountInfo {
  /** Service id. */
  serviceId: ServiceId;
  /** Balance of the service account. */
  balance?: number;
  /** Nonce of the service account. */
  nonce?: number;
  /** Code hash of the service account. */
  codeHash?: Uint8Array;
  /** Additional account data. */
  [key: string]: unknown;
}

/** Service details. */
export interface Service {
  /** Service id. */
  readonly serviceId: ServiceId;

  /** Retrieve service account info. */
  getInfo(): ServiceAccountInfo;

  /** Read one particular storage item. */
  getStorage(storage: StorageKey): BytesBlob | null;

  /** Check if preimage is present without retrieving the blob. */
  hasPreimage(hash: PreimageHash): boolean;

  /** Retrieve a preimage. */
  getPreimage(hash: PreimageHash): BytesBlob | null;

  /** Retrieve lookup history of a preimage. */
  getLookupHistory(hash: PreimageHash, len: U32): LookupHistorySlots | null;
}

/** State access interface with getService method. */
export interface StateAccess {
  getService(serviceId: ServiceId): Service | null;
  [key: string]: unknown;
}
