import { DataSet } from "vis-data";
import Parser from "$lib/parser";

export interface GraphResult {
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

  public static summary(edges: DataSet<any>): GraphResult {
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

  public static isomorphism(
    inputType: 'list' | 'matrix',
    inputGraphA: string,
    inputGraphB: string
  ): boolean {
    let G1: number[][], G2: number[][];

    // --- Parse JSON input safely ---
    try {
      G1 = JSON.parse(inputGraphA);
      G2 = JSON.parse(inputGraphB);
    } catch {
      throw new Error("Invalid JSON format for one or both graphs.");
    }

    // --- Validation helpers ---
    const isValidAdjList = (G: any): boolean => {
      if (!Array.isArray(G)) return false;
      return G.every(
        (row) =>
          Array.isArray(row) &&
          row.every((v) => Number.isInteger(v) && v >= 0)
      );
    };

    const isValidAdjMatrix = (G: any): boolean => {
      if (!Array.isArray(G)) return false;
      const n = G.length;
      return G.every(
        (row) =>
          Array.isArray(row) &&
          row.length === n &&
          row.every((v) => Number.isInteger(v) && v >= 0)
      );
    };

    // --- Validate based on type ---
    if (inputType === "list") {
      if (!isValidAdjList(G1) || !isValidAdjList(G2))
        throw new Error("Invalid adjacency list input.");
    } else if (inputType === "matrix") {
      if (!isValidAdjMatrix(G1) || !isValidAdjMatrix(G2))
        throw new Error("Invalid adjacency matrix input.");
    } else {
      throw new Error("Input type must be 'list' or 'matrix'.");
    }

    // --- Convert adjacency list → matrix if needed ---
    const listToMatrix = (G: number[][]): number[][] => {
      const n = G.length;
      const M = Array.from({ length: n }, () => Array(n).fill(0));
      for (let i = 0; i < n; i++) {
        for (const j of G[i]) M[i][j]++; // supports parallel edges
      }
      return M;
    };

    if (inputType === "list") {
      G1 = listToMatrix(G1);
      G2 = listToMatrix(G2);
    }

    // --- Check for basic structural differences ---
    if (G1.length !== G2.length) return false;

    // --- Degree pattern check (in-degree + out-degree) ---
    const getDegreeProfile = (M: number[][]) =>
      M.map((row, i) => ({
        out: row.reduce((a, b) => a + b, 0),
        in: M.reduce((a, r) => a + r[i], 0),
      }));

    const d1 = getDegreeProfile(G1);
    const d2 = getDegreeProfile(G2);

    const degPattern1 = d1.map((d) => `${d.in},${d.out}`).sort().join("|");
    const degPattern2 = d2.map((d) => `${d.in},${d.out}`).sort().join("|");
    if (degPattern1 !== degPattern2) return false;

    // --- Brute-force permutation check (small graphs only) ---
    const permute = (arr: number[]): number[][] => {
      if (arr.length <= 1) return [arr];
      const result: number[][] = [];
      for (let i = 0; i < arr.length; i++) {
        const rest = [...arr.slice(0, i), ...arr.slice(i + 1)];
        for (const p of permute(rest)) result.push([arr[i], ...p]);
      }
      return result;
    };

    const n = G1.length;
    const indices = Array.from({ length: n }, (_, i) => i);

    for (const p of permute(indices)) {
      let isIso = true;
      for (let i = 0; i < n && isIso; i++) {
        for (let j = 0; j < n; j++) {
          if (G1[i][j] !== G2[p[i]][p[j]]) {
            isIso = false;
            break;
          }
        }
      }
      if (isIso) return true;
    }

    return false;
  }
}