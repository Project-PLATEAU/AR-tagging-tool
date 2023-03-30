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
exports.nextApp = void 0;
var promise_pool_1 = require("@supercharge/promise-pool");
var functions = require("firebase-functions");
var next_1 = require("next");
var appapi_1 = require("./appapi");
var tags_1 = require("./tags");
var express = require('express');
var admin = require('firebase-admin');
admin.initializeApp();
var nextjsServer = (0, next_1["default"])({
    dev: false,
    conf: {
        distDir: '.next',
        future: {},
        experimental: {}
    }
});
var nextjsHandle = nextjsServer.getRequestHandler();
// @see https://firebase.google.com/docs/hosting/full-config?hl=ja#rewrite-functions
var getFn = function () {
    var region = 'asia-northeast1';
    return functions.region(region);
};
exports.nextApp = functions
    .region('us-central1')
    .https.onRequest(function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0: return [4 /*yield*/, nextjsServer.prepare()];
            case 1:
                _a.sent();
                return [2 /*return*/, nextjsHandle(req, res)];
        }
    });
}); });
var bodyHasKeyValue = function (body, key) {
    if (isUorNull(body)) {
        return false;
    }
    if (isUorNull(body[key])) {
        return false;
    }
    return true;
};
var isNumValue = function (value) {
    if (isUorNull(value)) {
        return false;
    }
    return value.replace(/[ ]/g, '') !== '' && !isNaN(value);
};
var isUorNull = function (value) {
    if (typeof value === 'undefined' || value == null) {
        return true;
    }
    return false;
};
const reqToken = '' // tokenを入れて下さい
var authorizeCheck = function (req) {
    // 認証情報なし
    if (!req.headers.authorization ||
        !req.headers.authorization.startsWith('Bearer ')) {
        return {
            access: false,
            message: 'Bearer realm="token_required"'
        };
    }
    var idToken = req.headers.authorization.split('Bearer ')[1];
    if (idToken === reqToken) {
        return {
            access: true,
            message: ''
        };
    }
    return {
        access: false,
        message: 'token wrong'
    };
};
var app = express();
app.get('/', function (req, res) { return res.status(200).send('Hey there!'); });
app.get('/tags', function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var authorize, q, fH, gTags, fTags, geoTags, geoJson, cTags, e_1;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                // const tagData = new Set<string>()
                if (bodyHasKeyValue(req.query, 'export') && req.query["export"]) {
                    if (bodyHasKeyValue(req.query, 'token') && req.query.token) {
                        if (req.query.token !== reqToken) {
                            res.status(401).json({ error: 'token wrong.' });
                        }
                        res.setHeader('Access-Control-Allow-Origin', '*');
                    }
                    else {
                        res.status(401).json({ error: 'Token is required.' });
                    }
                }
                else {
                    authorize = authorizeCheck(req);
                    if (!authorize.access) {
                        res.status(401).json({ error: authorize.message });
                    }
                }
                console.log(req.query);
                q = {
                    lat: 0,
                    lon: 0,
                    r: 200,
                    c: 5,
                    fC: 'None',
                    group: '',
                    fH: []
                };
                if (bodyHasKeyValue(req.query, 'lat') && bodyHasKeyValue(req.query, 'lon')) {
                    if (isNumValue(req.query.lat) && isNumValue(req.query.lon)) {
                        q.lat = Number(req.query.lat);
                        q.lon = Number(req.query.lon);
                    }
                    else {
                        res.status(402).json({ error: 'Incorrect geocode parameters.' });
                    }
                }
                else {
                    res
                        .status(402)
                        .json({ error: 'Geocode parameters [lat] [lon] are required.' });
                }
                if (bodyHasKeyValue(req.query, 'radius') && isNumValue(req.query.radius)) {
                    q.r = Number(req.query.radius);
                    if (q.r > 500) {
                        q.r = 500;
                    }
                }
                if (bodyHasKeyValue(req.query, 'comment') && isNumValue(req.query.comment)) {
                    q.c = Number(req.query.comment);
                }
                if (bodyHasKeyValue(req.query, 'category')) {
                    q.fC = req.query.category;
                }
                if (bodyHasKeyValue(req.query, 'group')) {
                    q.group = req.query.group;
                }
                if (bodyHasKeyValue(req.query, 'hash')) {
                    try {
                        fH = JSON.parse(req.query.hash);
                        console.log(fH);
                        if (Array.isArray(fH)) {
                            q.fH = fH;
                        }
                    }
                    catch (e) {
                        console.error(e);
                    }
                }
                else {
                    console.log('not hash array');
                }
                console.log(q);
                _a.label = 1;
            case 1:
                _a.trys.push([1, 7, , 8]);
                return [4 /*yield*/, (0, tags_1.getTagsFromGeoLocation)(q.lat, q.lon, q.r)];
            case 2:
                gTags = _a.sent();
                console.log('g');
                fTags = (0, tags_1.filterTags)(gTags, q.fC, q.group, q.fH);
                return [4 /*yield*/, promise_pool_1.PromisePool["for"](fTags)
                        .withConcurrency(10)
                        .process(function (aTag) { return __awaiter(void 0, void 0, void 0, function () {
                        return __generator(this, function (_a) {
                            switch (_a.label) {
                                case 0: return [4 /*yield*/, (0, tags_1.createPublicUrlOfTagImages)(aTag)];
                                case 1:
                                    _a.sent();
                                    return [4 /*yield*/, (0, tags_1.updateTagUserData)(aTag)];
                                case 2:
                                    _a.sent();
                                    return [2 /*return*/, null];
                            }
                        });
                    }); })];
            case 3:
                _a.sent();
                if (!(bodyHasKeyValue(req.query, 'export') && req.query["export"])) return [3 /*break*/, 4];
                geoTags = fTags.map(function (tag) {
                    return (0, tags_1.translateTagToGeoJson)(tag);
                });
                geoJson = {
                    type: 'FeatureCollection',
                    features: geoTags
                };
                res.status(200).send(geoJson);
                return [3 /*break*/, 6];
            case 4: return [4 /*yield*/, (0, tags_1.getTagsComments)(fTags, q.c)];
            case 5:
                cTags = _a.sent();
                res.status(200).send(cTags);
                _a.label = 6;
            case 6: return [3 /*break*/, 8];
            case 7:
                e_1 = _a.sent();
                console.error(e_1);
                res.status(404).json({ error: e_1.message });
                return [3 /*break*/, 8];
            case 8: return [2 /*return*/];
        }
    });
}); });
app.get('/tags/:id', function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var authorize, tagId, counts, e_2, tag, e_3;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                authorize = authorizeCheck(req);
                if (!authorize.access) {
                    res.status(401).json({ error: authorize.message });
                }
                tagId = req.params.id;
                if (!(tagId === 'count')) return [3 /*break*/, 5];
                _a.label = 1;
            case 1:
                _a.trys.push([1, 3, , 4]);
                return [4 /*yield*/, (0, tags_1.getTagCounts)()];
            case 2:
                counts = _a.sent();
                res.status(200).send({ count: counts });
                return [2 /*return*/];
            case 3:
                e_2 = _a.sent();
                console.error(e_2);
                res.status(404).json({ error: e_2.message });
                return [3 /*break*/, 4];
            case 4: return [3 /*break*/, 12];
            case 5:
                _a.trys.push([5, 11, , 12]);
                return [4 /*yield*/, (0, tags_1.getTagFromFirestoreWithTagID)(tagId, 100)];
            case 6:
                tag = _a.sent();
                if (!(tag === null)) return [3 /*break*/, 7];
                res.status(403).json({ error: 'No tag found.' });
                return [3 /*break*/, 10];
            case 7: return [4 /*yield*/, (0, tags_1.createPublicUrlOfTagImages)(tag)];
            case 8:
                _a.sent();
                return [4 /*yield*/, (0, tags_1.updateTagUserData)(tag)];
            case 9:
                _a.sent();
                res.status(200).send(tag);
                _a.label = 10;
            case 10: return [3 /*break*/, 12];
            case 11:
                e_3 = _a.sent();
                console.error(e_3);
                res.status(404).json({ error: e_3.message });
                return [3 /*break*/, 12];
            case 12: return [2 /*return*/];
        }
    });
}); });
app.get('/buildings/:id/tags', function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var authorize, buildingId, tags, e_4;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                authorize = authorizeCheck(req);
                if (!authorize.access) {
                    res.status(401).json({ error: authorize.message });
                }
                buildingId = req.params.id;
                _a.label = 1;
            case 1:
                _a.trys.push([1, 5, , 6]);
                return [4 /*yield*/, (0, tags_1.getTagsFromFirestoreWithBldgID)(buildingId, 5)];
            case 2:
                tags = _a.sent();
                if (!tags) return [3 /*break*/, 4];
                return [4 /*yield*/, promise_pool_1.PromisePool["for"](tags)
                        .withConcurrency(10)
                        .process(function (aTag) { return __awaiter(void 0, void 0, void 0, function () {
                        return __generator(this, function (_a) {
                            switch (_a.label) {
                                case 0: return [4 /*yield*/, (0, tags_1.createPublicUrlOfTagImages)(aTag)];
                                case 1:
                                    _a.sent();
                                    return [4 /*yield*/, (0, tags_1.updateTagUserData)(aTag)];
                                case 2:
                                    _a.sent();
                                    return [2 /*return*/, null];
                            }
                        });
                    }); })];
            case 3:
                _a.sent();
                _a.label = 4;
            case 4:
                res.status(200).send(tags);
                return [3 /*break*/, 6];
            case 5:
                e_4 = _a.sent();
                console.error(e_4);
                res.status(404).json({ error: e_4.message });
                return [3 /*break*/, 6];
            case 6: return [2 /*return*/];
        }
    });
}); });
app.get('/target/:id/tags', function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var authorize, gmlID, tags, e_5;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                authorize = authorizeCheck(req);
                if (!authorize.access) {
                    res.status(401).json({ error: authorize.message });
                }
                gmlID = req.params.id;
                _a.label = 1;
            case 1:
                _a.trys.push([1, 5, , 6]);
                return [4 /*yield*/, (0, tags_1.getTagsFromFirestoreWithGmlID)(gmlID, 5)];
            case 2:
                tags = _a.sent();
                if (!tags) return [3 /*break*/, 4];
                return [4 /*yield*/, promise_pool_1.PromisePool["for"](tags)
                        .withConcurrency(10)
                        .process(function (aTag) { return __awaiter(void 0, void 0, void 0, function () {
                        return __generator(this, function (_a) {
                            switch (_a.label) {
                                case 0: return [4 /*yield*/, (0, tags_1.createPublicUrlOfTagImages)(aTag)];
                                case 1:
                                    _a.sent();
                                    return [4 /*yield*/, (0, tags_1.updateTagUserData)(aTag)];
                                case 2:
                                    _a.sent();
                                    return [2 /*return*/, null];
                            }
                        });
                    }); })];
            case 3:
                _a.sent();
                _a.label = 4;
            case 4:
                res.status(200).send(tags);
                return [3 /*break*/, 6];
            case 5:
                e_5 = _a.sent();
                console.error(e_5);
                res.status(404).json({ error: e_5.message });
                return [3 /*break*/, 6];
            case 6: return [2 /*return*/];
        }
    });
}); });
exports.rest = getFn().runWith({ memory: '1GB' }).https.onRequest(app);
var getDataFromGeoLocation = function (data, context) { return __awaiter(void 0, void 0, void 0, function () {
    var newBuildings, newTags, newFrns, newVegs, e_6;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                if (context.auth === null || context.auth === undefined) {
                    throw new functions.https.HttpsError('permission-denied', 'You are not authorized.');
                }
                if (!data.coords || !data.radius) {
                    throw new functions.https.HttpsError('invalid-argument', 'coord and radius are required.');
                }
                _a.label = 1;
            case 1:
                _a.trys.push([1, 6, , 7]);
                return [4 /*yield*/, (0, appapi_1.getBuildings)(data.coords, data.radius)];
            case 2:
                newBuildings = _a.sent();
                return [4 /*yield*/, (0, appapi_1.getTags)(data.coords, data.radius)];
            case 3:
                newTags = _a.sent();
                return [4 /*yield*/, (0, appapi_1.getFrns)(data.coords, data.radius)];
            case 4:
                newFrns = _a.sent();
                return [4 /*yield*/, (0, appapi_1.getVegs)(data.coords, data.radius)];
            case 5:
                newVegs = _a.sent();
                return [2 /*return*/, {
                        buildings: newBuildings,
                        frns: newFrns,
                        tags: newTags,
                        vegs: newVegs
                    }];
            case 6:
                e_6 = _a.sent();
                console.log(e_6);
                return [3 /*break*/, 7];
            case 7: return [2 /*return*/, {
                    buildings: [],
                    frns: [],
                    tags: []
                }];
        }
    });
}); };
exports.getDataFromGeoLocation = getFn()
    .runWith({ memory: '1GB' })
    .https.onCall(getDataFromGeoLocation);
