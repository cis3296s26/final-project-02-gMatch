/**
 * WeightedHybridStrategy
 * Balances availability overlap (weight 2) and skill diversity (weight 1).
 * Anchors on the highest-scoring student, then greedily adds members by
 * combined overlap + skill diversity score.
 */
class WeightedHybridStrategy {
  generate(students, teamSize) {
    if (students.length === 0) return [];

    const pool = [...students].sort((a, b) => this.score(b) - this.score(a));

    const teams = [];
    const assigned = new Set();

    for (let i = 0; i < pool.length; i++) {
      if (assigned.has(i)) continue;

      const team = [pool[i]];
      assigned.add(i);

      while (team.length < teamSize) {
        let bestIdx = -1;
        let bestScore = -Infinity;

        const teamSlots = new Set(team.flatMap((s) => s.availability));
        const teamSkills = new Set(team.flatMap((s) => s.skills));

        for (let j = 0; j < pool.length; j++) {
          if (assigned.has(j)) continue;
          const candidate = pool[j];

          const availOverlap =
            candidate.availability.filter((s) => teamSlots.has(s)).length * 2;
          const newSkills = candidate.skills.filter((sk) => !teamSkills.has(sk)).length;
          const combined = availOverlap + newSkills;

          if (combined > bestScore) {
            bestScore = combined;
            bestIdx = j;
          }
        }

        if (bestIdx === -1) break;
        team.push(pool[bestIdx]);
        assigned.add(bestIdx);
      }

      teams.push(team);
    }

    return teams;
  }

  score(student) {
    const availabilityWeight = 2;
    const skillWeight = 1;
    return (
      student.availability.length * availabilityWeight +
      student.skills.length * skillWeight
    );
  }
}

export default WeightedHybridStrategy;