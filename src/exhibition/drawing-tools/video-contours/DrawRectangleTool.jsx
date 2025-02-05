import React, {
    useEffect,
    useState,
    forwardRef,
    useRef,
    useImperativeHandle,
} from "react";

/**
 * @typedef {object} DrawingTool
 * @property {number[][]} rectangles - normalized rectangle coordinates
 * @property {(rectangleArray: number[][]) => void} initRectangles
 * @property {() => void} clearRectangles
 */

const DrawRectangleTool = forwardRef(
    /**
     * @param {object} props
     * @param {React.ReactNode} props.children
     * @param {boolean} props.showFunctionBtns
     * @param {React.ForwardedRef<DrawingTool>} ref
     */
    ({ children, showFunctionBtns = true }, ref) => {
        const canvasWidth = 640;
        const canvasHeight = 360;

        const dotColor = "green";
        const dotRadius = 5;

        const rectangleLimit = 1;

        const rectangleColor = "green";
        const rectangleFillColor = "rgba(0, 255, 0, 0.3)";
        const rectangleEdgeWidth = 2;

        const [drawingDot, setDrawingDot] = useState([]);
        const [rectangles, setRectangles] = useState([]);

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
         * @param {number} x1
         * @param {number} y1
         * @param {number} x2
         * @param {number} y2
         */
        function drawRectangle(canvas, x1, y1, x2, y2) {
            console.log(x1, y1, x2, y2);
            const ctx = canvas.getContext("2d");
            ctx.beginPath();
            ctx.rect(x1, y1, x2 - x1, y2 - y1);
            ctx.lineWidth = rectangleEdgeWidth;
            ctx.strokeStyle = rectangleColor;
            ctx.stroke();
            ctx.fillStyle = rectangleFillColor;
            ctx.fill();
        }

        /**
         * @param {HTMLCanvasElement} canvas
         * @param {number[][]} rectangleArray
         */
        function strokeRectangles(
            canvas,
            rectangleArray,
            shouldDrawDot = true
        ) {
            clearCanvas(canvas);

            rectangleArray.forEach((rectangle) => {
                const unNormalizedRectangle = rectangle.map((coord, index) => {
                    if (index % 2 === 0) {
                        return coord * canvasWidth;
                    } else {
                        return coord * canvasHeight;
                    }
                });
                drawRectangle(canvas, ...unNormalizedRectangle);
                if (shouldDrawDot) {
                    drawDot(
                        canvas,
                        unNormalizedRectangle[0],
                        unNormalizedRectangle[1]
                    );
                    drawDot(
                        canvas,
                        unNormalizedRectangle[2],
                        unNormalizedRectangle[3]
                    );
                }
            });
        }

        /**
         * @param {React.MouseEvent<HTMLCanvasElement, MouseEvent>} e
         */
        const handleClick = (e) => {
            if (rectangles.length < rectangleLimit) {
                const canvas = drawCanvasRef.current;
                const adjustment = canvas.getBoundingClientRect();

                const x = e.clientX - adjustment.left;
                const y = e.clientY - adjustment.top;

                setDrawingDot((prev) => {
                    if (prev.length < 2) {
                        prev = [...prev, [x / canvas.width, y / canvas.height]];
                    }
                    return prev;
                });
            }
        };

        /**
         * @param {number[][]} rectangleArray
         */
        function initRectangles(rectangleArray) {
            setRectangles(rectangleArray);
        }

        function clearRectangles() {
            setRectangles([]);
        }

        useImperativeHandle(
            ref,
            () => ({
                rectangles,
                initRectangles,
                clearRectangles,
            }),
            [rectangles]
        );

        useEffect(() => {
            const canvas = drawCanvasRef.current;

            strokeRectangles(canvas, rectangles, true);

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
        }, [rectangles, drawingDot]);

        useEffect(() => {
            /**
             * @param {KeyboardEvent} e
             */
            function handleKeyBoardDotChange(e) {
                if (["w", "W", "ArrowUp"].includes(e.key)) {
                    setDrawingDot((prev) => {
                        if (prev.length > 0 && prev.length <= 2) {
                            const newDrawingDot = [...prev];
                            newDrawingDot[prev.length - 1][1] -= 0.001;
                            return newDrawingDot;
                        }
                        return prev;
                    });
                } else if (["s", "S", "ArrowDown"].includes(e.key)) {
                    setDrawingDot((prev) => {
                        if (prev.length > 0 && prev.length <= 2) {
                            const newDrawingDot = [...prev];
                            newDrawingDot[prev.length - 1][1] += 0.001;
                            return newDrawingDot;
                        }
                        return prev;
                    });
                } else if (["a", "A", "ArrowLeft"].includes(e.key)) {
                    setDrawingDot((prev) => {
                        if (prev.length > 0 && prev.length <= 2) {
                            const newDrawingDot = [...prev];
                            newDrawingDot[prev.length - 1][0] -= 0.001;
                            return newDrawingDot;
                        }
                        return prev;
                    });
                } else if (["d", "D", "ArrowRight"].includes(e.key)) {
                    setDrawingDot((prev) => {
                        if (prev.length > 0 && prev.length <= 2) {
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
                            zIndex: "1",
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
                            zIndex: "50",
                            cursor:
                                drawingDot.length === 2 ||
                                rectangles.length >= rectangleLimit
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
                                    return prev.slice(0, prev.length - 1);
                                });
                            }}
                        >
                            Recover
                        </button>
                        <button
                            disabled={drawingDot.length !== 2}
                            onClick={() => {
                                setDrawingDot([]);
                                setRectangles((prev) => {
                                    return [
                                        ...prev,
                                        [...drawingDot[0], ...drawingDot[1]],
                                    ];
                                });
                            }}
                        >
                            Stroke
                        </button>
                        <button
                            onClick={() => {
                                setDrawingDot([]);
                                setRectangles([]);
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

export default DrawRectangleTool;
