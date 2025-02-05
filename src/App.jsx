import { useRef, useState, useEffect } from "react";
import Toggle from "./exhibition/toggle/Toggle";
import "./App.css";
import DrawPolygonTool from "./exhibition/drawing-tools/image-contours/DrawPolygonTool";
import ImageDrawPolygonTool from "./exhibition/drawing-tools/video-contours/DrawPolygonTool";
import VideoDrawRectangleTool from "./exhibition/drawing-tools/video-contours/DrawRectangleTool";
import DrawLineTool from "./exhibition/drawing-tools/video-contours/DrawLineTool";
import DrawIconTool from "./exhibition/drawing-tools/video-contours/DrawIconTool";
import VideoTool from "./exhibition/video-tool/VideoTool";
import axios from "axios";

const WEB_SERVER_URL = import.meta.env.VITE_WEB_SERVER_URL;

function App() {
    const toolRef = useRef(null);

    const [captureImage, setCaptureImage] = useState("");

    useEffect(() => {
        toolRef.current.changeImage(captureImage);
        toolRef.current.clearPolygons();
    }, [captureImage]);

    return (
        <div className="App" style={{ marginTop: "20px" }}>
            {/* <Toggle /> */}

            <div>
                <button
                    onClick={() => {
                        console.log(toolRef.current.polygons);
                    }}
                >
                    Coordinate Output
                </button>
                <button
                    onClick={async () => {
                        const file = await toolRef.current.outputImageFile();

                        const formData = new FormData();
                        formData.append("vp_captures", file);

                        const res = await axios.post(
                            `${WEB_SERVER_URL}/api/upload/vp_captures`,
                            formData,
                            {
                                headers: {
                                    "Content-Type": "multipart/form-data",
                                },
                            }
                        );

                        console.log(res.data);
                    }}
                >
                    Image Output
                </button>
            </div>

            <ImageDrawPolygonTool ref={toolRef} />

            <VideoTool
                deviceId={"CAMERA-201-1"}
                setCaptureImage={setCaptureImage}
                videoWidth={640}
                videoHeight={360}
            />

            {/* <VideoDrawPolygonTool ref={toolRef}>
                <VideoTool
                    deviceId={"CAMERA-201-1"}
                    setCaptureImage={setCaptureImage}
                    videoWidth={640}
                    videoHeight={360}
                    turnOnCapture={false}
                />
            </VideoDrawPolygonTool>

            <DrawRectangleTool ref={toolRef}>
                <VideoTool
                    deviceId={"CAMERA-201-1"}
                    setCaptureImage={setCaptureImage}
                    videoWidth={640}
                    videoHeight={360}
                    turnOnCapture={false}
                />
            </DrawRectangleTool> */}
            {/* 
            <DrawLineTool ref={toolRef}>
                <VideoTool
                    deviceId={"CAMERA-201-1"}
                    setCaptureImage={setCaptureImage}
                    videoWidth={640}
                    videoHeight={360}
                    turnOnCapture={false}
                />
            </DrawLineTool>

            <DrawIconTool ref={toolRef}>
                <VideoTool
                    deviceId={"CAMERA-201-1"}
                    setCaptureImage={setCaptureImage}
                    videoWidth={640}
                    videoHeight={360}
                    turnOnCapture={false}
                />
            </DrawIconTool> */}
        </div>
    );
}

export default App;
