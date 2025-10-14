# 🕸️ Graph Theory Visualizer

A Svelte 5-based interactive tool for visualizing and analyzing directed graphs with support for graph operations, traversal, and isomorphism detection. 📊

![Graph Theory Visualizer](https://github.com/user-attachments/assets/e2275414-30d3-43d3-b980-268067b41a4a)

## 🚀 Features

- ✅ **Directed Graph Visualization** - All graphs are directed by default
- 🔍 **Auto-detection** - Automatically identifies multi-graphs and simple graphs
- 🧭 **Graph Traversal** - Traverse existing graphs (subgraphs can be created but not traversed)
- 🔄 **Isomorphism Detection** - Check if Graph A and Graph B are isomorphic
- ⚡ **Reactive Inputs** - Real-time state updates as you modify graph data

## 🛠️ Tech Stack

- **Framework:** Svelte 5 with TypeScript v4
- **Libraries:**
  - 📝 `parser` - Input conversion and parsing
  - ⚙️ `operations` - Graph transformation tasks
  - 🔬 `analyzer` - Graph theoretical analysis

## 🏁 Getting Started

```bash
# Clone the repository
git clone <repo>

# Install dependencies and run
pnpm run dev
```

## 📝 Input Format

### Adjacency List
Represent graphs using adjacency lists where the index corresponds to the node ID:

```javascript
// Simple graph
[[2,3], [], [0,3], [0,2]]
```

### Traversal Path
Specify a path through the graph:

```javascript
[0,2,0]
```

## 💡 Examples

### Example 1: Complete Graph K₄
```javascript
// Each node connected to all others
[[1, 2, 3], [0, 2, 3], [0, 1, 3], [0, 1, 2]]
```

### Example 2: Multi-graph with Traversal 🔀
```javascript
// Graph with multiple edges
[[2,3,3], [], [0,3], [0,0,2,3,3]]

// Traversal paths
[0,1,3,1]
[0,2,0]
```

### Example 3: Graph Operations 🧮

**Graph A:**
```javascript
[[1,2], [0,2], [0,1,3], [2]]
```

**Graph B:**
```javascript
[[1,3], [0,2], [1,3], [0,2]]
```

**Union** ∪ (nodes connected if edge exists in either graph):
```javascript
[[1,2,3], [0,2], [0,1,3], [0,2,3]]
```

**Intersection** ∩ (nodes connected only if edge exists in both graphs):
```javascript
[[1], [0,2], [1,3], [2]]
```

**Cartesian Product** × :
```javascript
0: [1, 3, 4, 8]
1: [0, 2, 5, 9]
2: [1, 3, 6, 10]
3: [0, 2, 7, 11]
4: [0, 5, 7, 8]
5: [1, 4, 6, 9]
6: [2, 5, 7, 10]
7: [3, 4, 6, 11]
8: [0, 4, 9, 11, 12]
9: [1, 5, 8, 10, 13]
10: [2, 6, 9, 11, 14]
11: [3, 7, 8, 10, 15]
12: [8, 13, 15]
13: [9, 12, 14]
14: [10, 13, 15]
15: [11, 12, 14]
```

## ⚠️ Known Issues

**Current Limitations:**

1. 🐌 **Performance** - Slow due to unoptimized use of Svelte 5's `$effect` rune
2. 🍝 **Input Validation** - Complex validation logic needs refactoring
3. 📱 **Responsive Layout** - Container breaks on smaller screens
4. 🚫 **Multi-graph Support** - Graph operations currently don't work on multi-graphs

## 🤝 Contributing

Contributions are welcome! Feel free to submit issues and pull requests. 💪

## 📄 License

[Add your license here]
