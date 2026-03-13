class AvailabilityOnlyStrategy {
  generate(students, teamSize) {
    const sorted = [...students].sort((a, b) => {
      return b.availability.length - a.availability.length;
    });

    return this.group(sorted, teamSize);
  }

  group(students, teamSize) {
    const teams = [];
    for (let i = 0; i < students.length; i += teamSize) {
      teams.push(students.slice(i, i + teamSize));
    }
    return teams;
  }
}

module.exports = AvailabilityOnlyStrategy;
