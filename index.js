
import WebCam from "./src/Webcam.vue";
import WebCamUI from "./src/WebCamUI.vue";
export default {
    install: (app) => {
        app.component("WebCam", WebCam);
        app.component("WebCamUI", WebCamUI);
        
    },
}

export { WebCam , WebCamUI };