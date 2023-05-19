import React, { useCallback, useState, useEffect } from 'react';
import ReactFlow, {
  ReactFlowProvider,
  useNodesState,
  useEdgesState,
  useReactFlow,
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

function buildNodesFromTree(root, nodeWidth=70, padding=10) {
  let id = 0;
  let currentDepth = 1;
  let nodes = [];
  let y = 0;
  let yIncrement = 60;
  let node = root;

  let maxDepth = 1; 
  while (node.lChild != null){
    maxDepth++;
    node = node.lChild;
  }
  node = root;

  // Leave 10 gap between elements
  let xIncrement = nodeWidth + padding;
  let maxWidth = (maxDepth * nodeWidth) + ((maxDepth+1)*padding);
  let lineWidth = (currentDepth * nodeWidth) + ((currentDepth+1)*padding);
  let xPos = maxWidth - (lineWidth/2);

  console.log("Xpos: " + xPos);

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
      y += yIncrement;
      currentDepth++;
      lineWidth = (currentDepth * nodeWidth) + ((currentDepth+1)*padding);
      xPos = maxWidth - (lineWidth/2);
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

function calculateNodeValue(node, chooser, saveCalculation=true) {
  if (node.calculated == undefined){
    let value = chooser(node.value, node.lChild, node.rChild, saveCalculation);

    if (saveCalculation)
      node.calculated = value;
    else return value;
  }
  return node.calculated;
}

function chooseMaxSum(nodeValue, lChild, rChild, saveCalculation) {
  if (lChild == null && rChild == null) return nodeValue;
  if (lChild == null)
    return nodeValue + calculateNodeValue(rChild, chooseMaxSum, saveCalculation);
  if (rChild == null)
    return nodeValue + calculateNodeValue(lChild, chooseMaxSum, saveCalculation);

  let lMax = calculateNodeValue(lChild, chooseMaxSum, saveCalculation);
  let rMax = calculateNodeValue(rChild, chooseMaxSum, saveCalculation);

  return nodeValue + Math.max(lMax, rMax);
}

function chooseMinSum(nodeValue, lChild, rChild) {
  if (lChild == null && rChild == null) return nodeValue;
  if (lChild == null)
    return nodeValue + calculateNodeValue(rChild, chooseMinSum, saveCalculation);
  if (rChild == null)
    return nodeValue + calculateNodeValue(lChild, chooseMinSum, saveCalculation);

  let lMin = calculateNodeValue(lChild, chooseMinSum, saveCalculation);
  let rMin = calculateNodeValue(rChild, chooseMinSum, saveCalculation);

  return nodeValue + Math.min(lMin, rMin);
}

function relabelNodes(nodes) {
  for (let i = 0; i < nodes.length; i++) {
    let node = nodes[i];
    nodes[i].data.label =
      node.data.source.value +
      ' (' +
      (nodes[i].data.source.calculated ?? 0) +
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
  const [elapsed, setElapsed] = useState(0);
  const [saveCalculations, setSaveCalculations] = useState(true);

  useEffect(() => {
    let startTime = new Date();
    calculateNodeValue(root, chooseMaxSum, saveCalculations);
    setElapsed(new Date() - startTime);
    relabelNodes(initialNodes);
  }, []);

  const generateNodes = () => {
    let temp = values.slice();
    const root = {
      value: temp.shift(),
    };

    buildTree(2, temp, root);

    let newNodes = buildNodesFromTree(root);
    let newEdges = buildEdges(newNodes);

    root.calculated = calculateNodeValue(
      root,
      chooser === 'maxSum' ? chooseMaxSum : chooseMinSum,
      saveCalculations 
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
            }}
            value={max}
          />
        </label>
      </p>
      <p>
        <input
          type="radio"
          value={saveCalculations}
          name="saveCalc"
          checked={saveCalculations === true}
          onChange={(e) => {
            setSaveCalculations(true);
          }}
        />
        Save Calculations
        <input
          type="radio"
          value={false}
          name="saveCalc"
          checked={saveCalculations === false}
          onChange={(e) => {
            setSaveCalculations(false);
          }}
        />
        Discard
      </p>

      <p>
        <input
          type="radio"
          value="maxSum"
          name="chooser"
          checked={chooser === 'maxSum'}
          onChange={(e) => {
            setChooser('maxSum');
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
          }}
        />
        Min Value
      </p>
      <p>
        <button
        onClick={() =>{
          setElapsed(0);
          generateNodes();
        }}
        >Generate</button>
        <button
        onClick={() =>{
          let startTime = new Date();          
          generateNodes(true);
          let endTime = new Date();
          setElapsed(endTime - startTime);
        }}
        >Calculate</button>
        Calculated in {elapsed} ms
      </p>

      <div style={{ width: '90vw', height: '80vh' }}>
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            nodesDraggable={false}
            fitView
          >
            <Controls />
            </ReactFlow>
      </div>
    </div>
  );
}
