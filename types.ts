
export interface SermonState {
  topic: string;
  content: string;
  isGenerating: boolean;
  isPlaying: boolean;
  error: string | null;
}

export enum PredefinedTopics {
  ANITYA = 'අනිත්‍යය (Impermanence)',
  METTA = 'මෙත්තාව (Loving Kindness)',
  DANA = 'දානය (Generosity)',
  KARUNA = 'කරුණාව (Compassion)',
  SATHI = 'සතිය (Mindfulness)',
  KARMA = 'කර්මය (Action and Result)'
}
