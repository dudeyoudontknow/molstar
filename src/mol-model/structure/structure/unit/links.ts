/**
 * Copyright (c) 2017-2019 mol* contributors, licensed under MIT, See LICENSE file for more info.
 *
 * @author David Sehnal <david.sehnal@gmail.com>
 * @author Alexander Rose <alexander.rose@weirdbyte.de>
 */

import { Iterator } from 'mol-data/int'
import { Unit, StructureElement } from '../../structure'
import Structure from '../structure';
import { LinkType } from '../../model/types';

export * from './links/data'
export * from './links/intra-compute'
export * from './links/inter-compute'

namespace Link {
    export interface Location<U extends Unit = Unit> {
        readonly kind: 'link-location',
        aUnit: U,
        /** Index into aUnit.elements */
        aIndex: StructureElement.UnitIndex,
        bUnit: U,
        /** Index into bUnit.elements */
        bIndex: StructureElement.UnitIndex,
    }

    export function Location(aUnit?: Unit, aIndex?: StructureElement.UnitIndex, bUnit?: Unit, bIndex?: StructureElement.UnitIndex): Location {
        return { kind: 'link-location', aUnit: aUnit as any, aIndex: aIndex as any, bUnit: bUnit as any, bIndex: bIndex as any };
    }

    export function isLocation(x: any): x is Location {
        return !!x && x.kind === 'link-location';
    }

    export function areLocationsEqual(locA: Location, locB: Location) {
        return (
            locA.aIndex === locB.aIndex && locA.bIndex === locB.bIndex &&
            locA.aUnit.id === locB.aUnit.id && locA.bUnit.id === locB.bUnit.id
        )
    }

    export interface Loci {
        readonly kind: 'link-loci',
        readonly structure: Structure
        readonly links: ReadonlyArray<Location>
    }

    export function Loci(structure: Structure, links: ArrayLike<Location>): Loci {
        return { kind: 'link-loci', structure, links: links as Loci['links'] };
    }

    export function isLoci(x: any): x is Loci {
        return !!x && x.kind === 'link-loci';
    }

    export function areLociEqual(a: Loci, b: Loci) {
        if (a.links.length !== b.links.length) return false
        for (let i = 0, il = a.links.length; i < il; ++i) {
            if (!areLocationsEqual(a.links[i], b.links[i])) return false
        }
        return true
    }

    export function getType(structure: Structure, link: Location<Unit.Atomic>): LinkType {
        if (link.aUnit === link.bUnit) {
            const links = link.aUnit.links;
            const idx = links.getEdgeIndex(link.aIndex, link.bIndex);
            if (idx < 0) return LinkType.create(LinkType.Flag.None);
            return LinkType.create(links.edgeProps.flags[idx]);
        } else {
            const bond = structure.interUnitLinks.getBondFromLocation(link);
            if (bond) return LinkType.create(bond.flag);
            return LinkType.create(LinkType.Flag.None);
        }
    }

    export function getOrder(structure: Structure, link: Location<Unit.Atomic>): number {
        if (link.aUnit === link.bUnit) {
            const links = link.aUnit.links;
            const idx = links.getEdgeIndex(link.aIndex, link.bIndex);
            if (idx < 0) return 0;
            return links.edgeProps.order[idx];
        } else {
            const bond = structure.interUnitLinks.getBondFromLocation(link);
            if (bond) return bond.order;
            return 0;
        }
    }

    export function getIntraUnitLinkCount(structure: Structure) {
        let count = 0
        for (let i = 0, il = structure.units.length; i < il; ++i) {
            const u = structure.units[i]
            if (Unit.isAtomic(u)) count += u.links.edgeCount / 2 // only count one direction
        }
        return count
    }

    export interface ElementLinkData {
        otherUnit: Unit.Atomic
        otherIndex: StructureElement.UnitIndex
        type: LinkType
        order: number
    }

    export class ElementLinkIterator implements Iterator<ElementLinkData> {
        private current: ElementLinkData = {} as any

        private structure: Structure
        private unit: Unit.Atomic
        private index: StructureElement.UnitIndex

        private interBondIndices: ReadonlyArray<number>
        private interBondCount: number
        private interBondIndex: number

        private intraBondEnd: number
        private intraBondIndex: number

        hasNext: boolean;
        move(): ElementLinkData {
            this.advance()
            return this.current
        }

        setElement(structure: Structure, unit: Unit.Atomic, index: StructureElement.UnitIndex) {
            this.structure = structure
            this.unit = unit
            this.index = index

            this.interBondIndices = structure.interUnitLinks.getBondIndices(index, unit)
            this.interBondCount = this.interBondIndices.length
            this.interBondIndex = 0

            this.intraBondEnd = unit.links.offset[index + 1]
            this.intraBondIndex = unit.links.offset[index]
        }

        private advance() {
            if (this.intraBondIndex < this.intraBondEnd) {
                this.current.otherUnit = this.unit
                this.current.otherIndex = this.unit.links.b[this.intraBondIndex] as StructureElement.UnitIndex
                this.current.type = this.unit.links.edgeProps.flags[this.intraBondIndex]
                this.current.order = this.unit.links.edgeProps.order[this.intraBondIndex]
                this.intraBondIndex += 1
            } else if (this.interBondIndex < this.interBondCount) {
                const b = this.structure.interUnitLinks.bonds[this.interBondIndex]
                this.current.otherUnit = b.unitA !== this.unit ? b.unitA : b.unitB
                this.current.otherIndex = b.indexA !== this.index ? b.indexA : b.indexB
                this.current.type = b.flag
                this.current.order = b.order
                this.interBondIndex += 1
            } else {
                this.hasNext = false
                return
            }
            this.hasNext = this.interBondIndex < this.interBondCount || this.intraBondIndex < this.intraBondEnd
        }

        constructor() {
            this.hasNext = false
        }
    }
}

export { Link }