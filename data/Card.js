import { forEach, filter, keys, map } from 'lodash';

import CardRequirement from './CardRequirement';
import CardRestrictions from './CardRestrictions';
import DeckRequirement from './DeckRequirement';
import RandomRequirement from './RandomRequirement';
import DeckOption from './DeckOption';
import DeckOptionLevel from './DeckOptionLevel';
import DeckAtLeastOption from './DeckAtLeastOption';
import { BASIC_SKILLS } from '../constants';

const USES_REGEX = new RegExp('.*Uses\\s*\\([0-9]+\\s(.+)\\)\\..*');
const HEALS_HORROR_REGEX = new RegExp('[Hh]eals? (\\d+ damage (and|or) )?(\\d+ )?horror');
export default class Card {
  static parseDeckRequirements(json) {
    const dr = new DeckRequirement();
    dr.card = map(keys(json.card), code => {
      const cr = new CardRequirement();
      cr.code = code;
      cr.alternates = filter(
        keys(json.card[code]),
        altCode => altCode !== code
      );
      return cr;
    });
    dr.random = map(json.random, r => {
      const rr = new RandomRequirement();
      rr.target = r.target;
      rr.value = r.value;
      return rr;
    });
    dr.size = json.size;

    return dr;
  }

  static parseDeckOptions(jsonList) {
    return map(jsonList, json => {
      const deck_option = new DeckOption();
      deck_option.faction = json.faction || [];
      deck_option.uses = json.uses || [];
      deck_option.text = json.text || [];
      deck_option.trait = json.trait || [];
      deck_option.limit = json.limit;
      deck_option.error = json.error;
      deck_option.not = json.not ? true : null;

      if (json.level) {
        const level = new DeckOptionLevel();
        level.min = json.level.min;
        level.max = json.level.max;
        deck_option.level = level;
      }

      if (json.atleast) {
        const atleast = new DeckAtLeastOption();
        atleast.factions = json.atleast.factions;
        atleast.min = json.atleast.min;
        deck_option.atleast = atleast;
      }

      return deck_option;
    });
  }

  static parseRestrictions(json) {
    const result = new CardRestrictions();
    result.investigator = json.investigator;
    return result;
  }

  static FACTION_HEADER_ORDER = [
    'Guardian',
    'Seeker',
    'Mystic',
    'Rogue',
    'Survivor',
    'Neutral',
    'Weakness',
    'Mythos',
  ];

  static factionSortHeader(json) {
    if (json.spoiler) {
      return 'Mythos';
    }
    switch(json.subtype_code) {
      case 'basicweakness':
      case 'weakness':
        return 'Weakness';
      default:
        return json.faction_name;
    }
  }

  static TYPE_HEADER_ORDER = [
    'Investigator',
    'Asset: Hand',
    'Asset: Hand x2',
    'Asset: Accessory',
    'Asset: Ally',
    'Asset: Arcane',
    'Asset: Arcane x2',
    'Asset: Body',
    'Asset: Permanent',
    'Asset: Other',
    'Event',
    'Skill',
    'Basic Weakness',
    'Weakness',
    'Scenario',
    'Story',
  ];

  static typeSortHeader(json) {
    switch(json.subtype_code) {
      case 'basicweakness':
        return 'Basic Weakness';
      case 'weakness':
        return 'Weakness';
      default:
        switch(json.type_code) {
          case 'asset':
            if (json.spoiler) {
              return 'Story';
            }
            if (json.permanent || json.double_sided) {
              return 'Asset: Permanent';
            }
            switch(json.slot) {
              case 'Hand': return 'Asset: Hand';
              case 'Hand x2': return 'Asset: Hand x2';
              case 'Accessory': return 'Asset: Accessory';
              case 'Ally': return 'Asset: Ally';
              case 'Arcane': return 'Asset: Arcane';
              case 'Arcane x2': return 'Asset: Arcane x2';
              case 'Body': return 'Asset: Body';
              default: return 'Asset: Other';
            }
          case 'event':
            if (json.spoiler) {
              return 'Story';
            }
            return 'Event';
          case 'skill':
            if (json.spoiler) {
              return 'Story';
            }
            return 'Skill';
          case 'investigator':
            return 'Investigator';
          default:
            return 'Scenario';
        }
    }
  }

  static fromJson(json, packsByCode, cycleNames) {
    const deck_requirements = json.deck_requirements ?
      Card.parseDeckRequirements(json.deck_requirements) :
      null;
    const deck_options = json.deck_options ?
      Card.parseDeckOptions(json.deck_options) :
      [];

    const wild = json.skill_wild || 0;
    const eskills = {};
    if (json.type_code !== 'investigator' && wild > 0) {
      forEach(BASIC_SKILLS, skill => {
        const value = json[`skill_${skill}`] || 0;
        if (value > 0) {
          eskills[`eskill_${skill}`] = value + wild;
        }
      });
    }

    let renderName = json.name;
    let renderSubname = json.subname;
    if (json.type_code === 'act' && json.stage) {
      renderSubname = `Act ${json.stage}`;
    } else if (json.type_code === 'agenda' && json.stage) {
      renderSubname = `Agenda ${json.stage}`;
    } else if (json.type_code === 'scenario') {
      renderSubname = 'Scenario';
    }
    const linked_card = json.linked_card ?
      Card.fromJson(json.linked_card, packsByCode, cycleNames) :
      null;
    if (linked_card) {
      linked_card.back_linked = true;
      if (json.hidden && !linked_card.hidden) {
        renderName = linked_card.name;
        if (linked_card.type_code === 'act' && linked_card.stage) {
          renderSubname = `Act ${linked_card.stage}`;
        } else if (linked_card.type_code === 'agenda' && linked_card.stage) {
          renderSubname = `Agenda ${linked_card.stage}`;
        } else {
          renderSubname = linked_card.subname;
        }
      }
    }

    const traits_normalized = json.traits ? map(
      filter(
        map(json.traits.split('.'), trait => trait.toLowerCase().trim()),
        trait => trait),
      trait => `#${trait}#`).join(',') : null;
    const restrictions = json.restrictions ?
      Card.parseRestrictions(json.restrictions) :
      null;

    const uses_match = json.text && json.text.match(USES_REGEX);
    const uses = uses_match ? uses_match[1].toLowerCase() : null;

    const heals_horror_match = json.real_text && json.real_text.match(HEALS_HORROR_REGEX);
    const heals_horror = heals_horror_match ? true : null;

    const sort_by_type = Card.TYPE_HEADER_ORDER.indexOf(Card.typeSortHeader(json));
    const sort_by_faction = Card.FACTION_HEADER_ORDER.indexOf(Card.factionSortHeader(json));
    const pack = packsByCode[json.pack_code] || null;
    const sort_by_pack = pack ? (pack.cycle_position * 100 + pack.position) : -1;
    const cycle_name = pack ? cycleNames[pack.cycle_position] : null;
    const spoiler = !!(json.spoiler || (linked_card && linked_card.spoiler));
    return Object.assign(
      {},
      json,
      eskills,
      {
        renderName,
        renderSubname,
        deck_requirements,
        deck_options,
        linked_card,
        spoiler,
        traits_normalized,
        uses,
        cycle_name,
        has_restrictions: !!restrictions,
        restrictions,
        heals_horror,
        sort_by_type,
        sort_by_faction,
        sort_by_pack,
      },
    );
  }
}

Card.schema = {
  name: 'Card',
  primaryKey: 'code',
  properties: {
    code: 'string', // primary key
    pack_code: 'string',
    pack_name: 'string',
    type_code: { type: 'string', indexed: true },
    type_name: 'string',
    subtype_code: 'string?',
    subtype_name: 'string?',
    slot: 'string?',
    faction_code: { type: 'string', optional: true, indexed: true },
    faction_name: 'string?',
    position: 'int',
    enemy_damage: 'int?',
    enemy_horror: 'int?',
    enemy_fight: 'int?',
    enemy_evade: 'int?',
    encounter_code: 'string?',
    encounter_name: 'string?',
    encounter_position: 'int?',
    exceptional: 'bool?',
    xp: { type: 'int', optional: true, indexed: true },
    victory: 'int?',
    renderName: 'string',
    renderSubname: 'string?',
    name: 'string',
    real_name: 'string',
    subname: 'string?',
    illustrator: 'string?',
    text: 'string?',
    flavor: 'string?',
    cost: 'int?',
    real_text: 'string?',
    back_name: 'string?',
    back_text: 'string?',
    back_flavor: 'string?',
    quantity: 'int?',
    spoiler: 'bool?',
    stage: 'int?', // Act/Agenda deck
    clues: 'int?',
    shroud: 'int?',
    clues_fixed: 'bool?',
    doom: 'int?',
    health: 'int?',
    health_per_investigator: 'bool?',
    sanity: 'int?',
    deck_limit: 'int?',
    traits: 'string?',
    real_traits: 'string?',
    is_unique: 'bool?',
    exile: 'bool?',
    hidden: 'bool?',
    permanent: 'bool?',
    double_sided: 'bool',
    url: 'string?',
    octgn_id: 'string?',
    imagesrc: 'string?',
    backimagesrc: 'string?',
    skill_willpower: 'int?',
    skill_intellect: 'int?',
    skill_combat: 'int?',
    skill_agility: 'int?',
    skill_wild: 'int?',
    // Effective skills (add wilds to them)
    eskill_willpower: 'int?',
    eskill_intellect: 'int?',
    eskill_combat: 'int?',
    eskill_agility: 'int?',
    linked_to_code: 'string?',
    linked_to_name: 'string?',

    // Parsed data (from original)
    restrictions: 'CardRestrictions?',
    deck_requirements: 'DeckRequirement?',
    deck_options: 'DeckOption[]',
    linked_card: 'Card',
    back_linked: 'bool?',

    // Derived data.
    cycle_name: 'string?',
    has_restrictions: 'bool',
    traits_normalized: 'string?',
    uses: 'string?',
    heals_horror: 'bool?',
    sort_by_type: 'int',
    sort_by_faction: 'int',
    sort_by_pack: 'int',
  },
};
