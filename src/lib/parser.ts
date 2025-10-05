import { DataSet } from "vis-data";


export default class Parser {

  public static StringToGraphDataset(input: string, type: 'matrix' | 'list') {
    let graphData;
    try {
      graphData = JSON.parse(input);
      if (!Array.isArray(graphData) || graphData.length === 0 || !graphData.every(Array.isArray)) {
        throw new Error("Invalid graph data: must be an array of arrays");
      }
    } catch (e) {
      throw new Error("Input string must be a valid JSON array of arrays");
    }

    const numNodes = graphData.length;
    const nodes = [];
    for (let i = 0; i < numNodes; i++) {
      nodes.push({ id: i, label: `${i}` });
    }

    const edges: any[] = [];

    if (type === "matrix") {
      if (!graphData.every(row => row.length === numNodes)) {
        throw new Error("Invalid matrix: must be square");
      }

      for (let i = 0; i < numNodes; i++) {
        for (let j = 0; j < numNodes; j++) {
          const count = graphData[i][j];
          if (typeof count === "number" && count > 0) {
            for (let k = 0; k < count; k++) {
              const isLoop = i === j;
                      edges.push({
              id: `${i}-${j}-${k}`,
              from: i,
              to: j,
              smooth: isLoop
                ? false // disable default smoothing for self-loops
                : {
                    enabled: true,
                    type: "curvedCW",
                    roundness: 0.2 + k * 0.2
                  },
              selfReference: isLoop
                ? {
                    size: 30 + k * 2,            // spread loops further out
                    angle: (k % 6) * (Math.PI/3) // fan them around the node
                  }
                : undefined,
              arrows: "to"
            });
            }
          }
        }
      }

    } else if (type === "list") {
      if (!graphData.every(row => Array.isArray(row))) {
        throw new Error("Invalid list: each element must be an array of neighbors");
      }

      const edgeCount: Record<string, number> = {};
      for (let i = 0; i < numNodes; i++) {
        const neighbors = graphData[i];
        for (const j of neighbors) {
          if (typeof j === "number" && j >= 0 && j < numNodes) {
            const key = `${i}-${j}`;
            edgeCount[key] = (edgeCount[key] || 0) + 1;

            const k = edgeCount[key] - 1;
            const isLoop = i === j;

            edges.push({
              id: `${i}-${j}-${k}`,
              from: i,
              to: j,
              smooth: isLoop
                ? false // disable default smoothing for self-loops
                : {
                    enabled: true,
                    type: "curvedCW",
                    roundness: 0.2 + k * 0.2
                  },
              selfReference: isLoop
                ? {
                    size: 30 + k * 2,            // spread loops further out
                    angle: (k % 6) * (Math.PI/3) // fan them around the node
                  }
                : undefined,
              arrows: "to"
            });

          }
        }
      }
    } else {
        throw new Error("Type must be 'matrix' or 'list'");
      }

    return {
      nodes: new DataSet(nodes),
      edges: new DataSet(edges),
    };
  }
  
  public static EdgeDatasetToAdjList(edges: DataSet<any>) {
    // Get all edges as array
    const edgeArr = edges.get();

    // Find max node id to size adjacency list
    const maxId = Math.max(
      ...edgeArr.map(e => Math.max(e.from, e.to))
    );

    // Initialize adjacency list with empty arrays
    const adjList: number[][] = Array.from({ length: maxId + 1 }, () => []);

    // Fill adjacency list
    for (let e of edgeArr) {
      adjList[e.from].push(e.to);
      // If undirected, also add reverse
      // adjList[e.to].push(e.from);
    }

    return adjList;
  }

  public static EdgeDatasetToAdjMatrix(edges: DataSet<any>) {
    const edgeArr = edges.get();

    // Find max node id to size matrix
    const maxId = Math.max(
      ...edgeArr.map(e => Math.max(e.from, e.to))
    );

    // Initialize (n+1) x (n+1) matrix with 0
    const size = maxId + 1;
    const matrix: number[][] = Array.from({ length: size }, () =>
      Array(size).fill(0)
    );

    // Fill matrix
    for (let e of edgeArr) {
      matrix[e.from][e.to] += 1;
      // If undirected, also add reverse:
      // matrix[e.to][e.from] += 1;
    }

    return matrix;
  }
}

