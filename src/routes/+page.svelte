<script lang="ts">
    import { onMount } from "svelte";
    import { DataSet } from "vis-data/esnext";
    import { Network } from "vis-network/esnext";
    import type { Options } from "vis-network";

    import Parser from "$lib/parser";
    import Analyzer from "$lib/analyzer";

    let divGraphA: HTMLDivElement;
    let divGraphB: HTMLDivElement;
    let divSubgraphA: HTMLDivElement;
    let divSubgraphB: HTMLDivElement;

    let graphA: Network;
    let graphB: Network;
    let subgraphA: Network;
    let subgraphB: Network;

    let inputGraphA = $state('');
    let inputGraphB = $state('');
    let inputTraverseA = $state('');
    let inputTraverseB = $state('');
    let inputType = $state<'list' | 'matrix'>('list');
    let outputAnalysis = $state('');

    function handleInputGraph(input: string, graph: Network) {
        try {
            const dataset = Parser.StringToGraphDataset(input, inputType);
            const analysis = Analyzer.summary(dataset.edges);
            graph.setData(dataset);
            console.log(inputType, analysis);
        } 
        catch (e) {
            graph.setData({ nodes: new DataSet([]), edges: new DataSet([]) });
            console.warn("Invalid input", e);
        }
    }

    function handleTraverseGraph(input: string, graph: Network, subgraph: Network) {
        const sequence: (string | number)[] = JSON.parse(input);

        const nodesData = (graph as any).body.data.nodes as DataSet<any>;
        const edgesData = (graph as any).body.data.edges as DataSet<any>;

        // Reset all nodes
        nodesData.forEach((node) => {
            nodesData.update({
            id: node.id,
            color: { background: "#A855F7", border: "#A855F7" },
            });
        });

        // Reset all edges
        edgesData.forEach((edge) => {
            edgesData.update({
            id: edge.id,
            color: "#4B5563",
            });
        });

        // Check if valid walk
        let isValid = true;
        for (let i = 0; i < sequence.length - 1; i++) {
            const from = sequence[i];
            const to = sequence[i + 1];
            const connecting = edgesData.get({
            filter: (item: any) => item.from === from && item.to === to,
            });
            if (connecting.length === 0) {
            isValid = false;
            break;
            }
        }

        // Determine type
        let type: "invalid" | "cycle" | "path" | "walk";
        if (!isValid) {
            type = "invalid";
        } else {
            const uniqueNodes = new Set(sequence);
            const isClosed = sequence.length > 0 && sequence[0] === sequence[sequence.length - 1];
            if (isClosed && uniqueNodes.size === sequence.length - 1) {
            type = "cycle";
            } else if (uniqueNodes.size === sequence.length) {
            type = "path";
            } else {
            type = "walk";
            }
        }
        console.log(type);

        // Highlight nodes
        const highlightNodes = new Set(sequence);
        highlightNodes.forEach((nodeId) => {
            nodesData.update({
            id: nodeId,
            color: { background: "#EC4899", border: "#FFFFFF" },
            });
        });

        // Highlight traversed edges
        const highlightEdgeIds = new Set<string | number>();
        for (let i = 0; i < sequence.length - 1; i++) {
            const from = sequence[i];
            const to = sequence[i + 1];
            const connecting = edgesData.get({
            filter: (item: any) => item.from === from && item.to === to,
            });
            connecting.forEach((edge: any) => highlightEdgeIds.add(edge.id));
        }

        highlightEdgeIds.forEach((edgeId) => {
            edgesData.update({
            id: edgeId,
            color: "#FDE047",
            });
        });

        // Build subgraph
        const subNodes = new DataSet<any>();
        highlightNodes.forEach((nodeId) => {
            const node = nodesData.get(nodeId);
            if (node) subNodes.add(node);
        });

        const subEdges = new DataSet<any>();
        const inducedEdges = edgesData.get({
            filter: (item: any) => highlightNodes.has(item.from) && highlightNodes.has(item.to),
        });
        subEdges.add(inducedEdges);

        subgraph.setData({ nodes: subNodes, edges: subEdges });
    }

    $effect(() => { // input type
        if (inputType) {
            if (graphA && graphB && subgraphA && subgraphB) {
                // erase all
                handleInputGraph('[]', graphA);
                handleInputGraph('[]', graphB);
                handleTraverseGraph('[]', graphA, subgraphA);
                handleTraverseGraph('[]', graphB, subgraphB);
                inputGraphA = '';
                inputGraphB = '';
                inputTraverseA = '';
                inputTraverseB = '';
            }
        }
    })
    $effect(() => { // input graph 
        if (inputGraphA && graphA) {
            handleInputGraph(inputGraphA, graphA);
            // erase
            handleTraverseGraph('[]', graphA, subgraphA);
            inputTraverseA = '';
        }
    });
    $effect(() => {
        if (inputGraphB && graphB) {
            handleInputGraph(inputGraphB, graphB);
            // erase
            handleTraverseGraph('[]', graphB, subgraphB);
            inputTraverseB = '';
        }
    });
    
    // traverse graph
    $effect(() => { 
        if (inputTraverseA && graphA && subgraphA) {
            handleTraverseGraph(inputTraverseA, graphA, subgraphA);
        }
    });
    $effect(() => {
        if (inputTraverseB && graphB && subgraphB) {
            handleTraverseGraph(inputTraverseB, graphB, subgraphB);
        }
    });

    // isomorphism
    $effect(() => {
        if (inputType && inputGraphA && inputGraphB) {
            const output = Analyzer.isomorphism(inputType, inputGraphA, inputGraphB);
            console.log("Isomorphism:", output);
        }
    });
    
    const options: Options = {
        interaction: {
            multiselect: true,
        },
        physics: {
            enabled: false,
        },
        edges: {
            chosen: false, // disable highlight on select
            arrows: {
                to: { enabled: true, scaleFactor: 0.5 }
            },
            color: {
                color: "#4B5563",
                highlight: "#FDE047",
                hover: "#FDE047",
                inherit: 'from',
                opacity: 0.8,
            },
            smooth: {
                enabled: true,
                type: "curvedCW",
                roundness: 0.2
            },
            width: 2.5,
        },
        nodes: {
            chosen: false, // disable highlight on select
            shape: "circle",
            color: {
                border: "#A855F7",
                background: "#A855F7",
                highlight: { border: "#FFFFFF", background: "#EC4899" },
                hover: { border: "#FFFFFF", background: "#EC4899" }
            },
            font: {
                size: 18,
                color: "#ffffff",
                face: "Outfit, sans-serif",
            },
            margin: {
                top: 15, 
                bottom: 15, 
                left: 15, 
                right: 15
            },
        }
    };

    const dataset =
    { 
    nodes: new DataSet([
        { id: 1, label: "1" },
        { id: 2, label: "2" },
        { id: 3, label: "3" },
        { id: 4, label: "4" },
        { id: 5, label: "5" },]), 
    edges: new DataSet([
        { id: 1, from: 1, to: 3 },
        { id: 2, from: 1, to: 2 },
        { id: 3, from: 2, to: 4 },
        { id: 4, from: 2, to: 5 },
        { id: 5, from: 5, to: 2 },
        { id: 6, from: 3, to: 3 },
        ]) 
    };
        
    onMount(() => {        
        graphA = new Network(divGraphA!, dataset, options);
        graphB = new Network(divGraphB!, dataset, options);
        subgraphA = new Network(divSubgraphA!, dataset, options);
        subgraphB = new Network(divSubgraphB!, dataset, options);        
    });

</script>

<div class="flex gap-8 p-12 h-screen text-gray-50">

    <div class="flex flex-col flex-1 gap-4">
        <h2>Input</h2>        
        <div class="flex justify-around gap-2">
            <div class="flex gap-2 items-center">
                <input bind:group={inputType} type="radio" name="inputType" value="list" /> Adjacent List
            </div>
            <div class="flex gap-2 items-center">
                <input bind:group={inputType} type="radio" name="inputType" value="matrix" /> Adjacent Matrix
            </div>
        </div>
        <input bind:value={inputGraphA} type="text" class="p-4 bg-gray-700 text-gray-50 rounded-lg resize-none" placeholder="Graph A"/>
        <input bind:value={inputGraphB} type="text" class="p-4 bg-gray-700 text-gray-50 rounded-lg resize-none" placeholder="Graph B"/>

        <h2>Traverse</h2>        
        <input bind:value={inputTraverseA} type="text" class="p-4 bg-gray-700 text-gray-50 rounded-lg resize-none" placeholder="Graph A"/>
        <input bind:value={inputTraverseB} type="text" class="p-4 bg-gray-700 text-gray-50 rounded-lg resize-none" placeholder="Graph B"/>

        <h2>Operations</h2>        
        <button class="flex items-center gap-2 px-5 py-4 rounded-2xl font-medium 
                    bg-gray-700 text-gray-100 shadow-md 
                    hover:bg-indigo-600 hover:scale-101 
                    active:scale-99 transition transform duration-200 cursor-pointer">
            <span class="text-lg font-bold text-yellow-300">∪</span>
            Union
        </button>
        <button class="flex items-center gap-2 px-5 py-4 rounded-2xl font-medium 
                    bg-gray-700 text-gray-100 shadow-md 
                    hover:bg-indigo-600 hover:scale-101 
                    active:scale-99 transition transform duration-200 cursor-pointer">
            <span class="text-lg font-bold text-yellow-300">∩</span>
            Intersection
        </button>
        <button class="flex items-center gap-2 px-5 py-4 rounded-2xl font-medium 
                    bg-gray-700 text-gray-100 shadow-md 
                    hover:bg-indigo-600 hover:scale-101 
                    active:scale-99 transition transform duration-200 cursor-pointer">
            <span class="text-lg font-bold text-yellow-300">⊖</span>
            Complement
        </button>
        <button class="flex items-center gap-2 px-5 py-4 rounded-2xl font-medium 
                    bg-gray-700 text-gray-100 shadow-md 
                    hover:bg-indigo-600 hover:scale-101 
                    active:scale-99 transition transform duration-200 cursor-pointer">
            <span class="text-lg font-bold text-yellow-300">×</span>
            Cartesian Product
        </button>
    </div>


    <div class="flex flex-2 gap-4">    
        
        <div class="flex gap-4 flex-col flex-1">
            <div class="flex flex-col gap-2 flex-1 min-h-32 min-w-32">
                <h2>Graph A</h2>
                <div bind:this={divGraphA} class="min-h-32 min-w-32 flex-1 border-2 rounded-lg"></div>
            </div>
            <div class="flex flex-col gap-2 flex-1 min-h-32 min-w-32">
                <h2>Graph B</h2>
                <div bind:this={divGraphB} class="min-h-32 min-w-32 flex-1 border-2 rounded-lg"></div>
            </div>
        </div>

        <div class="flex gap-4 flex-col flex-1">
            <div class="flex flex-col gap-2 flex-1 min-h-32 min-w-32">
                <h2>Subgraph A</h2>
                <div bind:this={divSubgraphA} class="min-h-32 min-w-32 flex-1 border-2 rounded-lg"></div>
            </div>
            <div class="flex flex-col gap-2 flex-1 min-h-32 min-w-32">
                <h2>Subgraph B</h2>
                <div bind:this={divSubgraphB} class="min-h-32 min-w-32 flex-1 border-2 rounded-lg"></div>
            </div>
        </div>
        
    </div>

    <div class="flex flex-col flex-1 gap-4">    
        <h2>Analysis</h2>
        <div class="flex flex-col gap-4 p-4 bg-gray-800 rounded-xl shadow-2xl flex-3 overflow-auto">
            <pre class="text-gray-50 text-sm">
                <code>{outputAnalysis}<!-- 
default
- adjacency list representation
- matrix resentation
- special graph identification
selected a bunch of nodes
- is walk, path, or cycle
- enable extract subgraph button and override the viewer-->
Isomorphism: 
Graphs: False
Subgraphs: True

Graph A:
Edges: 6
Nodes: 5
Graph Density: 0.6

Type: Simple
Directed: False
Special: True
Special Type: Complete

Traversal: True
Traversal Type: Walk
Traversal List: 1 -> 2

Adjacency Matrix: []
Adjacency List: []
Node Degrees: []
Node Neighbors: []

Graph B:
Type: Multi
Loops: False
Directed: False
. . .
                </code>
            </pre>
        </div>
    </div>
</div>