// Modified version of THREE.DeviceOrientationControls from three.js
// will use the deviceorientationabsolute event if available

class DeviceOrientationPermitter {
  constructor() {
    this.eventHandler = {}
    // if (window.isSecureContext === false) {
    //   console.error(
    //     "THREE.DeviceOrientationControls: DeviceOrientationEvent is only available in secure contexts (https)"
    //   );
    // }
  }

  on(eventName, eventHandler) {
    this.eventHandler[eventName] = eventHandler;
  }

  connect = function () {
    const scope = this
    // iOS 13+
    if (
      window.DeviceOrientationEvent !== undefined && 
      typeof window.DeviceOrientationEvent.requestPermission === "function"
    ) {
      // console.log('hhh')
      window.DeviceOrientationEvent.requestPermission()
        .then(function (response) {
          if (response == "granted") {
            scope.enabled = true
            if(scope.eventHandler['granted']) {
              scope.eventHandler['granted'](true)
            }
          } else {
            scope.enabled = false
          }
        })
        .catch(function (error) {
          scope.enabled = false
          console.error(
            "DevisePermitter:",
            error
          );
        });
    } else {
      scope.enabled = true
      if(scope.eventHandler['granted']) {
        scope.eventHandler['granted'](true)
      }
    }
  };

  disconnect = function () {
    this.enabled = false;
  }

  dispose = function () {
    this.disconnect()
  }
};

export { DeviceOrientationPermitter };
