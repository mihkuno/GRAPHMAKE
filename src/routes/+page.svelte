<script lang="ts">
    import { onMount } from "svelte";
    import { DataSet } from "vis-data/esnext";
    import { Network } from "vis-network/esnext";
    import type { GraphResult } from "$lib/analyzer";
    import type { Options } from "vis-network";

    import Parser from "$lib/parser";
    import Analyzer from "$lib/analyzer";
    import Operation from "$lib/operation";

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
    
    let outputAnalysis = $state({
        isomorphism: false,
        analysisA: '' as GraphResult | '',
        analysisB: '' as GraphResult | '',
        traverseA: '',
        traverseB: '',
    });

    function stringifyTree(obj: unknown, level: number = 0): string {
        if (Array.isArray(obj)) {
            const is1D: boolean = obj.every((el: unknown) => !Array.isArray(el) && typeof el !== 'object');
            if (is1D) {
                return `[${obj.join(',')}]`;
            } else {
                const items: string = obj.map((el: unknown) => stringifyTree(el, level + 1)).join(',\n');
                return `[\n${items}\n]`;
            }
        }

        if (typeof obj === 'object' && obj !== null) {
            const entries: string = Object.entries(obj)
                .map(([key, val]: [string, unknown]) => `${key}:${stringifyTree(val, level + 1)}\n\n`)
                .join('');
            return `{\n\n${entries}}`;
        }

        return JSON.stringify(obj);
    }

    function handleInputGraph(input: string, graph: Network) {        
        try {
            const dataset = Parser.StringToGraphDataset(input, inputType);
            const analysis = Analyzer.summary(dataset.edges);
            graph.setData(dataset);
            if      (graph === graphA) outputAnalysis.analysisA = analysis;
            else if (graph === graphB) outputAnalysis.analysisB = analysis;
        } 
        catch (e) {
            graph.setData({ nodes: new DataSet([]), edges: new DataSet([]) });
            if      (graph === graphA) outputAnalysis.analysisA = '';
            else if (graph === graphB) outputAnalysis.analysisB = '';
        }
    }

    function handleTraverseGraph(input: string, graph: Network, subgraph: Network) {


        try {
         
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
        let type: "" | "invalid" | "cycle" | "path" | "walk";
        if (!isValid) {
            type = "invalid";
        } 
        else if (input === '[]') {
            type = "";
        }
        else {
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

        if      (graph === graphA) outputAnalysis.traverseA = type;
        else if (graph === graphB) outputAnalysis.traverseB = type;

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
        catch (e) {
            if (graph === graphA) {
                outputAnalysis.traverseA = '';
                subgraph.setData({ nodes: new DataSet([]), edges: new DataSet([]) });
            }
            else if (graph === graphB) {
                outputAnalysis.traverseB = '';
                subgraph.setData({ nodes: new DataSet([]), edges: new DataSet([]) });
            };
        }
    }

    function handleOperation(type: 'union' | 'intersection' | 'complementA' | 'complementB' | 'cartesianProduct') {
        try {
        let result: { nodes: DataSet<any>, edges: DataSet<any> } | null = null;

        // Handle complement operations first
        if (type === 'complementA' && inputGraphA) {
            result = Operation.complement(inputType, inputGraphA);
        } 
        else if (type === 'complementB' && inputGraphB) {
            result = Operation.complement(inputType, inputGraphB);
        } 
        // Handle binary operations next
        else if (inputGraphA && inputGraphB) {
            switch (type) {
                case 'union':
                    result = Operation.union(inputType, inputGraphA, inputGraphB);
                    break;
                case 'intersection':
                    result = Operation.intersection(inputType, inputGraphA, inputGraphB);
                    break;
                case 'cartesianProduct':
                    result = Operation.cartesianProduct(inputType, inputGraphA, inputGraphB);
                    break;
                default:
                    console.warn('unsupported operation type:', type);
                    return;
            }
        } 
        else {
            console.warn('missing input for operation:', type);
            return;
        }

        // apply changes if a valid result was produced
        if (result) {
            clearAll();
            graphA.setData(result);

            const analysis = Analyzer.summary(result.edges);
            outputAnalysis.analysisA = analysis;
            outputAnalysis.analysisB = '';

            if (inputType === 'list') {
                inputGraphA = JSON.stringify(analysis["Adjacency List"]);
            } else if (inputType === 'matrix') {
                inputGraphA = JSON.stringify(analysis["Adjacency Matrix"]);
            }
        }
        }
        catch (e) {
            console.warn('operation failed:', type);
        }
    }

    function clearAll() {
        handleInputGraph('', graphA);
        handleInputGraph('', graphB);
        handleTraverseGraph('', graphA, subgraphA);
        handleTraverseGraph('', graphB, subgraphB);
        inputGraphA = '';
        inputGraphB = '';
        inputTraverseA = '';
        inputTraverseB = '';
    }

    // input type list or matrix
    $effect(() => {
        if (inputType) {
            if (graphA && graphB && subgraphA && subgraphB) {
                // erase all
                clearAll();
            }
        }
    })

    // input graph A
    $effect(() => { 
        if (inputGraphA && graphA) {
            handleInputGraph(inputGraphA, graphA);
            // erase traverse
            handleTraverseGraph('', graphA, subgraphA);
            inputTraverseA = '';
        }
        else if (graphA) {
            outputAnalysis.analysisA = '';
            outputAnalysis.traverseA = '';
            handleInputGraph('', graphA);
        }
    });

    // input graph B
    $effect(() => {
        if (inputGraphB && graphB) {
            handleInputGraph(inputGraphB, graphB);
            // erase traverse
            handleTraverseGraph('', graphB, subgraphB);
            inputTraverseB = '';
        }
        else if (graphB) {
            outputAnalysis.analysisB = '';
            outputAnalysis.traverseB = '';
            handleInputGraph('', graphB);
        }
    });
    
    // traverse graph A
    $effect(() => { 
        if (inputTraverseA && graphA && subgraphA) {
            handleTraverseGraph(inputTraverseA, graphA, subgraphA);
        }
        else if (graphA && subgraphA) {
            outputAnalysis.traverseA = '';
            handleTraverseGraph('', graphA, subgraphA);
            inputTraverseA = '';
        }
    });

    // traverse graph B
    $effect(() => {
        if (inputTraverseB && graphB && subgraphB) {
            handleTraverseGraph(inputTraverseB, graphB, subgraphB);
        }
        else if (graphB && subgraphB) {
            outputAnalysis.traverseB = '';
            handleTraverseGraph('', graphB, subgraphB);
            inputTraverseB = '';
        }
    });

    // isomorphism of A and B
    $effect(() => {
        if (inputType && inputGraphA && inputGraphB) {
            try {
                outputAnalysis.isomorphism = Analyzer.isomorphism(inputType, inputGraphA, inputGraphB);
            }
            catch (e) {
                outputAnalysis.isomorphism = false;
            }
        }
        else {
            outputAnalysis.isomorphism = false;
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
        // { id: 1, label: "1" },
        // { id: 2, label: "2" },
        // { id: 3, label: "3" },
        // { id: 4, label: "4" },
        // { id: 5, label: "5" },
    ]), 
    edges: new DataSet([
        // { id: 1, from: 1, to: 3 },
        // { id: 2, from: 1, to: 2 },
        // { id: 3, from: 2, to: 4 },
        // { id: 4, from: 2, to: 5 },
        // { id: 5, from: 5, to: 2 },
        // { id: 6, from: 3, to: 3 },
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
            <div class="flex gap-2 items-center text-sm">
                <input bind:group={inputType} type="radio" name="inputType" value="list" /> Adjacent List
            </div>
            <div class="flex gap-2 items-center text-sm">
                <input bind:group={inputType} type="radio" name="inputType" value="matrix" /> Adjacent Matrix
            </div>
        </div>
        <input bind:value={inputGraphA} type="text" class="py-1.5 px-5 bg-gray-700 text-gray-50 rounded-lg resize-none" placeholder="Graph A"/>
        <input bind:value={inputGraphB} type="text" class="py-1.5 px-5 bg-gray-700 text-gray-50 rounded-lg resize-none" placeholder="Graph B"/>

        <h2>Traverse</h2>        
        <span class="text-xs font-bold text-yellow-300">
            These require its associated graph to be non-empty
        </span>
        <input bind:value={inputTraverseA} type="text" class="py-1.5 px-5 bg-gray-700 text-gray-50 rounded-lg resize-none" placeholder="Graph A"/>
        <input bind:value={inputTraverseB} type="text" class="py-1.5 px-5 bg-gray-700 text-gray-50 rounded-lg resize-none" placeholder="Graph B"/>

        <h2>Operations</h2>        
        <button
            onclick={() => handleOperation('complementA')}
            class="flex items-center gap-2 px-5 py-1.5 rounded-2xl font-medium 
                    bg-gray-700 text-gray-100 shadow-md 
                    hover:bg-indigo-600 hover:scale-101 
                    active:scale-99 transition transform duration-200 cursor-pointer">
            <span class="text-lg font-bold text-yellow-300">⊖</span>
            Complement of A
        </button>
        <button
            onclick={() => handleOperation('complementB')}
            class="flex items-center gap-2 px-5 py-1.5 rounded-2xl font-medium 
                    bg-gray-700 text-gray-100 shadow-md 
                    hover:bg-indigo-600 hover:scale-101 
                    active:scale-99 transition transform duration-200 cursor-pointer">
            <span class="text-lg font-bold text-yellow-300">⊖</span>
            Complement of B
        </button>
        <span class="text-xs font-bold text-yellow-300">
            These require both Graph A and B to be non-empty
        </span>
        <button
            onclick={() => handleOperation('union')}
            class="flex items-center gap-2 px-5 py-1.5 rounded-2xl font-medium 
                    bg-gray-700 text-gray-100 shadow-md 
                    hover:bg-indigo-600 hover:scale-101 
                    active:scale-99 transition transform duration-200 cursor-pointer">
            <span class="text-lg font-bold text-yellow-300">∪</span>
            Union
        </button>
        <button
            onclick={() => handleOperation('intersection')}
            class="flex items-center gap-2 px-5 py-1.5 rounded-2xl font-medium 
                    bg-gray-700 text-gray-100 shadow-md 
                    hover:bg-indigo-600 hover:scale-101 
                    active:scale-99 transition transform duration-200 cursor-pointer">
            <span class="text-lg font-bold text-yellow-300">∩</span>
            Intersection
        </button>
        <button
            onclick={() => handleOperation('cartesianProduct')}
            class="flex items-center gap-2 px-5 py-1.5 rounded-2xl font-medium 
                    bg-gray-700 text-gray-100 shadow-md 
                    hover:bg-indigo-600 hover:scale-101 
                    active:scale-99 transition transform duration-200 cursor-pointer">
            <span class="text-lg font-bold text-yellow-300">×</span>
            Cartesian Product
        </button>
    </div>


    <!-- graph containers -->
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
<code>{stringifyTree(outputAnalysis)}</code>
            </pre>
        </div>
    </div>

</div>