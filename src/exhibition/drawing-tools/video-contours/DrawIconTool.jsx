import React, {
    useEffect,
    useState,
    forwardRef,
    useRef,
    useImperativeHandle,
} from "react";

/**
 * @typedef {object} DrawingTool
 * @property {number[][]} icons - normalized rectangle coordinates
 * @property {(rectangleArray: number[][]) => void} initIcons
 * @property {() => void} clearIcons
 */

const DrawIconTool = forwardRef(
    /**
     * @param {object} props
     * @param {React.ReactNode} props.children
     * @param {boolean} props.showFunctionBtns
     * @param {(canvas: HTMLCanvasElement, x: number, y: number) => void} props.drawIconCb
     * @param {React.ForwardedRef<DrawingTool>} ref
     */ ({ children, showFunctionBtns = true, drawIconCb }, ref) => {
        const canvasWidth = 640;
        const canvasHeight = 360;

        const iconLimit = 5;
        const iconRadius = 10;
        const iconLineWidth = 3;
        const iconColor = "red";
        const radiusAdjustment = 0.8;

        const [icons, setIcons] = useState([]);

        /** @type {React.MutableRefObject<HTMLDivElement | null>} */
        const canvasDivRef = useRef(null);

        /** @type {React.MutableRefObject<HTMLCanvasElement | null>} */
        const drawCanvasRef = useRef(null);

        /**
         * @param {HTMLCanvasElement} canvas
         * @param {number} x
         * @param {number} y
         */
        function drawIcon(canvas, x, y) {
            if (typeof drawIconCb === "function") {
                drawIconCb(canvas, x, y);
                return;
            }

            const ctx = canvas.getContext("2d");

            ctx.beginPath();
            ctx.arc(x, y, iconRadius, 0, Math.PI * 2);
            ctx.lineWidth = iconLineWidth;
            ctx.strokeStyle = iconColor;
            ctx.stroke();

            ctx.beginPath();
            ctx.moveTo(
                x + iconRadius * radiusAdjustment,
                y - iconRadius * radiusAdjustment
            );
            ctx.lineTo(
                x - iconRadius * radiusAdjustment,
                y + iconRadius * radiusAdjustment
            );
            ctx.lineWidth = iconLineWidth;
            ctx.strokeStyle = iconColor;
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
         * @param {React.MouseEvent<HTMLCanvasElement, MouseEvent>} e
         */
        const handleClick = (e) => {
            if (icons.length < iconLimit) {
                const canvas = drawCanvasRef.current;
                const adjustment = canvas.getBoundingClientRect();

                const x = e.clientX - adjustment.left;
                const y = e.clientY - adjustment.top;

                setIcons([...icons, [x, y]]);
            }
        };

        /**
         * @param {number[]} iconArray
         */
        function initIcons(iconArray) {
            setIcons(iconArray);
        }

        function clearIcons() {
            setIcons([]);
        }

        useImperativeHandle(
            ref,
            () => ({
                icons,
                initIcons,
                clearIcons,
            }),
            [icons]
        );

        useEffect(() => {
            const canvas = drawCanvasRef.current;

            clearCanvas(canvas);

            icons.forEach((icon) => {
                drawIcon(canvas, icon[0], icon[1]);
            });
        }, [icons]);

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
                            cursor: "pointer",
                        }}
                        onClick={handleClick}
                    />
                </div>
                {showFunctionBtns && (
                    <div className="draw-btns">
                        <button
                            disabled={icons.length === 0}
                            onClick={() => {
                                setIcons((prev) => {
                                    return prev.slice(0, prev.length - 1);
                                });
                            }}
                        >
                            Recover
                        </button>
                        <button
                            onClick={() => {
                                setIcons([]);
                            }}
                        >
                            Clear
                        </button>
                    </div>
                )}
            </div>
        );
    }
);

export default DrawIconTool;
