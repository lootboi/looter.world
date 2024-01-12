export interface History {
  id: number;
  date: Date;
  command: string;
  output: string;
  useMarkdown: boolean;
}
