import React, {
    useEffect,
    useState,
    forwardRef,
    useRef,
    useImperativeHandle,
} from "react";

/**
 * @typedef {object} DrawingTool
 * @property {number[][]} polygons - normalized polygon coordinates
 * @property {(polygonArray: number[][]) => void} initPolygons
 * @property {() => void} clearPolygons
 */

const DrawPolygonTool = forwardRef(
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
        const dotColor = "blue";
        const dotRadius = 5;

        const polygonLimit = 2;
        const polygonColor = "blue";
        const polygonFillColor = "rgba(0, 0, 255, 0.3)";
        const polygonFocusColor = "red";
        const polygonFocusFillColor = "rgba(255, 0, 0, 0.3)";
        const polygonEdgeWidth = 2;

        const modeOptions = {
            DRAW: "DRAW",
            REMOVE: "REMOVE",
        };

        const [mode, setMode] = useState(modeOptions.DRAW);
        const [selectedIdx, setSelectedIdx] = useState(-1);
        const [drawingDot, setDrawingDot] = useState([]);
        const [polygons, setPolygons] = useState([]);

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
                    yi > y !== yj > y &&
                    x < ((xj - xi) * (y - yi)) / (yj - yi) + xi;
                if (intersect) {
                    flag = !flag;
                }
                j = i;
            }

            return flag;
        }

        /**
         * @param {HTMLCanvasElement} canvas
         * @param {number} x
         * @param {number} y
         * @param {string} [fillColor=dotColor]
         */
        function drawDot(canvas, x, y, fillColor = dotColor) {
            const ctx = canvas.getContext("2d");
            ctx.beginPath();
            ctx.arc(x, y, dotRadius, 0, Math.PI * 2);
            ctx.fillStyle = fillColor;
            ctx.fill();
        }

        /**
         * @param {HTMLCanvasElement} canvas
         * @param {number[]} polygon
         * @param {string} [strokeColor=polygonColor]
         * @param {string} [fillColor=polygonFillColor]
         */
        function drawPolygon(
            canvas,
            polygon,
            strokeColor = polygonColor,
            fillColor = polygonFillColor
        ) {
            const ctx = canvas.getContext("2d");
            if (polygon.length < 4) return;

            ctx.beginPath();
            ctx.moveTo(polygon[0], polygon[1]);

            for (let i = 2; i < polygon.length; i += 2) {
                ctx.lineTo(polygon[i], polygon[i + 1]);
            }

            ctx.closePath();

            ctx.strokeStyle = strokeColor;
            ctx.polygonWidth = polygonEdgeWidth;
            ctx.stroke();

            ctx.fillStyle = fillColor;
            ctx.fill();
        }

        /**
         * @param {HTMLCanvasElement} canvas
         * @param {number[][]} polygonArray
         */
        function strokePolygons(canvas, polygonArray, shouldDrawDot = true) {
            clearCanvas(canvas);

            polygonArray.forEach((polygon, index) => {
                const unNormalizedPolygon = polygon.map((coord, index) => {
                    if (index % 2 === 0) {
                        return coord * canvasWidth;
                    } else {
                        return coord * canvasHeight;
                    }
                });
                drawPolygon(
                    canvas,
                    unNormalizedPolygon,
                    index === selectedIdx ? polygonFocusColor : polygonColor,
                    index === selectedIdx
                        ? polygonFocusFillColor
                        : polygonFillColor
                );
                if (shouldDrawDot) {
                    for (let i = 0; i < polygon.length; i += 2) {
                        drawDot(
                            canvas,
                            unNormalizedPolygon[i],
                            unNormalizedPolygon[i + 1],
                            index === selectedIdx ? polygonFocusColor : dotColor
                        );
                    }
                }
            });
        }

        /**
         * @param {React.MouseEvent<HTMLCanvasElement, MouseEvent>} e
         */
        const handleClick = (e) => {
            if (mode === modeOptions.REMOVE) {
                setPolygons((prev) => {
                    const newPolygons = [...prev];
                    newPolygons.splice(selectedIdx, 1);
                    return newPolygons;
                });
                setSelectedIdx(-1);
            } else if (mode === modeOptions.DRAW) {
                if (
                    polygons.length < polygonLimit &&
                    drawingDot.length < dotLimit
                ) {
                    const canvas = drawCanvasRef.current;
                    const adjustment = canvas.getBoundingClientRect();

                    const x = e.clientX - adjustment.left;
                    const y = e.clientY - adjustment.top;

                    setDrawingDot((prev) => {
                        prev = [...prev, [x / canvas.width, y / canvas.height]];
                        return prev;
                    });
                }
            }
        };

        const handleMouseMove = (e) => {
            if (mode === modeOptions.REMOVE && polygons.length > 0) {
                const canvas = drawCanvasRef.current;
                const adjustment = canvas.getBoundingClientRect();

                const x = e.clientX - adjustment.left;
                const y = e.clientY - adjustment.top;

                setPolygons((prev) => {
                    const newPolygons = [...prev];
                    const idx = newPolygons.findIndex((polygon) =>
                        polygonContains(canvas, x, y, polygon)
                    );
                    setSelectedIdx(idx);
                    return newPolygons;
                });
            }
        };

        /**
         * @param {number[][]} polygonArray
         */
        function initPolygons(polygonArray) {
            setPolygons(polygonArray);
        }

        function clearPolygons() {
            setPolygons([]);
        }

        useImperativeHandle(
            ref,
            () => ({
                polygons,
                initPolygons,
                clearPolygons,
            }),
            [polygons]
        );

        useEffect(() => {
            const canvas = drawCanvasRef.current;

            strokePolygons(canvas, polygons, true);

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
        }, [polygons, drawingDot, selectedIdx]);

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
                                mode === modeOptions.DRAW
                                    ? polygons.length >= polygonLimit ||
                                      drawingDot.length >= dotLimit
                                        ? "not-allowed"
                                        : "pointer"
                                    : polygons.length === 0
                                    ? "not-allowed"
                                    : "pointer",
                        }}
                        onClick={handleClick}
                        onMouseMove={handleMouseMove}
                    />
                </div>
                {showFunctionBtns && (
                    <div className="draw-btns">
                        <button
                            onClick={() => {
                                setMode(
                                    mode === modeOptions.DRAW
                                        ? modeOptions.REMOVE
                                        : modeOptions.DRAW
                                );
                            }}
                        >
                            {mode === modeOptions.DRAW ? "Remove" : "Draw"}
                        </button>
                        {mode === modeOptions.DRAW && (
                            <>
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
                                        setPolygons((prev) => {
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
                                        setPolygons([]);
                                    }}
                                >
                                    Clear
                                </button>
                            </>
                        )}
                    </div>
                )}
            </div>
        );
    }
);

export default DrawPolygonTool;
