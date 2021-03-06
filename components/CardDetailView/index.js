import React from 'react';
import PropTypes from 'prop-types';
import { head, flatMap, map, range } from 'lodash';
import {
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { CachedImage } from 'react-native-cached-image';
import { connectRealm } from 'react-native-realm';
import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';

import {
  CORE_FACTION_CODES,
  FACTION_COLORS,
  FACTION_BACKGROUND_COLORS,
  SKILLS,
  SKILL_COLORS,
} from '../../constants';
import { iconsMap } from '../../app/NavIcons';
import * as Actions from '../../actions';
import typography from '../../styles/typography';
import space from '../../styles/space';
import AppIcon from '../../assets/AppIcon';
import ArkhamIcon from '../../assets/ArkhamIcon';
import EncounterIcon from '../../assets/EncounterIcon';
import CardTextComponent from '../CardTextComponent';
import Button from '../core/Button';
import FlippableCard from '../core/FlippableCard';
import { getShowSpoilers } from '../../reducers';

import PlayerCardImage from './PlayerCardImage';
import FlavorTextComponent from './FlavorTextComponent';
import SignatureCardsComponent from './SignatureCardsComponent';

const BLURRED_ACT = require('../../assets/blur-act.jpeg');
const BLURRED_AGENDA = require('../../assets/blur-agenda.jpeg');
const PLAYER_BACK = require('../../assets/player-back.png');
const ENCOUNTER_BACK = require('../../assets/encounter-back.png');
const PER_INVESTIGATOR_ICON = (
  <ArkhamIcon name="per_investigator" size={12} color="#000000" />
);

class CardDetailView extends React.PureComponent {
  static propTypes = {
    navigator: PropTypes.object.isRequired,
    /* eslint-disable react/no-unused-prop-types */
    id: PropTypes.string.isRequired,
    pack_code: PropTypes.string.isRequired,
    card: PropTypes.object,
    showSpoilers: PropTypes.bool,
    linked: PropTypes.bool,
    signatureCard: PropTypes.bool,
    notFirst: PropTypes.bool,
  };

  constructor(props) {
    super(props);

    this.state = {
      showSpoilers: props.showSpoilers,
      showBack: false,
      cardViewDimension: {
        width: 0,
        height: 0,
      },
    };

    this._onCardViewLayout = this.onCardViewLayout.bind(this);
    this._editSpoilersPressed = this.editSpoilersPressed.bind(this);
    this._toggleShowSpoilers = this.toggleShowSpoilers.bind(this);
    this._toggleShowBack = this.toggleShowBack.bind(this);
    this._showInvestigatorCards = this.showInvestigatorCards.bind(this);
    this._showFaq = this.showFaq.bind(this);

    if (!props.linked) {
      const backButton = Platform.OS === 'ios' ? {
        id: 'back',
      } : {
        id: 'back',
        icon: iconsMap['arrow-left'],
      };
      const rightButtons = [{
        icon: iconsMap.faq,
        id: 'faq',
      }];
      if (props.card && props.card.type_code === 'investigator') {
        rightButtons.push({
          icon: iconsMap.deck,
          id: 'deck',
        });
      }
      props.navigator.setButtons({
        leftButtons: [
          backButton,
        ],
        rightButtons,
      });
      props.navigator.setOnNavigatorEvent(this.onNavigatorEvent.bind(this));
    }
  }

  editSpoilersPressed() {
    this.props.navigator.push({
      screen: 'EditSpoilers',
    });
  }

  onNavigatorEvent(event) {
    const {
      navigator,
    } = this.props;
    if (event.type === 'NavBarButtonPress') {
      if (event.id === 'deck') {
        this.showInvestigatorCards();
      } else if (event.id === 'faq') {
        this.showFaq();
      } else if (event.id === 'back') {
        navigator.pop();
      }
    }
  }

  showFaq() {
    const {
      navigator,
      card,
    } = this.props;
    navigator.push({
      screen: 'Card.Faq',
      title: 'FAQ',
      subtitle: card.name,
      passProps: {
        id: card.code,
      },
    });
  }

  showInvestigatorCards() {
    const {
      navigator,
      card,
    } = this.props;

    navigator.push({
      screen: 'Browse.InvestigatorCards',
      title: 'Allowed Cards',
      passProps: {
        investigatorCode: card.code,
      },
      backButtonTitle: 'Back',
    });
  }

  toggleShowBack() {
    this.setState({
      showBack: !this.state.showBack,
    });
  }

  toggleShowSpoilers() {
    this.setState({
      showSpoilers: !this.state.showSpoilers,
    });
  }

  onCardViewLayout(event) {
    const {
      width,
      height,
    } = event.nativeEvent.layout;

    const {
      cardViewDimension,
    } = this.state;

    if (!cardViewDimension || cardViewDimension.width !== width) {
      this.setState({
        cardViewDimension: {
          width,
          height,
        },
      });
    }
  }

  shouldBlur() {
    if (this.props.showSpoilers || this.state.showSpoilers) {
      return false;
    }
    return this.props.card.spoiler;
  }

  renderMetadata(card) {
    return (
      <View style={styles.metadataBlock}>
        { !!(card.subtype_name || card.type_name) && (
          <Text style={styles.typeText}>
            { card.subtype_name ?
              `${card.type_name}. ${card.subtype_name}` :
              card.type_name }
            { (card.type_code === 'agenda' || card.type_code === 'act') ? ` ${card.stage}` : '' }
          </Text>
        ) }
        { !!card.traits && <Text style={styles.traitsText}>{ card.traits }</Text> }
      </View>
    );
  }

  renderTestIcons(card) {
    if (card.type_code === 'investigator') {
      return (
        <Text>
          <ArkhamIcon name="willpower" size={14} color="#000" />{ `${card.skill_willpower}  ` }
          <ArkhamIcon name="intellect" size={14} color="#000" />{ `${card.skill_intellect}  ` }
          <ArkhamIcon name="combat" size={14} color="#000" />{ `${card.skill_combat}  ` }
          <ArkhamIcon name="agility" size={14} color="#000" />{ `${card.skill_agility}  ` }
        </Text>
      );
    }
    const skills = flatMap(SKILLS, skill => {
      const count = card[`skill_${skill}`] || 0;
      return range(0, count).map(() => skill);
    });

    if (skills.length === 0) {
      return null;
    }
    return (
      <Text>
        { 'Test Icons:' }
        { map(skills, (skill, idx) => (
          <ArkhamIcon
            key={idx}
            name={skill}
            size={16}
            color={SKILL_COLORS[skill]}
          />))
        }
      </Text>
    );
  }

  renderSlot(card) {
    if (!card.slot) {
      return null;
    }
    return (
      <View style={styles.slotBlock}>
        <Text>
          Slot: { card.slot }
        </Text>
      </View>
    );
  }

  renderPlaydata(card) {
    if (card.type_code === 'scenario') {
      return null;
    }
    const costString = (
      (card.type_code === 'asset' || card.type_code === 'event') &&
      `Cost: ${card.cost !== null ? card.cost : '-'}`
    ) || '';

    return (
      <View style={styles.statsBlock}>
        { !!(card.xp || costString) && (
          <Text>
            { card.xp ?
              (`${costString}${costString ? '. ' : ''}XP: ${card.xp}.`) :
              costString
            }
          </Text>
        ) }
        { card.type_code === 'agenda' && <Text>Doom: { card.doom }</Text> }
        { card.type_code === 'act' && card.clues > 0 && (
          <Text>
            Clues: { card.clues }
            { !card.clues_fixed && PER_INVESTIGATOR_ICON }
          </Text>
        ) }
        { this.renderTestIcons(card) }
        { this.renderSlot(card) }
        { this.renderHealthAndSanity(card) }
        { card.type_code === 'location' && (
          <Text>
            Shroud: { card.shroud }. Clues: { card.clues }
            { card.clues > 0 && !card.clues_fixed && PER_INVESTIGATOR_ICON }
            .
          </Text>)
        }
      </View>
    );
  }

  renderHealthAndSanity(card) {
    if (card.type_code === 'enemy') {
      return (
        <Text>
          { `Fight: ${card.enemy_fight || '-'}. Health: ${card.health || '-'}` }
          { !!card.health_per_investigator && PER_INVESTIGATOR_ICON }
          { `. Evade: ${card.enemy_evade || '-'}. ` }
          { '\n' }
          { `Damage: ${card.enemy_damage || '-'}. Horror: ${card.enemy_horror || '-'}. ` }
        </Text>
      );
    }
    if (card.health > 0 || card.sanity > 0) {
      return (
        <Text>
          { `Health: ${card.health || '-'}. Sanity: ${card.sanity || '-'}.` }
        </Text>
      );
    }
    return null;
  }

  renderTitle(card, name, subname) {
    const factionColor = card.faction_code && FACTION_BACKGROUND_COLORS[card.faction_code];
    return (
      <View style={[styles.cardTitle, {
        backgroundColor: factionColor || '#FFFFFF',
        borderColor: factionColor || '#000000',
      }]}>
        <View style={styles.column}>
          <Text style={[
            typography.text,
            space.marginLeftS,
            { color: factionColor ? '#FFFFFF' : '#000000' },
          ]}>
            { `${name}${card.is_unique ? ' ✷' : ''}` }
          </Text>
          { !!subname && (
            <Text style={[
              typography.small,
              space.marginLeftS,
              { color: factionColor ? '#FFFFFF' : '#000000' },
            ]}>
              { subname }
            </Text>
          ) }
        </View>
        { card.type_code !== 'scenario' && card.type_code !== 'location' &&
          card.type_code !== 'act' && card.type_code !== 'agenda' && (
          <Text style={styles.factionIcon}>
            { (CORE_FACTION_CODES.indexOf(card.faction_code) !== -1) &&
              <ArkhamIcon name={card.faction_code} size={28} color="#FFFFFF" /> }
          </Text>
        ) }
      </View>
    );
  }

  backSource(card, isHorizontal) {
    if (card.double_sided) {
      if (isHorizontal) {
        if (card.type_code === 'act') {
          return BLURRED_ACT;
        }
        if (card.type_code === 'agenda') {
          return BLURRED_AGENDA;
        }
        return {
          uri: `https://arkhamdb.com${card.imagesrc}`,
          cache: 'force-cache',
        };
      }
      return {
        uri: `https://arkhamdb.com${card.backimagesrc}`,
        cache: 'force-cache',
      };
    }
    return card.deck_limit > 0 ? PLAYER_BACK : ENCOUNTER_BACK;
  }

  renderCardImage(card, isHorizontal) {
    if (!card.imagesrc) {
      return null;
    }
    if (!card.spoiler) {
      return (
        <View
          style={isHorizontal ? styles.horizontalCard : styles.verticalCard}
          onLayout={this._onCardViewLayout}
        >
          <CachedImage
            style={isHorizontal ? styles.horizontalCardImage : styles.verticalCardImage}
            source={{
              uri: `https://arkhamdb.com${card.imagesrc}`,
              cache: 'force-cache',
            }}
          />
        </View>
      );
    }
    const frontImg = `https://arkhamdb.com${card.imagesrc}`;
    Image.prefetch(frontImg);
    return (
      <View
        style={isHorizontal ? styles.horizontalCard : styles.verticalCard}
        onLayout={this._onCardViewLayout}
      >
        { this.props.showSpoilers ?
          <CachedImage
            style={isHorizontal ? styles.horizontalCardImage : styles.verticalCardImage}
            source={{
              uri: frontImg,
              cache: 'force-cache',
            }}
          />
          :
          <FlippableCard
            style={{
              width: this.state.cardViewDimension.width,
              height: 250,
              borderWidth: 0,
            }}
            flipped
            backSide={
              <CachedImage
                style={isHorizontal ? styles.horizontalCardImage : styles.verticalCardImage}
                source={this.backSource(card, isHorizontal)}
              />
            }
            frontSide={
              <CachedImage
                style={isHorizontal ? styles.horizontalCardImage : styles.verticalCardImage}
                source={{
                  uri: frontImg,
                  cache: 'force-cache',
                }}
              />
            }
            onFlip={this._toggleShowSpoilers}
          />
        }
      </View>
    );
  }

  renderCardBack(card, backFirst, isHorizontal, flavorFirst, isFirst) {
    const {
      navigator,
      showSpoilers,
      pack_code,
    } = this.props;
    if (card.linked_card) {
      return (
        <View>
          <CardDetailView
            navigator={navigator}
            id={card.code}
            card={card.linked_card}
            pack_code={pack_code}
            showSpoilers={showSpoilers}
            linked
            notFirst={!isFirst}
          />
        </View>
      );
    }
    if (!card.double_sided) {
      return null;
    }

    if (!backFirst && card.spoiler && !this.state.showBack && card.type_code !== 'scenario') {
      return (
        <View style={styles.buttonContainer}>
          <Button text="Show back" onPress={this._toggleShowBack} />
        </View>
      );
    }

    return (
      <View style={styles.container}>
        <View style={[styles.card, {
          backgroundColor: '#FFFFFF',
          borderColor: FACTION_COLORS[card.faction_code] || '#000000',
        }]}>
          { this.renderTitle(card, card.back_name || card.name) }
          <View style={styles.cardBody}>
            <View style={styles.typeBlock}>
              <View style={styles.metadataBlock}>
                <Text style={styles.typeText}>
                  { card.type_name }
                  { (card.type_code === 'act' || card.type_code === 'agenda') ? ` ${card.stage}` : '' }
                </Text>
                { !!card.traits && <Text style={styles.traitsText}>{ card.traits }</Text> }
              </View>
              { !!card.back_flavor && flavorFirst &&
                <FlavorTextComponent text={card.back_flavor} />
              }
              { !!card.back_text && (
                <View style={[styles.gameTextBlock, {
                  borderColor: FACTION_COLORS[card.faction_code] || '#000000',
                }]}>
                  <CardTextComponent text={card.back_text} />
                </View>)
              }
              { !!card.back_flavor && !flavorFirst &&
                <FlavorTextComponent text={card.back_flavor} />
              }
            </View>
            { isFirst && this.renderCardFooter(card) }
          </View>
        </View>
      </View>
    );
  }

  renderInvestigatorCardsLink() {
    const {
      navigator,
      card,
    } = this.props;
    if (card.type_code !== 'investigator') {
      return null;
    }
    return (
      <View>
        <Text style={[typography.header, styles.sectionHeader]}>
          Deckbuilding
        </Text>
        <View style={styles.buttonContainer}>
          <Button
            onPress={this._showInvestigatorCards}
            text={`Browse ${card.name} Cards`}
            icon={<ArkhamIcon name="deck" size={18} color="white" />}
          />
        </View>
        <SignatureCardsComponent navigator={navigator} investigator={card} />
      </View>
    );
  }

  renderFaqButton() {
    return (
      <View style={styles.buttonContainer}>
        <Button
          text="FAQ"
          onPress={this._showFaq}
          icon={<ArkhamIcon name="faq" size={18} color="white" />}
        />
      </View>
    );
  }

  renderCardFooter(card) {
    return (
      <View style={styles.twoColumn}>
        <View style={[styles.column, styles.flex]}>
          { !!card.illustrator && (
            <Text style={styles.illustratorText}>
              <AppIcon name="palette" size={14} color="#000000" />
              { card.illustrator }
            </Text>
          ) }
          { !!card.pack_name &&
            <View style={styles.setRow}>
              <Text>
                { `${card.cycle_name} #${card.position % 1000}.` }
              </Text>
              { !!card.encounter_name &&
                <Text>
                  <EncounterIcon
                    encounter_code={card.encounter_code}
                    size={12}
                    color="#000000"
                  />
                  { `${card.encounter_name} #${card.encounter_position}.${card.quantity > 1 ? `\n${card.quantity} copies.` : ''}` }
                </Text>
              }
            </View>
          }
        </View>
        <View style={styles.column}>
          { this.renderFaqButton() }
        </View>
      </View>
    );
  }

  renderCardFront(card, backFirst, isHorizontal, flavorFirst, isFirst) {
    const {
      navigator,
    } = this.props;
    if ((card.hidden || backFirst) && (card.hidden || card.spoiler) && !this.state.showBack) {
      return (
        <View style={styles.buttonContainer}>
          <Button
            text={(card.hidden || backFirst) ? 'Show back' : 'Show front'}
            onPress={this._toggleShowBack}
          />
        </View>
      );
    }

    return (
      <View style={styles.container}>
        <View style={[
          styles.card,
          { borderColor: FACTION_COLORS[card.faction_code] || '#000000' },
        ]}>
          { this.renderTitle(card, card.name, card.subname) }
          <View style={styles.cardBody}>
            <View style={[styles.typeBlock, {
              backgroundColor: '#FFFFFF',
            }]}>
              <View style={styles.row}>
                <View style={styles.mainColumn}>
                  { this.renderMetadata(card) }
                  { this.renderPlaydata(card) }
                  { !!(card.flavor && flavorFirst) &&
                    <FlavorTextComponent text={card.flavor} />
                  }
                </View>
                { card.type_code !== 'story' && card.type_code !== 'scenario' && (
                  <View style={styles.column}>
                    <View style={styles.playerImage}>
                      <PlayerCardImage card={card} navigator={navigator} />
                    </View>
                  </View>
                ) }
              </View>
              { !!card.real_text && (
                <View style={[styles.gameTextBlock, {
                  borderColor: FACTION_COLORS[card.faction_code] || '#000000',
                }]}>
                  <CardTextComponent text={card.real_text} />
                </View>)
              }
              { ('victory' in card && card.victory !== null) &&
                <Text style={styles.typeText}>
                  { `Victory: ${card.victory}.` }
                </Text>
              }
              { !!card.flavor && !flavorFirst &&
                <FlavorTextComponent text={card.flavor} />
              }
              { isFirst && this.renderCardFooter(card) }
            </View>
          </View>
        </View>
      </View>
    );
  }

  render() {
    const {
      card,
      linked,
      notFirst,
    } = this.props;

    if (this.shouldBlur()) {
      return (
        <ScrollView style={styles.viewContainer}>
          <Text style={styles.spoilerText}>
            Warning: this card contains possible spoilers for '{ card.pack_name }'.
          </Text>
          <View style={styles.buttonContainer}>
            <Button onPress={this._toggleShowSpoilers} text="Show card" />
          </View>
          <View style={styles.buttonContainer}>
            <Button onPress={this._editSpoilersPressed} text="Edit my spoiler settings" />
          </View>
        </ScrollView>
      );
    }

    const isHorizontal = card.type_code === 'act' ||
      card.type_code === 'agenda' ||
      card.type_code === 'investigator';
    const flavorFirst = card.type_code === 'story' ||
      card.type_code === 'act' ||
      card.type_code === 'agenda';
    const backFirst = !linked &&
      (card.double_sided || (card.linked_card && !card.linked_card.hidden)) &&
      !(isHorizontal || !card.spoiler) &&
      card.type_code !== 'scenario';

    const sideA = backFirst && this.renderCardBack(card, backFirst, isHorizontal, flavorFirst, !notFirst);
    const sideB = this.renderCardFront(card, backFirst, isHorizontal, flavorFirst, !notFirst && !sideA);
    const sideC = !backFirst && this.renderCardBack(card, backFirst, isHorizontal, flavorFirst, !notFirst && !sideA && !sideB);
    return (
      <ScrollView style={styles.viewContainer}>
        { sideA }
        { sideB }
        { sideC }
        { this.renderInvestigatorCardsLink() }
        { !linked && <View style={styles.footerPadding} /> }
      </ScrollView>
    );
  }
}

function mapStateToProps(state, props) {
  return {
    showSpoilers: props.showSpoilers || getShowSpoilers(state, props.pack_code),
  };
}

function mapDispatchToProps(dispatch) {
  return bindActionCreators(Actions, dispatch);
}

export default connectRealm(
  connect(mapStateToProps, mapDispatchToProps)(CardDetailView), {
    schemas: ['Card'],
    mapToProps(results, realm, props) {
      return {
        realm,
        card: head(results.cards.filtered(`code == '${props.id}'`)),
      };
    },
  });

const styles = StyleSheet.create({
  viewContainer: {
    flexDirection: 'column',
    flexWrap: 'wrap',
    flex: 1,
    backgroundColor: 'white',
  },
  row: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  flex: {
    flex: 1,
  },
  column: {
    flexDirection: 'column',
    alignItems: 'flex-start',
    justifyContent: 'flex-start',
  },
  twoColumn: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  mainColumn: {
    flexDirection: 'column',
    alignItems: 'flex-start',
    justifyContent: 'flex-start',
    flex: 1,
  },
  playerImage: {
    marginTop: 2,
  },
  metadataBlock: {
    marginBottom: 8,
  },
  container: {
    marginTop: 8,
    marginLeft: 8,
    marginRight: 8,
    marginBottom: 8,
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'flex-start',
    justifyContent: 'flex-start',
  },
  card: {
    width: '100%',
    marginTop: 2,
    borderWidth: 1,
    borderRadius: 4,
  },
  cardBody: {
    paddingTop: 4,
    paddingLeft: 8,
    paddingRight: 9,
    paddingBottom: 4,
  },
  cardTitle: {
    paddingRight: 8,
    paddingTop: 4,
    paddingBottom: 4,
    borderBottomWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  gameTextBlock: {
    borderLeftWidth: 4,
    paddingLeft: 8,
    marginBottom: 8,
  },
  statsBlock: {
    marginBottom: 8,
  },
  slotBlock: {
    marginBottom: 8,
  },
  setRow: {
    marginBottom: 4,
  },
  typeBlock: {
    marginTop: 4,
  },
  typeText: {
    fontWeight: '700',
  },
  traitsText: {
    fontWeight: '700',
    fontStyle: 'italic',
  },
  illustratorText: {
    fontSize: 14,
    marginBottom: 4,
  },
  horizontalCard: {
    width: '100%',
    height: 200,
    flexDirection: 'column',
    alignItems: 'flex-start',
    justifyContent: 'flex-start',
  },
  verticalCard: {
    width: '100%',
    height: 280,
    flexDirection: 'column',
    alignItems: 'flex-start',
    justifyContent: 'flex-start',
  },
  verticalCardImage: {
    height: 280,
    width: '100%',
    resizeMode: 'contain',
    justifyContent: 'flex-start',
  },
  horizontalCardImage: {
    height: 200,
    width: '100%',
    resizeMode: 'contain',
    justifyContent: 'flex-start',
  },
  footerPadding: {
    height: 150,
  },
  buttonContainer: {
    marginLeft: 8,
    marginTop: 4,
    marginBottom: 4,
    flexDirection: 'row',
    justifyContent: 'flex-start',
  },
  sectionHeader: {
    marginTop: 24,
    paddingLeft: 8,
  },
  spoilerText: {
    margin: 8,
  },
});
