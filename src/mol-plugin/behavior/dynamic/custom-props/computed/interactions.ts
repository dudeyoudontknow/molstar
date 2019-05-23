/**
 * Copyright (c) 2019 mol* contributors, licensed under MIT, See LICENSE file for more info.
 *
 * @author Alexander Rose <alexander.rose@weirdbyte.de>
 */

import { ParamDefinition as PD } from 'mol-util/param-definition';
import { PluginBehavior } from '../../../behavior';
import { CustomPropertyRegistry } from 'mol-model-props/common/custom-property-registry';
import { ComputedInteractions } from 'mol-model-props/computed/interactions';
import { InteractionsRepresentationProvider } from 'mol-model-props/computed/representations/interactions';
import { InteractionTypeColorThemeProvider } from 'mol-model-props/computed/themes/interaction-type';

export const MolstarInteractions = PluginBehavior.create<{ autoAttach: boolean }>({
    name: 'molstar-computed-interactions-prop',
    category: 'custom-props',
    display: { name: 'Non-covalent interactions' },
    ctor: class extends PluginBehavior.Handler<{ autoAttach: boolean }> {
        private attach = ComputedInteractions.createAttachTask();

        private provider: CustomPropertyRegistry.StructureProvider = {
            option: [ComputedInteractions.Descriptor.name, 'Computed Interactions'],
            descriptor: ComputedInteractions.Descriptor,
            defaultSelected: this.params.autoAttach,
            attachableTo: () => true,
            attach: this.attach
        }

        register(): void {
            this.ctx.customStructureProperties.register(this.provider);
            // TODO labels
            // this.ctx.lociLabels.addProvider(labelAssemblySymmetryAxes);
            this.ctx.structureRepresentation.themeCtx.colorThemeRegistry.add('computed-interaction-type', InteractionTypeColorThemeProvider)
            this.ctx.structureRepresentation.registry.add('computed-interactions', InteractionsRepresentationProvider)
        }

        update(p: { autoAttach: boolean }) {
            let updated = this.params.autoAttach !== p.autoAttach
            this.params.autoAttach = p.autoAttach;
            this.provider.defaultSelected = p.autoAttach;
            return updated;
        }

        unregister() {
            this.ctx.customStructureProperties.unregister(ComputedInteractions.Descriptor.name);
        }
    },
    params: () => ({
        autoAttach: PD.Boolean(false)
    })
});