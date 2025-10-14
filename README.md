<img width="1919" height="944" alt="image" src="https://github.com/user-attachments/assets/e2275414-30d3-43d3-b980-268067b41a4a" />

#### Environment
```
1. Using Svlete 5 with Typescipt v4
2. libs:
  parser - for converting inputs,
  operations - for performing transform tasks,
  analyzer - for graph theoretical analysis
```

#### Setup 
```
git clone <repo>
pnpm run dev
```

#### Features
```
1. Always a directed graph
2. Auto detects multi and simple graph
3. Traverse can be subgraph, but subgraph can't be traverse
4. Isomorphism checks on Graph A and B only
5. Input responsive to state changes
```

#### Examples
```
eg. adjacent list (index is node id)
[ [2,3], [], [0,3], [0,2] ]

eg. traverse
[0,2,0]
```

```
[   [1, 2, 3],   [0, 2, 3],   [0, 1, 3],   [0, 1, 2] ]
[ [2,3,3], [], [0,3], [0,0,2,3,3] ]
[0,1,3,1]
[0,2,0]
```

```
Graph A
[[1,2], [0,2], [0,1,3], [2]]

Graph B
[[1,3], [0,2], [1,3], [0,2]]

Union (nodes connected if either graph has the edge)
[[1,2,3], [0,2], [0,1,3], [0,2,3]]

Intersection (nodes connected only if both graphs have the edge)
[[1], [0,2], [3], [2]]

Cartesian Product (G × H)

Nodes: (i,j) where i ∈ A, j ∈ B → id = i*4 + j

Connect (i,j) to (i',j) if (i,i') ∈ A, and to (i,j') if (j,j') ∈ B

Adjacency list (id = i*4 + j):

[[1,2,4], [0,2,5], [0,1,3,6], [2,7], [0,5,8], [1,4,6,9], [2,5,7,10], [3,6,11], [4,9,8], [5,8,9,10], [6,9,11,10], [7,10,11], [8,11,12], [9,10,13], [10,13,14], [11,12,15]]
```

#### Future
```
1. Slow due to unoptimized use of $effect rune
2. Spaghetti input validation
3. Responsive layout breaks the container of the graphs
4. Operations don't work on multigraphs
```
