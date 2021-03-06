import React from 'react';
import PropTypes from 'prop-types';
import { map } from 'lodash';
import {
  Dimensions,
  Platform,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';

import DialogOption from './DialogOption';

export default class DialogPicker extends React.Component {
  static propTypes = {
    navigator: PropTypes.object.isRequired,
    options: PropTypes.array.isRequired,
    selectedOption: PropTypes.string,
    onSelectionChanged: PropTypes.func.isRequired,
    header: PropTypes.string.isRequired,
  };

  constructor(props) {
    super(props);

    const {
      height,
      width,
    } = Dimensions.get('window');

    this.state = {
      width,
      height,
    };

    this._hide = this.hide.bind(this);
    this._onPress = this.onPress.bind(this);
  }

  onPress(option) {
    const {
      onSelectionChanged,
    } = this.props;
    onSelectionChanged(option);
    this.props.navigator.dismissLightBox();
  }

  hide() {
    this.props.navigator.dismissLightBox();
  }

  renderOptions() {
    const {
      options,
      selectedOption,
    } = this.props;
    return map(options, option => (
      <DialogOption
        key={option}
        text={option}
        onPress={this._onPress}
        selected={option === selectedOption}
      />
    ));
  }

  render() {
    const {
      header,
    } = this.props;

    const {
      width,
      height,
    } = this.state;


    return (
      <View style={[styles.wrapper, { width, height }]}>
        <TouchableOpacity style={styles.background} onPress={this._hide}>
          <View style={styles.background} />
        </TouchableOpacity>
        <View style={styles.container}>
          <View style={styles.header}>
            <Text style={styles.headerText}>{ header }:</Text>
          </View>
          <ScrollView
            style={styles.scrollOptions}
            overScrollMode="never"
            scrollIndicatorInsets={{ right: -10 }}
          >
            { this.renderOptions() }
          </ScrollView>
          <View style={styles.cancel}>
            <TouchableOpacity onPress={this._hide}>
              <Text style={styles.cancelText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  }
}

const styles = StyleSheet.create({
  wrapper: {
    position: 'relative',
    zIndex: 10,
    backgroundColor: 'transparent',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
  },
  container: {
    backgroundColor: 'white',
    flexDirection: 'column',
    alignItems: 'center',
    width: '90%',
    borderRadius: Platform.OS === 'ios' ? 25 : 0,
    borderWidth: 1,
    borderColor: '#dedede',
  },
  background: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
  },
  header: {
    height: 70,
    width: '100%',
    borderBottomWidth: 1,
    borderColor: '#eeeeee',
  },
  headerText: {
    fontSize: 22,
    lineHeight: 70,
    textAlign: 'center',
    fontWeight: '700',
  },
  cancel: {
    height: 55,
    width: '100%',
  },
  cancelText: {
    color: 'rgb(0,122,255)',
    textAlign: 'center',
    lineHeight: 50,
    fontSize: 23,
    fontWeight: '700',
  },
  scrollOptions: {
    maxHeight: 50 * 6 + 25,
  },
});
