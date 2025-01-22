import React, { useEffect, useState, useRef } from "react";
import Draggable from "react-draggable";
import { MdMessage } from "react-icons/md";
import PromptCard, {
  PromptContent,
  PromptHeader,
} from "../../components/prompt-card/PromptCard";

const Toggle = () => {
  const [openPrompt, setOpenPrompt] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [cursor, setCursor] = useState("default");

  const toggleRef = useRef(null);

  useEffect(() => {
    if (dragging) {
      setCursor("move");
    } else {
      setCursor("pointer");
    }
  }, [dragging]);

  return (
    <>
      <Draggable
        ref={toggleRef}
        onDrag={(e) => {
          e.stopPropagation();
          setDragging(true);
        }}
        onStop={(e) => {
          e.stopPropagation();
          setDragging(false);

          if (!dragging) setOpenPrompt(true);
        }}
        bounds="body"
      >
        <div
          style={{
            position: "absolute",
            bottom: "50px",
            right: "50px",
            width: "100px",
            height: "100px",
            backgroundColor: "rgb(48,48,54,0.8)",
            color: "rgb(180, 180, 180, 0.8)",
            fontSize: "50px",
            lineHeight: "95px",
            borderRadius: "50px",
            textAlign: "center",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            cursor: cursor,
          }}
          className="toggle"
        >
          <MdMessage className="pic" />
        </div>
      </Draggable>
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
};

export default Toggle;
