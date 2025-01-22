import React, {
  useEffect,
  useState,
  forwardRef,
  useRef,
  useImperativeHandle,
  useCallback,
} from "react";
import PromptCard, {
  PromptContent,
  PromptHeader,
} from "../../components/prompt-card/PromptCard";
import { toBlob } from "html-to-image";

/**
 * @typedef {object} DrawingTool
 * @property {number[][]} polygons
 * @property {(outputWidth?: number, outputHeight?: number, quality?: number) => Promise<File>} outputImageFile
 * @property {(image: string) => void} changeImage
 * @property {(polygonsArray: number[][]) => void} initPolygons
 * @property {() => void} clearPolygons
 */

const DrawPolygonTool = forwardRef(
  /**
   * @param {object} props
   * @param {React.ForwardedRef<DrawingTool>} ref
   */
  ({}, ref) => {
    const canvasWidth = 640;
    const canvasHeight = 360;

    const dotColor = "black";
    const dotRadius = 5;

    const polygonColor = "rgba(47, 47, 187)";
    const polygonFillColor = "rgba(47, 47, 187, 0.2)";
    const polygonEdgeWidth = 3;

    const focusColor = "red";
    const focusWidth = 3;
    const focusPadding = 20;

    const drawModes = {
      REMOVE: "REMOVE",
      DOT: "DOT",
    };

    const [cursor, setCursor] = useState("pointer");
    const [backgroundImage, setBackgroundImage] = useState("");

    const [mode, setMode] = useState(drawModes.DOT); // drawDot, erase

    /** @type {[number[][], React.Dispatch<React.SetStateAction<number[][]>>]} */
    const [polygons, setPolygons] = useState([]);

    /** @type {[number[], React.Dispatch<React.SetStateAction<number[]>>]} */
    const [drawingVertices, setDrawingVertices] = useState([]);

    const [openConfirmPrompt, setOpenConfirmPrompt] = useState(false);

    const [selectedIdx, setSelectedIdx] = useState(-1);

    /** @type {React.MutableRefObject<HTMLDivElement | null>} */
    const canvasDivRef = useRef(null);

    /** @type {React.MutableRefObject<HTMLCanvasElement | null>} */
    const focusCanvasRef = useRef(null);

    /** @type {React.MutableRefObject<HTMLCanvasElement | null>} */
    const drawCanvasRef = useRef(null);

    /** @type {React.MutableRefObject<HTMLImageElement | null>} */
    const imgRef = useRef(null);

    /**
     * @param {CanvasRenderingContext2D} ctx
     * @param {number} x
     * @param {number} y
     */
    function drawDot(ctx, x, y) {
      ctx.beginPath();
      ctx.arc(x, y, dotRadius, 0, Math.PI * 2);
      ctx.fillStyle = dotColor;
      ctx.fill();
    }

    /**
     * @param {HTMLCanvasElement} canvas
     * @param {number[]} coordArray
     */
    function strokeVertices(canvas, coordArray) {
      if (coordArray.length < 2) {
        return;
      }

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
     * @param {HTMLCanvasElement} canvas
     * @param {number[]} coordArray
     */
    function drawFocus(canvas, coordArray) {
      const ctx = canvas.getContext("2d");

      const [cx, cy] = getCenterPoint(drawCanvasRef.current, coordArray);

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

    /**
     * @param {HTMLCanvasElement} canvas
     */
    function clearCanvas(canvas) {
      const ctx = canvas.getContext("2d");
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    }

    /**
     * @param {HTMLCanvasElement} canvas
     * @param {number} x
     * @param {number} y
     * @param {number[]} coordArray
     * @returns {boolean}
     */
    function polygonContains(canvas, x, y, coordArray) {
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
     * @param {HTMLCanvasElement} canvas
     * @param {number[]} coordArray
     * @returns {number[]}
     */
    function getCenterPoint(canvas, coordArray) {
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

    const drawPolygonVertices = useCallback(
      /**
       * @param {HTMLCanvasElement} canvas
       */
      (canvas) => {
        const ctx = canvas.getContext("2d");
        for (let i = 0; i < drawingVertices.length; i += 2) {
          drawDot(
            ctx,
            drawingVertices[i] * canvas.width,
            drawingVertices[i + 1] * canvas.height
          );
        }
      },
      [drawingVertices]
    );

    /**
     * @param {HTMLCanvasElement} canvas
     */
    function strokePolygons(canvas, polygons) {
      const ctx = canvas.getContext("2d");
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      polygons.forEach((polygon) => {
        strokeVertices(canvas, polygon);
      });
    }

    const handleClick = useCallback(
      /**
       * @param {React.MouseEvent<HTMLCanvasElement, MouseEvent>} e
       */
      (e) => {
        switch (mode) {
          case drawModes.DOT:
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
          case drawModes.REMOVE:
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
      /**
       * @param {React.MouseEvent<HTMLCanvasElement, MouseEvent>} e
       */
      (e) => {
        if (mode === drawModes.REMOVE) {
          const canvas = drawCanvasRef.current;
          const adjustment = canvas.getBoundingClientRect();
          const x = e.clientX - adjustment.left;
          const y = e.clientY - adjustment.top;
          for (let idx = 0; idx < polygons.length; idx++) {
            const polygon = polygons[idx];
            if (polygonContains(drawCanvasRef.current, x, y, polygon)) {
              setCursor("pointer");
              setSelectedIdx(idx);
              drawFocus(focusCanvasRef.current, polygon);
              return;
            }
          }
          setCursor("default");
          setSelectedIdx(-1);
          clearCanvas(focusCanvasRef.current);
        } else {
          setCursor("pointer");
        }
      },
      [mode, polygons]
    );

    const outputImageFile = useCallback(
      /**
       *
       * @param {number} outputWidth
       * @param {number} outputHeight
       * @param {number} quality
       * @returns {Promise<File>}
       */
      async (outputWidth = 1440, outputHeight = 810, quality = 1) => {
        if (!backgroundImage) {
          throw new Error("Background image is not set");
        }

        const canvasDiv = document.createElement("div");
        canvasDiv.style.width = `${outputWidth}px`;
        canvasDiv.style.height = `${outputHeight}px`;
        canvasDiv.style.position = "relative";

        const drawCanvas = document.createElement("canvas");
        drawCanvas.width = outputWidth;
        drawCanvas.height = outputHeight;
        drawCanvas.style.width = `${outputWidth}px`;
        drawCanvas.style.height = `${outputHeight}px`;
        strokePolygons(drawCanvas, polygons);
        const canvasDataUrl = drawCanvas.toDataURL("image/png", 1);

        const canvasImage = document.createElement("img");
        canvasImage.src = canvasDataUrl;
        canvasImage.style.width = `${outputWidth}px`;
        canvasImage.style.height = `${outputHeight}px`;
        canvasImage.style.position = "absolute";
        canvasImage.style.top = "0";
        canvasImage.style.left = "0";
        canvasImage.style.zIndex = "10";

        const img = document.createElement("img");
        img.src = backgroundImage;
        img.style.width = `${outputWidth}px`;
        img.style.height = `${outputHeight}px`;
        img.style.position = "absolute";
        img.style.top = "0";
        img.style.left = "0";
        img.style.zIndex = "1";

        canvasDiv.appendChild(img);
        canvasDiv.appendChild(canvasImage);

        const blob = await toBlob(canvasDiv, {
          width: outputWidth,
          height: outputHeight,
          quality: quality,
        });
        const file = new File([blob], "output.png", { type: "image/png" });

        // canvasDiv.remove();

        return file;
      },
      [backgroundImage, polygons]
    );

    const changeImage = useCallback(
      /**
       * @param {string} image
       */
      (image) => {
        setBackgroundImage(image);
      },
      []
    );

    function initPolygons(polygonsArray) {
      setPolygons(polygonsArray);
    }

    function clearPolygons() {
      setPolygons([]);
    }

    useImperativeHandle(
      ref,
      () => ({
        polygons,
        outputImageFile,
        changeImage,
        initPolygons,
        clearPolygons,
      }),
      [polygons]
    );

    useEffect(() => {
      strokePolygons(drawCanvasRef.current, polygons);
    }, [polygons]);

    useEffect(() => {
      drawPolygonVertices(drawCanvasRef.current);
    }, [drawingVertices]);

    useEffect(() => {
      if (backgroundImage) {
        imgRef.current.src = backgroundImage;
        strokePolygons(drawCanvasRef.current, polygons);
      }
    }, [backgroundImage, polygons]);

    return (
      <div
        className="draw"
        style={{
          display: "flex",
          flexDirection: "column",
          marginBottom: "10px",
        }}
      >
        <div
          className="canvas-container"
          ref={canvasDivRef}
          style={{
            position: "relative",
            width: `${canvasWidth}px`,
            height: `${canvasHeight}px`,
          }}
        >
          <img
            ref={imgRef}
            alt=""
            style={{
              width: `${canvasWidth}px`,
              height: `${canvasHeight}px`,
              border: backgroundImage ? "" : "1px solid black",
              borderRadius: "5px",
              position: "absolute",
              top: "0",
              left: "0",
              zIndex: "1",
            }}
          />
          <canvas
            ref={drawCanvasRef}
            width={canvasWidth}
            height={canvasHeight}
            id="canvas"
            style={{
              width: `${canvasWidth}px`,
              height: `${canvasHeight}px`,
              border: backgroundImage ? "" : "1px solid black",
              borderRadius: "5px",
              position: "absolute",
              top: "0",
              left: "0",
              zIndex: "50",
            }}
          />
          <canvas
            ref={focusCanvasRef}
            width={canvasWidth}
            height={canvasHeight}
            id="canvas"
            style={{
              width: `${canvasWidth}px`,
              height: `${canvasHeight}px`,
              border: backgroundImage ? "" : "1px solid black",
              borderRadius: "5px",
              cursor: cursor,
              position: "absolute",
              top: "0",
              left: "0",
              zIndex: "100",
            }}
            onClick={handleClick}
            onMouseMove={handleMouseMove}
          />
        </div>
        <div className="draw-btns">
          {mode === drawModes.REMOVE && (
            <button
              className="draw-dot-btn"
              onClick={() => setMode(drawModes.DOT)}
            >
              Dot Mode
            </button>
          )}

          {mode === drawModes.DOT && (
            <>
              <button
                className="stroke-btn"
                onClick={() => {
                  setPolygons([...polygons, drawingVertices]);
                  setDrawingVertices([]);
                }}
              >
                Stroke
              </button>
              <button
                className="remove-btn"
                onClick={() => setMode(drawModes.REMOVE)}
              >
                Remove Mode
              </button>
              <button className="btn-btn" onClick={() => setPolygons([])}>
                Clear
              </button>
            </>
          )}
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
                  clearCanvas(focusCanvasRef.current);
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
  }
);

export default DrawPolygonTool;
