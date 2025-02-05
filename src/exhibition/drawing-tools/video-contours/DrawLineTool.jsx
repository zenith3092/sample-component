import React, {
    useEffect,
    useState,
    forwardRef,
    useRef,
    useImperativeHandle,
} from "react";

/**
 * @typedef {object} DrawingTool
 * @property {number[][]} lines - normalized line coordinates
 * @property {(lineArray: number[][]) => void} initLines
 * @property {() => void} clearLines
 */

const DrawLineTool = forwardRef(
    /**
     * @param {object} props
     * @param {React.ReactNode} props.children
     * @param {boolean} props.showFunctionBtns
     * @param {React.ForwardedRef<DrawingTool>} ref
     */
    ({ children, showFunctionBtns = true }, ref) => {
        const canvasWidth = 640;
        const canvasHeight = 360;

        const dotLimit = Infinity;
        const dotColor = "red";
        const dotRadius = 5;

        const lineLimit = 1;
        const lineColor = "red";
        const lineEdgeWidth = 2;

        const [drawingDot, setDrawingDot] = useState([]);
        const [lines, setLines] = useState([]);

        /** @type {React.MutableRefObject<HTMLDivElement | null>} */
        const canvasDivRef = useRef(null);

        /** @type {React.MutableRefObject<HTMLCanvasElement | null>} */
        const drawCanvasRef = useRef(null);

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
         */
        function drawDot(canvas, x, y) {
            const ctx = canvas.getContext("2d");
            ctx.beginPath();
            ctx.arc(x, y, dotRadius, 0, Math.PI * 2);
            ctx.fillStyle = dotColor;
            ctx.fill();
        }

        /**
         * @param {HTMLCanvasElement} canvas
         * @param {number[]} line
         */
        function drawLine(canvas, line) {
            const ctx = canvas.getContext("2d");
            if (line.length < 4) return;

            ctx.beginPath();
            ctx.moveTo(line[0], line[1]);

            for (let i = 2; i < line.length; i += 2) {
                ctx.lineTo(line[i], line[i + 1]);
            }

            ctx.strokeStyle = lineColor;
            ctx.lineWidth = lineEdgeWidth;
            ctx.stroke();
        }

        /**
         * @param {HTMLCanvasElement} canvas
         * @param {number[][]} lineArray
         */
        function strokeLine(canvas, lineArray, shouldDrawDot = true) {
            clearCanvas(canvas);

            lineArray.forEach((line) => {
                const unNormalizedLine = line.map((coord, index) => {
                    if (index % 2 === 0) {
                        return coord * canvasWidth;
                    } else {
                        return coord * canvasHeight;
                    }
                });
                drawLine(canvas, unNormalizedLine);
                if (shouldDrawDot) {
                    for (let i = 0; i < line.length; i += 2) {
                        drawDot(
                            canvas,
                            unNormalizedLine[i],
                            unNormalizedLine[i + 1]
                        );
                    }
                }
            });
        }

        /**
         * @param {React.MouseEvent<HTMLCanvasElement, MouseEvent>} e
         */
        const handleClick = (e) => {
            if (lines.length < lineLimit && drawingDot.length < dotLimit) {
                const canvas = drawCanvasRef.current;
                const adjustment = canvas.getBoundingClientRect();

                const x = e.clientX - adjustment.left;
                const y = e.clientY - adjustment.top;

                setDrawingDot((prev) => {
                    prev = [...prev, [x / canvas.width, y / canvas.height]];
                    return prev;
                });
            }
        };

        /**
         * @param {number[][]} lineArray
         */
        function initLines(lineArray) {
            setLines(lineArray);
        }

        function clearLines() {
            setLines([]);
        }

        useImperativeHandle(
            ref,
            () => ({
                lines,
                initLines,
                clearLines,
            }),
            [lines]
        );

        useEffect(() => {
            const canvas = drawCanvasRef.current;

            strokeLine(canvas, lines, true);

            drawingDot.forEach((point) => {
                const unNormalizedPoint = point.map((coord, index) => {
                    if (index % 2 === 0) {
                        return coord * canvas.width;
                    } else {
                        return coord * canvas.height;
                    }
                });
                const [x, y] = unNormalizedPoint;

                drawDot(canvas, x, y);
            });
        }, [lines, drawingDot]);

        useEffect(() => {
            /**
             * @param {KeyboardEvent} e
             */
            function handleKeyBoardDotChange(e) {
                if (["w", "W", "ArrowUp"].includes(e.key)) {
                    setDrawingDot((prev) => {
                        if (prev.length > 0) {
                            const newDrawingDot = [...prev];
                            newDrawingDot[prev.length - 1][1] -= 0.001;
                            return newDrawingDot;
                        }
                        return prev;
                    });
                } else if (["s", "S", "ArrowDown"].includes(e.key)) {
                    setDrawingDot((prev) => {
                        if (prev.length > 0) {
                            const newDrawingDot = [...prev];
                            newDrawingDot[prev.length - 1][1] += 0.001;
                            return newDrawingDot;
                        }
                        return prev;
                    });
                } else if (["a", "A", "ArrowLeft"].includes(e.key)) {
                    setDrawingDot((prev) => {
                        if (prev.length > 0) {
                            const newDrawingDot = [...prev];
                            newDrawingDot[prev.length - 1][0] -= 0.001;
                            return newDrawingDot;
                        }
                        return prev;
                    });
                } else if (["d", "D", "ArrowRight"].includes(e.key)) {
                    setDrawingDot((prev) => {
                        if (prev.length > 0) {
                            const newDrawingDot = [...prev];
                            newDrawingDot[prev.length - 1][0] += 0.001;
                            return newDrawingDot;
                        }
                        return prev;
                    });
                }
            }

            document.addEventListener("keydown", handleKeyBoardDotChange);

            return () => {
                document.removeEventListener(
                    "keydown",
                    handleKeyBoardDotChange
                );
            };
        }, []);

        return (
            <>
                <div
                    className="canvas-container"
                    ref={canvasDivRef}
                    style={{
                        position: "relative",
                        width: `${canvasWidth}px`,
                        height: `${canvasHeight}px`,
                    }}
                >
                    <div
                        style={{
                            width: `${canvasWidth}px`,
                            height: `${canvasHeight}px`,
                            border: "1px solid black",
                            borderRadius: "5px",
                            position: "absolute",
                            top: "0",
                            left: "0",
                        }}
                    >
                        {children}
                    </div>
                    <canvas
                        ref={drawCanvasRef}
                        width={canvasWidth}
                        height={canvasHeight}
                        style={{
                            width: `${canvasWidth}px`,
                            height: `${canvasHeight}px`,
                            border: "1px solid black",
                            borderRadius: "5px",
                            position: "absolute",
                            top: "0",
                            left: "0",
                            cursor:
                                lines.length >= lineLimit ||
                                drawingDot.length >= dotLimit
                                    ? "not-allowed"
                                    : "pointer",
                        }}
                        onClick={handleClick}
                    />
                </div>
                {showFunctionBtns && (
                    <div className="draw-btns">
                        <button
                            disabled={drawingDot.length === 0}
                            onClick={() => {
                                setDrawingDot((prev) => {
                                    const newDrawingDot = [...prev];
                                    newDrawingDot.pop();
                                    return newDrawingDot;
                                });
                            }}
                        >
                            Recover
                        </button>
                        <button
                            disabled={drawingDot.length < 2}
                            onClick={() => {
                                setDrawingDot([]);
                                setLines((prev) => {
                                    prev = [
                                        ...prev,
                                        [
                                            ...drawingDot.reduce(
                                                (acc, curr) => [
                                                    ...acc,
                                                    ...curr,
                                                ],
                                                []
                                            ),
                                        ],
                                    ];
                                    return prev;
                                });
                            }}
                        >
                            Stroke
                        </button>
                        <button
                            onClick={() => {
                                setDrawingDot([]);
                                setLines([]);
                            }}
                        >
                            Clear
                        </button>
                    </div>
                )}
            </>
        );
    }
);

export default DrawLineTool;
