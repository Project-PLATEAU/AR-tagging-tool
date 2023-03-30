// Modified version of THREE.DeviceOrientationControls from three.js
// will use the deviceorientationabsolute event if available
import {
  Euler,
  EventDispatcher,
  Math as MathUtils,
  Quaternion,
  Vector3,
} from 'three';

const _zee = new Vector3(0, 0, 1);
const _euler = new Euler();
const _q0 = new Quaternion();
const _q1 = new Quaternion(-Math.sqrt(0.5), 0, 0, Math.sqrt(0.5)); // - PI/2 around the x-axis

const _changeEvent = { type: "change" };
const _screenChangeEvent = { type: "screenChange" };
const _requestEvent = { type: "request" } 

class CustomDeviceOrientationControls extends EventDispatcher {
  constructor(object) {
    super();

    if (window.isSecureContext === false) {
      console.error(
        "THREE.DeviceOrientationControls: DeviceOrientationEvent is only available in secure contexts (https)"
      );
    }

    const scope = this;

    const EPS = 0.000001;
    const lastQuaternion = new Quaternion();

    this.object = object;
    this.object.rotation.reorder("YXZ");

    this.enabled = true;

    this.deviceOrientation = {};
    this.screenOrientation = 0;

    this.alphaOffset = 0; // radians
    
    // for compassHeading
    this.compassOffset = 0;

    this.compass = {
      absolute: 0,
      computed: 0
    }

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
    const onDeviceOrientationChangeEvent = function (event) {
      scope.deviceOrientation = event;
    };

    const onScreenOrientationChangeEvent = function () {
      scope.screenOrientation = window.orientation || 0;
      scope.dispatchEvent(_screenChangeEvent);
    };

    // The angles alpha, beta and gamma form a set of intrinsic Tait-Bryan angles of type Z-X'-Y''

    const setObjectQuaternion = function (
      quaternion,
      alpha,
      beta,
      gamma,
      orient
    ) {
      _euler.set(beta, alpha, -gamma, "YXZ"); // 'ZXY' for the device, but 'YXZ' for us
      quaternion.setFromEuler(_euler); // orient the device
      if(scope.isMobile) {
        quaternion.multiply(_q1); // camera looks out the back of the device, not the top
      }

      quaternion.multiply(_q0.setFromAxisAngle(_zee, -orient)); // adjust for screen orientation
    };

    this.connect = function () {
      this.enabled = true
      window.addEventListener(
        "orientationchange",
        onScreenOrientationChangeEvent
      );
      window.addEventListener(
        scope.orientationChangeEventName,
        onDeviceOrientationChangeEvent
      );
      return
      onScreenOrientationChangeEvent(); // run once on load
      console.log(scope.orientationChangeEventName)
      // iOS 13+

      if (
        window.DeviceOrientationEvent !== undefined &&
        typeof window.DeviceOrientationEvent.requestPermission === "function"
      ) {
        window.DeviceOrientationEvent.requestPermission()
          .then(function (response) {
            if (response == "granted") {
              window.addEventListener(
                "orientationchange",
                onScreenOrientationChangeEvent
              );
              window.addEventListener(
                scope.orientationChangeEventName,
                onDeviceOrientationChangeEvent
              );
            }
          })
          .catch(function (error) {
            console.error(
              "THREE.DeviceOrientationControls: Unable to use DeviceOrientation API:",
              error
            );
          });
      } else {
        window.addEventListener(
          "orientationchange",
          onScreenOrientationChangeEvent
        );
        window.addEventListener(
          scope.orientationChangeEventName,
          onDeviceOrientationChangeEvent
        );
      }

      scope.enabled = true;
    };

    this.disconnect = function () {
      window.removeEventListener(
        "orientationchange",
        onScreenOrientationChangeEvent
      );
      window.removeEventListener(
        scope.orientationChangeEventName,
        onDeviceOrientationChangeEvent
      );

      scope.enabled = false;
    };

    this.update = function () {
      // console.log(scope.enabled)
      if (scope.enabled === false) return;

      const device = scope.deviceOrientation;
      // const device = scope.dispatchEvent(_requestEvent);
      // console.log(device)
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
          ? MathUtils.degToRad(device.alpha) + scope.alphaOffset
          : 0; // Z
        
        let beta = device.beta ? MathUtils.degToRad(device.beta) : 0; // X'

        let gamma = device.gamma ? MathUtils.degToRad(device.gamma) : 0; // Y''

        // for iOS (safari), use webkitCompassHeading
        if(scope.orientationChangeEventName === 'deviceorientation') {
          scope.compass.absolute = device.webkitCompassHeading ? device.webkitCompassHeading : 0
          // compute 'relative' world compass heading
          scope.compass.computed = scope._computeCompassHeading(alpha, beta, gamma)
          if(!scope.compass.computed) {
            scope.compass.computed = 0
          }
          scope.compassOffset = MathUtils.degToRad(scope.compass.computed - scope.compass.absolute)
        }
        // console.log(alpha + ', ' + beta + ', ' + gamma)

        let orient = scope.screenOrientation
          ? MathUtils.degToRad(scope.screenOrientation)
          : 0; // O

        const _qT = new Quaternion();
        setObjectQuaternion(
          _qT,
          alpha,
          beta,
          gamma,
          orient
        );

        if (8 * (1 - lastQuaternion.dot(_qT)) > EPS) {
          scope.object.quaternion.copy(_qT)
          lastQuaternion.copy(scope.object.quaternion);
          scope.dispatchEvent(_changeEvent);
        }
      }
    };

    this.dispose = function () {
      scope.disconnect();
    };

    this._computeCompassHeading = function (alphaRad, betaRad, gammaRad) { 
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
  }
}

export { CustomDeviceOrientationControls };
