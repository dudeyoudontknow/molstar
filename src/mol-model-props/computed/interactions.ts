/**
 * Copyright (c) 2019 mol* contributors, licensed under MIT, See LICENSE file for more info.
 *
 * @author Alexander Rose <alexander.rose@weirdbyte.de>
 */

import { CustomPropertyDescriptor, Structure } from 'mol-model/structure';
import { Task } from 'mol-task';
import { idFactory } from 'mol-util/id-factory';
import { InteractionsProps, calcInteractions, Interactions } from './interactions/interactions';

const nextInteractionsId = idFactory()

export namespace ComputedInteractions {
    export type Property = {
        id: number
        map: Map<number, Interactions>
    }

    export function get(structure: Structure): Property | undefined {
        return structure.inheritedPropertyData.__ComputedInteractions__;
    }
    function set(structure: Structure, prop: Property) {
        (structure.inheritedPropertyData.__ComputedInteractions__ as Property) = prop;
    }

    export function createAttachTask(params: Partial<InteractionsProps> = {}) {
        return (structure: Structure) => Task.create('Compute Interactions', async ctx => {
            if (get(structure)) return true;
            return await attachFromCifOrCompute(structure, params)
        });
    }

    export const Descriptor = CustomPropertyDescriptor({
        isStatic: true,
        name: 'molstar_computed_interactions',
        // TODO `cifExport` and `symbol`
    });

    export async function attachFromCifOrCompute(structure: Structure, params: Partial<InteractionsProps> = {}) {
        if (structure.customPropertyDescriptors.has(Descriptor)) return true;

        const interactions = await computeInteractions(structure, params)

        structure.customPropertyDescriptors.add(Descriptor);
        set(structure, interactions);
        return true;
    }
}

export async function computeInteractions(structure: Structure, props: Partial<InteractionsProps>) {
    return { id: nextInteractionsId(), map: await calcInteractions(structure, props) }
}