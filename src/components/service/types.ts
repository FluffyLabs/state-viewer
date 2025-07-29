import type { Service, StateAccess } from '../../types/service';

export interface ServiceData {
  serviceId: number;
  preService: Service | null;
  postService: Service | null;
  preError: string | null;
  postError: string | null;
}

export interface ServiceViewerProps {
  preStateAccess?: StateAccess | null;
  postStateAccess?: StateAccess | null;
}

export interface ServiceCardProps {
  serviceData: ServiceData;
  isDiffMode: boolean;
}

export interface ServiceInfoProps {
  serviceData: ServiceData;
  isDiffMode: boolean;
}

export interface StorageQueryProps {
  serviceId: number;
  service: Service;
  disabled?: boolean;
}

export interface PreimageQueryProps {
  serviceId: number;
  service: Service;
  disabled?: boolean;
}

export interface LookupHistoryQueryProps {
  serviceId: number;
  service: Service;
  disabled?: boolean;
}

export interface ServiceErrorProps {
  preError: string | null;
  postError: string | null;
}

export interface ServiceIdsInputProps {
  value: string;
  onChange: (value: string) => void;
}