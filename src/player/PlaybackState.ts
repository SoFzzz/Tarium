import type { ITrack } from "../types";

export interface PlaybackState {
  isPlaying: boolean;
  loading: boolean;
  volume: number;
  currentTrack: ITrack | null;
  queue: ITrack[];
}
