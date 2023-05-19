import React, { useCallback } from 'react';
import ReactFlow, {
  ReactFlowProvider,
  useNodesState,
  useEdgesState,
  addEdge,
  Controls,
} from 'reactflow';
import 'reactflow/dist/style.css';

function insertLeft(parent, lChild, noLink) {
  // Link child to this parent and vice versa
  lChild.rParent = parent;
  parent.lChild = lChild;

  // Link this child to sibling if it exists.
  if (parent.rChild != null) {
    lChild.rSibling = parent.rChild;
    parent.rChild.lSibling = lChild;
  }

  // Link child to its other parent, but set noLink to prevent overflow.
  if (!noLink && parent.lSibling != null) {
    insertRight(parent.lSibling, lChild, true);
  }
}

function insertRight(parent, rChild, noLink) {
  // Link child to this parent and vice versa
  rChild.lParent = parent;
  parent.rChild = rChild;

  // Link this child to sibling if it exists.
  if (parent.lChild != null) {
    rChild.lSibling = parent.lChild;
    parent.lChild.rSibling = rChild;
  }

  // Link child to its other parent, but set noLink to prevent overflow.
  if (!noLink && parent.rSibling != null) {
    insertLeft(parent.rSibling, rChild, true);
  }
}

function buildTree(depth, values, base) {
  let work = [];
  for (let i = 0; i < depth; i++) {
    work.push(values.shift());
  }

  // Insert initial node to the left
  insertLeft(base, { value: work.shift() });

  // Insert remaining values as R nodes, as that will also link them
  // back to the L parent.
  let curr = base;
  while (work.length > 0 && curr != null) {
    insertRight(curr, { value: work.shift() });
    curr = curr.rSibling;
  }

  if (values.length > 0) {
    buildTree(depth + 1, values, base.lChild);
  }
}

function buildNodesFromTree(root) {
  let id = 0;
  let nodes = [];
  let y = 0;
  let x = 0;
  let node = root;

  while (node != null) {
    id++;

    node.id = id.toString();
    let item = {
      id: id.toString(),
      position: { x: x, y: y },
      data: { label: node.value, source: node },
    };

    // node.item = item;

    nodes.push(item);

    // Move to next sibling
    if (node.rSibling != null) {
      node = node.rSibling;
      x += 200;
    } else {
      // Rewind to beginning of row and take L child
      while (node.lSibling != null) {
        node = node.lSibling;
      }
      // Advance to the next row
      node = node.lChild;
      y += 100;
      x = 0;
    }
  }

  return nodes;
}

// const initialEdges = [{ id: 'e1-2', source: '1', target: '2' }];
function buildEdges(nodes) {
  let edges = [];
  for (let i = 0; i < nodes.length; i++) {
    let node = nodes[i].data.source;

    if (node.lChild != null) {
      let child = node.lChild;
      let edge = {
        id: 'e' + node.id + '-' + child.id,
        source: node.id,
        target: child.id,
      };
      edges.push(edge);
    }
    if (node.rChild != null) {
      let child = node.rChild;
      let edge = {
        id: 'e' + node.id + '-' + child.id,
        source: node.id,
        target: child.id,
      };
      edges.push(edge);
    }
  }
  return edges;
}

function calculateNodeValue(node, chooser) {
  if (node.calculated == undefined)
    node.calculated = chooser(node.value, node.lChild, node.rChild);
  return node.calculated;
}

function chooseMaxSum(nodeValue, lChild, rChild) {
  if (lChild == null && rChild == null) return nodeValue;
  if (lChild == null)
    return nodeValue + calculateNodeValue(rChild, chooseMaxSum);
  if (rChild == null)
    return nodeValue + calculateNodeValue(lChild, chooseMaxSum);

  let lMax = calculateNodeValue(lChild, chooseMaxSum);
  let rMax = calculateNodeValue(rChild, chooseMaxSum);

  return nodeValue + Math.max(lMax, rMax);
}

function relabelNodes(nodes) {
  for (let i = 0; i < nodes.length; i++) {
    let node = nodes[i];
    nodes[i].data.label =
      node.data.source.value +
      ' (' +
      nodes[i].data.source.calculated +
      ')';
  }
}

const max = 3;
const depth = 3;
const root = {
  value: Math.floor(Math.random() * max + 1),
};
let valueCount = (depth / 2) * (1 + depth);
let values = [];

for (let i = 0; i < valueCount - 1; i++) {
  values.push(Math.floor(Math.random() * max + 1));
}

buildTree(2, values, root);

const initialNodes = buildNodesFromTree(root);
const initialEdges = buildEdges(initialNodes);
console.log(initialNodes);
console.log(initialEdges);

export default function Flow({ depth, max }) {
  const [nodes, setNodes, onNodesChange] =
    useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] =
    useEdgesState(initialEdges);
  // const onConnect = useCallback(
  //   (params) => setEdges((els) => addEdge(params, els)),
  //   []
  // );

  let root = {
    value: Math.floor(Math.random() * max + 1),
  };
  let valueCount = (depth / 2) * (1 + depth);
  let values = [];

  for (let i = 0; i < valueCount - 1; i++) {
    values.push(Math.floor(Math.random() * max + 1));
  }

  buildTree(2, values, root);

  const initialNodes = buildNodesFromTree(root);
  const initialEdges = buildEdges(initialNodes);

  calculateNodeValue(root, chooseMaxSum);
  relabelNodes(initialNodes);

  return (
    <div style={{ width: '100vw', height: '100vh' }}>
      <ReactFlowProvider>
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          // onConnect={onConnect}
          fitView
        />
      </ReactFlowProvider>
    </div>
  );
}
