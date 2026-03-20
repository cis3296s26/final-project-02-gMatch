import WeightedHybridStrategy from "./strategies/WeightedHybridStrategy";
import AvailabilityOnlyStrategy from "./strategies/AvailabilityOnlyStrategy";
import SkillBalancedStrategy from "./strategies/SkillBalancedStrategy";

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

export default StrategyFactory;