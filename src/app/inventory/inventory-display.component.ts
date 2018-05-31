import { Component, OnInit } from '@angular/core';
import { InventoryService } from './inventory.service';
import { equipmentSlot, IEquipmentItem, equipmentType } from '../equipment/equipment-item';
import { EquipmentService } from '../equipment/equipment.service';
import { HeroService } from '../hero/hero.service';
import { RarityToColorPipe } from '../shared/rarity-to-color.pipe';
import { UpgradeStatusToColorPipe } from './upgrade-status-to-color.pipe';

@Component({
    selector: 'inventory-display',
    templateUrl: './inventory-display.component.html',
    styleUrls: ['./inventory-display.component.css']
})
export class InventoryDisplayComponent implements OnInit {

    constructor(private _inventoryService: InventoryService, private _equipmentService: EquipmentService,
        private _heroService: HeroService) { }

    ngOnInit() {
    }

    getInventory(): IEquipmentItem[] {
        return this._inventoryService.getInventory();
    }

    getSlotNameForItem(item: IEquipmentItem): string {
        if (item.type === equipmentType.art) {
            return 'Art';
        } else if (item.type === equipmentType.trophy) {
            return 'Trophy';
        } else if (item.type === equipmentType.equippable) {
            return this._equipmentService.getSlotName(item.slot);
        } else {
            return 'Unknown';
        }
    }

    getPowerOrValueForItem(item: IEquipmentItem): number {
        if (item.type === equipmentType.equippable) {
            return item.power;
        } else {
            return item.value;
        }
    }

    getUpgradeStatusForItem(item: IEquipmentItem): string {
        if (item.type !== equipmentType.equippable) {
            return 'Unequippable';
        }
        const existingEquipment: IEquipmentItem = this._equipmentService.getHeroEquipment()[item.slot];
            if (existingEquipment == null) {
                return 'Upgrade';
            }
            if (item.power < existingEquipment.power) {
                return 'Downgrade';
            } else if (item.power === existingEquipment.power) {
                return 'Sidegrade';
            } else if (item.power > existingEquipment.power) {
                return 'Upgrade';
            }
            return 'Unknown';
        }

    equip(item: IEquipmentItem) {
        if (item.type !== equipmentType.equippable) {
            return;
        }
        const oldItem = this._equipmentService.equip(item);
        this._inventoryService.removeFromInventory(item);
        if (oldItem != null) {
            this._inventoryService.addToInventory(oldItem);
        }
        this._heroService.recalculatePower();
    }

    sortBySlot() {
        this._inventoryService.sortBySlot();
    }

    sortByPower() {
        this._inventoryService.sortByPower();
    }

    donate(item: IEquipmentItem) {
        this._inventoryService.removeFromInventory(item);
        this._heroService.addKarma(item.value);
    }

    donateAll() {
        while (this._inventoryService.getInventory().length > 0) {
            this._inventoryService.getInventory().forEach(item => { this.donate(item); });
        }
    }
}
