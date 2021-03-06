import { findIndex, forEach, map } from 'lodash';

import { SKILLS } from '../constants';

function applyRangeFilter(query, field, values, linked) {
  if (values[0] === values[1]) {
    query.push(`(${field} == ${values[0]}${linked ? ` or linked_card.${field} == ${values[0]}` : ''})`);
  } else {
    query.push(`((${field} >= ${values[0]} and ${field} <= ${values[1]})${linked ? ` or (linked_card.${field} >= ${values[0]} and linked_card.${field} <= ${values[1]})` : ''})`);
  }
}

function applyTraitFilter(filters, query) {
  const {
    traits,
  } = filters;
  if (traits.length) {
    query.push([
      '(',
      map(traits, t => `traits_normalized CONTAINS[c] '${t}'`).join(' or '),
      ' or ',
      map(traits, t => `linked_card.traits_normalized CONTAINS[c] '${t}'`).join(' or '),
      ')',
    ].join(''));
  }
}

function applySkillIconFilter(filters, query) {
  const parts = [];
  const doubleIcons = filters.doubleIcons;
  const matchAll = doubleIcons &&
    (findIndex(SKILLS, skill => filters[skill]) === -1);

  forEach(SKILLS, skill => {
    if (matchAll || filters[skill]) {
      parts.push(`skill_${skill} > ${doubleIcons ? 1 : 0}`);
    }
  });

  if (parts.length) {
    // Kick out investigators because they re-use the same field
    // and by definition cannot have skill icons.
    query.push(`(type_code != 'investigator')`);
    query.push(`(${parts.join(' or ')})`);
  }
}

function applyLocationFilters(filters, query) {
  const {
    shroudEnabled,
    shroud,
    cluesEnabled,
    clues,
    cluesFixed,
  } = filters;
  const oldLength = query.length;
  if (shroudEnabled) {
    applyRangeFilter(query, 'shroud', shroud, true);
  }
  if (cluesEnabled) {
    applyRangeFilter(query, 'clues', clues, true);
    if (clues[0] !== clues[1] || clues[0] !== 0) {
      query.push(`(clues_fixed == ${cluesFixed} or linked_card.clues_fixed == ${cluesFixed})`);
    }
  }
  if (query.length !== oldLength) {
    query.push(`(type_code == 'location' or linked_card.type_code == 'location')`);
  }
}

function applyEnemyFilters(filters, query) {
  const {
    // toggle filters
    enemyElite,
    enemyNonElite,
    enemyHunter,
    enemyNonHunter,
    enemyRetaliate,
    enemyAlert,
    enemyParley,
    enemySpawn,
    enemyPrey,
    enemyAloof,
    enemyMassive,
    // range filters
    enemyEvade,
    enemyEvadeEnabled,
    enemyFight,
    enemyFightEnabled,
    enemyHealth,
    enemyHealthEnabled,
    enemyHealthPerInvestigator,
    enemyDamage,
    enemyDamageEnabled,
    enemyHorror,
    enemyHorrorEnabled,
    enemyKeywordsEnabled,
  } = filters;
  const oldLength = query.length;
  if (enemyKeywordsEnabled) {
    if (enemyElite && !enemyNonElite) {
      query.push(`(traits_normalized CONTAINS[c] 'elite' or linked_card.traits_normalized CONTAINS[c] 'elite')`);
    }
    if (enemyNonElite && !enemyElite) {
      query.push(`((type_code == 'enemy' and !(traits_normalized CONTAINS[c] 'elite')) or (linked_card.type_code == 'enemy' and !(linked_card.traits_normalized CONTAINS[c] 'elite')))`);
    }
    if (enemyRetaliate) {
      query.push(`(text CONTAINS 'Retaliate.' or linked_card.text CONTAINS 'Retaliate.')`);
    }
    if (enemyAlert) {
      query.push(`(text CONTAINS 'Alert.' or linked_card.text CONTAINS 'Alert.')`);
    }
    if (enemyHunter && !enemyNonHunter) {
      query.push(`(text CONTAINS 'Hunter.' or linked_card.text CONTAINS 'Hunter.')`);
    }
    if (enemyNonHunter && !enemyHunter) {
      query.push(`((type_code == 'enemy' and !(text CONTAINS 'Hunter.')) or (linked_card.type_code == 'enemy' and !(linked_card.text CONTAINS 'Hunter.')))`);
    }
    if (enemySpawn) {
      query.push(`(text CONTAINS 'Spawn' or linked_card.text CONTAINS 'Spawn')`);
    }
    if (enemyPrey) {
      query.push(`(text CONTAINS 'Prey' or linked_card.text CONTAINS 'Prey')`);
    }
    if (enemyAloof) {
      query.push(`(text CONTAINS 'Aloof.' or linked_card.text CONTAINS 'Aloof.')`);
    }
    if (enemyParley) {
      query.push(`(text CONTAINS 'Parley.' or linked_card.text CONTAINS 'Parley.')`);
    }
    if (enemyMassive) {
      query.push(`(text CONTAINS 'Massive.' or linked_card.text CONTAINS 'Massive.')`);
    }
  }
  if (enemyFightEnabled) {
    applyRangeFilter(query, 'enemy_fight', enemyFight, true);
  }
  if (enemyEvadeEnabled) {
    applyRangeFilter(query, 'enemy_evade', enemyEvade, true);
  }
  if (enemyDamageEnabled) {
    applyRangeFilter(query, 'enemy_damage', enemyDamage, true);
  }
  if (enemyHorrorEnabled) {
    applyRangeFilter(query, 'enemy_horror', enemyHorror, true);
  }
  if (enemyHealthEnabled) {
    applyRangeFilter(query, 'health', enemyHealth, true);
    query.push(`((type_code == 'enemy' and health_per_investigator == ${enemyHealthPerInvestigator}) or (linked_card.type_code == 'enemy' && linked_card.health_per_investigator == ${enemyHealthPerInvestigator}))`);
  }
  if (query.length !== oldLength ||
    (enemyHunter && enemyNonHunter) ||
    (enemyElite && enemyNonElite)) {
    query.push(`(type_code == 'enemy' or linked_card.type_code == 'enemy')`);
  }
}

function applyMiscFilter(filters, query) {
  const {
    victory,
    // vengeance,
  } = filters;
  if (victory) {
    query.push('victory >= 0 or linked_card.victory >=0');
  }
  // if (vengeance) {
  //   query.push('vengeance > 0');
  // }
}

function applyLevelFilter(filters, query) {
  const {
    levelEnabled,
    level,
    exceptional,
    nonExceptional,
  } = filters;
  if (levelEnabled) {
    applyRangeFilter(query, 'xp', level);
    if (exceptional && !nonExceptional) {
      query.push(`(text CONTAINS 'Exceptional.' or linked_card.text CONTAINS 'Exceptional.')`);
    }
    if (nonExceptional && !exceptional) {
      query.push(`!(text CONTAINS 'Exceptional.' or linked_card.text CONTAINS 'Exceptional.')`);
    }
  }
}

function applyCostFilter(filters, query) {
  const {
    costEnabled,
    cost,
  } = filters;
  if (costEnabled) {
    applyRangeFilter(query, 'cost', cost);
  }
}

function applyFilter(values, field, query) {
  if (values.length) {
    query.push(`(${map(values, value => `${field} == '${value}'`).join(' or ')})`);
  }
}

function applyPlayerCardFilters(filters, query) {
  const {
    playerFiltersEnabled,
    slots,
    uses,
    unique,
    fast,
    permanent,
    exile,
  } = filters;
  if (playerFiltersEnabled) {
    applyFilter(slots, 'slot', query);
    applyFilter(uses, 'uses', query);
    if (fast) {
      query.push(`(text CONTAINS 'Fast.' or linked_card.text CONTAINS 'Fast.')`);
    }
    if (permanent) {
      query.push(`(text CONTAINS 'Permanent.' or linked_card.text CONTAINS 'Permanent.')`);
    }
    if (exile) {
      query.push(`(text CONTAINS[c] 'exile' or linked_card.text CONTAINS[c] 'exile')`);
    }
    if (unique) {
      query.push('((is_unique == true or linked_card.is_unique == true) && type_code != "enemy")');
    }
  }
}
export function applyFilters(filters) {
  const query = [];
  applyFilter(filters.factions, 'faction_code', query);
  applyFilter(filters.cycleNames, 'cycle_name', query);
  applyFilter(filters.types, 'type_name', query);
  applyFilter(filters.subTypes, 'subtype_name', query);
  applyPlayerCardFilters(filters, query);
  applyFilter(filters.packs, 'pack_name', query);
  applyFilter(filters.encounters, 'encounter_name', query);
  applyFilter(filters.illustrators, 'illustrator', query);
  if (filters.skillEnabled) {
    applySkillIconFilter(filters.skillIcons, query);
  }
  applyMiscFilter(filters, query);
  applyLevelFilter(filters, query);
  applyCostFilter(filters, query);
  applyTraitFilter(filters, query);
  applyEnemyFilters(filters, query);
  applyLocationFilters(filters, query);
  return query;
}

export default {
  applyFilters,
};
