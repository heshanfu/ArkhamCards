import React from 'react';
import PropTypes from 'prop-types';
import {
  Text,
  TouchableOpacity,
  StyleSheet,
  View,
  ViewPropTypes,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';

import typography from '../../styles/typography';

export default function Button({
  text,
  icon,
  align = 'center',
  size = 'normal',
  width,
  onPress,
  style,
  color,
}) {
  let containerStyle = styles.centerContainer;
  switch (align) {
    case 'left': containerStyle = styles.leftContainer; break;
    case 'right': containerStyle = styles.rightContainer; break;
    default: containerStyle = styles.centerContainer; break;
  }
  let padding = 16;
  switch(size) {
    case 'small': padding = 8; break;
    default: padding = 16; break;
  }
  let colors = ['#3093c7', '#1c5a85'];
  switch(color) {
    case 'green': colors = ['#107116', '#0b4f0f']; break;
    case 'red': colors = ['#cc3038', '#a3262d']; break;
    case 'purple': colors = ['#4331b9', '#2f2282']; break;
    case 'yellow': colors = ['#ec8426', '#bd6a1e']; break;
  }
  return (
    <View style={[containerStyle, style]}>
      <TouchableOpacity onPress={onPress}>
        <LinearGradient colors={colors} style={[
          styles.button,
          width ? { width } : {},
          { paddingLeft: padding, paddingRight: padding },
        ]}>
          { !!icon && (
            <View style={text ? styles.icon : {}}>
              { icon }
            </View>
          ) }
          { !!text && (
            <Text style={[typography.text, styles.buttonText]}>
              { text }
            </Text>
          ) }
        </LinearGradient>
      </TouchableOpacity>
    </View>
  );
}

Button.propTypes = {
  text: PropTypes.string,
  icon: PropTypes.node,
  onPress: PropTypes.func,
  align: PropTypes.oneOf(['left', 'center', 'right']),
  size: PropTypes.oneOf(['small', 'normal']),
  style: ViewPropTypes.style,
  width: PropTypes.number,
  color: PropTypes.oneOf(['default', 'green', 'purple', 'red', 'yellow']),
};

const styles = StyleSheet.create({
  leftContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    marginLeft: 8,
  },
  rightContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginRight: 8,
  },
  centerContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
  },
  button: {
    paddingTop: 8,
    paddingBottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
  },
  icon: {
    marginRight: 8,
  },
  buttonText: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
});
