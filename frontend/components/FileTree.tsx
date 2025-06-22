'use client';

import { useState } from 'react';
import { FileNode } from '../types';

interface FileTreeProps {
  node: FileNode;
  getFileUrl: (filename: string) => string;
  level?: number;
}

function FileTreeNode({ node, getFileUrl, level = 0 }: FileTreeProps) {
  const [isExpanded, setIsExpanded] = useState(level < 2); // Auto-expand first 2 levels

  const handleToggle = () => {
    if (node.isDir) {
      setIsExpanded(!isExpanded);
    }
  };

  const handleFileClick = (filename: string) => {
    const url = getFileUrl(filename);
    window.open(url, '_blank');
  };

  return (
    <div className="select-none">
      <div
        className={`flex items-center py-1 px-2 hover:bg-white/10 rounded cursor-pointer ${
          level === 0 ? 'font-semibold' : ''
        }`}
        style={{ paddingLeft: `${level * 20 + 8}px` }}
        onClick={handleToggle}
      >
        {node.isDir ? (
          <>
            <span className="mr-2 text-yellow-400">
              {isExpanded ? '📂' : '📁'}
            </span>
            <span className="text-white">{node.name}</span>
          </>
        ) : (
          <>
            <span 
              className="mr-2 text-blue-400 cursor-pointer"
              onClick={(e) => {
                e.stopPropagation();
                handleFileClick(node.name);
              }}
            >
              📄
            </span>
            <span 
              className="text-gray-300 hover:text-white cursor-pointer"
              onClick={(e) => {
                e.stopPropagation();
                handleFileClick(node.name);
              }}
            >
              {node.name}
            </span>
          </>
        )}
      </div>

      {node.isDir && isExpanded && node.children && (
        <div>
          {node.children.map((child, index) => (
            <FileTreeNode
              key={`${child.name}-${index}`}
              node={child}
              getFileUrl={getFileUrl}
              level={level + 1}
            />
          ))}
        </div>
      )}
    </div>
  );
}

interface FileTreeComponentProps {
  tree: FileNode;
  getFileUrl: (filename: string) => string;
}

export default function FileTree({ tree, getFileUrl }: FileTreeComponentProps) {
  return (
    <div className="bg-black/40 backdrop-blur-sm rounded-lg p-4 max-h-96 overflow-y-auto">
      <h2 className="text-lg font-semibold text-white mb-4 flex items-center">
        <span className="mr-2">🗑</span>
        Trash Backup Files
      </h2>
      <FileTreeNode node={tree} getFileUrl={getFileUrl} />
    </div>
  );
}
