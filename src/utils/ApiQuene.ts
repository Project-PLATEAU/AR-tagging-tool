// Modified version of THREE.DeviceOrientationControls from three.js
// will use the deviceorientationabsolute event if available

class ApiQuene {
  nowJob: any | null
  nextJob: any | null
  on: boolean
  constructor() {
    this.nowJob = null
    this.nextJob = null
    this.on = false
  }

  getJob = () => {
    if (this.nowJob === null) {
      if (this.nextJob !== null) {
        this.nowJob = this.nextJob
        this.nextJob = null
        return this.nowJob
      }
    }
    return null
  }

  isWorking = () => {
    return this.on
  }

  startWorking = () => {
    this.on = true
  }

  finishWorking = () => {
    this.nowJob = null
    this.on = false
  }

  setNextJob = (job: any) => {
    this.nextJob = job
  }

  setNowJob = (job: any) => {
    this.nowJob = job
  }
}

export { ApiQuene }
