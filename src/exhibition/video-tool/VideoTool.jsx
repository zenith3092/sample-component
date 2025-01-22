import React, { useRef } from "react";
import CameraStreaming from "./camera-streaming";
import { toCanvas, toPng } from "html-to-image";

const VideoTool = ({ setCaptureImage }) => {
  const videoRef = useRef(null);

  const videoWidth = 640 / 2;
  const videoHeight = videoWidth * (9 / 16);

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
        deviceId="CAMERA-201-1"
        style={{ width: `${videoWidth}px`, height: `${videoHeight}px` }}
        turnOnCapture={true}
      />
      <button
        onClick={() => {
          const canvas = document.createElement("canvas");
          canvas.width = window.innerWidth * 0.95;
          // canvas.width = videoWidth;
          canvas.height = (canvas.width * 9) / 16;

          const ctx = canvas.getContext("2d");
          ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
          const dataUrl = canvas.toDataURL("image/png", 1.0);
          setCaptureImage(dataUrl);
        }}
      >
        Capture
      </button>
    </div>
  );
};

export default VideoTool;
