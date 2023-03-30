import * as THREE from "three";

class CustomWebcamRenderer {
  constructor(renderer, videoElement) {
    this.renderer = renderer;
    this.renderer.autoClear = false;
    this.sceneWebcam = new THREE.Scene();
    this.stopped = false
    let video;
    if (videoElement === undefined) {
      video = document.createElement("video");
      video.setAttribute("autoplay", true);
      video.setAttribute("playsinline", true);
      video.style.display = "none";
      document.body.appendChild(video);
    } else {
      video = document.querySelector(videoElement);
    }
    this.geom = new THREE.PlaneBufferGeometry();
    this.texture = new THREE.VideoTexture(video);
    this.material = new THREE.MeshBasicMaterial({ map: this.texture });
    const mesh = new THREE.Mesh(this.geom, this.material);
    this.sceneWebcam.add(mesh);
    this.cameraWebcam = new THREE.OrthographicCamera(
      -0.5,
      0.5,
      0.5,
      -0.5,
      0,
      10
    );
    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
      const constraints = {
        video: {
          width: 1280,
          height: 720,
          facingMode: "environment",
        },
      };
      navigator.mediaDevices
        .getUserMedia(constraints)
        .then((stream) => {
          console.log(`using the webcam successfully...`);
          video.srcObject = stream;
          video.play();
        })
        .catch((e) => {
          alert(`Webcam error: ${e}`);
        });
    } else {
      alert("sorry - media devices API not supported");
    }
  }

  update() {
    if(this.stopped) {
      return
    }
    this.renderer.clear();
    this.renderer.render(this.sceneWebcam, this.cameraWebcam);
    this.renderer.clearDepth();
  }

  dispose() {
    this.stopped = true
    this.safeRelease(this.material)
    this.safeRelease(this.texture)
    this.safeRelease(this.geom)
  }

  safeRelease(obj) {
    if(obj && obj.dispose) {
      obj.dispose()
      obj = null
    }
  }
}

export { CustomWebcamRenderer };
