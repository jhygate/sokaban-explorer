import { LevelMap } from '../types';

export class LevelManager {
    storageKey: string;
    defaultLevel: string;

    constructor() {
        this.storageKey = 'sokoban_levels';
        this.defaultLevel = `
  #####
###   #
#.@$  #
### $.#
#.##$ #
# # . ##
#$ *$  #
#   .  #
########
`.trim();
    }

    getLevels(): LevelMap {
        const stored = localStorage.getItem(this.storageKey);
        const levels: LevelMap = stored ? JSON.parse(stored) : {};
        if (Object.keys(levels).length === 0) {
            levels['Default Level'] = this.defaultLevel;
            this.saveLevels(levels);
        }
        return levels;
    }

    saveLevels(levels: LevelMap): void {
        localStorage.setItem(this.storageKey, JSON.stringify(levels));
    }

    saveLevel(name: string, levelString: string): void {
        const levels = this.getLevels();
        levels[name] = levelString;
        this.saveLevels(levels);
    }

    deleteLevel(name: string): void {
        const levels = this.getLevels();
        delete levels[name];
        this.saveLevels(levels);
    }

    getLevel(name: string): string | undefined {
        const levels = this.getLevels();
        return levels[name];
    }
}
