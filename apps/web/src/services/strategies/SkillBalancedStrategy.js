/**
 * SkillBalancedStrategy
 * Maximises unique skill coverage per team.
 * Anchors on high-skill students, then adds members whose skills most
 * complement the team's existing skill set.
 */
class SkillBalancedStrategy {
  generate(students, teamSize) {
    if (students.length === 0) return [];

    const pool = [...students].sort((a, b) => b.skills.length - a.skills.length);

    const teams = [];
    const assigned = new Set();

    for (let i = 0; i < pool.length; i++) {
      if (assigned.has(i)) continue;

      const team = [pool[i]];
      assigned.add(i);

      while (team.length < teamSize) {
        let bestIdx = -1;
        let bestNewSkills = -1;

        const teamSkills = new Set(team.flatMap((s) => s.skills));

        for (let j = 0; j < pool.length; j++) {
          if (assigned.has(j)) continue;
          const newSkills = pool[j].skills.filter((sk) => !teamSkills.has(sk)).length;
          if (newSkills > bestNewSkills) {
            bestNewSkills = newSkills;
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
}

export default SkillBalancedStrategy;