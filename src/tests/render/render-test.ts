/**
 * Copyright (c) 2019 mol* contributors, licensed under MIT, See LICENSE file for more info.
 *
 * @author Alexander Rose <alexander.rose@weirdbyte.de>
 * @author Jesse Liang <jesse.liang@rcsb.org>
 */

//import * as argparse from 'argparse'
import pixelmatch = require('pixelmatch')
import createContext = require('gl')
import fs = require('fs')
import { PNG } from 'pngjs'
import { Canvas3D, Canvas3DParams } from '../../mol-canvas3d/canvas3d';
import InputObserver from '../../mol-util/input/input-observer';
import { ColorTheme } from '../../mol-theme/color';
import { SizeTheme } from '../../mol-theme/size';
import { CartoonRepresentationProvider } from '../../mol-repr/structure/representation/cartoon';
import { MolecularSurfaceRepresentationProvider } from '../../mol-repr/structure/representation/molecular-surface';
import { BallAndStickRepresentationProvider } from '../../mol-repr/structure/representation/ball-and-stick';
import { GaussianSurfaceRepresentationProvider } from '../../mol-repr/structure/representation/gaussian-surface';
import { CifFrame } from '../../mol-io/reader/cif'
import { trajectoryFromMmCIF } from '../../mol-model-formats/structure/mmcif';
import { Model, Structure } from '../../mol-model/structure';
import { ColorNames } from '../../mol-util/color/tables';
import { readCifFile } from '../../apps/structure-info/model';

let cifList = Array<string>(); // List of cif's to render and test
cifList = ['1crn']
const show = { // Which representations to show
    cartoon: true,
    ballAndStick: false,
    molecularSurface: false,
    gaussianSurface: false,
}

const width = 320
const height = 320
const IMAGE_PATH = 'images/'

const gl = createContext(width, height, {
    alpha: false,
    antialias: true,
    depth: true,
    preserveDrawingBuffer: true
})

const input = InputObserver.create()
const canvas3d = Canvas3D.create(gl, input, {
    multiSample: {
        mode: 'on',
        sampleLevel: 3
    },
    renderer: {
        ...Canvas3DParams.renderer.defaultValue,
        lightIntensity: 0,
        ambientIntensity: 1,
        backgroundColor: ColorNames.white
    },
    postprocessing: {
        ...Canvas3DParams.postprocessing.defaultValue,
        occlusionEnable: true,
        outlineEnable: true
    }
})
canvas3d.animate()

const reprCtx = {
    wegbl: canvas3d.webgl,
    colorThemeRegistry: ColorTheme.createRegistry(),
    sizeThemeRegistry: SizeTheme.createRegistry()
}
function getCartoonRepr() {
    return CartoonRepresentationProvider.factory(reprCtx, CartoonRepresentationProvider.getParams)
}

function getBallAndStickRepr() {
    return BallAndStickRepresentationProvider.factory(reprCtx, BallAndStickRepresentationProvider.getParams)
}

function getMolecularSurfaceRepr() {
    return MolecularSurfaceRepresentationProvider.factory(reprCtx, MolecularSurfaceRepresentationProvider.getParams)
}

function getGaussianSurfaceRepr() {
    return GaussianSurfaceRepresentationProvider.factory(reprCtx, GaussianSurfaceRepresentationProvider.getParams)
}

async function getModels(frame: CifFrame) {
    return await trajectoryFromMmCIF(frame).run();
}

async function getStructure(model: Model) {
    return Structure.ofModel(model);
}

function runTests() {
    cifList.forEach(async function(id) {
        try {
            const cif = await readCifFile('../../../examples/' + id + '.cif') // Similar to render-structure, but accesses local cif
            const models = await getModels(cif as CifFrame)
            const structure = await getStructure(models[0])
    
            const cartoonRepr = getCartoonRepr()
            const ballAndStickRepr = getBallAndStickRepr()
            const molecularSurfaceRepr = getMolecularSurfaceRepr()
            const gaussianSurfaceRepr = getGaussianSurfaceRepr()
        
            if (show.cartoon) {
                cartoonRepr.setTheme({
                    color: reprCtx.colorThemeRegistry.create('sequence-id', { structure }),
                    size: reprCtx.sizeThemeRegistry.create('uniform', { structure })
                })
                await cartoonRepr.createOrUpdate({ ...CartoonRepresentationProvider.defaultValues, quality: 'auto' }, structure).run()
            }
        
            if (show.ballAndStick) {
                ballAndStickRepr.setTheme({
                    color: reprCtx.colorThemeRegistry.create('sequence-id', { structure }),
                    size: reprCtx.sizeThemeRegistry.create('uniform', { structure })
                })
                await ballAndStickRepr.createOrUpdate({ ...BallAndStickRepresentationProvider.defaultValues, quality: 'auto' }, structure).run()
            }
        
            if (show.molecularSurface) {
                molecularSurfaceRepr.setTheme({
                    color: reprCtx.colorThemeRegistry.create('sequence-id', { structure }),
                    size: reprCtx.sizeThemeRegistry.create('uniform', { structure })
                })
                console.time('molecular surface')
                await molecularSurfaceRepr.createOrUpdate({ ...MolecularSurfaceRepresentationProvider.defaultValues, quality: 'custom', alpha: 0.5, flatShaded: true, doubleSided: true, resolution: 0.3 }, structure).run()
                console.timeEnd('molecular surface')
            }
        
            if (show.gaussianSurface) {
                gaussianSurfaceRepr.setTheme({
                    color: reprCtx.colorThemeRegistry.create('sequence-id', { structure }),
                    size: reprCtx.sizeThemeRegistry.create('uniform', { structure })
                })
                console.time('gaussian surface')
                await gaussianSurfaceRepr.createOrUpdate({ ...GaussianSurfaceRepresentationProvider.defaultValues, quality: 'custom', alpha: 1.0, flatShaded: true, doubleSided: true, resolution: 0.3 }, structure).run()
                console.timeEnd('gaussian surface')
            }
        
            if (show.cartoon) canvas3d.add(cartoonRepr)
            if (show.ballAndStick) canvas3d.add(ballAndStickRepr)
            if (show.molecularSurface) canvas3d.add(molecularSurfaceRepr)
            if (show.gaussianSurface) canvas3d.add(gaussianSurfaceRepr)
            canvas3d.resetCamera()
        } catch (e) {
            console.error(e)
            process.exit(1)
        }
    
        setTimeout(() => {
            process.stdout.write('Testing render of ' + id + ': ');
            const pixelData = canvas3d.getPixelData('color')
            const generatedPng = new PNG({ width, height })
            generatedPng.data = Buffer.from(pixelData.array)
            let numDiffPx = 1;
            try {
                const baselinePng = PNG.sync.read(fs.readFileSync(IMAGE_PATH + 'baseline' + id + '.png'))
                const diff = new PNG({width, height})
                numDiffPx = pixelmatch(baselinePng.data, generatedPng.data, diff.data, baselinePng.width, baselinePng.height,
                    {threshold: 0})
                fs.writeFileSync(IMAGE_PATH + 'differences.png', PNG.sync.write(diff));
            } catch (e) {
                console.log('\x1b[31m%s\x1b[0m', 'FAILED');
            }
            
            if (numDiffPx > 0) {
                console.log('\x1b[31m%s\x1b[0m', 'FAILED');
            } else {
                console.log('\x1b[32m%s\x1b[0m', 'PASSED');
            }
    
            generatedPng.pack().pipe(fs.createWriteStream(IMAGE_PATH + 'output' + id + '.png')).on('finish', () => {
                process.exit()
            })
        }, 500)
    })
}

// TODO: implement argparse
// const parser = new argparse.ArgumentParser({
//     addHelp: true,
//     description: 'render image as PNG (work in progress)'
// });
// parser.addArgument([ 'id' ], {
//     help: 'PDB ID'
// });
// parser.addArgument([ 'out' ], {
//     help: 'image output path'
// });

// interface Args {
//     id: string
//     out: string
// }
// const args: Args = parser.parseArgs();

runTests()