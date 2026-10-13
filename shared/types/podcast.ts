export interface Podcast {
  id: string;
  title: string;
  host: string;
  duration: string;
  description: string;
  thumbnail?: string;
  audioUrl: string;
  episode: number;
}
