import { Router } from "express";
import authorization from "./../controllers/authorization.js"
import flowChartGenerator from "../controllers/diagramsGenerator/Flowchart/flowChart.js";
import dfaDiagramGenerator from "../controllers/diagramsGenerator/FINATE_AUTOMATA/DFA/dfaDiagram.js";
import nfaDiagramGenerator from "../controllers/diagramsGenerator/FINATE_AUTOMATA/NFA/nfaDiagram.js";
import erDiagramGenerator from "../controllers/diagramsGenerator/ER/erDiagram.js";
import dsDiagramGenerator from "../controllers/diagramsGenerator/DataStructure/dsDiagram.js";
import umlDiagramGenerator from "../controllers/diagramsGenerator/UML/umlDiagram.js";

const diagramGenerator = Router();


diagramGenerator.post("/flow-chart",authorization,flowChartGenerator)
diagramGenerator.post("/toc/dfa",authorization, dfaDiagramGenerator)
diagramGenerator.post("/toc/nfa",authorization, nfaDiagramGenerator)
diagramGenerator.post("/toc/er",authorization, erDiagramGenerator)
diagramGenerator.post("/ds",authorization, dsDiagramGenerator)
diagramGenerator.post("/uml",authorization, umlDiagramGenerator)


export default diagramGenerator;