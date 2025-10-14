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

eg. output
{
isomorphism:true
traverseA:""
traverseB:"cycle"

analysisA:{
Edges:6
Nodes:4
Graph Density:0.5
Graph Type:"Simple"
Special Type:"-"
Adjacency Matrix:[
[0,0,1,1],
[0,0,0,0],
[1,0,0,1],
[1,0,1,0]
]
Adjacency List:[
[2,3],
[],
[0,3],
[0,2]
]
Node Degrees:[2,0,2,2]
Node Neighbors:[
[2,3],
[],
[0,3],
[0,2]
]
}

analysisB:{
Edges:6
Nodes:4
Graph Density:0.5
Graph Type:"Simple"
Special Type:"-"
Adjacency Matrix:[
[0,0,1,1],
[0,0,0,0],
[1,0,0,1],
[1,0,1,0]
]
Adjacency List:[
[2,3],
[],
[0,3],
[0,2]
]
Node Degrees:[2,0,2,2]
Node Neighbors:[
[2,3],
[],
[0,3],
[0,2]
]
}
}
```

#### Future
```
1. Slow due to unoptimized use of $effect rune
2. Spaghetti input validation
3. Responsive layout breaks the container of the graphs
```
