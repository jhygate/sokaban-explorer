export class LevelManager {
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

    getLevels() {
        const stored = localStorage.getItem(this.storageKey);
        const levels = stored ? JSON.parse(stored) : {};
        if (Object.keys(levels).length === 0) {
            levels['Default Level'] = this.defaultLevel;
            this.saveLevels(levels);
        }
        return levels;
    }

    saveLevels(levels) {
        localStorage.setItem(this.storageKey, JSON.stringify(levels));
    }

    saveLevel(name, levelString) {
        const levels = this.getLevels();
        levels[name] = levelString;
        this.saveLevels(levels);
    }

    deleteLevel(name) {
        const levels = this.getLevels();
        delete levels[name];
        this.saveLevels(levels);
    }

    getLevel(name) {
        const levels = this.getLevels();
        return levels[name];
    }
}
