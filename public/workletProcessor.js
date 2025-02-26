class MicrophoneProcessor extends AudioWorkletProcessor {
    process(inputs) {
        const input = inputs[0];
        if (!input || input.length === 0) return true;

        const float32Array = input[0]; // 直接獲取 Float32Array
        this.port.postMessage(float32Array.buffer); // 直接發送 Float32 給前端
        return true;
        // if (input.length > 0) {
        //     const channelData = input[0];
        //     const int16Data = new Int16Array(channelData.length);

        //     for (let i = 0; i < channelData.length; i++) {
        //         int16Data[i] = Math.max(
        //             -32768,
        //             Math.min(32767, channelData[i] * 32768)
        //         );
        //     }

        //     this.port.postMessage(int16Data.buffer);
        // }
        // return true;
    }
}

registerProcessor("microphone-processor", MicrophoneProcessor);
