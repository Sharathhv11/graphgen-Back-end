import { Router } from "express";
import authorization from "./../controllers/authorization.js"
import flowChartGenerator from "../controllers/diagramsGenerator/Flowchart/flowChart.js";
import dfaDiagramGenerator from "../controllers/diagramsGenerator/FINATE_AUTOMATA/DFA/dfaDiagram.js";
import erDiagramGenerator from "../controllers/diagramsGenerator/ER/erDiagram.js";

const diagramGenerator = Router();


diagramGenerator.post("/flow-chart",authorization,flowChartGenerator)
diagramGenerator.post("/toc/dfa",authorization, dfaDiagramGenerator)
diagramGenerator.post("/toc/er",authorization, erDiagramGenerator)


export default diagramGenerator;