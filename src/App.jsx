import { useState, useRef } from "react";
import Toggle from "./exhibition/toggle/Toggle";
import "./App.css";
import DrawPolygonTool from "./exhibition/drawing-tools/DrawPolygonTool";

function App() {
  const [openPrompt, setOpenPrompt] = useState(false);

  const toolRef = useRef(null);
  return (
    <>
      <Toggle setOpenPrompt={setOpenPrompt} />
      <button
        onClick={() => {
          console.log(toolRef.current.polygons);
        }}
      >
        Output2
      </button>
      <DrawPolygonTool ref={toolRef} />
    </>
  );
}

export default App;
