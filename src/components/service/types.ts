import type { Service } from '../../types/service';

export interface ServiceData {
  serviceId: number;
  preService: Service | null;
  postService: Service | null;
  preError: string | null;
  postError: string | null;
}

export type RawState = Record<string, string>;

export interface ServiceErrorProps {
  preError: string | null;
  postError: string | null;
}

export interface ServiceIdsInputProps {
  value: string;
  onChange: (value: string) => void;
}
