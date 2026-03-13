const WeightedHybridStrategy = require("./strategies/WeightedHybridStrategy");
const AvailabilityOnlyStrategy = require("./strategies/AvailabilityOnlyStrategy");
const SkillBalancedStrategy = require("./strategies/SkillBalancedStrategy");

class StrategyFactory {
  static create(name) {
    switch (name) {
      case "AvailabilityOnlyStrategy":
        return new AvailabilityOnlyStrategy();
      case "SkillBalancedStrategy":
        return new SkillBalancedStrategy();
      default:
        return new WeightedHybridStrategy();
    }
  }
}

module.exports = StrategyFactory;
