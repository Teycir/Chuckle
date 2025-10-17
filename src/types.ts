export interface MemeRequest {
  text: string;
}

export interface MemeResponse {
  imageUrl: string;
  template: string;
}

export interface GeminiResponse {
  candidates: Array<{
    content: {
      parts: Array<{
        text: string;
      }>;
    };
  }>;
  error?: {
    message: string;
  };
}

export interface MemeData {
  text: string;
  imageUrl: string;
  originalUrl?: string;
  template: string;
  timestamp: number;
  language: string;
  originalInput?: string;
}

export interface StorageResult {
  [key: string]: MemeData;
}
