import React, { useCallback, useState, useEffect } from 'react';
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

function buildNodesFromTree(root, width=1000) {
  let id = 0;
  let currentDepth = 1;
  let nodes = [];
  let y = 0;
  let xIncrement = width/(currentDepth+1);
  let node = root;

  let maxDepth = 1; 
  while (node.lChild != null){
    maxDepth++;
    node = node.lChild;
  }
  console.log("max depth: " + maxDepth);
  node = root;

  let xOffset = width/maxDepth;
  let xPos = xIncrement - xOffset;
  console.log("Xpos: " + xPos);
  console.log("Offset: " + xOffset);

  while (node != null) {
    id++;

    node.id = id.toString();
    let item = {
      id: id.toString(),
      position: { x: xPos, y: y },
      data: { label: node.value, source: node },
    };

    nodes.push(item);

    // Move to next sibling
    if (node.rSibling != null) {
      node = node.rSibling;
      xPos += xIncrement;
    } else {
      // Rewind to beginning of row and take L child
      while (node.lSibling != null) {
        node = node.lSibling;
      }
      // Advance to the next row
      node = node.lChild;
      y += 100;
      currentDepth++;
      xIncrement = width/(currentDepth+1);
      xPos = xIncrement - xOffset;
      console.log("Xpos: " + xPos);
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

function chooseMinSum(nodeValue, lChild, rChild) {
  if (lChild == null && rChild == null) return nodeValue;
  if (lChild == null)
    return nodeValue + calculateNodeValue(rChild, chooseMinSum);
  if (rChild == null)
    return nodeValue + calculateNodeValue(lChild, chooseMinSum);

  let lMin = calculateNodeValue(lChild, chooseMinSum);
  let rMin = calculateNodeValue(rChild, chooseMinSum);

  return nodeValue + Math.min(lMin, rMin);
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

function buildValues(depth, max) {
  let valueCount = (depth / 2) * (1 + depth);
  let values = [];

  for (let i = 0; i < valueCount; i++) {
    values.push(Math.floor(Math.random() * max + 1));
  }
  return values;
}

const defaultMaxValue = 3;
const defaultDepth = 3;
const defaultValues = buildValues(defaultDepth, defaultMaxValue);
let work = defaultValues.slice();
const root = {
  value: work.shift(),
};

buildTree(2, work, root);

const initialNodes = buildNodesFromTree(root);
const initialEdges = buildEdges(initialNodes);
console.log(initialNodes);
console.log(initialEdges);

export default function Flow() {
  const [nodes, setNodes, onNodesChange] =
    useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] =
    useEdgesState(initialEdges);
  const [depth, setDepth] = useState(3);
  const [max, setMax] = useState(3);
  const [chooser, setChooser] = useState('maxSum');
  const [values, setValues] = useState(defaultValues);

  useEffect(() => {
    calculateNodeValue(root, chooseMaxSum);
    relabelNodes(initialNodes);
  }, []);

  const updateNodes = () => {
    let temp = values.slice();
    const root = {
      value: temp.shift(),
    };

    buildTree(2, temp, root);

    let newNodes = buildNodesFromTree(root);
    let newEdges = buildEdges(newNodes);

    calculateNodeValue(
      root,
      chooser === 'maxSum' ? chooseMaxSum : chooseMinSum
    );

    relabelNodes(newNodes);
    setNodes(newNodes);
    setEdges(newEdges);
  };

  return (
    <div>
      <p>
        <label>
          Depth:
          <input
            type="text"
            name="depth"
            onChange={(e) => {
              let n = Number(e.target.value);
              setDepth(n);
              let newValues = buildValues(n, max);
              setValues(newValues);
              // updateNodes(newValues, chooser);
            }}
            value={depth}
          />
        </label>
        <label>
          Max Value:
          <input
            type="text"
            name="maxValue"
            onChange={(e) => {
              let n = Number(e.target.value);
              setMax(n);
              let newValues = buildValues(depth, n);
              setValues(newValues);
              // updateNodes(newValues, chooser);
            }}
            value={max}
          />
        </label>
      </p>
      <p>
        <input
          type="radio"
          value="maxSum"
          name="chooser"
          checked={chooser === 'maxSum'}
          onChange={(e) => {
            setChooser('maxSum');
            // updateNodes(values, chooseMaxSum);
          }}
        />
        Max Sum
        <input
          type="radio"
          value="minSum"
          name="chooser"
          checked={chooser === 'minSum'}
          onChange={(e) => {
            setChooser('minSum');
            // updateNodes(values, chooseMinSum);
          }}
        />
        Min Value
      </p>
      <p>
        <button
        onClick={() =>{
          updateNodes();
        }}
        >Calculate</button>

      </p>

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
    </div>
  );
}
