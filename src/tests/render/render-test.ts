/**
 * Copyright (c) 2019 mol* contributors, licensed under MIT, See LICENSE file for more info.
 *
 * @author Alexander Rose <alexander.rose@weirdbyte.de>
 */

import * as argparse from 'argparse'
import createContext = require('gl')
import fs = require('fs')
import { PNG } from 'pngjs'
import { Canvas3D, Canvas3DParams } from '../../mol-canvas3d/canvas3d';
import InputObserver from '../../mol-util/input/input-observer';
import { ColorTheme } from '../../mol-theme/color';
import { SizeTheme } from '../../mol-theme/size';
import { CartoonRepresentationProvider } from '../../mol-repr/structure/representation/cartoon';
import { CifFrame } from '../../mol-io/reader/cif'
import { trajectoryFromMmCIF } from '../../mol-model-formats/structure/mmcif';
import { Model, Structure } from '../../mol-model/structure';
import { ColorNames } from '../../mol-util/color/tables';
import { readCifFile } from '../../apps/structure-info/model';

const width = 320
const height = 320
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

async function getModels(frame: CifFrame) {
    return await trajectoryFromMmCIF(frame).run();
}

async function getStructure(model: Model) {
    return Structure.ofModel(model);
}

async function run() {
    try {
        const cif = await readCifFile('../../../examples/1crn.cif')
        const models = await getModels(cif as CifFrame)
        const structure = await getStructure(models[0])

        const cartoonRepr = getCartoonRepr()
        cartoonRepr.setTheme({
            color: reprCtx.colorThemeRegistry.create('sequence-id', { structure }),
            size: reprCtx.sizeThemeRegistry.create('uniform', { structure })
        })
        await cartoonRepr.createOrUpdate({ ...CartoonRepresentationProvider.defaultValues, quality: 'auto' }, structure).run()

        canvas3d.add(cartoonRepr)
        canvas3d.resetCamera()
    } catch (e) {
        console.error(e)
        process.exit(1)
    }

    setTimeout(() => {
        const pixelData = canvas3d.getPixelData('color')
        const png = new PNG({ width, height })
        png.data = Buffer.from(pixelData.array)
        png.pack().pipe(fs.createWriteStream('output2.png')).on('finish', () => {
            process.exit()
        })
    }, 500)
}

//

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

run()