import React from 'react';
import PropTypes from 'prop-types';
import {
  StyleSheet,
  TouchableOpacity,
  View,
  ViewPropTypes,
} from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/dist/MaterialCommunityIcons';

import { COLORS } from '../../styles/colors';

export default class PlusMinusButtons extends React.Component {
  static propTypes = {
    count: PropTypes.number.isRequired,
    onChange: PropTypes.func.isRequired,
    limit: PropTypes.number,
    style: ViewPropTypes.style,
    size: PropTypes.number,
  };

  constructor(props) {
    super(props);

    this._increment = this.increment.bind(this);
    this._decrement = this.decrement.bind(this);
  }

  increment() {
    const {
      count,
      onChange,
    } = this.props;
    onChange(count + 1);
  }

  decrement() {
    const {
      count,
      onChange,
    } = this.props;
    onChange(count - 1);
  }

  renderPlusButton() {
    const {
      count,
      limit,
      size = 36,
    } = this.props;
    const atLimit = limit && (count === limit);
    if (count === null || atLimit) {
      return <MaterialCommunityIcons name="plus-box-outline" size={size} color="#ddd" />;
    }
    return (
      <TouchableOpacity onPress={this._increment}>
        <MaterialCommunityIcons name="plus-box" size={size} color={COLORS.darkBlue} />
      </TouchableOpacity>
    );
  }

  renderMinusButton() {
    const {
      count,
      size = 36,
    } = this.props;
    if (count > 0) {
      return (
        <TouchableOpacity onPress={this._decrement}>
          <MaterialCommunityIcons name="minus-box" size={size} color={COLORS.darkBlue} />
        </TouchableOpacity>
      );
    }
    return <MaterialCommunityIcons name="minus-box-outline" size={size} color="#ddd" />;
  }

  render() {
    return (
      <View style={this.props.style || styles.row}>
        { this.renderMinusButton() }
        { this.renderPlusButton() }
      </View>
    );
  }
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    alignItems: 'center',
  },
});
