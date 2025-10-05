import { DataSet } from "vis-data";

import Parser from "$lib/parser";

interface GraphResult {
  Edges: number;
  Nodes: number;
  'Graph Density': number;
  'Graph Type': 'Simple' | 'Multi';
  'Special Type': string;
  'Adjacency Matrix': number[][];
  'Adjacency List': number[][];
  'Node Degrees': number[];
  'Node Neighbors': number[][];
}

export default class Analyzer {

  public static GraphFromEdges(edges: DataSet<any>): GraphResult {
    const edgeArr = edges.get();
    if (edgeArr.length === 0) {
      return {
        Edges: 0,
        Nodes: 0,
        'Graph Density': 0,
        'Graph Type': 'Simple',
        'Special Type': '-',
        'Adjacency Matrix': [],
        'Adjacency List': [],
        'Node Degrees': [],
        'Node Neighbors': []
      };
    }

    const adjMatrix = Parser.EdgeDatasetToAdjMatrix(edges);
    const adjListRaw = Parser.EdgeDatasetToAdjList(edges);
    const n = adjMatrix.length;

    if (n === 0 || adjMatrix.every(row => row.every(val => val === 0))) {
      return {
        Edges: 0,
        Nodes: 0,
        'Graph Density': 0,
        'Graph Type': 'Simple',
        'Special Type': '-',
        'Adjacency Matrix': [],
        'Adjacency List': [],
        'Node Degrees': [],
        'Node Neighbors': []
      };
    }

    // Compute total edges
    let totalEdges = 0;
    for (let i = 0; i < n; i++) {
      for (let j = 0; j < n; j++) {
        totalEdges += adjMatrix[i][j];
      }
    }

    // Type: Simple or Multi
    let isSimple = true;
    for (let i = 0; i < n; i++) {
      if (adjMatrix[i][i] > 0) isSimple = false;
      for (let j = 0; j < n; j++) {
        if (adjMatrix[i][j] > 1) isSimple = false;
      }
    }
    const type: 'Simple' | 'Multi' = isSimple ? 'Simple' : 'Multi';

    // Density (fixed: exclude self-loops for simple graphs)
    const maxPossibleEdges = isSimple ? n * (n - 1) : n * n;
    const density = totalEdges / maxPossibleEdges;

    // Special type checks
    function isComplete(): boolean {
      for (let i = 0; i < n; i++) {
        for (let j = 0; j < n; j++) {
          if (i !== j && adjMatrix[i][j] < 1) return false;
        }
      }
      return true;
    }

    function isBipartite(): boolean {
      for (let i = 0; i < n; i++) {
        if (adjMatrix[i][i] > 0) return false;
      }
      const undirAdj: number[][] = Array.from({ length: n }, () => []);
      for (let i = 0; i < n; i++) {
        for (let j = i + 1; j < n; j++) {
          if (adjMatrix[i][j] > 0 || adjMatrix[j][i] > 0) {
            undirAdj[i].push(j);
            undirAdj[j].push(i);
          }
        }
      }
      const colors: number[] = new Array(n).fill(-1);
      for (let start = 0; start < n; start++) {
        if (colors[start] === -1) {
          const queue: number[] = [start];
          colors[start] = 0;
          let idx = 0;
          while (idx < queue.length) {
            const u = queue[idx++];
            for (let v of undirAdj[u]) {
              if (colors[v] === -1) {
                colors[v] = 1 - colors[u];
                queue.push(v);
              } else if (colors[v] === colors[u]) {
                return false;
              }
            }
          }
        }
      }
      return true;
    }

    function isTree(): boolean {
      for (let i = 0; i < n; i++) {
        if (adjMatrix[i][i] > 0) return false;
      }
      const undirAdj: number[][] = Array.from({ length: n }, () => []);
      let e = 0;
      for (let i = 0; i < n; i++) {
        for (let j = i + 1; j < n; j++) {
          if (adjMatrix[i][j] > 0 || adjMatrix[j][i] > 0) {
            undirAdj[i].push(j);
            undirAdj[j].push(i);
            e++;
          }
        }
      }
      if (e !== n - 1) return false;
      const visited: boolean[] = new Array(n).fill(false);
      const stack: number[] = [0];
      visited[0] = true;
      let visitedCount = 1;
      while (stack.length > 0) {
        const u = stack.pop()!;
        for (let v of undirAdj[u]) {
          if (!visited[v]) {
            visited[v] = true;
            visitedCount++;
            stack.push(v);
          }
        }
      }
      return visitedCount === n;
    }

    let special = '-';
    if (isTree()) special = 'Tree';
    else if (isBipartite()) special = 'Bipartite';
    else if (isComplete()) special = 'Complete';

    // Degrees
    const outDegrees: number[] = adjListRaw.map(nbrs => nbrs.length);

    // Neighbors (unique)
    const nodeNeighbors: number[][] = adjListRaw.map(nbrs => Array.from(new Set(nbrs)));

    return {
      Edges: totalEdges,
      Nodes: n,
      'Graph Density': density,
      'Graph Type': type,
      'Special Type': special,
      'Adjacency Matrix': adjMatrix,
      'Adjacency List': adjListRaw,
      'Node Degrees': outDegrees,
      'Node Neighbors': nodeNeighbors
    };
  }
}