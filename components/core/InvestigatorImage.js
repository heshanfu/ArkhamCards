import React from 'react';
import PropTypes from 'prop-types';
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { CachedImage } from 'react-native-cached-image';

import { createFactionIcons, FACTION_COLORS } from '../../constants';

const FACTION_ICONS = createFactionIcons(55, '#FFF');

export default class InvestigatorImage extends React.Component {
  static propTypes = {
    card: PropTypes.object.isRequired,
    navigator: PropTypes.object,
  };

  constructor(props) {
    super(props);

    this._onPress = this.onPress.bind(this);
  }

  onPress() {
    const {
      card,
      navigator,
    } = this.props;
    navigator.push({
      screen: 'Card',
      passProps: {
        id: card.code,
        pack_code: card.pack_code,
        showSpoilers: true,
      },
      title: `${card.is_unique ? '✷ ' : ''}${card.name}`,
      subtitle: card.subname,
      backButtonTitle: 'Back',
    });
  }

  renderImage() {
    const {
      card,
    } = this.props;
    return (
      <View style={styles.container}>
        <View style={styles.relative}>
          <View style={[
            styles.placeholder,
            { backgroundColor: FACTION_COLORS[card.faction_code] },
          ]}>
            <Text style={styles.placeholderIcon}>
              { FACTION_ICONS[card.faction_code] }
            </Text>
          </View>
        </View>

        { !!card.imagesrc && (
          <View style={styles.relative}>
            <CachedImage
              style={styles.image}
              source={{
                uri: `https://arkhamdb.com/${card.imagesrc}`,
              }}
              resizeMode="contain"
            />
          </View>
        ) }
      </View>
    );
  }

  render() {
    const {
      navigator,
    } = this.props;
    if (navigator) {
      return (
        <TouchableOpacity onPress={this._onPress}>
          { this.renderImage() }
        </TouchableOpacity>
      );
    }
    return this.renderImage();
  }
}

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    overflow: 'hidden',
    borderRadius: 6,
    width: 80,
    height: 80,
  },
  relative: {
    position: 'relative',
  },
  image: {
    position: 'absolute',
    top: -17,
    left: -10,
    width: 166 + 44,
    height: 136 + 34,
  },
  placeholder: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: 80,
    height: 80,
    borderRadius: 6,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  placeholderIcon: {
    textAlign: 'center',
  },
});
