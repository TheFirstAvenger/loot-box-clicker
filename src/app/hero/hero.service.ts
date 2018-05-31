import { Injectable } from '@angular/core';
import { IHero } from './hero';
import { EquipmentService } from '../equipment/equipment.service';
import { StorageService } from '../storage/storage.service';
import { CashService } from '../cash/cash.service';
import { TrainerService } from '../trainer/trainer.service';
import { ISkill, skillId } from '../trainer/skill';
import { ToastrService } from 'ngx-toastr';

@Injectable()
export class HeroService {

    hero: IHero;
    intervalId: number;

    constructor(
        private _storageService: StorageService,
        private _equipmentService: EquipmentService,
        private _cashService: CashService,
        private _trainerService: TrainerService,
        private _toasterService: ToastrService,
    ) {
        if (this._storageService.retrieve('hero')) {
            this.hero = this._storageService.retrieve('hero');
        } else {
            this.hero = { name: 'Nameless Adventurer', job: 'Demi-Druid', power: 1, criticalChance: 0.04, criticalPower: 5, fame: 0, gender: '' };
        }

        this._storageService.autoSaveNotification.subscribe((dummy) => {
            this._storageService.store('hero', this.hero);
        });

        this._storageService.resetNotification.subscribe((dummy) => {
            this.hero = { name: 'Nameless Adventurer', job: 'Demi-Druid', power: 1, criticalChance: 0.04, criticalPower: 5, fame: 0, gender: '' };
        });

        this.beginAutoAdventure();

        this.recalculatePower();
    }

    getHero(): IHero {
        return this.hero;
    }

    criticalPowerPerRank: number = 1 / 15;    // every 15 ranks gives you +1 critical hit power, starting at x5
    criticalChancePerRank: number = (0.01 / 15);   // every 15 ranks gives you 1% critical hit rate, which can explode,
    // starting at 4%

    recalculatePower() {
        this.hero.power = this._equipmentService.calculatePower();
        this.hero.criticalChance = 0.04 + (this._trainerService.getRanksForSkillById(skillId.critChance) *
            this.criticalChancePerRank);
        this.hero.criticalPower = 5 + (this._trainerService.getRanksForSkillById(skillId.critPower) *
            this.criticalPowerPerRank);

    }

    addKarma(fame: number) {
        this.hero.fame += fame;
    }

    purchaseTraining(skill: ISkill) {
        const cost: number = this._trainerService.getCostForSkill(skill);
        if (cost > this.hero.fame) {
            return;
        } else {
            this.hero.fame -= cost;
            this._trainerService.incrementSkill(skill);
            this.recalculatePower();
        }
    }

    beginAutoAdventure() {
        window.clearInterval(this.intervalId);
        this.intervalId = window.setInterval(() => {
            this.adventure();
        }
            , 1000);
    }

    adventure() {
        this._cashService.adventure(this.hero);
    }

    saveVanityOptions(name: string, job: string, gender: string) {
        this.hero.name = name;
        this.hero.job = job;
        this.hero.gender = gender;
    }

    donateCash() {
        if (this._cashService.allCash.length === 0) {
            return;
        }
        let cashIndex = 0;
        while (this._cashService.allCash[cashIndex] && this._cashService.allCash[cashIndex].quantity === 0) {
            cashIndex += 1;
        }
        if (this._cashService.allCash[cashIndex]) {
            const donateQuantity = this._cashService.allCash[cashIndex].quantity;
            const newKarma = Math.floor(donateQuantity / 1000);
            this.addKarma(newKarma);
            this._cashService.allCash[cashIndex].quantity -= donateQuantity;
            this._toasterService.success(`For donating <b>${donateQuantity} ${this._cashService.currencyNames[cashIndex]}</b>`,
                                        `Gained ${newKarma} karma`,
                                        {
                                            enableHtml: true,
                                            positionClass: 'toast-bottom-right',
                                        });
        }

    }
}
