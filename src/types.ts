export interface ITrack {
  id: string;
  videoId: string;
  title: string;
  artist: string;
  thumbnailUrl: string;
  durationInSeconds?: number;
  album?: string;
}
