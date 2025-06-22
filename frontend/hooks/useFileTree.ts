'use client';

import { useState, useEffect, useCallback } from 'react';
import { FileNode } from '../types';

const GO_API_BASE = 'http://localhost:8080';

export function useFileTree() {
  const [fileTree, setFileTree] = useState<FileNode | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchFileTree = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch(`${GO_API_BASE}/api/tree`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch file tree');
      }
      
      const tree: FileNode = await response.json();
      setFileTree(tree);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch file tree on mount
  useEffect(() => {
    fetchFileTree();
  }, [fetchFileTree]);

  // Generate file URL for Go backend
  const getFileUrl = useCallback((filename: string) => {
    return `${GO_API_BASE}/files/${filename}`;
  }, []);

  return {
    fileTree,
    loading,
    error,
    refetch: fetchFileTree,
    getFileUrl,
  };
}
