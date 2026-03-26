class WeightedHybridStrategy {
  generate(students, teamSize) {
    const sorted = [...students].sort((a, b) => {
      return this.score(b) - this.score(a);
    });

    return this.group(sorted, teamSize);
  }

  score(student) {
    const availabilityWeight = 2;
    const skillWeight = 1;

    return (
      student.availability.length * availabilityWeight +
      student.skills.length * skillWeight
    );
  }

  group(students, teamSize) {
    const teams = [];

    for (let i = 0; i < students.length; i += teamSize) {
      teams.push(students.slice(i, i + teamSize));
    }

    return teams;
  }
}

export default WeightedHybridStrategy;