/**
 * Copyright (c) 2019 mol* contributors, licensed under MIT, See LICENSE file for more info.
 *
 * @author Alexander Rose <alexander.rose@weirdbyte.de>
 */

import { CustomPropertyDescriptor, Structure } from 'mol-model/structure';
import { Task } from 'mol-task';
import { idFactory } from 'mol-util/id-factory';
import { ValenceModelProps, calcValenceModel, ValenceModel } from './chemistry/valence-model';

const nextValenceModelId = idFactory()

export namespace ComputedValenceModel {
    export type Property = {
        id: number
        map: Map<number, ValenceModel>
    }

    export function get(structure: Structure): Property | undefined {
        return structure.inheritedPropertyData.__ComputedValenceModel__;
    }
    function set(structure: Structure, prop: Property) {
        (structure.inheritedPropertyData.__ComputedValenceModel__ as Property) = prop;
    }

    export function createAttachTask(params: Partial<ValenceModelProps> = {}) {
        return (structure: Structure) => Task.create('Compute Valence Model', async ctx => {
            if (get(structure)) return true;
            return await attachFromCifOrCompute(structure, params)
        });
    }

    export const Descriptor = CustomPropertyDescriptor({
        isStatic: true,
        name: 'molstar_computed_valence_model',
        // TODO `cifExport` and `symbol`
    });

    export async function attachFromCifOrCompute(structure: Structure, params: Partial<ValenceModelProps> = {}) {
        if (structure.customPropertyDescriptors.has(Descriptor)) return true;

        const valenceModel = await computeValenceModel(structure, params)

        structure.customPropertyDescriptors.add(Descriptor);
        set(structure, valenceModel);
        return true;
    }
}

export function computeValenceModel(structure: Structure, props: Partial<ValenceModelProps>) {
    return { id: nextValenceModelId(), map: calcValenceModel(structure, props) }
}