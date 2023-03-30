import {
  Raycaster,
  Vector2,
  Math as MathUtils,
} from 'three';
import { LocationBased } from '@ar-js-org/ar.js/three.js/build/ar-threex-location-only';
import Hammer from '@egjs/hammerjs'

class CustomLocationBased extends LocationBased{
  constructor(scene, camera, options = {}) {
    super(scene, camera, options)
    this._raycaster = new Raycaster();
    this._canvas = null;
    this.pointer = new Vector2();
    this.lastPointer = new Vector2();
    this.currentCoords = null;
    this.cam = null;
    this.isMobile = (/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)) ? true : false;
    this.cameraOffset = {
      rotation: 0,
      height: 1
    };
    this.xyPoint = {
      x: 0, y: 0
    };
    this.counter = 0;
  }

  // override
  add(object, lon, lat, elev) {
    super.add(object, lon, lat, elev)
  }

  getNewRayCaster() {
    return new Raycaster()
  }

  // override not use for plateau yokohama app
  _gpsReceived(position) {
    let distMoved = Number.MAX_VALUE;
    if (position.coords.accuracy <= this._gpsMinAccuracy) {
      if (this._lastCoords === null) {
        this._lastCoords = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          altitude: position.coords.altitude ? position.coords.altitude + this.cameraOffset.height: this.cameraOffset.height,
        };
        this.currentCoords = position.coords;
      } else {
        this.currentCoords = position.coords;
        distMoved = this._haversineDist(this._lastCoords, position.coords);
      }
      if (distMoved >= this._gpsMinDistance) {
        this._lastCoords.longitude = position.coords.longitude;
        this._lastCoords.latitude = position.coords.latitude;
        this._lastCoords.altitude = position.coords.altitude;
        this.setWorldPosition(
          this._camera,
          position.coords.longitude,
          position.coords.latitude,
          position.coords.altitude ? position.coords.altitude + this.cameraOffset.height: this.cameraOffset.height
        );
        if (this._eventHandlers["gpsupdate"]) {
          this._eventHandlers["gpsupdate"](position, distMoved);
        }
      }
    }
  }

  // override
  _haversineDist(src, dest) {
    const dlongitude = MathUtils.degToRad(dest.longitude - src.longitude);
    const dlatitude = MathUtils.degToRad(dest.latitude - src.latitude);

    const a =
      Math.sin(dlatitude / 2) * Math.sin(dlatitude / 2) +
      Math.cos(MathUtils.degToRad(src.latitude)) *
        Math.cos(MathUtils.degToRad(dest.latitude)) *
        (Math.sin(dlongitude / 2) * Math.sin(dlongitude / 2));
    const angle = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return angle * 6371000;
  }

  // override
  setElevation(elev) {
    this._camera.position.y = elev + this.cameraOffset.height;
  }

  // updating gps manually
  coordsReceived(coords) {
    let distMoved = Number.MAX_VALUE;
    
    if (coords.accuracy <= this._gpsMinAccuracy) {
      this.currentCoords = coords;
      if (this._lastCoords === null) {
        this._lastCoords = {
          latitude: coords.latitude,
          longitude: coords.longitude,
          altitude: coords.altitude ? coords.altitude : 0,
          accuracy: coords.accuracy,
        };
      } else {
        distMoved = this._haversineDist(this._lastCoords, coords);
      }
      if (distMoved >= this._gpsMinDistance) {
        this._lastCoords.longitude = coords.longitude;
        this._lastCoords.latitude = coords.latitude;
        this._lastCoords.altitude = coords.altitude ? coords.altitude : 0;

        this.setWorldPosition(
          this._camera,
          this._lastCoords.longitude,
          this._lastCoords.latitude,
          this._lastCoords.altitude + this.cameraOffset.height,
        );
        if (this._eventHandlers["gpsupdate"]) {
          this._eventHandlers["gpsupdate"](coords, distMoved);
        }
      }
    }
  }

  setRayCaster(raycaster) {
    this._raycaster = raycaster;
  }

  setCanvas(canvas, ismobile) {
    console.log('setCanvas')
    this._canvas = canvas;
    const self = this;
    const hammer = new Hammer(canvas)
    hammer.get('pinch').set({enable: true})
    hammer.get('pan').set({direction: Hammer.DIRECTION_ALL})

    hammer.on('tap', e => {
      console.log('tap')
      console.log(e)
      self.handlePointerMove2(e)
      if (self._eventHandlers["tap"]) {
        self._eventHandlers["tap"](self.pointer);
      }
    })
    hammer.on('pinchstart', e => {
      console.log('pinchstart')
      self.counter = 0
    })
    hammer.on('pinchend', e => {
      console.log('pinchend')
      self.counter = 0
      if (self._eventHandlers["pinch-end"]) {
        self._eventHandlers["pinch-end"]("pinch-end");
      }
    })
    hammer.on('pinch', e => {
      // console.log('pinch')
      self.handlePointerMove2(e)
      self.counter = (self.counter + 1) % 5
      if(self.counter === 0) {
        if (self._eventHandlers["pinch"]) {
          self._eventHandlers["pinch"](e.additionalEvent);
        }
      }
    })

    hammer.on('panmove', e => {
      // console.log('pan')
      self.handlePointerMove2(e)
      // self.counter = (self.counter + 1) % 2
      if(self.counter === 0) {
        if (self._eventHandlers["pan"]) {
          self._eventHandlers["pan"](e.additionalEvent);
        }
      }
    })
    hammer.on('panend', e => {
      console.log('panend')
      if (self._eventHandlers["pan-end"]) {
        self._eventHandlers["pan-end"]("pan-end");
      }
    })
    /*
    const events = 'ontouchend' in document ? 
    ['touchstart', 'touchmove', 'touchend'] :
    ['mousedown', 'mousemove', 'mouseup']
    this._canvas.addEventListener(events[0], e => {
      e.preventDefault();
      self.dragging = true;
      self.handlePointerMove(e)
      if (self._eventHandlers["touch-start"]) {
        self._eventHandlers["touch-start"](self.pointer, self.lastPointer);
      }
    })
    this._canvas.addEventListener(events[1], e => {
      if(self.dragging) {
        self.handlePointerMove(e)
        if (self._eventHandlers["touch-move"]) {
          self._eventHandlers["touch-move"](self.pointer, self.lastPointer);
        }
      }
    })
    this._canvas.addEventListener(events[2], e => {
      if(self.dragging) {
        self.handlePointerMove(e)
        if (self._eventHandlers["touch-end"]) {
          self._eventHandlers["touch-end"](self.pointer, self.lastPointer);
        }
      }
      self.dragging = false;
    })*/
  }

  setCam(cam) {
    this.cam = cam;
  }

  // hammerjsのイベントの座標処理
  handlePointerMove2(e) {
    // console.log(e)
    this.lastPointer.x = this.pointer.x;
    this.lastPointer.y = this.pointer.y;

    const element = e.target;
    // canvas要素上のXY座標
    const x = e.center.x
    const y = e.center.y

    // canvas要素の幅・高さ
    const w = element.offsetWidth;
    const h = element.offsetHeight;

    // -1〜+1の範囲で現在のマウス座標を登録する
    this.pointer.x = ( x / w ) * 2 - 1;
    this.pointer.y = -( y / h ) * 2 + 1;
    this.xyPoint.x = x;
    this.xyPoint.y = y;
  }

  // マウスを動かしたときのイベント
  handlePointerMove(e) {
    this.lastPointer.x = this.pointer.x;
    this.lastPointer.y = this.pointer.y;

    const element = e.currentTarget;
    // canvas要素上のXY座標
    const p = e.changedTouches ? e.changedTouches[0] : e
    const x = p.pageX - element.offsetLeft;
    const y = p.pageY - element.offsetTop - 0;
    // const y = p.pageY - element.offsetTop - 58;
    // console.log(p)
    // console.log(element.offsetLeft + ', ' + element.offsetTop + ', ' + element.offsetWidth + ', ' + element.offsetHeight)

    // canvas要素の幅・高さ
    const w = element.offsetWidth;
    const h = element.offsetHeight;

    // -1〜+1の範囲で現在のマウス座標を登録する
    this.pointer.x = ( x / w ) * 2 - 1;
    this.pointer.y = -( y / h ) * 2 + 1;
    this.xyPoint.x = x;
    this.xyPoint.y = y;
  }

  checkRayCast(targets) {
    if(targets.length === 0) {
      return
    }
    // this._raycaster.setFromCamera(this.pointer, this._camera)
    this._raycaster.setFromCamera(this.pointer, this.cam)
    // その光線とぶつかったオブジェクトを得る
    const intersects = this._raycaster.intersectObjects(targets);
    // ぶつかったオブジェクトに対してなんかする
    if (this._eventHandlers["raycastobjects"]) {
      this._eventHandlers["raycastobjects"](intersects, this.pointer, this.xyPoint);
    }
  }

  remove(mesh) {
    this._scene.remove(mesh);
    this.safeRelease(mesh)
  }

  safeRelease(mesh) {
    if(mesh.material) {
      if(mesh.material.map) {
        mesh.material.map.dispose()
        mesh.material.map = null
      }
      mesh.material.dispose()
      mesh.material = null
    }
    if(mesh.geometry) {
      mesh.geometry.dispose()
      mesh.geometry = null
    }
  }

  removeAllMesh() {
    console.log('remove all mesh')
    const self = this
    const namelist = this._scene.children.map((mesh) => {
      return mesh.name
    })
    console.log(namelist)
    let count = 0
    
    this._scene.children.map((item) => {
      console.log(item.name)
      item.traverse((obj) => {
        console.log('t:' + obj.name)
        self.remove(obj)
        count = count + 1  
      })
      return null
    })
    console.log('removed ' + count + ', ' + this._scene.children.length)
  }

  transfromPosition(center, positionList) {
    const self = this;
    const cW = this.lonLatToWorldCoords(center.longitude, center.latitude)
    const pLW = positionList.map(position => {
      const wP = self.lonLatToWorldCoords(position.longitude, position.latitude)
      return [wP[0] - cW[0], wP[1] - cW[1]]
    })

    return {
      center: cW,
      footprint: pLW,
    }
  }

  calculateTouchOffset(bldgObj, touchPosition) {
    const cW = this.lonLatToWorldCoords(bldgObj.center.longitude, bldgObj.center.latitude)
    return {
      x: touchPosition.x - cW[0],
      y: touchPosition.y - bldgObj.center.altitude,
      z: touchPosition.z - cW[1]
    }
  }

  addBuilding(object, center, altitude) {
    object.position.x = center[0]
    object.position.z = center[1]
    object.position.y = altitude
    this._scene.add(object);
  }

  addTag(object, center, altitude, position) {
    object.position.x = center[0] + position.x
    object.position.z = center[1] + position.z
    object.position.y = altitude + position.y
    this._scene.add(object);
  }

  getDistance(position) {
    if (this.currentCoords) {
      const distance = this._haversineDist(this.currentCoords, position)
      return distance;
    } else {
      return -1;
    }
  }

  findChildWithName(objName) {
    const list = this._scene.children.filter((item) => {
      return (item.name === objName);
    })
    if (list.length > 0) {
        return list[0];
    } else {
        return null;
    }
  }

  removeChildWithName(objName) {
    const obj = this.findChildWithName(objName);
    if(obj) {
      this.remove(obj);
    }
  }

  updateCameraRotationOffset(rotation) {
    this.cameraOffset.rotation = rotation;
    this._camera.rotation.y = this.cameraOffset.rotation;
  }

  updateCameraHeightOffset(height) {
    this.cameraOffset.height = height;
    this._camera.position.y = this._lastCoords.altitude + this.cameraOffset.height;
  }

  dispose() {
    this._camera = null
    this.cam = null
    this._eventHandlers = {}
    this._scene = null
    this._lastCoords = null
    this._raycaster = null
    this._canvas = null
  }
}
export { CustomLocationBased };
