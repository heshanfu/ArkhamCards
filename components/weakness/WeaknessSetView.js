import React from 'react';
import PropTypes from 'prop-types';
import { filter, forEach, map, sum, values } from 'lodash';
import {
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';
import { connectRealm } from 'react-native-realm';

import Button from '../core/Button';
import { BASIC_WEAKNESS_QUERY } from '../../data/query';
import * as Actions from '../../actions';
import typography from '../../styles/typography';

class WeaknessSetView extends React.Component {
  static computeCount(set, allCards) {
    if (!set) {
      return {
        assigned: 0,
        total: 0,
      };
    }
    const packCodes = new Set(set.packCodes);
    const cards = filter(allCards, card => packCodes.has(card.pack_code));
    return {
      assigned: sum(values(set.assignedCards)),
      total: sum(map(cards, card => card.quantity)),
    };
  }

  static propTypes = {
    navigator: PropTypes.object.isRequired,
    /* eslint-disable react/no-unused-prop-types */
    id: PropTypes.number.isRequired,
    set: PropTypes.object,
    cards: PropTypes.object, // Realm array
    cardsMap: PropTypes.object,
    packsByCode: PropTypes.object,
    deleteWeaknessSet: PropTypes.func.isRequired,
    editWeaknessSet: PropTypes.func.isRequired,
  };

  constructor(props) {
    super(props);

    this._onEditAssignedPress = this.onScreenPress.bind(this, 'Weakness.EditAssigned');
    this._onDrawPress = this.onScreenPress.bind(this, 'Weakness.Draw');
    this._onDeletePress = this.onDeletePress.bind(this);
  }

  componentDidMount() {
    this.props.navigator.setTitle({
      title: this.props.set.name,
    });
  }

  onScreenPress(screen) {
    const {
      navigator,
      set,
    } = this.props;
    navigator.push({
      screen,
      passProps: {
        id: set.id,
      },
    });
  }

  onDeletePress() {
    const {
      navigator,
      set,
      deleteWeaknessSet,
    } = this.props;
    deleteWeaknessSet(set.id);
    navigator.pop();
  }

  cards() {
    const {
      set,
      cards,
    } = this.props;
    if (!set) {
      return [];
    }
    const packCodes = new Set(set.packCodes);
    return filter(cards, card => packCodes.has(card.pack_code));
  }

  render() {
    const {
      set,
      packsByCode,
      cards,
    } = this.props;
    if (!set) {
      return null;
    }
    const counts = WeaknessSetView.computeCount(set, cards);
    return (
      <ScrollView>
        <Text style={[typography.text, styles.text]}>
          { `Consists of ${set.packCodes.length} ${set.packCodes.length === 1 ? 'set' : 'sets:'}` }
        </Text>
        <Text style={[typography.small, styles.smallText]}>
          { `${map(set.packCodes, packCode => packsByCode[packCode].name).join('\n')}` }
        </Text>
        <Text style={[typography.text, styles.text]}>
          { `${counts.assigned} / ${counts.total} have been drawn.` }
        </Text>
        <View style={styles.buttonWrapper}>
          <Button text="Draw a weakness" onPress={this._onDrawPress} />
        </View>
        <View style={styles.buttonWrapper}>
          <Button text="Edit available cards" onPress={this._onEditAssignedPress} />
        </View>
        <View style={styles.buttonWrapper}>
          <Button text="Delete Set" onPress={this._onDeletePress} />
        </View>
      </ScrollView>
    );
  }
}

function mapStateToProps(state, props) {
  const packsByCode = {};
  forEach(state.packs.all, pack => {
    packsByCode[pack.code] = pack;
  });
  return {
    set: state.weaknesses.all[props.id],
    packsByCode,
  };
}

function mapDispatchToProps(dispatch) {
  return bindActionCreators(Actions, dispatch);
}

export default connect(mapStateToProps, mapDispatchToProps)(
  connectRealm(WeaknessSetView, {
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
  buttonWrapper: {
    paddingTop: 16,
  },
  text: {
    paddingTop: 8,
    paddingLeft: 8,
  },
  smallText: {
    paddingLeft: 16,
    paddingRight: 8,
  },
});
