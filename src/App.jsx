import { useState, useRef } from "react";
import Toggle from "./toggle";
import "./App.css";
import PromptCard, { PromptContent, PromptHeader } from "./PromptCard";
import DrawPolygonTool from "./DrawPolygonTool";

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
      <PromptCard
        {...{
          openPrompt,
          setOpenPrompt,
          mainConfigs: {
            style: { width: "500px", height: "500px" },
          },
        }}
      >
        <PromptHeader
          title="Prompt Card"
          handlePromptClose={() => setOpenPrompt(false)}
        />
        <PromptContent>
          <div
            className="toggle-prompt-content"
            style={{ width: "100%", height: "100%" }}
          >
            <h1>Title</h1>
            <p>Content</p>
          </div>
        </PromptContent>
      </PromptCard>
    </>
  );
}

export default App;
