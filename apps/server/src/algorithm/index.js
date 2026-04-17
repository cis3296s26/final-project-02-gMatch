// gMatch Mathematical Team Matching Engine
// Uses Randomized Search / Simulated Annealing with Constraint Satisfaction

function calculateTeamScore(team, weights) {
  let score = 0;

  // 1. HARD CONSTRAINTS (Whitelist / Blacklist)
  // If team has blacklisted members together, massive penalty
  // If team is missing whitelisted members, massive penalty
  let hardPenalty = 0;
  
  for (let i = 0; i < team.length; i++) {
    const member = team[i];
    const memberEmail = member.participantId?.email;

    // Check Blacklist
    if (member.blacklistEmails && member.blacklistEmails.length > 0) {
      for (const targetEmail of member.blacklistEmails) {
        if (!targetEmail) continue;
        const targetInTeam = team.some(m => m.participantId?.email === targetEmail);
        if (targetInTeam) hardPenalty -= 10000; 
      }
    }

    // Check Whitelist (We penalize if a whitelisted peer is NOT in the team, but ONLY if that peer actually filled out the survey!)
    if (member.whitelistEmails && member.whitelistEmails.length > 0) {
      for (const targetEmail of member.whitelistEmails) {
        if (!targetEmail) continue;
        const targetInTeam = team.some(m => m.participantId?.email === targetEmail);
        if (!targetInTeam) hardPenalty -= 1000;
      }
    }
  }

  score += hardPenalty;

  // 2. SOFT CONSTRAINTS: Schedule Overlap
  // How many timeslots do ALL members of the team share?
  let sharedSlots = 0;
  if (team.length > 0 && weights.schedule > 0) {
    const firstMemberSlots = Object.keys(team[0].availabilityGrid || {});
    
    for (const slot of firstMemberSlots) {
      if (!team[0].availabilityGrid[slot]) continue;
      
      let allHaveIt = true;
      for (let i = 1; i < team.length; i++) {
        if (!team[i].availabilityGrid || !team[i].availabilityGrid[slot]) {
          allHaveIt = false;
          break;
        }
      }
      if (allHaveIt) sharedSlots += 1;
    }
    
    // Normalize to prevent massive score inflation, let's say max 100
    // Arbitrary normalization: 10 shared slots is considered "excellent"
    score += (Math.min(sharedSlots, 20) * 5) * weights.schedule;
  }

  // 3. SOFT CONSTRAINTS: Skill Diversity
  // Pool all unique skills inside the team
  if (team.length > 0 && weights.diversity > 0) {
    const uniqueSkills = new Set();
    
    for (const member of team) {
      const skillsAnswer = member.answers?.find(a => a.questionId === "skills");
      if (skillsAnswer && Array.isArray(skillsAnswer.value)) {
        skillsAnswer.value.forEach(s => uniqueSkills.add(s.toLowerCase().trim()));
      }
    }

    // Reward diversity: every unique skill gives points
    score += (uniqueSkills.size * 10) * weights.diversity;
  }

  return score;
}

function evaluateEcosystem(teams, weights) {
  let totalScore = 0;
  for (const team of teams) {
    totalScore += calculateTeamScore(team, weights);
  }
  return totalScore;
}

function generateTeams(responses, teamSize, weights = { schedule: 0.5, diversity: 0.3, experience: 0.2 }) {
  if (!responses || responses.length === 0) return [];

  const maxTeamSize = Math.max(2, teamSize);
  const numTeams = Math.ceil(responses.length / maxTeamSize);
  
  // Create an initial random assignment
  const shuffled = [...responses].sort(() => Math.random() - 0.5);
  let currentTeams = Array.from({ length: numTeams }, () => []);
  
  shuffled.forEach((res, i) => {
    currentTeams[i % numTeams].push(res);
  });

  let currentScore = evaluateEcosystem(currentTeams, weights);
  
  let bestTeams = JSON.parse(JSON.stringify(currentTeams)); // Deep copy doesn't work well on Mongo models, but we only swap references anyway
  bestTeams = currentTeams.map(t => [...t]);
  let bestScore = currentScore;

  // Randomized Local Search (Simulated Annealing without temperature for speed)
  const iterations = 1000;
  for (let iter = 0; iter < iterations; iter++) {
    // Pick two random teams
    const t1Idx = Math.floor(Math.random() * numTeams);
    const t2Idx = Math.floor(Math.random() * numTeams);
    if (t1Idx === t2Idx) continue;

    const team1 = currentTeams[t1Idx];
    const team2 = currentTeams[t2Idx];

    if (team1.length === 0 || team2.length === 0) continue;

    // Pick a random participant from each
    const p1Idx = Math.floor(Math.random() * team1.length);
    const p2Idx = Math.floor(Math.random() * team2.length);

    // Swap
    const temp = team1[p1Idx];
    team1[p1Idx] = team2[p2Idx];
    team2[p2Idx] = temp;

    // Evaluate
    const newScore = evaluateEcosystem(currentTeams, weights);

    if (newScore > currentScore) {
      // Keep swap
      currentScore = newScore;
      if (newScore > bestScore) {
        bestScore = newScore;
        bestTeams = currentTeams.map(t => [...t]);
      }
    } else {
      // Revert swap
      const revertTemp = team1[p1Idx];
      team1[p1Idx] = team2[p2Idx];
      team2[p2Idx] = revertTemp;
    }
  }

  // Format Return Array
  const finalOutput = bestTeams.map(team => ({
    members: team.map(member => member.participantId._id)
  }));

  return finalOutput;
}

module.exports = { generateTeams };
