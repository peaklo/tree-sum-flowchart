# tree-sum-flowchart
sum elements in conjoined bin tree

npm i
npm run dev

The tree is like a binary tree (balanced and complete) with the additional feature that each parent is linked to the closest child of it's sibling.
So instead of the following true binary tree
    A
 B     C
D E   F G 

The graph is the following:

    A
  B   C
D   E   F  

Each node has a value assigned randomly from 1 to the input max.
The tree has a number of levels equal to the configured depth.

generate - generate a new set of values and depth if necessary
calculate - calculate the max (or min) path through the graph.

save calculations - when enabled, each node value will only be calculated once.  If disabled, the whole tree has to be recalculated at every step, and quickly becomes impossible to calculate.
