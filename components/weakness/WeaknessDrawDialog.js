import React from 'react';
import PropTypes from 'prop-types';
import { filter, find, flatMap, forEach, head, keys, map, range, shuffle } from 'lodash';
import {
  Dimensions,
  StyleSheet,
  Text,
  TouchableWithoutFeedback,
  View,
} from 'react-native';
import { CachedImage, ImageCacheManager } from 'react-native-cached-image';
import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';
import { connectRealm } from 'react-native-realm';
import FlipCard from 'react-native-flip-card';

import { BASIC_WEAKNESS_QUERY } from '../../data/query';
import * as Actions from '../../actions';
import Button from '../core/Button';
import ChooserButton from '../core/ChooserButton';
import { CARD_RATIO } from '../../styles/sizes';
const PLAYER_BACK = require('../../assets/player-back.png');
const defaultImageCacheManager = ImageCacheManager();

const PADDING = 32;
class WeaknessDrawDialog extends React.Component {
  static propTypes = {
    navigator: PropTypes.object.isRequired,
    /* eslint-disable react/no-unused-prop-types */
    id: PropTypes.number.isRequired,
    set: PropTypes.object,
    cards: PropTypes.object, // Realm array
    cardsMap: PropTypes.object,
    editWeaknessSet: PropTypes.func.isRequired,
  };

  constructor(props) {
    super(props);

    const {
      width,
    } = Dimensions.get('window');

    const cardWidth = width - PADDING * 2;
    const cardHeight = Math.round(cardWidth * CARD_RATIO);

    this.state = {
      cardWidth,
      cardHeight,
      selectedTraits: [],
      nextCard: this.nextCard([]),
      flipped: false,
      drawNewCard: false,
    };

    this._drawAnother = this.drawAnother.bind(this);
    this._flipCard = this.flipCard.bind(this);
    this._onFlipEnd = this.onFlipEnd.bind(this);
    this._onTraitsChange = this.onTraitsChange.bind(this);
    this._selectNextCard = this.selectNextCard.bind(this);
  }

  drawAnother() {
    this.setState({
      flipped: false,
      drawNewCard: true,
    });
  }

  flipCard() {
    if (!this.state.flipped && !this.state.drawNewCard) {
      const {
        editWeaknessSet,
        set: {
          id,
          name,
          packCodes,
          assignedCards,
        },
      } = this.props;
      const {
        nextCard,
      } = this.state;

      const newAssignedCards = Object.assign({}, assignedCards);
      if (!newAssignedCards[nextCard.code]) {
        newAssignedCards[nextCard.code] = 0;
      }
      newAssignedCards[nextCard.code]++;

      editWeaknessSet(id, name, packCodes, newAssignedCards);
      this.setState({
        flipped: true,
      });
    }
  }

  onTraitsChange(values) {
    this.setState({
      selectedTraits: values,
    }, this._selectNextCard);
  }

  onFlipEnd() {
    if (this.state.drawNewCard) {
      setTimeout(this._selectNextCard, 200);
    }
  }

  selectNextCard() {
    this.setState({
      drawNewCard: false,
      nextCard: this.nextCard(this.state.selectedTraits),
    });
  }

  nextCard(selectedTraits) {
    const {
      set,
    } = this.props;
    const cards = shuffle(flatMap(this.selectedCards(selectedTraits), card => {
      return map(
        range(0, card.quantity - (set.assignedCards[card.code] || 0)),
        () => card);
    }));

    const card = head(cards);
    if (card && card.imagesrc) {
      defaultImageCacheManager.downloadAndCacheUrl(`https://arkhamdb.com/${card.imagesrc}`);
    }
    return card;
  }

  selectedCards(selectedTraits) {
    if (!selectedTraits.length) {
      return this.cards();
    }
    return filter(this.cards(), card => {
      return !!find(selectedTraits, trait =>
        card.traits_normalized.indexOf(`#${trait.toLowerCase()}#`) !== -1);
    });
  }

  cards() {
    const {
      set,
      cards,
    } = this.props;
    const packSet = new Set(set.packCodes);
    return filter(cards, card => (
      packSet.has(card.pack_code) &&
      (set.assignedCards[card.code] || 0) < card.quantity
    ));
  }

  allTraits() {
    const {
      selectedTraits,
    } = this.state;
    const traitsMap = {};
    forEach(this.cards(), card => {
      if (card.traits) {
        forEach(
          filter(map(card.traits.split('.'), t => t.trim()), t => t),
          t => {
            traitsMap[t] = 1;
          });
      }
    });
    forEach(selectedTraits, trait => {
      traitsMap[trait] = 1;
    });
    return keys(traitsMap).sort();
  }

  renderNoWeaknessMessage() {
    const {
      selectedTraits,
    } = this.state;
    if (selectedTraits.length) {
      return (
        <Text>No Matching Weaknesses, try adjusting Trait filter.</Text>
      );
    }
    return (
      <Text>All weaknesses have been drawn.</Text>
    );
  }

  render() {
    const {
      navigator,
      set,
    } = this.props;
    const {
      selectedTraits,
      nextCard,
      flipped,
      cardWidth,
      cardHeight,
    } = this.state;
    if (!set) {
      return null;
    }
    return (
      <View style={styles.container}>
        <View style={styles.headerContainer}>
          { flipped ? (
            <View style={styles.buttonWrapper}>
              <Button text="Draw another" onPress={this._drawAnother} />
            </View>
          ) : (
            <ChooserButton
              navigator={navigator}
              title="Traits"
              values={this.allTraits()}
              selection={selectedTraits}
              onChange={this._onTraitsChange}
            />
          ) }
        </View>
        { nextCard ? (
          <View styles={styles.cardWrapper}>
            <TouchableWithoutFeedback onPress={this._flipCard}>
              <FlipCard
                style={{
                  width: cardWidth,
                  height: cardHeight,
                  borderWidth: 0,
                }}
                friction={6}
                perspective={1000}
                flipHorizontal
                flipVertical={false}
                flip={flipped}
                clickable={false}
                onFlipEnd={this._onFlipEnd}
              >
                <CachedImage
                  style={styles.verticalCardImage}
                  source={PLAYER_BACK}
                  resizeMode="contain"
                />
                { nextCard && (
                  <CachedImage
                    style={styles.verticalCardImage}
                    source={{
                      uri: `https://arkhamdb.com/${nextCard.imagesrc}`,
                    }}
                    resizeMode="contain"
                  />
                ) }
              </FlipCard>
            </TouchableWithoutFeedback>
          </View>
        ) : this.renderNoWeaknessMessage() }
        <View style={styles.bottomPadding} />
      </View>
    );
  }
}

function mapStateToProps(state, props) {
  return {
    set: state.weaknesses.all[props.id],
  };
}

function mapDispatchToProps(dispatch) {
  return bindActionCreators(Actions, dispatch);
}

export default connect(mapStateToProps, mapDispatchToProps)(
  connectRealm(WeaknessDrawDialog, {
    schemas: ['Card'],
    mapToProps(results) {
      const cards = results.cards
        .filtered(BASIC_WEAKNESS_QUERY)
        .sorted([['name', false]]);
      const cardsMap = {};
      forEach(cards, card => {
        cardsMap[card.code] = card;
      });
      return {
        cards,
        cardsMap,
      };
    },
  })
);

const styles = StyleSheet.create({
  container: {
    height: '100%',
    width: '100%',
    flexDirection: 'column',
    alignItems: 'center',
  },
  headerContainer: {
    flexDirection: 'column',
    width: '100%',
  },
  buttonWrapper: {
    paddingTop: 8,
  },
  cardWrapper: {
    flex: 1,
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  verticalCardImage: {
    height: '100%',
    width: '100%',
    justifyContent: 'flex-start',
  },
  bottomPadding: {
    height: PADDING,
  },
});
