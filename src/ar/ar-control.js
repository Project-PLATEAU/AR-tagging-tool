import * as THREE from 'three'
import { Math as MathUtils } from 'three'
import { CustomLocationBased } from 'src/ar/location-based-custom'
import { CustomDeviceOrientationControls } from 'src/ar/device-orientation-controls-custom'
import { CustomWebcamRenderer } from 'src/ar/webcam-renderer-custom'
// import { WebcamRenderer } from '@ar-js-org/ar.js/three.js/build/ar-threex-location-only'
// import { ConvexGeometry } from 'src/ar/ConvexGeometry'
import { TagUtils } from '@/utils/TagUtils'

class ARController {
    constructor(divId) {
        this.frameID = -1
        this.scene = new THREE.Scene();
        this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 50000);
        this.renderer = new THREE.WebGLRenderer({
            antialias: true,
            alpha: true
        });
        this.renderer.setPixelRatio(window.devicePixelRatio);
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        
        const root = document.getElementById(divId);
        root.appendChild(this.renderer.domElement);
        // create video element
        const video = document.createElement("video");
        video.setAttribute("autoplay", true);
        video.setAttribute("playsinline", true);
        video.style.display = "none";
        root.appendChild(video)
        this.videoCam = new CustomWebcamRenderer(this.renderer, "video");

        // カメラをグループとし、座標移動と方向（グループ）、傾き（実カメラ）に分ける。
        this.cameraWrap = new THREE.Group();
        this.cameraWrap.name = 'camera_wrap'
        this.cameraWrap.add(this.camera);
        this.scene.add(this.cameraWrap)

        this.controller = new CustomLocationBased(this.scene, this.cameraWrap);
        this.controller.setCam(this.camera)
        this._eventHandlers = {};
        this.isMobile = (/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)) ? true : false;
        this.orientationControls = new CustomDeviceOrientationControls(this.camera);

        this.mode = "normal";
        this.calibration = {
            rotation : 0,
            height : 0,
        };
        
        // Buildings
        this.buildingWrap = new THREE.Group();
        this.buildingWrap.name = 'building_wrap'
        this.scene.add(this.buildingWrap)
        this.buildings = []

        // Tags
        this.tagWrap = new THREE.Group();
        this.tagWrap.name = 'tag_wrap'
        this.scene.add(this.tagWrap)
        this.tags = []

        // Trans
        this.transWrap = new THREE.Group();
        this.transWrap.name = 'trans_wrap';
        this.scene.add(this.transWrap)

        // Brid
        this.bridWrap = new THREE.Group();
        this.bridWrap.name = 'bridWrap';
        this.scene.add(this.bridWrap)

        // Frn
        this.frnWrap = new THREE.Group()
        this.frnWrap.name = 'frn_wrap'
        this.scene.add(this.frnWrap)
        this.frns = []

        // Veg
        this.vegWrap = new THREE.Group()
        this.vegWrap.name = 'veg_wrap'
        this.scene.add(this.vegWrap)
        this.vegs = []

        //Polys
        this.polyWrap = new THREE.Group();
        this.polyWrap.name = 'polygons';
        this.scene.add(this.polyWrap)
        this.polygons = []

        //fbx
        // this.fbxWrap = new THREE.Group()
        // this.fbxWrap.name = 'fbx'
        // this.scene.add(this.fbxWrap)

        this.selectedObj = {
        }

        this.baseBuildings = [
            '13103-bldg-3883', //takanawa NHK交響楽団
            '13103-bldg-4503', //takanawa 伊皿子幼稚園
            '13103-bldg-4299', // takanawa アデニウム高輪

            '14100-bldg-406367', //office フローリッシュビル
            '14100-bldg-412784', //offict Ts Garden
            '14100-bldg-545242', //ホテルリソル横浜桜木町
            '14100-bldg-514605', //横浜桜木郵便局
            '14100-bldg-515878', //横浜シティタワー馬車道
            '13103-bldg-4707', // 高松中学校
            '13103-bldg-4760'// 高輪消防署
        ]

        const loader = new THREE.TextureLoader()
        this.textures = {
            good: loader.load('/images/GOOD_300.png'),
            bad: loader.load('/images/BAD_300.png'),
            idea: loader.load('/images/POSSIBLE_300.png')
        }

        var directionalLight = new THREE.DirectionalLight(0xFFFFFF, 1.0); // 光源色と光強度を指定して生成
        directionalLight.position.set(0, 10000, -1); // 光源位置を設定
        this.scene.add(directionalLight);
        // var directionalLight = new THREE.AmbientLight(0xFFFFFF, 1.0); // 光源色と光強度を指定して生成
        // // directionalLight.position.set(0, 0, 100000); // 光源位置を設定
        // this.scene.add(directionalLight); 
        this.stopped = false
        this.renderingcounter = 0

        this.queneList = []
    }

    createCategoryMaterial (category) {
        if(category === 'GOOD') {
            return new THREE.MeshBasicMaterial({
                map: this.textures.good,
                transparent: true,
                side: THREE.DoubleSide
            })
        } else if(category === 'BAD') {
            return new THREE.MeshBasicMaterial({
                map: this.textures.bad,
                transparent: true,
                side: THREE.DoubleSide
            })
        } else if(category === 'IDEA') {
            return new THREE.MeshBasicMaterial({
                map: this.textures.idea,
                transparent: true,
                side: THREE.DoubleSide
            })
        } else {
            return new THREE.MeshBasicMaterial({
                color: 0x6699cc,
                opacity: 0.9,
                transparent: true,
                side: THREE.DoubleSide
            });
        }
    }

    setup() {
        let first = true;
        const self = this;
        this.controller.setCanvas(this.renderer.domElement);

        // const orientationPermissionListener = function () {
        //     self.orientationControls.connect();
        //     console.log('orientationPermissionListener')
        //     window.removeEventListener('touchend', orientationPermissionListener);
        //     window.removeEventListener('mouseup', orientationPermissionListener);
        // }
        // if (this.isMobile){   
        //     window.addEventListener('touchend', orientationPermissionListener);
        // } else {
        //     window.addEventListener('mouseup', orientationPermissionListener);
        // }

        this.orientationControls.addEventListener('change', (ev) => {
            if (self.orientationControls.compassOffset != 0 || self.calibration.rotation != 0) {
                self.controller.updateCameraRotationOffset(self.orientationControls.compassOffset + self.calibration.rotation);
            }
        })

        this.orientationControls.addEventListener('request', (ev) => {
            if(self._eventHandlers["requestorientation"]) {
                const event = self._eventHandlers["requestorientation"]()
                // console.log(event)
                return event
            } else {
                console.log('nnn')
            }
            return null
        })

        this.orientationControls.addEventListener('screenChange', (ev) => {
            console.log('screenChange')
            self.screenResize()
            if (self._eventHandlers["resizescreen"]) {
                self._eventHandlers["resizescreen"]();
            }
        })

        // this.controller.on("touch-start", (pointer, lastPointer) => {
        //     console.log('touch-start ' + this.mode)
        // })

        // this.controller.on("touch-move", (pointer, lastPointer) => {
        //     if(self.mode === "with_building") {
        //         const divx = pointer.x - lastPointer.x
        //         const divy = pointer.y - lastPointer.y

        //         if (Math.abs(divx) > Math.abs(divy)) {
        //             // move rotation
        //             if (divx > 0) {
        //                 self.calibration.rotation = self.calibration.rotation + MathUtils.degToRad(1)
        //             } else {
        //                 self.calibration.rotation = self.calibration.rotation - MathUtils.degToRad(1)
        //             }
        //             self.controller.updateCameraRotationOffset(self.orientationControls.compassOffset + self.calibration.rotation)
        //         } else {
        //             // move height
        //             if (divy > 0) {
        //                 self.calibration.height = self.calibration.height + 0.5
        //             } else {
        //                 self.calibration.height = self.calibration.height - 0.5
        //             }
        //             self.controller.updateCameraHeightOffset(self.calibration.height)
        //         }
        //     }
        // })

        // this.controller.on("touch-end", (pointer, lastPointer) => {
        //     self.controller.checkRayCast(self.getRayCastTargets())
        // })
        
        this.controller.on("pan", (eventType) => {
            //if(self.mode !== "adding_tag") {
                if(eventType === 'panright') {
                    self.calibration.rotation = self.calibration.rotation + MathUtils.degToRad(0.5)
                    self.controller.updateCameraRotationOffset(self.orientationControls.compassOffset + self.calibration.rotation)
                } else if(eventType === 'panleft') {
                    self.calibration.rotation = self.calibration.rotation - MathUtils.degToRad(0.5)
                    self.controller.updateCameraRotationOffset(self.orientationControls.compassOffset + self.calibration.rotation)
                } else if(eventType === 'panup') {
                    self.calibration.height = self.calibration.height - 0.2
                    self.controller.updateCameraHeightOffset(self.calibration.height)
                } else if(eventType === 'pandown') {
                    self.calibration.height = self.calibration.height + 0.2
                    self.controller.updateCameraHeightOffset(self.calibration.height)
                }
            //}
        })

        this.controller.on("pinch", (eventType) => {
            //if(self.mode !== "adding_tag") {
                if(eventType === 'pinchin') {
                    if(self.camera.fov < 120) {
                        self.camera.fov = self.camera.fov + 1
                    }
                } else if(eventType === 'pinchout') {
                    if(self.camera.fov > 45) {
                        self.camera.fov = self.camera.fov - 1
                    }
                }
            //}
        })

        this.controller.on("tap", (pointer) => {
            self.controller.checkRayCast(self.getRayCastTargets())
        })

        this.controller.on("pan-end", (type) => {
            // if(self.mode !== "adding_tag") {
                if (self._eventHandlers["offsetupdate"]) {
                    self._eventHandlers["offsetupdate"]()
                }
            // }
        })

        this.controller.on("pinch-end", (type) => {
            // if(self.mode !== "adding_tag") {
                if (self._eventHandlers["offsetupdate"]) {
                    self._eventHandlers["offsetupdate"]()
                }
            // }
        })

        this.controller.on("gpsupdate", (pos, dist) => {
            if(first) {
                first = false;
                console.log(self.controller._camera.position)
                if (self._eventHandlers["gpsinitialized"]) {
                    self._eventHandlers["gpsinitialized"](pos, dist);
                    // self.controller.updateCameraRotationOffset(self.orientationControls.compassOffset + self.calibration.rotation)
                    // self.controller.updateCameraHeightOffset(self.calibration.height)
                }
            } else {
                if (self._eventHandlers["gpsupdate"]) {
                    self._eventHandlers["gpsupdate"](pos, dist);
                }
            }
        });
        
        this.controller.on("gpserror", code => {
            alert(`GPS error: code ${code}`);
        });
        
        // 3Dオブジェクトのタッチイベント
        this.controller.on("raycastobjects", (objects, pointer, xy) => {
            console.log("raycast " + objects)
            if(objects.length > 0) {
                const mesh = objects[0].object
                const touchPoint = objects[0].point
                const normal = objects[0].face.normal
                const distance = self.getDistanceWithName(mesh.name);
                let objType = "tag"
                console.log(mesh.name)
                // console.log(touchPoint)
                // console.log(objects[0])
                let obj = null, key = "tag", touchOffset = {x: 0, y: 0, z: 0}, rotation = {x: 0, y: 0, z: 0};
                if(self.mode === "normal" || self.mode === "with_building") {
                    // タグの閲覧イベントのみ実行
                    obj = TagUtils.findTagFromTagID(mesh.name, self.tags);
                    // console.log(xy)
                } else if (self.mode === "select_object") {
                    // タグの閲覧イベントをチェック後、ビル、設備のタグ新規作成に移るかチェック
                    obj = TagUtils.findTagFromTagID(mesh.name, self.tags);
                    if(!obj) {
                        obj = TagUtils.findBuildingFromGmlID(mesh.name, self.buildings);
                        key = "select_object"
                        if(obj) {
                            self.changeMode("adding_tag")
                            touchOffset = self.controller.calculateTouchOffset(obj, touchPoint)
                            self.selectObjectMesh(mesh, touchOffset, xy)
                            objType = "building"
                        } else {
                            obj = TagUtils.findFrnFromGmlID(mesh.name, self.frns)
                            if(obj) {
                                objType = 'frn'
                                self.changeMode("adding_tag")
                                touchOffset = self.controller.calculateTouchOffset(obj, touchPoint)
                                self.selectObjectMesh(mesh, touchOffset, xy)
                            }
                        }
                        if(!obj) {
                            obj = TagUtils.findVegFromGmlID(mesh.name, self.vegs)
                            if(obj) {
                                objType = 'veg'
                                self.changeMode("adding_tag")
                                touchOffset = self.controller.calculateTouchOffset(obj, touchPoint)
                                self.selectObjectMesh(mesh, touchOffset, xy)
                            }
                        }
    
                        self.updateTmpMesh(touchOffset, xy, normal, touchPoint)
                        rotation.x = self.selectedObj.tagMesh.rotation.x
                        rotation.y = self.selectedObj.tagMesh.rotation.y
                        rotation.z = self.selectedObj.tagMesh.rotation.z
                    } 
                } else if (self.mode === "adding_tag") {
                    obj = TagUtils.findBuildingFromGmlID(self.selectedObj.objMesh.name, self.buildings)
                    if(obj) {
                        objType = "building"
                    } else {
                        obj = TagUtils.findFrnFromGmlID(self.selectedObj.objMesh.name, self.frns)
                        if(obj) {
                            objType = 'frn'
                        }
                    }
                    if(!obj) {
                        obj = TagUtils.findVegFromGmlID(self.selectedObj.objMesh.name, self.vegs)
                        if(obj) {
                            objType = 'veg'
                        }
                    }
                    if(obj) {
                        key = "update_building"
                        touchOffset = self.controller.calculateTouchOffset(obj, touchPoint)
                        self.updateTmpMesh(touchOffset, xy, normal, touchPoint)
                        rotation.x = self.selectedObj.tagMesh.rotation.x
                        rotation.y = self.selectedObj.tagMesh.rotation.y
                        rotation.z = self.selectedObj.tagMesh.rotation.z
                    }
                }
                if(!obj) {
                    key = "error"
                    self.changeMode("normal")
                }

                if (self._eventHandlers["raycastobject"]) {
                    self._eventHandlers["raycastobject"]({
                        key: key,
                        object: obj,
                        distance: distance,
                        offset: touchOffset,
                        objtype: objType,
                        rotation: rotation
                    });
                }
            }
        })
    }

    updateGps(coords) {
        if(this.stopped === false) {
            this.controller.coordsReceived(coords)
        }
    }

    setupTarget(object) {
        if(object.bldgID) {
            const mesh = this.findWrapMesh(object.gmlID, this.buildingWrap)
            this.changeMode("adding_tag")
            this.selectObjectMesh(mesh, {x: 0, y: object.height + 3, z: 0}, {x: 0, y: 0})
        } else if (object.frnID) {
            const mesh = this.findWrapMesh(object.gmlID, this.frnWrap)
            this.changeMode("adding_tag")
            this.selectObjectMesh(mesh, {x: 0, y: object.height + 1, z: 0}, {x: 0, y: 0})
        } else if (object.vegID) {
            const mesh = this.findWrapMesh(object.gmlID, this.vegWrap)
            this.changeMode("adding_tag")
            this.selectObjectMesh(mesh, {x: 0, y: object.height + 1, z: 0}, {x: 0, y: 0})
        }
    }

    start(fakeGps) {
        this.startRendering();
    }

    stop() {
        this.stopped = true
        this._eventHandlers = {};
        this.removeAllQuene()

        this.stopRendering()
        
        this.removeAllWraps(this.buildingWrap)
        this.removeAllWraps(this.frnWrap)
        this.removeAllWraps(this.vegWrap)
        this.removeAllWraps(this.tagWrap)
        this.removeAllWraps(this.transWrap)
        this.removeAllWraps(this.polyWrap)
        this.removeAllWraps(this.bridWrap)
        
        this.controller.removeAllMesh()
        this.controller.dispose()
        this.buildings = []
        this.frns = []
        this.vegs = []
        this.tags = []
        this.trans = []
        this.polygons = []

        this.orientationControls.disconnect()

        if (this.textures.good) {
            if(this.textures.good.dispose) {
                this.textures.good.dispose()
            }
            this.textures.good = null
        }
        if (this.textures.idea) {
            if(this.textures.idea.dispose) {
                this.textures.idea.dispose()
            }
            this.textures.idea = null
        }
        if (this.textures.bad) {
            if(this.textures.bad.dispose) {
                this.textures.bad.dispose()
            }
            this.textures.bad = null
        }
        if (this.videoCam.dispose) {
            this.videoCam.dispose()
        }
        //this.videoCam.dispose()

        this.renderer.dispose()
        this.renderer.forceContextLoss()
        this.renderer.domElement.remove()
        this.renderer.domElement = null
        // const canvas = this.renderer.domElement
        // canvas.width = 1 
        // canvas.height = 1
        // this.renderer.domElement = null
    }

    startRendering() {
        this.frameID = requestAnimationFrame(this.render.bind(this))
        this.renderingcounter = 0
        this.stopped = false
    }

    stopRendering() {
        if(window.cancelAnimationFrame) {
            cancelAnimationFrame(this.frameID);
        } else {
            console.log('not exist cancelanimationframe')
        }
    }

    render(timestamp) {
        if(this.stopped) {
            return
        }
        this.resizeUpdate();
        this.orientationControls.update();
        if(this.videoCam.update) {
            this.videoCam.update()
        }
        if(this.renderingcounter % 10 === 0) {
            this.buildingVisibleChecker()
            this.tagVisibleChecker()
            // console.log(timestamp)
            // if(this.selectedObj.tagMesh) {
            //     let r = this.selectedObj.tagMesh.rotation.x
            //     r = r + 0.1
            //     if (r > Math.PI * 2) {
            //         r = 0
            //     }
            //     this.selectedObj.tagMesh.rotation.x = r
            // }
        }
        this.runQuene()
        this.renderingcounter = (this.renderingcounter + 1) % 10
        this.renderer.render(this.scene, this.camera);
        requestAnimationFrame(this.render.bind(this));
    }

    screenResize() {
        const canvas = this.renderer.domElement;
        const width = window.outerWidth;
        const height = window.outerHeight;
        this.renderer.setPixelRatio(window.devicePixelRatio);
        this.renderer.setSize(width, height);
        // this.renderer.setSize(height, width);
        console.log('w:' + width + ', h:' + height)
        
        console.log('w2:' +canvas.clientWidth + ', h2:' + canvas.clientHeight)
        this.camera.aspect = canvas.clientWidth / canvas.clientHeight;
        this.camera.updateProjectionMatrix();
        this.resizeUpdate()
    }

    resizeUpdate() {
        const canvas = this.renderer.domElement;
        const width = canvas.clientWidth, height = canvas.clientHeight;
        const pr = window.devicePixelRatio
        if(width * pr != canvas.width || height * pr != canvas.height) {
            console.log('reisizeUp')
            console.log('w:' + width + ', ' + canvas.width + ', h:' + height + ' ,' + canvas.height)
            this.renderer.setSize(width, height);
            this.camera.aspect = canvas.clientWidth / canvas.clientHeight;
            this.camera.updateProjectionMatrix();
        }
        
    }

    on(eventName, eventHandler) {
        this._eventHandlers[eventName] = eventHandler;
    }

    changeMode(newMode) {
        if (newMode === "normal") {
            
            this.mode = newMode;
            this.clearSelectedObj()
            this.setBuildingVisibility(false)
            this.setFrnVisibility(false)
            this.setVegVisibility(false)
            this.setTagVisibility(true)
            // this.setPolyVisibility(false)
            this.polyWrap.visible = true
            this.bridWrap.visible = false
            
        } else if(newMode === "select_object") {
            this.mode = newMode
            this.clearSelectedObj()
            this.setBuildingVisibility(true)
            this.setFrnVisibility(true)
            this.setVegVisibility(true)
            this.setTagVisibility(true)
            // this.setPolyVisibility(false)
            this.polyWrap.visible = false
            this.bridWrap.visible = false

            
        } else if(newMode === "with_building") {
            this.mode = newMode
            this.clearSelectedObj()
            this.setBuildingVisibility(true)
            this.setFrnVisibility(true)
            this.setVegVisibility(true)
            this.setTagVisibility(true)
            this.polyWrap.visible = true
            this.bridWrap.visible = true            
        } else if(newMode === "adding_tag") {
            this.mode = newMode
            this.setBuildingVisibility(false)
            this.setFrnVisibility(false)
            this.setVegVisibility(false)
            this.setTagVisibility(false)
            this.polyWrap.visible = false
            this.bridWrap.visible = false
        }
    }

    resetModeVisibility() {
        if (this.mode === "normal") {
            this.setBuildingVisibility(false)
            this.setFrnVisibility(false)
            this.setVegVisibility(false)
            this.setTagVisibility(true)
            this.polyWrap.visible = true
            this.bridWrap.visible = false            
        } else if(this.mode === "select_object") {
            this.setBuildingVisibility(true)
            this.setFrnVisibility(true)
            this.setVegVisibility(true)
            this.setTagVisibility(true)
            this.polyWrap.visible = false
            this.bridWrap.visible = false
        } else if(this.mode === "with_building") {
            this.setBuildingVisibility(true)
            this.setFrnVisibility(true)
            this.setVegVisibility(true)
            this.setTagVisibility(true)
            this.polyWrap.visible = true
            this.bridWrap.visible = true            
        } else if(this.mode === "adding_tag") {
            this.setBuildingVisibility(false)
            this.setFrnVisibility(false)
            this.setVegVisibility(false)
            this.setTagVisibility(false)
            this.polyWrap.visible = false
            this.bridWrap.visible = false
        }
    }

    selectObjectMesh(mesh, offset, xy) {
        this.selectedObj.objMesh = mesh;
        this.selectedObj.offset = offset;
        this.selectedObj.xy = xy;

        this.selectedObj.objMesh.material.color.set(0x33cc99)
        this.selectedObj.objMesh.material.opacity = 0.75
        this.selectedObj.objMesh.visible = true

        const material = this.createCategoryMaterial('None')
        let size = 3
        if(mesh.name.includes('frn_') || mesh.name.includes('veg_')) {
            size = 1
        }
        const geom = new THREE.CircleGeometry(size, 24)
        const tmpmesh = new THREE.Mesh(geom, material)
        tmpmesh.name = "tempTag"
        tmpmesh.visible = true
        tmpmesh.position.x = this.selectedObj.objMesh.position.x + offset.x
        tmpmesh.position.y = this.selectedObj.objMesh.position.y + offset.y
        tmpmesh.position.z = this.selectedObj.objMesh.position.z + offset.z
        this.scene.add(tmpmesh)
        // this.addTag(tmpmesh,
        //     [this.selectedObj.objMesh.position.x, this.selectedObj.objMesh.position.z],
        //     this.selectedObj.objMesh.position.y,
        //     {x:offset.x, z:offset.z, y:offset.y})
            
        this.selectedObj.tagMesh = tmpmesh
    }

    updateTmpMesh(offset, xy, normal, point) {
        // console.log('ttt')
        this.selectedObj.tagMesh.position.x = this.selectedObj.objMesh.position.x + offset.x + normal.x
        this.selectedObj.tagMesh.position.z = this.selectedObj.objMesh.position.z + offset.z + normal.z
        this.selectedObj.tagMesh.position.y = this.selectedObj.objMesh.position.y + offset.y + normal.y
        // 面の法線に沿って１０ｍ先を向かせる。
        const target = point.clone()
        target.addScaledVector(normal, 10)    
        this.selectedObj.tagMesh.lookAt(target)
        this.selectedObj.xy = xy
    }

    clearSelectedObj() {
        if(this.selectedObj.objMesh) {
            if(this.selectedObj.objMesh.material) {
                this.selectedObj.objMesh.material.color.set(0xffcc33)
            }
            this.selectedObj.objMesh = null
        }
        if(this.selectedObj.tagMesh) {
            this.selectedObj.tagMesh.removeFromParent()
            this.safeRelease(this.selectedObj.tagMesh)
            this.selectedObj.tagMesh = null
        }
        this.selectedObj = {}
    }

    isBaseBuilding(bldgID) {
        const result = this.baseBuildings.filter((base) => {
            return base === bldgID
        })
        return result.length > 0
    }

    addBuilding(object, center, altitude) {
        object.position.x = center[0]
        object.position.z = center[1]
        object.position.y = altitude
        this.buildingWrap.add(object);
    }

    addFrn(object, center, altitude) {
        object.position.x = center[0]
        object.position.z = center[1]
        object.position.y = altitude
        this.frnWrap.add(object);
    }

    addVeg(object, center, altitude) {
        object.position.x = center[0]
        object.position.z = center[1]
        object.position.y = altitude
        this.vegWrap.add(object);
    }
    
    addTag(object, center, altitude, position) {
        object.position.x = center[0] + position.x
        object.position.z = center[1] + position.z
        object.position.y = altitude + position.y
        this.tagWrap.add(object)
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

    removeMesh(mesh) {
        if(mesh) {
            mesh.removeFromParent()
            this.safeRelease(mesh)
        }
    }

    removeWrapMesh(gmlID, wrap) {
        const mesh = this.findWrapMesh(gmlID, wrap)
        if(mesh) {
            wrap.remove(mesh)
            this.safeRelease(mesh)
        }
    } 

    removeAllWraps(meshWrap) {
        const self = this
        const namelist = meshWrap.children.map((mesh) => {
            return mesh.name
        })
        let counter = 0
        const n = meshWrap.name
        const l = meshWrap.children.length
        for (const name of namelist) {
            const resMesh = meshWrap.children.find((mesh) => mesh.name === name)
            if(resMesh) {
                meshWrap.remove(resMesh)
                self.safeRelease(resMesh)
                counter++
            }
        }
        console.log('remove ' + n + ', start: ' + l + ', removed:' + counter + ', rediue ' + meshWrap.children.length)
    }

    findWrapMesh(gmlID, wrap) {
        const list = wrap.children.filter((item) => {
            return (item.name === gmlID);
        })
        if (list.length > 0) {
            return list[0];
        } else {
            return null;
        }
    }

    findPolyMesh(polyID) {
        const list = this.polyWrap.children.filter((item) => {
            return (item.name === polyID);
        })
        if (list.length > 0) {
            return list[0];
        } else {
            return null;
        }
    }
    

    // sample
    _makeBuildingShape2(obj) {
        let material = new THREE.MeshToonMaterial({color: 0xffcc33, opacity: 0.3, transparent: true})
        if (this.isBaseBuilding(obj.bldgID)) {
            material = new THREE.MeshToonMaterial({color: 0x0000ff, opacity: 0.3, transparent: true});
        }
        const shape = new THREE.Shape();
        const worldPosition = this.controller.transfromPosition(obj.center, obj.footprint)
        worldPosition.footprint.forEach((pW, index) => {
            if(index === 0) {
                shape.moveTo(pW[0], -pW[1])
            } else {
                shape.lineTo(pW[0], -pW[1])
            }
        })
        const extrudeSettings = {
            steps: 1,
            depth: obj.height,
            bevelEnabled: false
        }
        const extrudeGeom = new THREE.ExtrudeBufferGeometry(shape, extrudeSettings);
        extrudeGeom.rotateX(-Math.PI / 2);
        const mesh = new THREE.Mesh(extrudeGeom, material);
        mesh.name = obj.gmlID
        mesh.position.x = worldPosition.center[0]
        mesh.position.y = obj.center.altitude
        mesh.position.z = worldPosition.center[1]
        // console.log(mesh)
        if(this.isBaseBuilding(obj.bldgID)) {
            console.log(obj.bldgID + ', ' + obj.gmlID + ' is base.')
            mesh.visible = true
        } else {
            mesh.visible = false
        }
        this.addBuilding(mesh, worldPosition.center, obj.center.altitude)
    }

    _makeFrnShape(obj) {
        let material = new THREE.MeshToonMaterial({color: 0x888888, opacity: 0.6, transparent: true})
        const shape = new THREE.Shape();
        const worldPosition = this.controller.transfromPosition(obj.center, obj.footprint)
        worldPosition.footprint.forEach((pW, index) => {
            if(index === 0) {
                shape.moveTo(pW[0], -pW[1])
            } else {
                shape.lineTo(pW[0], -pW[1])
            }
        })
        const extrudeSettings = {
            steps: 1,
            depth: obj.height,
            bevelEnabled: false
        }
        const extrudeGeom = new THREE.ExtrudeBufferGeometry(shape, extrudeSettings);
        extrudeGeom.rotateX(-Math.PI / 2);
        const mesh = new THREE.Mesh(extrudeGeom, material);
        mesh.name = obj.gmlID
        mesh.position.x = worldPosition.center[0]
        mesh.position.y = obj.center.altitude
        mesh.position.z = worldPosition.center[1]
        // console.log(mesh)

        this.addFrn(mesh, worldPosition.center, obj.center.altitude)
    }

    _makeVegShape(obj) {
        let material = new THREE.MeshToonMaterial({color: 0x228844, opacity: 0.7, transparent: true})
        const shape = new THREE.Shape();
        const worldPosition = this.controller.transfromPosition(obj.center, obj.footprint)
        worldPosition.footprint.forEach((pW, index) => {
            if(index === 0) {
                shape.moveTo(pW[0], -pW[1])
            } else {
                shape.lineTo(pW[0], -pW[1])
            }
        })
        const extrudeSettings = {
            steps: 1,
            depth: obj.height,
            bevelEnabled: false
        }
        const extrudeGeom = new THREE.ExtrudeBufferGeometry(shape, extrudeSettings);
        extrudeGeom.rotateX(-Math.PI / 2);
        const mesh = new THREE.Mesh(extrudeGeom, material);
        mesh.name = obj.gmlID
        mesh.position.x = worldPosition.center[0]
        mesh.position.y = obj.center.altitude
        mesh.position.z = worldPosition.center[1]
        this.addVeg(mesh, worldPosition.center, obj.center.altitude)
    }

    _makeTagShape(obj) {
        const worldPosition = this.controller.transfromPosition(obj.center, [])
        let size = 3
        if(obj.gmlID.includes('frn_') || obj.gmlID.includes('veg_')) {
            size = 1
        }
        const geom = new THREE.CircleGeometry(size, 24)
        const material = this.createCategoryMaterial(obj.category)

        const mesh = new THREE.Mesh(geom, material)
        mesh.name = obj.tagID
        this.addTag(mesh, worldPosition.center, obj.center.altitude, obj.offset.position)        
        mesh.rotation.x = obj.offset.rotation.x
        mesh.rotation.y = obj.offset.rotation.y
        mesh.rotation.z = obj.offset.rotation.z
    }

    getDistanceWithName(objName) {
        const obj = TagUtils.findBuildingFromGmlID(objName, this.buildings);
        if(obj) {
            return this.controller.getDistance(obj.center);
        } else {
            return -2;
        }
    }

    setBuildingVisibility(visibility) {
        const self = this;
        this.buildings.forEach(building => {
            // const obj = self.controller.findChildWithName(building.gmlID)
            const obj = self.findWrapMesh(building.gmlID, self.buildingWrap)
            if(self.selectedObj.objMesh && self.selectedObj.objMesh.name === obj.name) {
                return
            }
            if(obj) {
                if(visibility) {
                    if(self.mode === "with_building") {
                        if(self.isBaseBuilding(building.bldgID)) {
                            obj.material.color.set('#0000ff')
                        } else {
                            obj.material.color.set('#ffcc33')
                        }
                    }
                    const distance = self.controller.getDistance(building.center) - building.radius
                    if (distance < 70) {
                        obj.visible = true
                    } else {
                        obj.visible = false
                    }
                } else {
                    if(self.isBaseBuilding(building.bldgID)) {
                        obj.material.color.set('#0000ff')
                        if(self.mode === "adding_tag") {
                            obj.visible = false
                        } else { 
                            obj.visible = true
                            obj.material.opacity = 0.3
                            // obj.material.opacity = 1
                        }
                    } else {
                        obj.visible = false
                    }
                }
            }
        })
        if(visibility) {
            this.buildingVisibleChecker()
        }
    }

    setFrnVisibility(visibility) {
        const self = this;
        this.frns.forEach(frn => {
            const obj = self.findWrapMesh(frn.gmlID, self.frnWrap)
            if(obj) {
                if(visibility) {
                    obj.material.color.set('#888888')
                    const distance = self.controller.getDistance(frn.center)
                    if (distance < 50) {
                        obj.visible = true
                    } else {
                        obj.visible = false
                    }
                } else {
                    obj.visible = false
                }
            }
        })
    }

    setVegVisibility(visibility) {
        const self = this;
        this.vegs.forEach(veg => {
            const obj = self.findWrapMesh(veg.gmlID, self.vegWrap)
            if(obj) {
                if(visibility) {
                    const distance = self.controller.getDistance(veg.center)
                    obj.material.color.set('#228844')
                    if (distance < 50) {
                        obj.visible = true
                    } else {
                        obj.visible = false
                    }
                } else {
                    obj.visible = false
                }
            }
        })
    }

    buildingVisibleChecker() {
        const self = this
        if(this.mode === "select_object" || this.mode === "with_building"){
            this.buildings.forEach(building => {
                const obj = self.findWrapMesh(building.gmlID, self.buildingWrap)
                if(obj) {
                    const distance = self.controller.getDistance(building.center) - building.radius
                    let ratio = (distance > 70 || distance <= 3) > 0 ? 0 : (70 - distance) / 70
                    if(ratio > 1.0) {
                        ratio = 0.95
                    }
                    if (ratio > 0.1) {
                        obj.visible = true
                        obj.material.opacity = ratio
                        // obj.material.opacity = 1
                    } else {
                        obj.visible = false
                    }
                    if(this.mode === "with_building"){
                        if(self.isBaseBuilding(building.bldgID)) {
                            obj.material.color.set('#0000ff')
                            obj.visible = true
                        }
                    }
                }
            })
        }
    }

    frnVisibleChecker() {
        const self = this;
        if(this.mode === "select_object" || this.mode === "with_building"){
            this.frns.forEach(frn => {
                const obj = self.findWrapMesh(frn.gmlID, self.frnWrap)
                if(obj) {
                    if(self.mode === "with_building") {
                        obj.material.color.set('#888888')
                    }
                    const distance = self.controller.getDistance(frn.center)
                    if (distance < 50) {
                        obj.visible = true
                    } else {
                        obj.visible = false
                    }
                }
            })
        }
    }

    vegVisibleChecker() {
        const self = this;
        if(this.mode === "select_object" || this.mode === "with_building"){
            this.vegs.forEach(veg => {
                const obj = self.findWrapMesh(veg.gmlID, self.vegWrap)
                if(obj) {
                    const distance = self.controller.getDistance(veg.center)
                    if (distance < 50) {
                        obj.visible = true
                        if(self.mode === "with_building") {
                            obj.material.color.set('#228844')
                        }
                    } else {
                        obj.visible = false
                    }
                }
            })
        }
    }

    tagVisibleChecker() {
        const self = this
        const ocrCaster = this.controller.getNewRayCaster()
        if(this.mode === 'normal' || this.mode === 'with_building' || this.mode === 'select_object') {
            const touchableMeshes = []
            //　オクルージョン用
            this.buildingWrap.children.forEach((mesh) => {
                touchableMeshes.push(mesh)
            })
            this.tags.forEach(tag => {
                // const obj = self.controller.findChildWithName(tag.tagID)
                const obj = self.findWrapMesh(tag.tagID, self.tagWrap)
                if(obj) {
                    const proj = obj.position.clone()
                    proj.project(self.camera)
                    // console.log(proj)
                    const diffx = self.cameraWrap.position.x - obj.position.x
                    const diffz = self.cameraWrap.position.z - obj.position.z
                    const diff = diffx * diffx + diffz * diffz
                    if(diff > 10000 || diff < 5){
                        obj.visible = false
                        return
                    }
                    // if(self.controller.getDistance(tag.center) > 80){
                    //     obj.visible = false
                    //     return
                    // }
                    if(proj.x > -1 && proj.x < 1 && proj.y > -1 && proj.y < 1) {
                        // const xx = (proj.x + 1) / 2 * width
                        // const yy = -(proj.y - 1) / 2 * height
                        // console.log("x: " + xx + ", y: " + yy)
                        ocrCaster.setFromCamera({x: proj.x, y:proj.y}, self.camera)
                        const touchableMeshes2 = touchableMeshes.concat([obj])
                        const intersects = ocrCaster.intersectObjects(touchableMeshes2)
                        let count = 0
                        if(intersects.length > 0) {
                            for(let i = 0; i < intersects.length; i ++) {
                                const interObj = intersects[i]
                                if(interObj.object.name === obj.name) {
                                    if(i > 0 && 
                                        interObj.distance - intersects[i - 1].object.distance < 3.0) {
                                            count = count - 1
                                    }
                                    break
                                }
                                count = count + 1
                            }
                        }
                        if(count > 1) {
                            obj.visible = false
                        } else if (count > 0) {
                            obj.visible = true
                            obj.material.opacity = 1
                        } else {
                            obj.visible = true
                            obj.material.opacity = 1
                        }
                    } else {
                        // obj.material.opacity = 1
                        obj.visible = false
                    }
                }
            })
        }
    }

    setTagVisibility(visibility) {
        this.tagWrap.children.forEach((mesh) => {
            mesh.visible = visibility
        })
        if(visibility) {
            this.tagVisibleChecker()
        }
    }

    setPolyVisibility(visibility) {
        const self = this
        this.polyWrap.children.forEach((mesh) => {
            const obj = self.findPolyObjFromMesh(mesh.name)
            if(obj) {
                if(obj.type === 'tran') {
                    mesh.visible = true
                } else {
                    mesh.visible = visibility
                }
            } else {
                mesh.visible = false
            }            
        })
    }

    updateBuildingList(newList) {
        console.log('updateBuildingList ' + newList.length)
        if (this.stopped) {
            return
        }
        // this.stopRendering()
        const self = this;

        // 今のリストで新しいリストにないものをsenceから除く
        this.buildings.forEach(building => {
            const obj = TagUtils.findBuildingFromGmlID(building.gmlID, newList);
            if(!obj) {
                self.removeWrapMesh(building.gmlID, self.buildingWrap)
            }
        })

        // 新しいリストでsenceにないものを追加
        newList.forEach((building) => {
            // const obj = self.controller.findChildWithName(building.gmlID)
            const obj = self.findWrapMesh(building.gmlID, self.buildingWrap)
            if (!obj) {
                self._makeBuildingShape2(building)
            }
        })
        this.buildings = newList;
        // this.startRendering()
    }

    updateFrnList(newList) {
        console.log('updateFrnList ' + newList.length)
        if (this.stopped) {
            return
        }
        const self = this;

        // 今のリストで新しいリストにないものをsenceから除く
        this.frns.forEach(frn => {
            const obj = TagUtils.findFrnFromGmlID(frn.gmlID, newList);
            if(!obj) {
                self.removeWrapMesh(frn.gmlID, self.frnWrap)
            }
        })

        // 新しいリストでsenceにないものを追加
        newList.forEach((frn) => {
            const obj = self.findWrapMesh(frn.gmlID, self.frnWrap)
            if (!obj) {
                self._makeFrnShape(frn)
            }
        })
        this.frns = newList;
        this.resetModeVisibility()
    }

    updateVegList(newList) {
        console.log('updateVegList ' + newList.length)
        if (this.stopped) {
            return
        }
        const self = this;

        // 今のリストで新しいリストにないものをsenceから除く
        this.vegs.forEach((veg) => {
            const obj = TagUtils.findFrnFromGmlID(veg.gmlID, newList);
            if(!obj) {
                self.removeWrapMesh(veg.gmlID, self.vegWrap)
            }
        })

        // 新しいリストでsenceにないものを追加
        newList.forEach((veg) => {
            const obj = self.findWrapMesh(veg.gmlID, self.vegWrap)
            if (!obj) {
                self._makeVegShape(veg)
            }
        })
        this.vegs = newList;
        this.resetModeVisibility()
    }

    updateTagList(newList) {
        console.log('updateTagList')
        if (this.stopped) {
            return
        }
        const self = this;
        // 今のリストで新しいリストにないものをsenceから除く
        this.tags.forEach(tag => {
            const obj = TagUtils.findTagFromTagID(tag.tagID, newList);
            if(!obj) {
                self.removeWrapMesh(tag.tagID, self.tagWrap)
            }
        })
        // 新しいリストでsenceにないものを追加
        newList.forEach((tag) => {
            // const obj = self.controller.findChildWithName(tag.tagID)
            const obj = self.findWrapMesh(tag.tagID, self.tagWrap)
            if (!obj) {
                self._makeTagShape(tag)
            }
        })
        this.tags = newList;
    }

    getRayCastTargets() {
        if(this.stopped) {
            return
        }
        const touchableMeshes = [];

        // ノーマルモードならタグのみがイベント対象
        if(this.mode === "normal" || this.mode === "with_building") {
            this.tagWrap.children.forEach((mesh) => {
                if(mesh.visible) {
                    touchableMeshes.push(mesh)
                }
            })
        } else if (this.mode === "select_object") {
            // 新規作成ならビルディングのみ
            this.buildingWrap.children.forEach((mesh) => {
                if(mesh.visible) {
                    touchableMeshes.push(mesh)
                }
            })

            this.frnWrap.children.forEach((mesh) => {
                if(mesh.visible) {
                    touchableMeshes.push(mesh)
                }
            })

            this.vegWrap.children.forEach((mesh) => {
                if(mesh.visible) {
                    touchableMeshes.push(mesh)
                }
            })

            this.tagWrap.children.forEach((mesh) => {
                if(mesh.visible) {
                    touchableMeshes.push(mesh)
                }
            })

            // this.polyWrap.children.forEach((mesh) => {
            //     if(mesh.visible) {
            //         touchableMeshes.push(mesh)
            //     }
            // })

        } else if (this.mode === "adding_tag") {
            // 新規作成モードでビルディングを選択済みで、タグの位置を選んでるモード
            if(this.selectedObj.objMesh){
                touchableMeshes.push(this.selectedObj.objMesh)
            }
            // if(this.selectedObj.tagMesh){
            //     touchableMeshes.push(this.selectedObj.tagMesh)
            // }
        }
        return touchableMeshes;
    }

    setUpCaribration(offset) {
        this.calibration.rotation = offset.rotation
        this.calibration.height = offset.height
        // this.controller.cameraOffset.rotation = this.calibration.rotation
        // this.controller.cameraOffset.height = this.calibration.height
        this.camera.fov = offset.fov
        this.controller.updateCameraRotationOffset(this.orientationControls.compassOffset + this.calibration.rotation)
        this.controller.updateCameraHeightOffset(this.calibration.height)
    }
    
    // setupObjects() {
    //     console.log('setup objects')
    //     this.data = City
    //     console.log(this.controller._camera.position)
    //     for (const oneObj of this.data) {
    //         this._makeBuildingShape(oneObj)
    //     }
    // }

    loggingCamera() {
        console.log(this.camera.rotation)
        console.log(this.camera.quaternion)
        console.log(this.orientationControls.deviceOrientation)
    }

    resetOrientationControll() {
        this.orientationControls.disconnect();
        this.orientationControls.connect();
    }

    refreshTransMesh(trans) {
        if (this.stopped) {
            return
        }
        const removes = this.transWrap.children.filter((mesh) => {
            const res = trans.filter((tran) => {
                return tran.id === mesh.name
            })
            return res.length === 0
        })
        for (const rmesh of removes) {
            this.transWrap.remove(rmesh)
            this.safeRelease(rmesh)
            // this.controller.remove(rmesh)
        }

        for (const tran of trans) {
            const res = this.transWrap.children.filter((mesh) => {
                return tran.id === mesh.name
            })
            if(res.length === 0) {
                // add
                const mesh = this.createTransMesh(tran)
                this.transWrap.add(mesh)
            } 
        }
    }

    createTransMesh(tran) {
        const self = this
        let material = new THREE.MeshBasicMaterial({color: 0x666666, opacity: 0.7, transparent: true});
        const shape = new THREE.Shape();
        const worldPosition = this.controller.transfromPosition(tran.center, tran.roadmap)
        worldPosition.footprint.forEach((pW, index) => {
            if(index === 0) {
                shape.moveTo(pW[0], -pW[1])
            } else {
                shape.lineTo(pW[0], -pW[1])
            }
        })
        const geometry = new THREE.ShapeGeometry(shape)
        geometry.rotateX(-Math.PI / 2)
        const pL2 = geometry.attributes.position.array;
        const length = worldPosition.footprint.length - 1
        for(let i = 0; i < length; i ++) {
            pL2[i * 3 + 1] = tran.roadmap[i].altitude - tran.center.altitude
        }
        geometry.computeBoundingBox()
        geometry.computeVertexNormals()
        geometry.attributes.position.needsUpdate = true
        
        const mesh = new THREE.Mesh(geometry, material)
        mesh.position.x = worldPosition.center[0]
        mesh.position.y = tran.center.altitude
        mesh.position.z = worldPosition.center[1]
        mesh.name = tran.id
        return mesh
    }

    updatePolyMesh(polygons) {
        if (this.stopped) {
            return
        }
        this.stopRendering()

        this.removeAllWraps(this.polyWrap)
        // this.removeAllWraps(this.bridWrap)

        // const removes = this.polyWrap.children.filter((mesh) => {
        //     const res = polygons.filter((poly) => {
        //         return poly.id === mesh.name
        //     })
        //     return res.length === 0
        // })
        // for (const rmesh of removes) {
        //     this.polyWrap.remove(rmesh)
        //     this.safeRelease(rmesh)
        // }

        for (const poly of polygons) {
            // const res = this.polyWrap.children.filter((mesh) => {
            //     return poly.id === mesh.name
            // })
            // if(res.length === 0) {
                // add
                const mesh = this.createPolyMesh(poly)
                if(poly.type === 'brid') {
                    //this.bridWrap.add(mesh)
                } else {
                    this.polyWrap.add(mesh)
                }
                // console.log(this.polyWrap.children.length)
            //} 
        }
        this.polygons = polygons
        this.bridWrap.visible = this.mode === "with_building" ? true : false
        this.polyWrap.visible = (this.mode === "with_building" || this.mode === "normal") ? true : false
        this.startRendering()
//         if(this.polygons.length > 0) {
//             const self = this
//             const fbxList = ['53391530_tran_6677', '53391531_tran_6677', '53391540_tran_6677', '53391541_tran_6677']
//             for (const name of fbxList) {
//                 const res = this.fbxWrap.children.filter((aMesh) => {
//                     return aMesh.name === name
//                 })
//                 if (res.length > 0) {
//                     continue
//                 }
//                 const loader = new FBXLoader();
                
//                 loader.load('/fbx/' + name + '.fbx', function ( object ) {
//                     console.log('load')
//                     console.log(object)
//                     object.name = name
//                     object.position.x = self.cameraWrap.position.x
//                     object.position.y = self.cameraWrap.position.y
//                     object.position.z = self.cameraWrap.position.z
//                     // object.scale.set(1, 1, 1)
// ///                    object.rotateX(-Math.PI / 2)
//                     //object.position = self.cameraWrap.position
//                     self.fbxWrap.add(object)
//                 })
//             }
//         }
    }

    createPolyMesh(poly) {
        const self = this
        let material = new THREE.MeshBasicMaterial({color: 0x666666, opacity: 0.6, transparent: true});
        const pCW = self.controller.lonLatToWorldCoords(poly.center.longitude, poly.center.latitude)
        const vectors = poly.triangle.map((pos) => {
            const wp = self.controller.lonLatToWorldCoords(pos.longitude, pos.latitude)
            return new THREE.Vector3(wp[0] - pCW[0], pos.altitude - poly.center.altitude , wp[1] - pCW[1])
        })
        // console.log(vectors)
        const faces = [0, 1, 2]
        const geometry = new THREE.BufferGeometry()
        geometry.setFromPoints(vectors)
        geometry.setIndex(faces)
        geometry.computeVertexNormals()
        const mesh = new THREE.Mesh(geometry, material)
        mesh.position.x = pCW[0]
        mesh.position.y = poly.center.altitude
        mesh.position.z = pCW[1]
        mesh.name = poly.id
        return mesh
    }

    createPolyMesh2(poly) {
        let material = new THREE.MeshBasicMaterial({color: 0x666666, opacity: 0.7, transparent: true});
        const shape = new THREE.Shape();
        const worldPosition = this.controller.transfromPosition(poly.center, poly.triangle)
        shape.moveTo(worldPosition.footprint[0][0], -worldPosition.footprint[0][1])
        shape.lineTo(worldPosition.footprint[1][0], -worldPosition.footprint[1][1])
        shape.lineTo(worldPosition.footprint[2][0], -worldPosition.footprint[2][1])
        shape.lineTo(worldPosition.footprint[0][0], -worldPosition.footprint[0][1])
        const geometry = new THREE.ShapeGeometry(shape)
        geometry.rotateX(-Math.PI / 2)
        const pL2 = geometry.attributes.position.array;
        const length = worldPosition.footprint.length
        for(let i = 0; i < length; i ++) {
            pL2[i * 3 + 1] = poly.triangle[i].altitude - poly.center.altitude
        }
        geometry.computeBoundingBox()
        geometry.computeVertexNormals()
        geometry.attributes.position.needsUpdate = true
        
        const mesh = new THREE.Mesh(geometry, material)
        mesh.position.x = worldPosition.center[0]
        mesh.position.y = poly.center.altitude
        mesh.position.z = worldPosition.center[1]
        mesh.name = poly.id
        return mesh
    }

    findPolyObjFromMesh(name) {
        const objs = this.polygons.filter((item) => {
            return item.id === name
        })
        if(objs.length > 0) {
            return objs[0]
        }
        return null
    }

    addQuene(jobName, list) {
        console.log('addQuene ' + jobName)
        const quene = { job: jobName, dataList: list, status: 0 }
        this.queneList.push(quene)
    }

    runQuene() {
        if(this.queneList.length > 0) {
            const quene = this.queneList[0]
            if (quene.status === 0) {
                quene.status = 1
                console.log('start quene:' + quene.job)
                if(quene.job === 'update_building') {
                    this.updateBuildingList(quene.dataList)
                } else if(quene.job === 'update_tag') {
                    this.updateTagList(quene.dataList)
                } else if(quene.job === 'update_frn') {
                    this.updateFrnList(quene.dataList)
                } else if(quene.job === 'update_veg') {
                    this.updateVegList(quene.dataList)
                }
                this.queneList.shift()
            } else {
                console.log('running quene:' + quene.job + ', ' + quene.status )
            }
        }
    }

    removeAllQuene() {
        if(this.queneList.length > 0) {
            if(this.queneList.length > 1) {
                this.queneList.length = 1
            }
            const quene = this.queneList[0]
            if(quene.status === 0) {
                this.queneList.shift()
            }
        }
    }
}

export { ARController };