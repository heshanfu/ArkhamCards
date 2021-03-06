import React from 'react';
import PropTypes from 'prop-types';

import ChooserButton from '../core/ChooserButton';

export default class FilterChooserButton extends React.Component {
  static propTypes = {
    navigator: PropTypes.object.isRequired,
    title: PropTypes.string.isRequired,
    values: PropTypes.array.isRequired,
    selection: PropTypes.array,
    setting: PropTypes.string.isRequired,
    onFilterChange: PropTypes.func.isRequired,
    indent: PropTypes.bool,
  };

  constructor(props) {
    super(props);

    this._onChange = this.onChange.bind(this);
  }

  onChange(values) {
    const {
      onFilterChange,
      setting,
    } = this.props;
    onFilterChange(setting, values);
  }

  render() {
    const {
      navigator,
      title,
      values,
      selection,
      indent,
    } = this.props;
    return (
      <ChooserButton
        navigator={navigator}
        title={title}
        values={values}
        selection={selection}
        onChange={this._onChange}
        indent={indent}
      />
    );
  }
}
