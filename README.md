# vue-camera-lib

Simple yet powerful camera library for Vue 3. The main purpose of this library is to display camera output and take a picture on user demand.

## Features

* Taking pictures within your webpage
* Default UI which looks like mobile a camera app, but you can always make a custom UI
* Rotates a photo if the user uses a device in landscape mode (if the device has a gyroscope) 

## Demo

[Demo is available here](https://62fe53df410812000989322e--statuesque-madeleine-efb457.netlify.app/), source code of that demo is [available here](https://github.com/AlexKratky/vue-camera-lib-demo)

![demo](https://i.imgur.com/7yjXPIp.jpeg)

## Installation

```bash
npm i vue-camera-lib
# or
yarn add vue-camera-lib
```

## Usage

To use it in your Vue3 app, the best way is to edit `src/main.js` file by adding two lines:

```js
import VueCameraLib from 'vue-camera-lib'
app.use(VueCameraLib)
```

So after edit the file should look like this:

```js
import { createApp } from 'vue'
// ... more imports

// add this:
import VueCameraLib from 'vue-camera-lib'

const app = createApp(App)

// here can be router setup, other plugins

// add this:
app.use(VueCameraLib)

app.mount('#app')
```

The second way how to do it, if you need a camera just in a few places, is to import it directly into your components

```html
<template>
    <WebCamUI :fullscreenState="false"  @photoTaken="photoTaken" />
</template>

<script>
import { WebCamUI } from 'vue-camera-lib'

export default {
  components: {
    WebCamUI,
  },
  methods: {
    photoTaken(data) {
      console.log('image blob: ', data.blob)
      console.log('image data url', data.image_data_url)
    },
  }
},
```

That was about importing the library to your project, let's look closely at two components, the WebCamUI and the WebCam.

### WebCamUI

This component has already a user interface, so it is very easy to use it, the main event you want to listen to is `photoTaken` as is seen above.

#### All events that are emitted:

* `clear` - clear video tracks, called from stop
* `stop` - stop if its started
* `start`
* `pause`
* `resume`
* `error` (message) - errors occurred
* `unsupported` (message) - browser is not supported
* `init` - first run
* `photoTaken` ({blob, image_data_url}) - Photo was successfully taken, the argument is an object with `blob` and `image_data_url` attributes
* `fullscreen` (currentState) - Fullscreen state changed

#### Used props

```js
const props: {
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
    // there is a watcher than will change the state of fullscreen on change
    fullscreenState: {
        type: Boolean,
        default: false,
    }
}
```

### WebCam

This component has barely any UI and should be used within its own UI.

#### All events that are emitted:

* `clear` - clear video tracks, called from stop
* `stop` - stop if its started
* `start`
* `pause`
* `resume`
* `error` (message) - errors occurred
* `unsupported` (message) - browser is not supported
* `init` - first run
* `photoTaken` ({blob, image_data_url}) - Photo was successfully taken, the argument is an object with `blob` and `image_data_url` attributes

#### Used props

```js
const props: {
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
    // play audio on photo taken
    audio: {
        type: Boolean,
        default: true
    },
    // shutter effect on photo taken
    shutterEffect: {
        type: Boolean,
        default: true
    }
}
```

#### Methods

| Name | Parameters | Description |
| --- | --- | --- |
| loadCameras | | Try to load all available cameras and if auto start is enabled, then it tries to start video stream |
| changeCamera | deviceId | Change the camera. The deviceId in `cameras` data, which is array of [MediaDeviceInfo](https://developer.mozilla.org/en-US/docs/Web/API/MediaDeviceInfo). If passed undefined, then it stops the current camera without starting any other. |
| start	| | Start the camera after stopping it (will be used last deviceId, if you need to use another, use changeCamera method) |
| stop	| | Stop the camera's video steam |
| pause	| | Pause the camera |
| resume	| | Resume the camera after it was paused |

#### How to call methods

You need to have a ref attribute on Webcam element and then use `this.$refs.webcam.`, example:

```html
<template>
    <div>
        <!-- the ref attribute is very important -->
        <Webcam ref="webcam" @photoTaken="photoTakenEvent" @init="webcamInit" />
        <select @change="setCamera" v-model="deviceId">
            <option value="">-</option>
            <option v-for="camera in cameras" :value="camera.deviceId">{{camera.label}}</option>
        </select>
        <button @click="takePhoto">Take a photo</button>
    </div>
</template>

<script>
export default {
    data() {
        return {
            cameras: [],
            deviceId: '',
        }
    },
    methods: {
        async takePhoto() {
            try {
                await this.$refs.webcam.takePhoto();
            } catch (err) {
                console.log(err)
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

        photoTakenEvent({ blob, image_data_url }) {
            this.$emit('photoTaken', { blob, image_data_url })
        },
    },
    // load cameras
    mounted () {
        this.cameras = this.$refs.webcam.cameras;
        if (this.cameras.length === 0) {
            // if no camera found, we will try to refresh cameras list each second until there is some camera
            let reloadCamInterval = setInterval(() => {
                this.loadCameras()
                if (this.cameras.length > 0) {
                    clearInterval(reloadCamInterval)
                }
            }, 1000);
        }
    },
}
</script>
```



## Contributing

Pull requests are welcomed because currently, I do not plan to make any changes.

## With ❤️ by Alex Kratky

[Contact webpage](https://alexkratky.com/)

This package was inspired by [vue-web-cam](https://www.npmjs.com/package/vue-web-cam)
