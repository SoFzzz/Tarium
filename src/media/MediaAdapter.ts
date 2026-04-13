import type { ITrack } from "../types";

export interface MediaAdapter {
  play(track: ITrack): Promise<void> | void;
  pause(): Promise<void> | void;
  setVolume(volume: number): void;
  seekTo?(seconds: number): void;
}
