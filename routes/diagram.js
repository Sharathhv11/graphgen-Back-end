import { Router } from "express";
import authorization from "./../controllers/authorization.js"
import flowChartGenerator from "../controllers/diagramsGenerator/Flowchart/flowChart.js";
import dfaDiagramGenerator from "../controllers/diagramsGenerator/DFA/dfaDiagram.js";

const diagramGenerator = Router();


diagramGenerator.post("/flow-chart",authorization,flowChartGenerator)
diagramGenerator.post("/toc/dfa",authorization, dfaDiagramGenerator)


export default diagramGenerator;