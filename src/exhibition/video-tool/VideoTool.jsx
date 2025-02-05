import React, { useRef } from "react";
import CameraStreaming from "./camera-streaming";

const VideoTool = ({
    setCaptureImage,
    deviceId,
    videoWidth = 640 / 2,
    videoHeight = (640 / 2) * (9 / 16),
    turnOnCapture = true,
}) => {
    const videoRef = useRef(null);

    return (
        <div
            className="video-tool"
            style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                marginBottom: "10px",
            }}
        >
            <CameraStreaming
                videoRef={videoRef}
                deviceId={deviceId}
                style={{ width: `${videoWidth}px`, height: `${videoHeight}px` }}
                turnOnCapture={true}
            />
            {turnOnCapture && (
                <button
                    onClick={() => {
                        const canvas = document.createElement("canvas");
                        canvas.width = window.innerWidth * 0.95;
                        canvas.height = (canvas.width * 9) / 16;

                        const ctx = canvas.getContext("2d");
                        ctx.drawImage(
                            videoRef.current,
                            0,
                            0,
                            canvas.width,
                            canvas.height
                        );
                        const dataUrl = canvas.toDataURL("image/png", 1.0);
                        setCaptureImage(dataUrl);
                    }}
                >
                    Capture
                </button>
            )}
        </div>
    );
};

export default VideoTool;
