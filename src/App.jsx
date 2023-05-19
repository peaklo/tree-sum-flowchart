import React from 'react';
import { useState } from 'react';
import Flow from './Flow';
import ReactFlow, {
  ReactFlowProvider,
  useNodesState,
  useEdgesState,
  useReactFlow,
  addEdge,
  Controls,
} from 'reactflow';


import 'reactflow/dist/style.css';

export default function App() {
  return (
    <div>
      <div style={{ width: '100vw', height: '100vh' }}>
        <ReactFlowProvider>        
          <Flow />
</ReactFlowProvider>

      </div>
    </div>
  );
}
