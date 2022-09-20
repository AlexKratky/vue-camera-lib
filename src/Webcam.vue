
<template>
    <video
        ref="video"
        class="w-full h-auto"
        :class="{'hidden': ! deviceId, classList: true}"
        autoplay
    />

    <canvas ref="canvas" style="display: none;" />
    <div class="hidden">
        <audio ref="audio" volume="0.5" src="https://www.soundjay.com/mechanical/camera-shutter-click-08.mp3"></audio>
    </div>
    <div ref="shutter" class="shutter"></div>
</template>

<style scoped>
.w-full {
  width: 100%;
}
.h-auto {
  height: auto;
}
.hidden {
    display: none;
}
.shutter {
  opacity: 0;
  transition: all 30ms ease-in;
  position: fixed;
  height: 0%;
  width: 0%;
  pointer-events: none;

  background-color: black;
  
  left:50%;
  top:50%;
  transform: translate(-50%, -50%);
  -webkit-transform: translate(-50%, -50%)
}
.shutter.on {
  opacity: 1;/* Shutter Transparency */
  height: 100%;
  width: 100%;
}
</style>

<script>
import deviceorientation  from 'deviceorientation-js'
import { drawRotated }  from 'rotate-canvas'

export default {
    name: 'Webcam',
    props: {
        // if should remember last camera
        rememberDevice: {
            type: Boolean,
            default: true,
        },
        // try to use these device instead of first one, if the camera label has any keyword from this list
        preferCamerasWithLabel: {
            type: Array,
            default: ['back', 'usb'],
        },
        // class list of video element
        classList: {
            type: String,
            default: 'w-full h-auto'
        },
        // constraints that will be passed to getUserMedia, you can specify preferred resolution, facing direction etc.
        constraints: {
            type: Object,
            default: { video: { width: {ideal: 2560}, height: {ideal: 1440} }, facingMode: 'environment' }
        },
        // if device has gyroscope and the device is rotated (for example in landscape mode), this will try to rotate the image
        tryToRotateImage: {
            type: Boolean,
            default: true
        },
        // output image
        imageType: {
            type: String,
            default: 'image/jpeg'
        },
        // will store the last used device in the local storage if rememberDevice is enabled
        rememberDeviceTokenName: {
            type: String,
            default: '_vwl_device_id'
        },
        // if should automatically start and select the best device depending to preferCamerasWithLabel and constraints, or selects first device 
        autoStart: {
            type: Boolean,
            default: true
        },
        audio: {
            type: Boolean,
            default: true
        },
        shutterEffect: {
            type: Boolean,
            default: true
        }
    },
    data() {
        return {
            deviceId: null,
            cameras: [],
            innited: false,
        }
    },
    emits: ['clear','stop','start','pause','resume','error','unsupported','init','photoTaken'],
    async mounted() {
        this.setupMedia();
        deviceorientation.init()
    },
    beforeUnmount() {
        this.stop();
    },
    methods: {
        loadCameras() {
            navigator.mediaDevices
                .enumerateDevices()
                .then(deviceInfos => {
                    for (let i = 0; i !== deviceInfos.length; ++i) {
                        let deviceInfo = deviceInfos[i];
                        if (deviceInfo.kind === 'videoinput' && this.cameras.find(el => el.deviceId === deviceInfo.deviceId) === undefined) {
                            this.cameras.push(deviceInfo);
                        }
                    }
                })
                .then(() => {
                    if ( ! this.innited) {
                        if (this.deviceId === null && this.autoStart) {
                            this.start();
                        }
                        this.$emit('init', this.deviceId)
                        this.innited = true
                    }
                })
                .catch(error => this.$emit('unsupported', error));
        },
        changeCamera(deviceId) {
            if (this.deviceId !== deviceId) {
                this.deviceId = deviceId;
                return // will be recalled due to watcher
            }
            this.stop();
            if (deviceId) {
                this.loadCamera(deviceId);
            }
        },
        loadCamera(deviceId) {
            navigator.mediaDevices
                .getUserMedia(this.buildConstraints(deviceId))
                .then(stream => {
                    this.$refs.video.srcObject = stream

                    if (this.rememberDevice) {
                        window.localStorage.setItem(this.rememberDeviceTokenName, deviceId)
                    }
                })
                .catch(err => this.$emit('error', err));
        },

        legacyGetUserMediaSupport() {
            return constraints => {
                let getUserMedia =
                navigator.getUserMedia ||
                navigator.webkitGetUserMedia ||
                navigator.mozGetUserMedia ||
                navigator.msGetUserMedia ||
                navigator.oGetUserMedia;

                if (!getUserMedia) {
                    return Promise.reject(
                        new Error('getUserMedia is not implemented in this browser')
                    );
                }
                return new Promise(function(resolve, reject) {
                    getUserMedia.call(navigator, constraints, resolve, reject);
                });
            };
        },
        testMediaAccess() {
            navigator.mediaDevices
                .getUserMedia(this.buildConstraints())
                .then(stream => {
                    let tracks = stream.getTracks();
                    tracks.forEach(track => {
                        track.stop();
                    });
                    this.loadCameras();
                })
                .catch(err => this.$emit('error', err));
        },
        setupMedia() {
            if (navigator.mediaDevices === undefined) {
                navigator.mediaDevices = {};
            }
            if (navigator.mediaDevices.getUserMedia === undefined) {
                navigator.mediaDevices.getUserMedia = this.legacyGetUserMediaSupport();
            }
            this.testMediaAccess();
        },

        clear(video) {
            video.srcObject.getTracks().forEach(track => {
                track.stop();
                this.$refs.video.srcObject = null;
                this.source = null;
            });
            this.$emit('clear');
        },
        stop() {
            if (this.$refs.video?.srcObject) {
                this.clear(this.$refs.video);
            }
            this.$emit('stop');
        },
        start() {
            if (this.deviceId) {
                this.loadCamera(this.deviceId);
            } else {
                // check if there is any remembered device and if so, use them
                const rememberedDevice = window.localStorage.getItem(this.rememberDeviceTokenName);
                if (rememberedDevice && this.rememberDevice && this.cameras.find(el => el.deviceId === rememberedDevice)) {
                    this.deviceId = rememberedDevice;
                } else if (this.cameras.length > 1) {
                    for (const label of this.preferCamerasWithLabel) {
                        const camera = this.cameras.find(el => el.label.toLowerCase().indexOf(label) !== -1)
                        if (camera) {
                            this.deviceId = camera.deviceId;
                            break;
                        }
                    }
                }
                // nothing found, use first if there is any
                if ( ! this.deviceId && this.cameras.length > 0) {
                    this.cameras[0].deviceId;
                }
            }
            this.$emit('start');
        },
        pause() {
            if (this.$refs.video?.srcObject) {
                this.$refs.video.pause();
            }
            this.$emit('pause');
        },
        resume() {
            if (this.$refs.video?.srcObject) {
                this.$refs.video.play();
            }
            this.$emit('resume');
        },

        buildConstraints(deviceId) {
            const constraints = { video: true, audio: false };
            const c = { ...constraints, ...this.constraints };
            if (deviceId) {
                if (typeof c.video !== 'object' || c.video === null) {
                    c.video = {}
                }
                c.video.deviceId = { exact: deviceId } 
            }
            return c;
        },

        async takePhoto() {
            let video = this.$refs.video;
            let canvas = this.$refs.canvas;
            canvas.height = video.videoHeight;
            canvas.width = video.videoWidth;
            let ctx = canvas.getContext('2d');

            drawRotated(video, canvas, ctx, this.tryToRotateImage ? deviceorientation.getDeviceOrientation() : 0)

            let image_data_url = canvas.toDataURL(this.imageType);
            canvas.toBlob(blob => {
                if (this.audio) {
                    this.$refs.audio.play();
                }
                if (this.shutterEffect) {
                    this.$refs.shutter.classList.add('on');
                    setTimeout(() => {
                        this.$refs.shutter.classList.remove('on');
                    }, 30*2+45);
                }
                this.$emit('photoTaken', { blob, image_data_url })
            }, this.imageType);
        },
    },
    watch: {
        deviceId: function(deviceId) {
            this.changeCamera(deviceId);
        }
    },
}
</script>