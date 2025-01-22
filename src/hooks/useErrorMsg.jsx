import { useState } from "react";

/**
 * @returns {{ errorMsg: string, putErrorMsg: (msg: string) => void }}
 */
const useErrorMsg = () => {
  const [errorMsg, setErrorMsg] = useState("");

  function putErrorMsg(msg) {
    setErrorMsg(msg);
    setTimeout(() => {
      setErrorMsg("");
    }, 3000);
  }
  return {
    errorMsg,
    putErrorMsg,
  };
};

export default useErrorMsg;
