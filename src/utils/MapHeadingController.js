// Modified version of THREE.DeviceOrientationControls from three.js
// will use the deviceorientationabsolute event if available
const _changeEvent = "change"
const _screenChangeEvent = "screenChange"

const RADIAN = Math.PI / 180.0;
const DegToRad = (degree) => {
  return degree * RADIAN
};
const RadToDeg = (rad) => {
  return (rad / RADIAN) % 360
}

class MapHeadingController {
  constructor() {
    if (window.isSecureContext === false) {
      console.error(
        "THREE.DeviceOrientationControls: DeviceOrientationEvent is only available in secure contexts (https)"
      );
    }

    const scope = this;

    this.enabled = false;

    this.deviceOrientation = {};
    this.screenOrientation = 0;

    this.alphaOffset = 0; // radians
    
    // for compassHeading
    this.compassOffset = 0;

    this.compass = {
      absolute: 0,
      computed: 0
    }

    this.eventHandlers = {}

    this.isMobile = (/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)) ? true : false;
    if(!this.isMobile) {
      const ua = window.navigator.userAgent.toLowerCase();
      if (ua.indexOf("ipad") > -1 || (ua.indexOf("macintosh") > -1 && "ontouchend" in document)){
        this.isMobile = true
      }
    }

    this.orientationChangeEventName =
      "ondeviceorientationabsolute" in window
        ? "deviceorientationabsolute"
        : "deviceorientation";

    this.onDeviceOrientationChangeEvent = function (event) {
      scope.deviceOrientation = event;
    };

    this.onScreenOrientationChangeEvent = function () {
      scope.screenOrientation = window.orientation || 0;
      if(scope.eventHandlers[_screenChangeEvent]) {
        scope.eventHandlers[_screenChangeEvent]();
      }
    };

    // The angles alpha, beta and gamma form a set of intrinsic Tait-Bryan angles of type Z-X'-Y''

    this.interval = null
  }

  on(eventName, eventHandler) {
    this.eventHandlers[eventName] = eventHandler;
  }

  connect = function () {
    const scope = this
    this.onScreenOrientationChangeEvent(); // run once on load
    console.log(scope.orientationChangeEventName)
    window.addEventListener(
        "orientationchange",
        scope.onScreenOrientationChangeEvent
      );
      window.addEventListener(
        scope.orientationChangeEventName,
        scope.onDeviceOrientationChangeEvent
    );
    this.enabled = true
    if(!this.interval) {
      this.interval = setInterval(this.update.bind(this), 500)
    }
  };

  disconnect = function () {
    window.removeEventListener(
      "orientationchange",
      this.onScreenOrientationChangeEvent
    )
    window.removeEventListener(
      this.orientationChangeEventName,
      this.onDeviceOrientationChangeEvent
    )
    this.enabled = false;
    if(this.interval) {
      clearInterval(this.interval)
    }
  }

  dispose = function () {
    this.disconnect()
  }

  update = function () {
    const scope = this
    if (scope.enabled === false) return;

    const device = scope.deviceOrientation;

    if (device) {
/*
https://one-it-thing.com/6555/
alphaは0か360付近が出て欲しい所ですが、大分ずれていて、再描画すると毎回値が変わります。
これはalphaが相対値（API起動した時点を0としてそこからの変化）で取れてしまっている為のようです。
方角を知るには相対値（本体基準系：body frame）ではなく絶対値（地球基準系：earth frame）で取る必要があります。
方角を知る為、確実に絶対値でalpha値を取るには
Chrome：deviceorientationabsoluteイベントを替わりに使う。
Safari：deviceorientationabsoluteが無い為、webkitCompassHeadingで取れる値を使う。
※このSafari（iOS）の補正でEulerがズレ、斜めに傾けた時にオブジェクトが動く
*/
      let alpha = device.alpha
        ? DegToRad(device.alpha) + scope.alphaOffset
        : 0; // Z
      
      let beta = device.beta ? DegToRad(device.beta) : 0; // X'

      let gamma = device.gamma ? DegToRad(device.gamma) : 0; // Y''

      // for iOS (safari), use webkitCompassHeading
      if(scope.orientationChangeEventName === 'deviceorientation') {
        scope.compass.absolute = device.webkitCompassHeading ? device.webkitCompassHeading : 0
        // compute 'relative' world compass heading
        scope.compass.computed = scope._computeCompassHeading(alpha, beta, gamma)
        if(!scope.compass.computed) {
          scope.compass.computed = 0
        }
        scope.compassOffset = scope.compass.computed - scope.compass.absolute
      } else {
        // scope.compass.absolute = device.alpha ? device.alpha : 0
        scope.compass.computed = scope._computeCompassHeading(alpha, beta, gamma)
        if(!scope.compass.computed) {
          scope.compass.computed = 0
        }
        scope.compass.absolute = scope.compass.computed
        scope.compassOffset = scope.compass.computed - scope.compass.absolute
      }
      if(scope.eventHandlers[_changeEvent]) {
        scope.eventHandlers[_changeEvent]();
      }
    }
  }

  _computeCompassHeading = function (alphaRad, betaRad, gammaRad) { 
    // Calculate equation components
    var cA = Math.cos(alphaRad);
    var sA = Math.sin(alphaRad);
    var sB = Math.sin(betaRad);
    var cG = Math.cos(gammaRad);
    var sG = Math.sin(gammaRad);

    // Calculate A, B, C rotation components
    var rA = -cA * sG - sA * sB * cG;
    var rB = -sA * sG + cA * sB * cG;

    // Calculate compass heading
    var compassHeading = Math.atan(rA / rB);

    // Convert from half unit circle to whole unit circle
    if (rB < 0) {
      compassHeading += Math.PI;
    } else if (rA < 0) {
      compassHeading += 2 * Math.PI;
    }

    // Convert radians to degrees
    compassHeading *= 180 / Math.PI;

    return compassHeading;
  }

  getHeading(offset) {
    const arOffset = RadToDeg(offset)
    // console.log(arOffset)
    // console.log(this.compass)
    return (this.compass.computed - this.compassOffset - arOffset) % 360
  }
};

export { MapHeadingController };
