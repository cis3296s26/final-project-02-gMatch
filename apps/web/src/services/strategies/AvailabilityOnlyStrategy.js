/**
 * AvailabilityOnlyStrategy
 * Groups students to maximise shared availability slots.
 * Students with more availability slots are "anchors" placed first;
 * remaining students are matched to the anchor with the most overlap.
 */
class AvailabilityOnlyStrategy {
  generate(students, teamSize) {
    if (students.length === 0) return [];

    // Sort by slot count descending so anchors come first
    const pool = [...students].sort(
      (a, b) => b.availability.length - a.availability.length
    );

    const teams = [];
    const assigned = new Set();

    for (let i = 0; i < pool.length; i++) {
      if (assigned.has(i)) continue;

      const team = [pool[i]];
      assigned.add(i);

      // Pick remaining teammates by overlap with current team
      while (team.length < teamSize) {
        let bestIdx = -1;
        let bestOverlap = -1;

        const teamSlots = new Set(team.flatMap((s) => s.availability));

        for (let j = 0; j < pool.length; j++) {
          if (assigned.has(j)) continue;
          const overlap = pool[j].availability.filter((s) => teamSlots.has(s)).length;
          if (overlap > bestOverlap) {
            bestOverlap = overlap;
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

export default AvailabilityOnlyStrategy;