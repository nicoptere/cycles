import { cycles } from "./Cycles";
import Simplify from "./utils/Simplify";

let ctx, mouse, last, stroke, nodes, edges;
export default class Drawing {
  constructor() {
    let canvas = document.createElement("canvas");
    mouse = { x: 0, y: 0, down: false };
    last = { x: 0, y: 0, down: false };

    nodes = [];
    edges = [];
    stroke = [];
    canvas.addEventListener("pointerdown", this.onDown.bind(this));
    canvas.addEventListener("pointerup", this.onUp.bind(this));
    canvas.addEventListener("pointermove", this.onMove.bind(this));

    document.body.appendChild(canvas);
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    ctx = canvas.getContext("2d");
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
  }

  update() {
    //simplify the stroke (optional but welcome)
    stroke = Simplify.compute(stroke, 2).map((p) => [p.x, p.y]);

    // update nodes and edges list
    let L = nodes.length;
    stroke.forEach((p, i) => {
      nodes.push(p);
      if (i > 0) {
        edges.push([L + i - 1, L + i]);
      }
    });
    edges.push([L, nodes.length - 1]);

    ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);

    // compute the cycles
    let result = cycles(nodes, edges);

    //   renders the polys
    this.hue = 0;
    result.CCW.forEach((cycle) => this.fillCycle(ctx, result.nodes, cycle));

    //   renders the graph on top
    ctx.strokeStyle = "#000";
    ctx.lineWidth = 2;
    this.renderGraph(ctx, { nodes, edges });
  }
  distance(a, b) {
    return Math.sqrt(Math.pow(a.x - b.x, 2), Math.pow(a.y - b.y, 2));
  }
  onDown(e) {
    mouse.x = e.clientX;
    mouse.y = e.clientY;
    mouse.down = true;
    last.x = mouse.x;
    last.y = mouse.y;
    stroke.push({ x: mouse.x, y: mouse.y });
  }

  onUp(e) {
    mouse.x = e.clientX;
    mouse.y = e.clientY;
    mouse.down = false;

    //   update the cycles
    this.update();

    stroke = [];
  }
  onMove(e) {
    mouse.x = e.clientX;
    mouse.y = e.clientY;
    if (mouse.down === true) {
      ctx.beginPath();
      ctx.moveTo(last.x, last.y);
      ctx.lineTo(mouse.x, mouse.y);
      ctx.stroke();
      stroke.push({ x: mouse.x, y: mouse.y });
      last.x = mouse.x;
      last.y = mouse.y;
    }
  }

  fillCycle(ctx, nodes, cycle) {
    ctx.fillStyle = `hsl(${(this.hue += 10) % 360}, 70%,50%)`;
    ctx.beginPath();
    cycle.forEach((id) => {
      ctx.lineTo(nodes[id].x, nodes[id].y);
    });
    ctx.closePath();
    ctx.fill();
  }

  strokeCycle(ctx, nodes, cycle) {
    ctx.strokeStyle = `hsl(${(this.hue += 10) % 360}, 70%,50%)`;
    ctx.beginPath();
    cycle.forEach((id) => {
      ctx.lineTo(nodes[id].x, nodes[id].y);
    });
    ctx.closePath();
    ctx.stroke();
  }

  renderGraph(ctx, graph) {
    const N = graph.nodes;
    ctx.beginPath();
    graph.edges.forEach((e) => {
      ctx.moveTo(N[e[0]][0], N[e[0]][1]);
      ctx.lineTo(N[e[1]][0], N[e[1]][1]);
    });
    ctx.stroke();
  }
}
