import React, {
  useEffect,
  useState,
  forwardRef,
  useRef,
  useImperativeHandle,
  useCallback,
} from "react";
import PromptCard, { PromptContent, PromptHeader } from "./PromptCard";

const DrawPolygonTool = forwardRef(({}, ref) => {
  const dotColor = "black";
  const dotRadius = 5;

  const polygonColor = "rgba(47, 47, 187)";
  const polygonFillColor = "rgba(47, 47, 187, 0.2)";
  const polygonEdgeWidth = 3;

  const focusColor = "red";
  const focusWidth = 3;
  const focusPadding = 10;

  const [cursor, setCursor] = useState("pointer");

  const [mode, setMode] = useState("drawDot"); // drawDot, erase

  /** @type {[number[][], React.Dispatch<React.SetStateAction<number[][]>>]} */
  const [polygons, setPolygons] = useState([]);

  /** @type {[number[], React.Dispatch<React.SetStateAction<number[]>>]} */
  const [drawingVertices, setDrawingVertices] = useState([]);

  const [openConfirmPrompt, setOpenConfirmPrompt] = useState(false);

  const [selectedIdx, setSelectedIdx] = useState(-1);

  /** @type {React.MutableRefObject<HTMLCanvasElement | null>} */
  const focusCanvasRef = useRef(null);

  /** @type {React.MutableRefObject<HTMLCanvasElement | null>} */
  const drawCanvasRef = useRef(null);

  /**
   * @param {number} x
   * @param {number} ys
   * @param {string} color
   */
  function drawDot(x, y) {
    const ctx = drawCanvasRef.current.getContext("2d");
    ctx.beginPath();
    ctx.arc(x, y, dotRadius, 0, Math.PI * 2);
    ctx.fillStyle = dotColor;
    ctx.fill();
  }

  /**
   * @param {number[]} coordArray
   */
  function strokeVertices(coordArray) {
    if (coordArray.length < 2) {
      return;
    }

    const canvas = drawCanvasRef.current;
    const ctx = canvas.getContext("2d");
    ctx.beginPath();
    ctx.moveTo(coordArray[0] * canvas.width, coordArray[1] * canvas.height);

    for (let i = 2; i < coordArray.length; i += 2) {
      ctx.lineTo(
        coordArray[i] * canvas.width,
        coordArray[i + 1] * canvas.height
      );
    }

    ctx.closePath();

    ctx.strokeStyle = polygonColor;
    ctx.lineWidth = polygonEdgeWidth;
    ctx.stroke();

    ctx.fillStyle = polygonFillColor;
    ctx.fill();
  }

  /**
   *
   * @param {number[]} coordArray
   */
  function drawFocus(coordArray) {
    const canvas = focusCanvasRef.current;

    const ctx = canvas.getContext("2d");

    const [cx, cy] = getCenterPoint(coordArray);

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const lengthArray = [];
    for (let i = 0; i < coordArray.length; i += 2) {
      const x = coordArray[i] * canvas.width;
      const y = coordArray[i + 1] * canvas.height;
      const length = Math.sqrt((x - cx) ** 2 + (y - cy) ** 2);
      lengthArray.push(length);
    }
    const radius = Math.max(...lengthArray);

    ctx.beginPath();
    ctx.arc(cx, cy, radius + focusPadding, 0, Math.PI * 2);
    ctx.strokeStyle = focusColor;
    ctx.lineWidth = focusWidth;
    ctx.stroke();
  }

  function clearFocus() {
    const canvas = focusCanvasRef.current;
    const ctx = canvas.getContext("2d");
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  }

  /**
   * @param {number} x
   * @param {number} y
   * @param {number[]} coordArray
   * @returns {boolean}
   */
  function polygonContains(x, y, coordArray) {
    const canvas = drawCanvasRef.current;

    let flag = false;
    const n = coordArray.length;
    let j = n - 2;

    for (let i = 0; i < n; i += 2) {
      const xi = coordArray[i] * canvas.width;
      const yi = coordArray[i + 1] * canvas.height;
      const xj = coordArray[j] * canvas.width;
      const yj = coordArray[j + 1] * canvas.height;

      const intersect =
        yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi;
      if (intersect) {
        flag = !flag;
      }
      j = i;
    }

    return flag;
  }

  /**
   * @param {number[]} coordArray
   * @returns {number[]}
   */
  function getCenterPoint(coordArray) {
    const canvas = drawCanvasRef.current;

    let cx = 0;
    let cy = 0;
    let area = 0;

    for (let i = 0; i < coordArray.length; i += 2) {
      const x1 = coordArray[i] * canvas.width;
      const y1 = coordArray[i + 1] * canvas.height;
      const x2 = coordArray[(i + 2) % coordArray.length] * canvas.width;
      const y2 = coordArray[(i + 3) % coordArray.length] * canvas.height;
      const cross = x1 * y2 - x2 * y1;
      area += cross;
      cx += (x1 + x2) * cross;
      cy += (y1 + y2) * cross;
    }

    area /= 2;
    cx /= 6 * area;
    cy /= 6 * area;

    return [cx, cy];
  }

  const drawPolygonVertices = useCallback(() => {
    const canvas = drawCanvasRef.current;
    for (let i = 0; i < drawingVertices.length; i += 2) {
      drawDot(
        drawingVertices[i] * canvas.width,
        drawingVertices[i + 1] * canvas.height
      );
    }
  }, [drawingVertices]);

  const strokePolygons = useCallback(() => {
    const canvas = drawCanvasRef.current;
    const ctx = canvas.getContext("2d");
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    polygons.forEach((polygon) => {
      strokeVertices(polygon);
    });
  }, [polygons]);

  const handleClick = useCallback(
    (e) => {
      switch (mode) {
        case "drawDot":
          const canvas = drawCanvasRef.current;
          const adjustment = canvas.getBoundingClientRect();

          const x = e.clientX - adjustment.left;
          const y = e.clientY - adjustment.top;

          setDrawingVertices((prev) => [
            ...prev,
            x / canvas.width,
            y / canvas.height,
          ]);
          break;
        case "erase":
          if (selectedIdx !== -1) {
            setOpenConfirmPrompt(true);
          }
          break;
        default:
          break;
      }
    },
    [mode, selectedIdx]
  );

  const handleMouseMove = useCallback(
    (e) => {
      if (mode === "erase") {
        const canvas = drawCanvasRef.current;
        const adjustment = canvas.getBoundingClientRect();
        const x = e.clientX - adjustment.left;
        const y = e.clientY - adjustment.top;
        for (let idx = 0; idx < polygons.length; idx++) {
          const polygon = polygons[idx];
          if (polygonContains(x, y, polygon)) {
            setCursor("pointer");
            setSelectedIdx(idx);
            drawFocus(polygon);
            return;
          }
        }
        setCursor("default");
        setSelectedIdx(-1);
        clearFocus();
      } else {
        setCursor("pointer");
      }
    },
    [mode, polygons]
  );

  useImperativeHandle(
    ref,
    () => ({
      polygons,
    }),
    [polygons]
  );

  useEffect(() => {
    drawPolygonVertices();
  }, [drawingVertices]);

  useEffect(() => {
    strokePolygons();
  }, [polygons]);

  return (
    <div
      className="draw"
      style={{ position: "relative", width: "500px", height: "500px" }}
    >
      <canvas
        ref={focusCanvasRef}
        width={500}
        height={500}
        id="canvas"
        style={{
          border: "1px solid black",
          borderRadius: "5px",
          cursor: cursor,
          position: "absolute",
          top: "0",
          left: "0",
          zIndex: "1",
        }}
        onClick={handleClick}
        onMouseMove={handleMouseMove}
      />
      <canvas
        ref={drawCanvasRef}
        width={500}
        height={500}
        id="canvas"
        style={{
          border: "1px solid black",
          borderRadius: "5px",
        }}
      />
      <div>
        <button id="clear" onClick={() => setMode("drawDot")}>
          Dot
        </button>
        <button
          id="stroke"
          onClick={() => {
            setPolygons([...polygons, drawingVertices]);
            setDrawingVertices([]);
          }}
        >
          Stroke
        </button>
        <button id="reset" onClick={() => setMode("erase")}>
          Remove
        </button>
        <button
          id="submit"
          onClick={() => {
            console.log(polygons);
          }}
        >
          Output
        </button>
      </div>
      <PromptCard
        {...{
          openPrompt: openConfirmPrompt,
          setOpenPrompt: setOpenConfirmPrompt,
        }}
      >
        <PromptHeader
          title="Confirm"
          handlePromptClose={() => setOpenConfirmPrompt(false)}
        />
        <PromptContent>
          <div
            className="toggle-prompt-content"
            style={{ width: "100%", height: "100%" }}
          >
            <p>Do you want to delete this polygons?</p>
            <button
              onClick={() => {
                setPolygons((prev) => {
                  const newPolygons = [...prev];
                  newPolygons.splice(selectedIdx, 1);
                  return newPolygons;
                });
                setSelectedIdx(-1);
                clearFocus();
                setOpenConfirmPrompt(false);
              }}
            >
              Yes
            </button>
            <button onClick={() => setOpenConfirmPrompt(false)}>No</button>
          </div>
        </PromptContent>
      </PromptCard>
    </div>
  );
});

export default DrawPolygonTool;
