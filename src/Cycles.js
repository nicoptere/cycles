// https://github.com/mikolalysenko/clean-pslg
const cleanPSLG = require("clean-pslg");

/**
 * compute the cycles of an undirected graph
 * @param {Array} nodes array of [x,y] coordinates
 * @param {Array} edges array of indices [node Id 0, node Id 1]
 * @returns an object conatining the CW and CCW cycles of the graph
 */
export function cycles(nodes, edges) {
  // cleanup nodes and edges (remove duplicates)
  let graph = cleanUpGraph(nodes, edges);

  //compute PSLG
  cleanPSLG(graph.nodes, graph.edges);

  // remap to objects
  graph.nodes = graph.nodes.map((n) => {
    return { x: n[0], y: n[1] };
  });

  //result object
  const result = {
    nodes: graph.nodes,
    edges: graph.edges.concat(),
    CW: [],
    CCW: [],
  };

  // make graph undirected (for each edges A=>B, create a new edge B=>A)
  graph.edges = graph.edges.concat(graph.edges.map((e) => [e[1], e[0]]));

  // compute the adjacency list
  computeAdjacency(graph);

  //for each node
  graph.nodes.forEach((_, a) => {
    // store the root node (to check if we made a cycle)
    let root = a;

    //find the first connected node
    let b = graph.adjacency[a][0];

    // there is no adjacent node, bail out
    if (b === undefined) return;

    // start the cycle by storing this edge
    let cycle = [a, b];

    // we could use a while true but it's safer to set  a finished limit
    for (let i = 0; i < graph.nodes.length; i++) {
      // collect the nodes connected to B
      let adjacent = graph.adjacency[b];

      //if the cycle forms at least a triangle and contains the root node
      if (cycle.length > 2 && adjacent.indexOf(root) != -1) {
        //
        // we found a cycle ! woohoo!
        //
        //remove all the edges of the cycle from the graph edges' list
        popCycle(graph, cycle);

        if (winding(graph, cycle) > 0) {
          result.CW.push(cycle);
        } else {
          result.CCW.push(cycle);
        }

        //bail out
        break;
      }

      // check that the adjacent nodes do not contain any previously visited node
      cycle.forEach((n) => {
        // if (cycle.filter((v) => v == n).length > 2) {
        if (adjacent.indexOf(n) != -1) {
          const id = adjacent.indexOf(n);
          adjacent.splice(id, 1);
        }
        // }
      });

      //if the adjacent list is empty
      if (adjacent.length == 0) {
        // bail out
        // console.log("no valid adjacency");
        break;
      }

      // find the "right-most" nodes from the list
      let p = rightMost(graph.nodes, a, b, Array.from(new Set(adjacent)));

      //add it to the cycle if it's not already there
      if (cycle.indexOf(p) == -1) cycle.push(p);

      // move along the edge : A <= B && B <= P
      a = b;
      b = p;
    }
  });

  return result;
}

// UTILS

// computes the detrminant of vecotrs p=>a & p=>b
function determinant(p, a, b) {
  return (a.x - b.x) * (p.y - b.y) - (p.x - b.x) * (a.y - b.y);
}

//finds the right-most node
function rightMost(nodes, a, b, arr) {
  const tmp = arr.map((id, i) => {
    const pa = nodes[a];
    const pb = nodes[b];
    const pn = nodes[id];
    return { id, value: determinant(pn, pa, pb) };
  });
  tmp.sort((a, b) => {
    return a.value < b.value ? -1 : 1;
  });
  return tmp[0].id;
}

// determine if a polygon is CW or CCW (for drawing)
function winding(graph, arr) {
  let sum = 0;
  for (let i = 0; i < arr.length; i++) {
    let i0 = arr[i];
    let i1 = arr[(i + 1) % arr.length];
    let n0 = graph.nodes[i0];
    let n1 = graph.nodes[i1];
    sum += (n1.x - n0.x) * (n1.y + n0.y);
  }
  return sum;
}

// remove a cycle from the graph edges list
function popCycle(graph, cycle) {
  for (let i = 0; i < cycle.length; i++) {
    let i0 = cycle[i];
    let i1 = cycle[(i + 1) % cycle.length];
    let e = graph.edges.find((e) => e[0] == i0 && e[1] == i1);
    let id = graph.edges.indexOf(e);
    graph.edges.splice(id, 1);
  }
  computeAdjacency(graph);
}

// computes the adjacency list for each node and the graph
function computeAdjacency(graph) {
  graph.nodes.forEach((n) => {
    n.neighbours = new Set();
  });
  graph.edges.forEach((e) => {
    graph.nodes[e[0]].neighbours.add(e[1]);
  });
  graph.adjacency = graph.nodes.map((n) => Array.from(n.neighbours));
}

function serialize(n) {
  const exp = 1e3; //precision for serialization
  if (n.x === undefined) return ~~(n[0] * exp) + "|" + ~~(n[1] * exp);
  return ~~(n.y * exp) + "|" + ~~(n.y * exp);
}

function cleanUpGraph(nodes, edges) {
  edges = dedup(edges, (a, b) => {
    return (
      a[0] == a[1] ||
      b[0] == b[1] ||
      (a[0] == b[0] && a[1] == b[1]) ||
      (a[0] == b[1] && a[1] == b[0])
    );
  });

  const edgeSet = new Set(edges.flat());
  const LUT = {};
  nodes.forEach((n, id) => {
    n.neighbours = new Set();
    if (edgeSet.has(id) == false) return;
    let serialized = serialize(n);
    if (LUT[serialized] === undefined) {
      LUT[serialized] = n;
    }
  });

  let tmpNodes = [];
  for (let key in LUT) tmpNodes.push(LUT[key]);

  edges = edges
    .map((e) => {
      let n0 = nodes[e[0]];
      let s0 = serialize(n0);
      let i0 = tmpNodes.indexOf(LUT[s0]);

      let n1 = nodes[e[1]];
      let s1 = serialize(n1);
      let i1 = tmpNodes.indexOf(LUT[s1]);

      return [i0, i1];
    })
    .filter((e) => {
      return e[0] != e[1];
    });
  return { nodes: tmpNodes, edges };
}

function dedup(
  array,
  evaluate = (a, b) => {
    return a == b;
  }
) {
  let tmp = [];
  array.forEach((a, id) => {
    let exists = false;
    tmp.forEach((b) => {
      if (exists) return;
      if (evaluate(a, b)) exists = true;
    });
    if (exists === false) tmp.push(a);
  });
  return tmp;
}
