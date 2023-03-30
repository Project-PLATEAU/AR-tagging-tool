"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
exports.__esModule = true;
exports.getVegs = exports.getFrns = exports.getPolygons = exports.getTrans = exports.getTags = exports.getCommentsFromFirestore = exports.getBuildings = void 0;
var geofire = require("geofire-common");
var admin = require('firebase-admin');
var COLLECTIONS = {
    TAGS: 'tags',
    USERS: 'users',
    COMMENTS: 'comments',
    BUILDINGS: 'buildings',
    TRANS: 'trans',
    POLYS: 'polygons',
    FRNS: 'frns',
    VEGS: 'vegs'
};
// Geohashの補助とか
var HALF_EARTH = 20037508.34;
var lonToSphMerc = function (lon) {
    return (lon / 180) * HALF_EARTH;
};
var latToSphMerc = function (lat) {
    var y = Math.log(Math.tan(((90 + lat) * Math.PI) / 360)) / (Math.PI / 180);
    return (y * HALF_EARTH) / 180.0;
};
// const getGeoHash = (lat: number, lon: number) => {
//   return geofire.geohashForLocation([lat, lon])
// }
var getGeoBounds = function (coord, radius) {
    return geofire.geohashQueryBounds([coord.latitude, coord.longitude], radius);
};
var calculateFootprintRadius = function (footprint, center) {
    if (footprint.length === 0) {
        return 0;
    }
    var distanceSum = 0;
    for (var _i = 0, footprint_1 = footprint; _i < footprint_1.length; _i++) {
        var point = footprint_1[_i];
        var latDif = latToSphMerc(point.latitude) - latToSphMerc(center.latitude);
        var lonDif = lonToSphMerc(point.longitude) - lonToSphMerc(center.longitude);
        distanceSum = distanceSum + Math.sqrt(latDif * latDif + lonDif * lonDif);
    }
    return distanceSum / footprint.length;
};
var createCenterPoint = function (data) {
    if (data.geoPoint) {
        return {
            latitude: data.geoPoint.latitude,
            longitude: data.geoPoint.longitude,
            altitude: data.altitude
        };
    }
    if (data.geopoint) {
        return {
            latitude: data.geopoint.latitude,
            longitude: data.geopoint.longitude,
            altitude: data.altitude
        };
    }
    return {
        latitude: 0,
        longitude: 0,
        altitude: data.altitude
    };
};
var documentListFromBoundsSnaps = function (boundsSnaps) {
    var items = [];
    for (var _i = 0, boundsSnaps_1 = boundsSnaps; _i < boundsSnaps_1.length; _i++) {
        var bSnap = boundsSnaps_1[_i];
        if (bSnap === null) {
            continue;
        }
        bSnap.docs.forEach(function (doc) {
            // 一応重複チェック
            if (items.filter(function (item) {
                return item.id === doc.id;
            }).length > 0) {
                return;
            }
            items.push(doc);
        });
    }
    return items;
};
// DocumentSnapshotから基本オブジェクトへの変換
var createBuildingFromSnapshot = function (doc) {
    var data = doc.data();
    var center = createCenterPoint(data);
    var radius = calculateFootprintRadius(data.footprint, center);
    var created = data.created;
    var modified = data.modified;
    var item = {
        gmlID: doc.id,
        footprint: data.footprint,
        center: center,
        bldgID: data.bldgID,
        created: created,
        modified: modified,
        height: data.height,
        radius: radius
    };
    return item;
};
var createTagFromSnapshot = function (doc) {
    var data = doc.data();
    var center = createCenterPoint(data);
    var created = data.created;
    var modified = data.modified;
    var commented = data.commented;
    var obj = {
        tagID: doc.id,
        gmlID: data.gmlID,
        subject: data.subject,
        label: data.label,
        description: data.description,
        createdBy: data.createdby,
        editors: data.allowedtoedit,
        hashtag: data.hashtag,
        category: data.category,
        group: data.group,
        hide: data.hide,
        like: data.like,
        offset: data.offset,
        center: center,
        created: created,
        modified: modified,
        photo: data.photo,
        commented: commented,
        commentCounts: data.counts,
        comments: []
    };
    return obj;
};
var createCommentFromSnapshot = function (doc) {
    var data = doc.data();
    var created = data.created;
    var modified = data.modified;
    var obj = {
        commentId: doc.id,
        comment: data.comment,
        createdBy: data.createdby,
        editors: data.allowedtoedit,
        created: created,
        modified: modified
    };
    return obj;
};
var createFrnFromSnapshot = function (doc) {
    var data = doc.data();
    var center = createCenterPoint(data);
    var created = data.created;
    var modified = data.modified;
    var item = {
        gmlID: doc.id,
        footprint: data.footprint,
        center: center,
        frnID: data.frnID,
        created: created,
        modified: modified,
        height: data.height,
        attributes: data.attributes,
        type: data.type
    };
    return item;
};
var createVegFromSnapshot = function (doc) {
    var data = doc.data();
    var center = createCenterPoint(data);
    var created = data.created;
    var modified = data.modified;
    var item = {
        gmlID: doc.id,
        footprint: data.footprint,
        center: center,
        vegID: data.vegID,
        created: created,
        modified: modified,
        height: data.height,
        attributes: data.attributes,
        type: data.type
    };
    return item;
};
// DocumentSnapshotから基本オブジェクトへの変換
var createPolyFromSnapshot = function (doc) {
    var data = doc.data();
    var center = createCenterPoint(data);
    var created = data.created;
    var modified = data.modified;
    var item = {
        id: doc.id,
        type: data.type,
        triangle: data.polygon,
        center: center,
        created: created,
        modified: modified
    };
    if (item.type === 'tran') {
        item.roadID = data.roadID;
        item.trafficID = data.trafficID;
    }
    if (item.type === 'brid') {
        item.bridID = data.bridID;
    }
    return item;
};
// DocumentSnapshotから基本オブジェクトへの変換
var createTranFromSnapshot = function (doc) {
    var data = doc.data();
    var center = createCenterPoint(data);
    var created = data.created;
    var modified = data.modified;
    var item = {
        gmlID: data.gmlID,
        id: doc.id,
        roadmap: data.roadmap,
        center: center,
        created: created,
        modified: modified
    };
    return item;
};
// geohashからdocumentを取得し、１つのリストにまとめる所（共通）
var getGeoHashDocuments = function (colName, hashName, coord, radius) { return __awaiter(void 0, void 0, void 0, function () {
    var colRef, bounds, boundsSnaps, dList;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                colRef = admin.firestore().collection(colName);
                bounds = getGeoBounds(coord, radius);
                return [4 /*yield*/, Promise.all(bounds.map(function (b) {
                        var q = colRef.orderBy(hashName).startAt(b[0]).endAt(b[1]);
                        return q.get();
                    }))];
            case 1:
                boundsSnaps = _a.sent();
                dList = documentListFromBoundsSnaps(boundsSnaps);
                return [2 /*return*/, dList];
        }
    });
}); };
var getBuildings = function (coord, radius) { return __awaiter(void 0, void 0, void 0, function () {
    var dList, items;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0: return [4 /*yield*/, getGeoHashDocuments(COLLECTIONS.BUILDINGS, 'geoHash', coord, radius)];
            case 1:
                dList = _a.sent();
                items = dList.map(function (doc) {
                    return createBuildingFromSnapshot(doc);
                });
                return [2 /*return*/, items];
        }
    });
}); };
exports.getBuildings = getBuildings;
var getCommentsFromFirestore = function (tagId, counts) { return __awaiter(void 0, void 0, void 0, function () {
    var commentRef, q, snapShots, comments_1;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                commentRef = admin
                    .firestore()
                    .collection(COLLECTIONS.TAGS)
                    .doc(tagId)
                    .collection(COLLECTIONS.COMMENTS);
                q = commentRef.orderBy('created', 'desc').limit(counts);
                return [4 /*yield*/, q.get()];
            case 1:
                snapShots = _a.sent();
                if (snapShots.docs.length === 0) {
                    return [2 /*return*/, []];
                }
                else {
                    comments_1 = [];
                    snapShots.docs.forEach(function (doc) {
                        var obj = createCommentFromSnapshot(doc);
                        comments_1.push(obj);
                    });
                    return [2 /*return*/, comments_1];
                }
                return [2 /*return*/];
        }
    });
}); };
exports.getCommentsFromFirestore = getCommentsFromFirestore;
var getTags = function (coord, radius) { return __awaiter(void 0, void 0, void 0, function () {
    var dList, items;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0: return [4 /*yield*/, getGeoHashDocuments(COLLECTIONS.TAGS, 'geohash', coord, radius)];
            case 1:
                dList = _a.sent();
                items = dList.map(function (doc) {
                    return createTagFromSnapshot(doc);
                });
                return [2 /*return*/, items];
        }
    });
}); };
exports.getTags = getTags;
var getTrans = function (coord, radius) { return __awaiter(void 0, void 0, void 0, function () {
    var dList, items;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0: return [4 /*yield*/, getGeoHashDocuments(COLLECTIONS.TRANS, 'geoHash', coord, radius)];
            case 1:
                dList = _a.sent();
                items = dList.map(function (doc) {
                    return createTranFromSnapshot(doc);
                });
                return [2 /*return*/, items];
        }
    });
}); };
exports.getTrans = getTrans;
var getPolygons = function (coord, radius) { return __awaiter(void 0, void 0, void 0, function () {
    var dList, items;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0: return [4 /*yield*/, getGeoHashDocuments(COLLECTIONS.POLYS, 'geoHash', coord, radius)];
            case 1:
                dList = _a.sent();
                items = dList.map(function (doc) {
                    return createPolyFromSnapshot(doc);
                });
                return [2 /*return*/, items];
        }
    });
}); };
exports.getPolygons = getPolygons;
var getFrns = function (coord, radius) { return __awaiter(void 0, void 0, void 0, function () {
    var dList, items;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0: return [4 /*yield*/, getGeoHashDocuments(COLLECTIONS.FRNS, 'geoHash', coord, radius)];
            case 1:
                dList = _a.sent();
                items = dList.map(function (doc) {
                    return createFrnFromSnapshot(doc);
                });
                return [2 /*return*/, items];
        }
    });
}); };
exports.getFrns = getFrns;
var getVegs = function (coord, radius) { return __awaiter(void 0, void 0, void 0, function () {
    var dList, items;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0: return [4 /*yield*/, getGeoHashDocuments(COLLECTIONS.VEGS, 'geoHash', coord, radius)];
            case 1:
                dList = _a.sent();
                items = dList.map(function (doc) {
                    return createVegFromSnapshot(doc);
                });
                return [2 /*return*/, items];
        }
    });
}); };
exports.getVegs = getVegs;
