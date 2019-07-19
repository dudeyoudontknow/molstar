/**
 * Copyright (c) 2019 mol* contributors, licensed under MIT, See LICENSE file for more info.
 *
 * @author Alexander Rose <alexander.rose@weirdbyte.de>
 */

import fs = require('fs')
import { PNG } from 'pngjs'
import createContext = require('gl')
import { Canvas3D, Canvas3DParams } from '../../mol-canvas3d/canvas3d';
import InputObserver from '../../mol-util/input/input-observer';
import { ColorNames } from '../../mol-util/color/tables';
import { CIF, CifFrame, CifSafeFrame } from '../../mol-io/reader/cif'
import { Model, Structure } from '../../mol-model/structure';
import { ColorTheme } from '../../mol-theme/color';
import { SizeTheme } from '../../mol-theme/size';
import { CartoonRepresentationProvider } from '../../mol-repr/structure/representation/cartoon';
import { trajectoryFromMmCIF } from '../../mol-model-formats/structure/mmcif';
import { ComputedSecondaryStructure } from '../../mol-model-props/computed/secondary-structure';

const width = 2048
const height = 1536
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


async function getModels(frame: CifFrame) {
    return await trajectoryFromMmCIF(frame).run();
}

async function getStructure(model: Model) {
    return Structure.ofModel(model);
}

const reprCtx = {
    colorThemeRegistry: ColorTheme.createRegistry(),
    sizeThemeRegistry: SizeTheme.createRegistry()
}
function getCartoonRepr() {
    return CartoonRepresentationProvider.factory(reprCtx, CartoonRepresentationProvider.getParams)
}

async function init() {
    fs.readFile(`../../../examples/1crn.cif`, async function(err, data) {
        if (err) throw err
        try {
            const comp = CIF.parse(data);
            const parsed = await comp.run();
            if (parsed.isError) throw parsed; //  <<========= Error occurs
            const cif = parsed.result.blocks[0]
            const models = await getModels(cif as CifFrame);
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
    });

    // canvas3d.setProps({ trackball: { ...canvas3d.props.trackball, spin: true } })

    setTimeout(() => {
        const pixelData = canvas3d.getPixelData('color')
        const png = new PNG({ width, height })
        png.data = Buffer.from(pixelData.array)
        png.pack().pipe(fs.createWriteStream('output.png')).on('finish', () => {
            process.exit()
        })
    }, 500)
}

init()