<template>
     <div :class="{'fullscreen-overlay': fullscreen, '': !fullscreen}" id="webcam-ui">
        <Webcam ref="webcam" @init="webcamInit" @clear="clear" @stop="stop" @start="start" @pause="pause" @resume="resume" @error="error" @unsupported="unsupported" @photoTaken="photoTakenEvent" :shutterEffect="fullscreen" />
        <div class="flex flex-col justify-center py-2 mx-auto text-center sm:flex-row align-center" v-if=" ! fullscreen">
            <div @click="loadCameras">
                <select @change="setCamera" v-model="deviceId" class="block w-full py-2 pl-3 pr-10 text-base border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm">
                    <option value="">{{selectCameraLabel}}</option>
                    <option v-for="camera in cameras" :value="camera.deviceId">{{camera.label}}</option>
                </select>
            </div>
            <div class="button-control" v-if="takePhotoButton.display">
                <button @click="takePhoto" v-if="deviceId" type="button" :class="takePhotoButton.css">
                    {{ takePhotoButton.text }}
                </button>
            </div>
            <div class="pr-2" v-if="reloadCamerasButton.display">
                <button @click="loadCameras" type="button" :class="reloadCamerasButton.css">
                    {{ reloadCamerasButton.text }}
                </button>
            </div>
            <div v-if="fullscreenButton.display">
                <button @click="toggleFullscreen" type="button" :class="fullscreenButton.css">
                    {{ fullscreenButton.text }}
                </button>
            </div>
        </div>
        <div class="fullscreen-ui" style="background: rgba(0,0,0,0.4);" v-else>
            <div class="flex items-center justify-center h-full">
                <div class="flex items-center justify-between p-8 align-center w-80">
                    <div @click="toggleFullscreen">
                        <button class="text-white">
                            <svg xmlns="http://www.w3.org/2000/svg" class="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                                <path stroke-linecap="round" stroke-linejoin="round" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                        </button>
                    </div>
                    <div @click="takePhoto">
                        <button class="camera" :class="{'camera-success': photoTaken, 'camera-failed': photoFailed}"> </button>
                    </div>
                    <div @click="flipCamera" :class="{'invisible': cameras.length < 2}">
                        <button class="text-white">
                            <svg xmlns="http://www.w3.org/2000/svg" class="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                                <path stroke-linecap="round" stroke-linejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                            </svg>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<style scoped src="../dist/output.css">
</style>

<style>
.fullscreen-ui {
    @apply fixed bottom-0 right-0 left-0 h-32
}
.fullscreen-overlay {
    @apply fixed top-0 bottom-0 left-0 right-0 z-50 w-screen h-screen bg-black
}
.camera {
    @apply text-white h-12 w-12 border-4 border-white rounded-full
}
.camera-success {
    @apply border-green-500
}
.camera-failed {
    @apply border-red-500
}
.button-control {
    @apply px-2 py-2 sm:py-0
}
.invisible {
    visibility: hidden;
}
</style>

<script>
import Webcam from './Webcam.vue';
export default {
    components: { Webcam },
    props: {
        reloadCamerasButton: {
            type: Object,
            default: {
                display: false,
                text: 'Reload cameras',
                css: 'inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-500 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500'
            }
        },
        takePhotoButton: {
            type: Object,
            default: {
                display: true,
                text: 'Take a photo',
                css: 'inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-indigo-500 border border-transparent rounded-md shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500'
            }
        },
        fullscreenButton: {
            type: Object,
            default: {
                display: true,
                text: 'Fullscreen',
                css: 'inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-indigo-500 border border-transparent rounded-md shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500'
            }
        },
        selectCameraLabel: {
            type: String,
            default: 'Select camera...'
        },
        fullscreenState: {
            type: Boolean,
            default: false,
        }
    },
    data() {
        return {
            cameras: [],
            deviceId: '',
            fullscreen: false,
            photoTaken: false,
            photoFailed: false,
            reloadCamInterval: null,
        }
    },
    emits: ['clear','stop','start','pause','resume', 'error', 'unsupported', 'init', 'photoTaken', 'fullscreen'],
    beforeUnmount() {
        if (this.reloadCamInterval) {
            clearInterval(this.reloadCamInterval)
        }
        this.exit()
    },
    methods: {
        async takePhoto() {
            try {
                await this.$refs.webcam.takePhoto();
                this.photoTaken = true
                setTimeout(() => {
                    this.photoTaken = false
                }, 500);
            } catch (err) {
                this.photoFailed = true
                setTimeout(() => {
                    this.photoFailed = false
                }, 500);
            }
        },
        loadCameras() {
            this.$refs.webcam.loadCameras()
            this.cameras = this.$refs.webcam.cameras;
        },
        webcamInit(deviceId) {
            this.deviceId = deviceId
            this.$emit('init', this.deviceId)
        },
        setCamera() {
            this.$refs.webcam.changeCamera(this.deviceId === '' ? null : this.deviceId)
        },
        flipCamera() {
            this.loadCameras();
            // flipping camera will select the next one from the list, but on most device there will be only 2, if < 2 it will not be shown
            if (this.cameras.length > 1) {
                let currentIndex = this.cameras.findIndex(el => el.deviceId === this.deviceId)
                let newIndex = currentIndex + 1
                if (newIndex >= this.cameras.length) {
                    newIndex = 0;
                }

                this.deviceId = this.cameras[newIndex].deviceId;
                this.$refs.webcam.changeCamera(this.cameras[newIndex].deviceId)
            }
        },
        toggleFullscreen() {
            this.fullscreen = ! this.fullscreen
            this.$emit('fullscreen', this.fullscreen)
            if (this.fullscreen) {
                // try to fullscreen webcam ui element
                if (document.querySelector('#webcam-ui').requestFullscreen !== undefined) {
                    document.querySelector('#webcam-ui').requestFullscreen();
                } else {
                    document.fullscreenElement.requestFullscreen()
                }
            } else {
                document.exitFullscreen();
            }
        },
        exit() {
            this.$refs.webcam.stop()
        },


        // emits
        clear() {
            this.$emit('clear')
        },
        stop() {
            this.$emit('stop')
        },
        start() {
            this.$emit('start')
        },
        pause() {
            this.$emit('pause')
        },
        resume() {
            this.$emit('resume')
        },
        error(err) {
            this.$emit('error', err)
        },
        unsupported(err) {
            this.$emit('unsupported', err)
        },
        photoTakenEvent({ blob, image_data_url }) {
            this.$emit('photoTaken', { blob, image_data_url })
        },
    },
    mounted () {
        this.cameras = this.$refs.webcam.cameras;
        if (this.cameras.length === 0) {
            // if no camera found, we will try to refresh cameras list each second until there is some camera
            this.reloadCamInterval = setInterval(() => {
                this.loadCameras()
                if (this.cameras.length > 0) {
                    clearInterval(this.reloadCamInterval)
                }
            }, 1000);
        }
    },
    watch: {
        fullscreenState: {
            immediate: true,
            handler: function (newVal) {
                    this.fullscreen = newVal
            }
        }
    }
}
</script>