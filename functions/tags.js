"use strict";
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
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
exports.translateBuildingToGeoJson = exports.translateTagToGeoJson = exports.getTagsComments = exports.filterTags = exports.getTagsFromGeoLocation = exports.getTagFromFirestoreWithTagID = exports.getTagCounts = exports.getTagsFromFirestoreWithGmlID = exports.getTagsFromFirestoreWithBldgID = exports.createPublicUrlOfTagImages = exports.updateTagUserData = exports.getUserData = void 0;
var geofire = require("geofire-common");
var admin = require('firebase-admin');
var COLLECTIONS = {
    TAGS: 'tags',
    USERS: 'users',
    COMMENTS: 'comments',
    BUILDINGS: 'buildings'
};
var STORAGE_ROOT = 'https://firebasestorage.googleapis.com/v0/b';
// insert projectname.appspot com
var bucketName = '*** project-name ***.appspot.com';
var getGeoBounds = function (latitude, longitude, radius) {
    return geofire.geohashQueryBounds([latitude, longitude], radius);
};
var createTagFromSnapshot = function (doc) {
    var data = doc.data();
    var center = {
        latitude: data.geopoint.latitude,
        longitude: data.geopoint.longitude,
        altitude: data.altitude
    };
    var created = data.created.toDate();
    var modified = data.modified.toDate();
    var commented = data.commented.toDate();
    var obj = {
        tagID: doc.id,
        gmlID: doc.gmlID,
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
    var created = data.created.toDate();
    var modified = data.modified.toDate();
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
var getUserData = function (userId) { return __awaiter(void 0, void 0, void 0, function () {
    var userRef, doc, userData, data, profileUrl;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                userRef = admin.firestore().collection(COLLECTIONS.USERS).doc(userId);
                return [4 /*yield*/, userRef.get()];
            case 1:
                doc = _a.sent();
                userData = {
                    displayName: ''
                };
                if (!doc.exists) return [3 /*break*/, 3];
                data = doc.data();
                userData.displayName = data.displayName;
                if (!data.profile) return [3 /*break*/, 3];
                return [4 /*yield*/, createPublicUrlOfProfileImage(userId, data.profile)];
            case 2:
                profileUrl = _a.sent();
                userData.profile = profileUrl;
                _a.label = 3;
            case 3: return [2 /*return*/, userData];
        }
    });
}); };
exports.getUserData = getUserData;
var createPublicUrlOfProfileImage = function (userId, profile) { return __awaiter(void 0, void 0, void 0, function () {
    var storageBucket, refPath, storageRef, result, token, path, url;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                storageBucket = admin.storage().bucket(bucketName);
                refPath = 'users/' + userId + '/' + profile;
                storageRef = storageBucket.file(refPath);
                return [4 /*yield*/, storageRef.getMetadata()];
            case 1:
                result = (_a.sent())[0];
                if (result.metadata && result.metadata.firebaseStorageDownloadTokens) {
                    token = result.metadata.firebaseStorageDownloadTokens;
                    path = encodeURIComponent(refPath);
                    url = STORAGE_ROOT +
                        '/' +
                        bucketName +
                        '/o/' +
                        path +
                        '?alt=media&token=' +
                        token;
                    return [2 /*return*/, url];
                }
                return [2 /*return*/, profile];
        }
    });
}); };
var updateTagUserData = function (tag) { return __awaiter(void 0, void 0, void 0, function () {
    var userData;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0: return [4 /*yield*/, (0, exports.getUserData)(tag.createdBy)];
            case 1:
                userData = _a.sent();
                tag.createdBy = __assign({ id: tag.createdBy }, userData);
                return [2 /*return*/];
        }
    });
}); };
exports.updateTagUserData = updateTagUserData;
var createPublicUrlOfTagImages = function (tag) { return __awaiter(void 0, void 0, void 0, function () {
    var photos, storageBucket, prefix, newPhotos;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                photos = tag.photo;
                storageBucket = admin.storage().bucket(bucketName);
                prefix = 'tags/' + tag.tagID + '/';
                return [4 /*yield*/, Promise.all(photos.map(function (aPhoto) { return __awaiter(void 0, void 0, void 0, function () {
                        var storageRef, result, token, path, url;
                        return __generator(this, function (_a) {
                            switch (_a.label) {
                                case 0:
                                    storageRef = storageBucket.file(prefix + aPhoto);
                                    return [4 /*yield*/, storageRef.getMetadata()];
                                case 1:
                                    result = (_a.sent())[0];
                                    if (result.metadata && result.metadata.firebaseStorageDownloadTokens) {
                                        token = result.metadata.firebaseStorageDownloadTokens;
                                        path = encodeURIComponent(prefix + aPhoto);
                                        url = STORAGE_ROOT +
                                            '/' +
                                            bucketName +
                                            '/o/' +
                                            path +
                                            '?alt=media&token=' +
                                            token;
                                        return [2 /*return*/, url];
                                    }
                                    return [2 /*return*/, aPhoto];
                            }
                        });
                    }); }))];
            case 1:
                newPhotos = _a.sent();
                tag.photo = newPhotos;
                return [2 /*return*/, true];
        }
    });
}); };
exports.createPublicUrlOfTagImages = createPublicUrlOfTagImages;
var getTagsFromFirestoreWithBldgID = function (bldgID, comment) { return __awaiter(void 0, void 0, void 0, function () {
    var colRef, q, snapShots, list_2, _i, list_1, tag, _a;
    return __generator(this, function (_b) {
        switch (_b.label) {
            case 0:
                colRef = admin.firestore().collection(COLLECTIONS.TAGS);
                q = colRef.where('subject', '==', bldgID);
                return [4 /*yield*/, q.get()];
            case 1:
                snapShots = _b.sent();
                if (!(snapShots.docs.length === 0)) return [3 /*break*/, 2];
                return [2 /*return*/, null];
            case 2:
                list_2 = [];
                snapShots.docs.forEach(function (doc) {
                    var obj = createTagFromSnapshot(doc);
                    list_2.push(obj);
                });
                _i = 0, list_1 = list_2;
                _b.label = 3;
            case 3:
                if (!(_i < list_1.length)) return [3 /*break*/, 6];
                tag = list_1[_i];
                _a = tag;
                return [4 /*yield*/, getCommentsFromFirestore(tag.tagID, comment)];
            case 4:
                _a.comments = _b.sent();
                _b.label = 5;
            case 5:
                _i++;
                return [3 /*break*/, 3];
            case 6: return [2 /*return*/, list_2];
        }
    });
}); };
exports.getTagsFromFirestoreWithBldgID = getTagsFromFirestoreWithBldgID;
var getTagsFromFirestoreWithGmlID = function (gmlID, comment) { return __awaiter(void 0, void 0, void 0, function () {
    var colRef, q, snapShots, list_4, _i, list_3, tag, _a;
    return __generator(this, function (_b) {
        switch (_b.label) {
            case 0:
                colRef = admin.firestore().collection(COLLECTIONS.TAGS);
                q = colRef.where('gmlID', '==', gmlID);
                return [4 /*yield*/, q.get()];
            case 1:
                snapShots = _b.sent();
                if (!(snapShots.docs.length === 0)) return [3 /*break*/, 2];
                return [2 /*return*/, null];
            case 2:
                list_4 = [];
                snapShots.docs.forEach(function (doc) {
                    var obj = createTagFromSnapshot(doc);
                    list_4.push(obj);
                });
                _i = 0, list_3 = list_4;
                _b.label = 3;
            case 3:
                if (!(_i < list_3.length)) return [3 /*break*/, 6];
                tag = list_3[_i];
                _a = tag;
                return [4 /*yield*/, getCommentsFromFirestore(tag.tagID, comment)];
            case 4:
                _a.comments = _b.sent();
                _b.label = 5;
            case 5:
                _i++;
                return [3 /*break*/, 3];
            case 6: return [2 /*return*/, list_4];
        }
    });
}); };
exports.getTagsFromFirestoreWithGmlID = getTagsFromFirestoreWithGmlID;
var getTagCounts = function () { return __awaiter(void 0, void 0, void 0, function () {
    var colRef, snapShots;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                colRef = admin.firestore().collection(COLLECTIONS.TAGS);
                return [4 /*yield*/, colRef.get()];
            case 1:
                snapShots = _a.sent();
                return [2 /*return*/, snapShots.docs.length];
        }
    });
}); };
exports.getTagCounts = getTagCounts;
var getTagFromFirestoreWithTagID = function (tagID, comment) { return __awaiter(void 0, void 0, void 0, function () {
    var docRef, doc, obj, _a;
    return __generator(this, function (_b) {
        switch (_b.label) {
            case 0:
                docRef = admin.firestore().collection(COLLECTIONS.TAGS).doc(tagID);
                return [4 /*yield*/, docRef.get()];
            case 1:
                doc = _b.sent();
                if (!doc.exists) return [3 /*break*/, 3];
                obj = createTagFromSnapshot(doc);
                _a = obj;
                return [4 /*yield*/, getCommentsFromFirestore(obj.tagID, comment)];
            case 2:
                _a.comments = _b.sent();
                return [2 /*return*/, obj];
            case 3: return [2 /*return*/, null];
        }
    });
}); };
exports.getTagFromFirestoreWithTagID = getTagFromFirestoreWithTagID;
var getTagsFromGeoLocation = function (latitude, longitude, radius) { return __awaiter(void 0, void 0, void 0, function () {
    var colRef, bounds, boundsSnaps, items, _i, boundsSnaps_1, bSnap;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                colRef = admin.firestore().collection(COLLECTIONS.TAGS);
                bounds = getGeoBounds(latitude, longitude, radius);
                return [4 /*yield*/, Promise.all(bounds.map(function (b) {
                        var q = colRef.orderBy('geohash').startAt(b[0]).endAt(b[1]);
                        return q.get();
                    }))];
            case 1:
                boundsSnaps = _a.sent();
                items = [];
                for (_i = 0, boundsSnaps_1 = boundsSnaps; _i < boundsSnaps_1.length; _i++) {
                    bSnap = boundsSnaps_1[_i];
                    bSnap.docs.forEach(function (doc) {
                        // 一応重複チェック
                        if (items.filter(function (item) {
                            return item.tagID === doc.id;
                        }).length > 0) {
                            return;
                        }
                        var obj = createTagFromSnapshot(doc);
                        items.push(obj);
                    });
                }
                // コメントはあとで
                return [2 /*return*/, items];
        }
    });
}); };
exports.getTagsFromGeoLocation = getTagsFromGeoLocation;
var filterTags = function (tags, category, group, hashTags) {
    var filtered = tags.filter(function (tag) {
        if (category !== 'None') {
            if (tag.category !== category) {
                return false;
            }
        }
        if (group !== '') {
            if (tag.group !== group) {
                return false;
            }
        }
        var r = hashTags.filter(function (fHash) {
            return (tag.hashtag.filter(function (tHash) {
                return tHash === fHash;
            }).length > 0);
        });
        if (r.length < hashTags.length) {
            return false;
        }
        return true;
    });
    return filtered;
};
exports.filterTags = filterTags;
var getTagsComments = function (tags, limit) { return __awaiter(void 0, void 0, void 0, function () {
    var newTags;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0: return [4 /*yield*/, Promise.all(tags.map(function (tag) { return __awaiter(void 0, void 0, void 0, function () {
                    var comments;
                    return __generator(this, function (_a) {
                        switch (_a.label) {
                            case 0: return [4 /*yield*/, getCommentsFromFirestore(tag.tagID, limit)];
                            case 1:
                                comments = _a.sent();
                                tag.comments = comments;
                                return [2 /*return*/, tag];
                        }
                    });
                }); }))];
            case 1:
                newTags = _a.sent();
                return [2 /*return*/, newTags];
        }
    });
}); };
exports.getTagsComments = getTagsComments;
var translateTagToGeoJson = function (tag) {
    var feature = {
        type: 'Feature',
        geometry: {
            type: 'Point',
            coordinates: changeGeoJsonCoodsFromCenterWithOffset(tag.center, tag.offset)
        },
        properties: {
            title: tag.label,
            id: tag.tagID,
            description: tag.description,
            bldgID: tag.subject,
            gmlID: tag.gmlID,
            hashtag: tag.hashtag,
            category: tag.category,
            created: tag.created,
            modified: tag.modified,
            createdBy: tag.createdBy,
            group: tag.group,
            photo: tag.photo
        }
    };
    if (tag.category === 'GOOD') {
        feature.properties.markerUrl =
            'https://*** project-name ***.web.app/images/GOOD_300.png';
    }
    else if (tag.category === 'BAD') {
        feature.properties.markerUrl =
            'https://*** project-name ***.web.app/images/BAD_300.png';
    }
    else if (tag.category === 'IDEA') {
        feature.properties.markerUrl =
            'https://*** project-name ***.web.app/images/POSSIBLE_300.png';
    }
    return feature;
};
exports.translateTagToGeoJson = translateTagToGeoJson;
var translateBuildingToGeoJson = function (bldg) {
    var feature = {
        type: 'Feature',
        geometry: {
            type: 'Point',
            coordinates: changeGeoJsonCoodsFromCenter(bldg.center)
        },
        properties: {
            title: bldg.gmlID,
            bldgID: bldg.bldgID,
            'marker-color': '#33cc66'
        }
    };
    return feature;
};
exports.translateBuildingToGeoJson = translateBuildingToGeoJson;
var HALF_EARTH = 20037508.34;
var lonToSphMerc = function (lon) {
    return (lon / 180) * HALF_EARTH;
};
var latToSphMerc = function (lat) {
    var y = Math.log(Math.tan(((90 + lat) * Math.PI) / 360)) / (Math.PI / 180);
    return (y * HALF_EARTH) / 180.0;
};
var sphMercToLon = function (x) {
    return (x / HALF_EARTH) * 180.0;
};
var sphMercToLat = function (y) {
    var lat = (y / HALF_EARTH) * 180.0;
    lat =
        (180 / Math.PI) *
            (2 * Math.atan(Math.exp((lat * Math.PI) / 180)) - Math.PI / 2);
    return lat;
};
var changeGeoJsonCoodsFromCenter = function (center) {
    return [center.longitude, center.latitude, center.altitude];
};
var changeGeoJsonCoodsFromCenterWithOffset = function (center, offset) {
    var sx = lonToSphMerc(center.longitude) + offset.position.x;
    var sz = latToSphMerc(center.latitude) - offset.position.z;
    return [sphMercToLon(sx), sphMercToLat(sz), 0 + offset.position.y];
};
