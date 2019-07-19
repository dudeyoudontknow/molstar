"use strict";
/**
 * Copyright (c) 2019 mol* contributors, licensed under MIT, See LICENSE file for more info.
 *
 * @author Alexander Rose <alexander.rose@weirdbyte.de>
 */
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
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
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
Object.defineProperty(exports, "__esModule", { value: true });
var fs = require("fs");
var util_1 = require("util");
var pngjs_1 = require("pngjs");
var createContext = require("gl");
var canvas3d_1 = require("../../mol-canvas3d/canvas3d");
var input_observer_1 = require("../../mol-util/input/input-observer");
var tables_1 = require("../../mol-util/color/tables");
var cif_1 = require("../../mol-io/reader/cif");
var structure_1 = require("../../mol-model/structure");
var color_1 = require("../../mol-theme/color");
var size_1 = require("../../mol-theme/size");
var cartoon_1 = require("../../mol-repr/structure/representation/cartoon");
var mmcif_1 = require("../../mol-model-formats/structure/mmcif");
var width = 2048;
var height = 1536;
var gl = createContext(width, height, {
    alpha: false,
    antialias: true,
    depth: true,
    preserveDrawingBuffer: true
});
var input = input_observer_1.default.create();
var canvas3d = canvas3d_1.Canvas3D.create(gl, input, {
    multiSample: {
        mode: 'on',
        sampleLevel: 3
    },
    renderer: __assign({}, canvas3d_1.Canvas3DParams.renderer.defaultValue, { lightIntensity: 0, ambientIntensity: 1, backgroundColor: tables_1.ColorNames.white }),
    postprocessing: __assign({}, canvas3d_1.Canvas3DParams.postprocessing.defaultValue, { occlusionEnable: true, outlineEnable: true })
});
canvas3d.animate();
function parseCif(data) {
    return __awaiter(this, void 0, void 0, function () {
        var comp, parsed;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    comp = cif_1.CIF.parse(data);
                    return [4 /*yield*/, comp.run()];
                case 1:
                    parsed = _a.sent();
                    if (parsed.isError)
                        throw parsed;
                    return [2 /*return*/, parsed.result];
            }
        });
    });
}
function downloadCif(url, isBinary) {
    return __awaiter(this, void 0, void 0, function () {
        var data, _a, _b, _c;
        return __generator(this, function (_d) {
            switch (_d.label) {
                case 0: return [4 /*yield*/, fetch(url)];
                case 1:
                    data = _d.sent();
                    _a = parseCif;
                    if (!isBinary) return [3 /*break*/, 3];
                    _c = Uint8Array.bind;
                    return [4 /*yield*/, data.arrayBuffer()];
                case 2:
                    _b = new (_c.apply(Uint8Array, [void 0, _d.sent()]))();
                    return [3 /*break*/, 5];
                case 3: return [4 /*yield*/, data.text()];
                case 4:
                    _b = _d.sent();
                    _d.label = 5;
                case 5: return [2 /*return*/, _a.apply(void 0, [_b])];
            }
        });
    });
}
function downloadFromPdb(pdb) {
    return __awaiter(this, void 0, void 0, function () {
        var parsed;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, downloadCif("https://webchem.ncbr.muni.cz/ModelServer/static/bcif/" + pdb, true)];
                case 1:
                    parsed = _a.sent();
                    return [2 /*return*/, parsed.blocks[0]];
            }
        });
    });
}
function getModels(frame) {
    return __awaiter(this, void 0, void 0, function () {
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, mmcif_1.trajectoryFromMmCIF(frame).run()];
                case 1: return [2 /*return*/, _a.sent()];
            }
        });
    });
}
function getStructure(model) {
    return __awaiter(this, void 0, void 0, function () {
        return __generator(this, function (_a) {
            return [2 /*return*/, structure_1.Structure.ofModel(model)];
        });
    });
}
var reprCtx = {
    colorThemeRegistry: color_1.ColorTheme.createRegistry(),
    sizeThemeRegistry: size_1.SizeTheme.createRegistry()
};
function getCartoonRepr() {
    return cartoon_1.CartoonRepresentationProvider.factory(reprCtx, cartoon_1.CartoonRepresentationProvider.getParams);
}
function init() {
    return __awaiter(this, void 0, void 0, function () {
        return __generator(this, function (_a) {
            fs.readFile("../../../examples/1crn.cif", 'utf8', function (err, data) {
                return __awaiter(this, void 0, void 0, function () {
                    var dataArray, parsed, _a, _b, _c, cif, models, structure, cartoonRepr, e_1;
                    return __generator(this, function (_d) {
                        switch (_d.label) {
                            case 0:
                                if (err)
                                    throw err;
                                _d.label = 1;
                            case 1:
                                _d.trys.push([1, 10, , 11]);
                                dataArray = new util_1.TextEncoder().encode(data);
                                _a = parseCif;
                                if (!true) return [3 /*break*/, 3];
                                _c = Uint8Array.bind;
                                return [4 /*yield*/, dataArray];
                            case 2:
                                _b = new (_c.apply(Uint8Array, [void 0, _d.sent()]))();
                                return [3 /*break*/, 5];
                            case 3: return [4 /*yield*/, data];
                            case 4:
                                _b = _d.sent();
                                _d.label = 5;
                            case 5: return [4 /*yield*/, _a.apply(void 0, [_b])];
                            case 6:
                                parsed = _d.sent();
                                cif = parsed.blocks[0];
                                return [4 /*yield*/, getModels(cif)];
                            case 7:
                                models = _d.sent();
                                return [4 /*yield*/, getStructure(models[0])];
                            case 8:
                                structure = _d.sent();
                                cartoonRepr = getCartoonRepr();
                                cartoonRepr.setTheme({
                                    color: reprCtx.colorThemeRegistry.create('sequence-id', { structure: structure }),
                                    size: reprCtx.sizeThemeRegistry.create('uniform', { structure: structure })
                                });
                                return [4 /*yield*/, cartoonRepr.createOrUpdate(__assign({}, cartoon_1.CartoonRepresentationProvider.defaultValues, { quality: 'auto' }), structure).run()];
                            case 9:
                                _d.sent();
                                canvas3d.add(cartoonRepr);
                                canvas3d.resetCamera();
                                return [3 /*break*/, 11];
                            case 10:
                                e_1 = _d.sent();
                                console.error(e_1);
                                process.exit(1);
                                return [3 /*break*/, 11];
                            case 11: return [2 /*return*/];
                        }
                    });
                });
            });
            setTimeout(function () {
                var pixelData = canvas3d.getPixelData('color');
                var png = new pngjs_1.PNG({ width: width, height: height });
                png.data = Buffer.from(pixelData.array);
                png.pack().pipe(fs.createWriteStream('output.png')).on('finish', function () {
                    process.exit();
                });
            }, 500);
            return [2 /*return*/];
        });
    });
}
init();
