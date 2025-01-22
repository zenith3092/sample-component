import { useRef, useState, useEffect } from "react";
import Toggle from "./exhibition/toggle/Toggle";
import "./App.css";
import DrawPolygonTool from "./exhibition/drawing-tools/DrawPolygonTool";
import VideoTool from "./exhibition/video-tool/VideoTool";
import axios from "axios";

function App() {
  const toolRef = useRef(null);
  const bgCanvasRef = useRef(null);

  const [captureImage, setCaptureImage] = useState("");

  useEffect(() => {
    toolRef.current.changeImage(captureImage);
  }, [captureImage]);

  return (
    <div className="App">
      <Toggle />
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
            "http://127.0.0.1:5211/api/upload/vp_captures",
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
      <DrawPolygonTool
        ref={toolRef}
        bgCanvasRef={bgCanvasRef}
        initPolygons={[]}
      />
      <VideoTool setCaptureImage={setCaptureImage} bgCanvasRef={bgCanvasRef} />
    </div>
  );
}

export default App;
