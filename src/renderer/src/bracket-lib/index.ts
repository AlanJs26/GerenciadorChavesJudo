import type { Bracket, Player, Organization } from "./types";

// ==================== Tournament Order Generation ====================
function generateTournamentOrder(size: number): number[] {
  if (size === 1) return [1];

  const halfSize = Math.max(Math.floor(size / 2), 1);
  const halfOrder = generateTournamentOrder(halfSize);
  const result = [];

  for (let i = 0; i < halfOrder.length; i++) {
    result.push(halfOrder[i]);
    result.push(halfOrder[i] + halfSize);
  }

  return result;
}

// ==================== Bracket Generation ====================
export function buildBracket(players: Player[]): Bracket {
  const numPlayers = players.length;
  const nMatches = Math.max(Math.floor(numPlayers / 2), 3);
  const rounds = [
    "1st Round",
    "2nd Round",
    "3rd Round",
    "4th Round",
    "Final",
  ].slice(0, nMatches - 1);
  const order = generateTournamentOrder(2 ** Math.ceil(Math.log2(numPlayers)));

  // Generate unique IDs for contestants
  const contestantsIds = players.map(() =>
    Math.floor(Math.random() * 10000).toString(),
  );

  // Create contestant objects
  const contestants = players.reduce((prev, curr, i) => {
    return {
      ...prev,
      [contestantsIds[i]]: {
        players: [{ title: curr.name, nationality: curr.organization }],
      },
    };
  }, {});

  // Generate match pairs
  const matchPairs = [];
  for (let i = 0; i < order.length; i += 2) {
    if (order[i] <= numPlayers && order[i + 1] <= numPlayers) {
      const player1 = contestantsIds[order[i] - 1];
      const player2 = contestantsIds[order[i + 1] - 1];
      matchPairs.push([player1, player2]);
    }
  }

  // Create the complete bracket
  return {
    rounds: rounds.map((name) => ({ name })),
    contestants,
    matches: matchPairs.map(([a, b], i) => ({
      roundIndex: 0,
      order: i,
      sides: [{ contestantId: a }, { contestantId: b }],
    })),
  };
}

// ==================== Data Generation ====================

export function generateRandomOrganizations(
  numOrgs: number,
  playersPerOrg: number,
): Organization[] {
  const maleNames = [
    "Alan",
    "Lucas",
    "Marcelo",
    "Carlos",
    "Ricardo",
    "João",
    "Pedro",
    "Miguel",
    "Gabriel",
    "Rafael",
  ];
  const femaleNames = [
    "Ana",
    "Maria",
    "Joana",
    "Fernanda",
    "Paula",
    "Luisa",
    "Sofia",
    "Julia",
    "Beatriz",
    "Laura",
  ];
  const orgNames = [
    "Escola Politécnica",
    "Escola de Engenharia",
    "Escola de Artes",
    "Academia Judo",
    "Centro Esportivo",
    "Clube Atlético",
    "Instituto Nacional",
    "Associação Desportiva",
    "Federação Estadual",
    "União Esportiva",
  ];
  const categories = ["KIDS", "KIDS 2", "JUNIOR", "TEEN", "ADULT"];

  return Array.from({ length: numOrgs }, (_, i) => {
    const orgName = i < orgNames.length ? orgNames[i] : `Organização ${i + 1}`;

    const players = Array.from({ length: playersPerOrg }, () => {
      const isMale = Math.random() > 0.5;
      const names = isMale ? maleNames : femaleNames;
      return {
        name: names[Math.floor(Math.random() * names.length)],
        isMale,
        category: categories[Math.floor(Math.random() * categories.length)],
      };
    });

    return {
      organization: orgName,
      players,
    };
  });
}
