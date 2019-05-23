/**
 * Copyright (c) 2019 mol* contributors, licensed under MIT, See LICENSE file for more info.
 *
 * @author Alexander Rose <alexander.rose@weirdbyte.de>
 */

import { ParamDefinition as PD } from 'mol-util/param-definition';
import { Representation, RepresentationParamsGetter, RepresentationContext } from 'mol-repr/representation';
import { ThemeRegistryContext } from 'mol-theme/theme';
import { Structure } from 'mol-model/structure';
import { UnitsRepresentation, StructureRepresentation, StructureRepresentationStateBuilder, StructureRepresentationProvider } from 'mol-repr/structure/representation';
import { InteractionsIntraUnitParams, InteractionsIntraUnitVisual } from './interactions-intra-unit-cylinder';
import { UnitKindOptions, UnitKind } from 'mol-repr/structure/visual/util/common';
import { ComputedInteractions } from '../interactions';

const InteractionsVisuals = {
    'intra-unit': (ctx: RepresentationContext, getParams: RepresentationParamsGetter<Structure, InteractionsIntraUnitParams>) => UnitsRepresentation('Intra-unit interactions cylinder', ctx, getParams, InteractionsIntraUnitVisual),
}
type InteractionVisualName = keyof typeof InteractionsVisuals
const InteractionVisualOptions = Object.keys(InteractionsVisuals).map(name => [name, name] as [InteractionVisualName, string])

export const InteractionsParams = {
    ...InteractionsIntraUnitParams,
    unitKinds: PD.MultiSelect<UnitKind>(['atomic'], UnitKindOptions),
    sizeFactor: PD.Numeric(0.3, { min: 0.01, max: 10, step: 0.01 }),
    sizeAspectRatio: PD.Numeric(2/3, { min: 0.01, max: 3, step: 0.01 }),
    visuals: PD.MultiSelect<InteractionVisualName>(['intra-unit'], InteractionVisualOptions),
}
export type InteractionsParams = typeof InteractionsParams
export function getInteractionParams(ctx: ThemeRegistryContext, structure: Structure) {
    return PD.clone(InteractionsParams)
}

export type InteractionRepresentation = StructureRepresentation<InteractionsParams>
export function InteractionRepresentation(ctx: RepresentationContext, getParams: RepresentationParamsGetter<Structure, InteractionsParams>): InteractionRepresentation {
    return Representation.createMulti('Interactions', ctx, getParams, StructureRepresentationStateBuilder, InteractionsVisuals as unknown as Representation.Def<Structure, InteractionsParams>)
}

export const InteractionsRepresentationProvider: StructureRepresentationProvider<InteractionsParams> = {
    label: 'Non-covalent Interactions',
    description: 'Displays non-covalent interactions as dashed cylinders.',
    factory: InteractionRepresentation,
    getParams: getInteractionParams,
    defaultValues: PD.getDefaultValues(InteractionsParams),
    defaultColorTheme: 'interaction-type',
    defaultSizeTheme: 'uniform',
    isApplicable: (data: Structure) => !!ComputedInteractions.get(data)
}