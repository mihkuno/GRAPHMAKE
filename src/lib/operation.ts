import { DataSet } from "vis-data/esnext";
import { Network } from "vis-network/esnext";

type GraphType = 'list' | 'matrix';

interface VisData {
  nodes: DataSet<any>;
  edges: DataSet<any>;
}

export default class Operation {
  private static parseGraph(type: GraphType, str: string): number[][] {
    let data: unknown;
    try {
      data = JSON.parse(str);
    } catch (e) {
      throw new Error('Invalid JSON');
    }
    if (!Array.isArray(data)) throw new Error('Not an array');
    const n = data.length;
    if (n === 0) throw new Error('Empty graph');
    let adj: number[][] = Array.from({length: n}, () => []);
    if (type === 'list') {
      for (let i = 0; i < n; i++) {
        const neighbors = data[i];
        if (!Array.isArray(neighbors)) throw new Error('Neighbor list not an array');
        const seen = new Set<number>();
        for (let j of neighbors) {
          if (typeof j !== 'number' || !Number.isInteger(j) || j < 0 || j >= n || j === i || seen.has(j)) throw new Error('Invalid neighbor');
          seen.add(j);
          adj[i].push(j);
        }
      }
    } else { // matrix
      for (let i = 0; i < n; i++) {
        const row = data[i];
        if (!Array.isArray(row) || row.length !== n) throw new Error('Invalid matrix row');
        for (let j = 0; j < n; j++) {
          const val = row[j];
          if (val !== 0 && val !== 1) throw new Error('Matrix entries must be 0 or 1');
          if (val === 1) {
            if (i === j) throw new Error('No self-loops');
            adj[i].push(j);
          }
        }
      }
    }
    // No symmetry check for directed graphs
    // Sort adjacency lists for consistency
    for (let i = 0; i < n; i++) {
      adj[i].sort((x, y) => x - y);
    }
    return adj;
  }

  private static getEdges(adj: number[][]): Set<string> {
    const edges = new Set<string>();
    for (let i = 0; i < adj.length; i++) {
      for (let j of adj[i]) {
        edges.add(`${i}->${j}`);
      }
    }
    return edges;
  }

  private static toVisData(numNodes: number, edges: Set<string>): VisData {
    const nodes = new DataSet(Array.from({ length: numNodes }, (_, id) => ({ id })));
    const edgeList = Array.from(edges).map(key => {
      const [from, to] = key.split('->').map(Number);
      return { id: key, from, to };
    }).sort((e1, e2) => e1.from - e2.from || e1.to - e2.to);
    const edgesDS = new DataSet(edgeList);
    return { nodes, edges: edgesDS };
  }

  public static union(type: GraphType, a: string, b: string): VisData {
    const adjA = this.parseGraph(type, a);
    const adjB = this.parseGraph(type, b);
    if (adjA.length !== adjB.length) throw new Error('Graphs must have the same number of nodes');
    const n = adjA.length;
    const edgesA = this.getEdges(adjA);
    const edgesB = this.getEdges(adjB);
    const unionEdges = new Set([...edgesA, ...edgesB]);
    return this.toVisData(n, unionEdges);
  }

  public static intersection(type: GraphType, a: string, b: string): VisData {
    const adjA = this.parseGraph(type, a);
    const adjB = this.parseGraph(type, b);
    if (adjA.length !== adjB.length) throw new Error('Graphs must have the same number of nodes');
    const n = adjA.length;
    const edgesA = this.getEdges(adjA);
    const edgesB = this.getEdges(adjB);
    const interEdges = new Set([...edgesA].filter(x => edgesB.has(x)));
    return this.toVisData(n, interEdges);
  }

  public static complement(type: GraphType, g: string): VisData {
    const adj = this.parseGraph(type, g);
    const n = adj.length;
    const originalEdges = this.getEdges(adj);
    const complementEdges = new Set<string>();
    for (let i = 0; i < n; i++) {
      for (let j = 0; j < n; j++) {
        if (i !== j) {
          const key = `${i}->${j}`;
          if (!originalEdges.has(key)) {
            complementEdges.add(key);
          }
        }
      }
    }
    return this.toVisData(n, complementEdges);
  }

  public static cartesianProduct(type: GraphType, a: string, b: string): VisData {
    const adjA = this.parseGraph(type, a);
    const adjB = this.parseGraph(type, b);
    const na = adjA.length;
    const nb = adjB.length;
    const n = na * nb;
    const edges = new Set<string>();
    for (let i = 0; i < na; i++) {
      for (let j = 0; j < nb; j++) {
        // Edges from A: (i,j) -> (ip,j) for ip in adjA[i]
        for (let ip of adjA[i]) {
          const v1 = i * nb + j;
          const v2 = ip * nb + j;
          edges.add(`${v1}->${v2}`);
        }
        // Edges from B: (i,j) -> (i,jp) for jp in adjB[j]
        for (let jp of adjB[j]) {
          const v1 = i * nb + j;
          const v2 = i * nb + jp;
          edges.add(`${v1}->${v2}`);
        }
      }
    }
    return this.toVisData(n, edges);
  }
}