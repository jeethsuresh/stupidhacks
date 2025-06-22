// File tree types for Go backend
export interface FileNode {
  name: string;
  isDir: boolean;
  children?: FileNode[];
}

// Black hole session types for upload/download backend
export interface SessionData {
  session_id: string;
  message: string;
  next_step: string;
}

export interface FileDelivery {
  type: 'file_delivery';
  file_id: string;
  filename: string;
  file_size: number;
  content_type: string;
  uploaded_at: string;
  file_content: string;
}

export interface WebSocketMessage {
  type: string;
  [key: string]: any;
}

export interface UploadResponse {
  file_id: string;
  filename: string;
  size: number;
  message: string;
}

// Animation types
export interface FallingFile {
  id: string;
  filename: string;
  startTime: number;
}

export interface EmergingFile {
  id: string;
  filename: string;
  fileContent: string;
}
