import React from 'react';
import PropTypes from 'prop-types';

import FetchCardsGate from '../FetchCardsGate';
import FullMenu from './FullMenu';
import CardMenu from './CardMenu';
import { iconsMap } from '../../app/NavIcons';

const CARD_MODE = true;

export default class HomeView extends React.Component {
  static propTypes = {
    navigator: PropTypes.object.isRequired,
  };

  constructor(props) {
    super(props);

    this.state = {
      drawerOpen: false,
    };

    props.navigator.setOnNavigatorEvent(this.onNavigatorEvent.bind(this));
    props.navigator.setButtons({
      rightButtons: [
        {
          icon: iconsMap.settings,
          id: 'settings',
        },
      ],
    });
  }

  onNavigatorEvent(event) {
    const {
      navigator,
    } = this.props;
    if (event.type === 'DeepLink') {
      if (event.link === '/collection') {
        navigator.push({
          screen: 'CollectionEdit',
        });
      } else if (event.link === '/spoilers') {
        navigator.push({
          screen: 'EditSpoilers',
        });
      } else if (event.link === '/about') {
        navigator.push({
          screen: 'About',
        });
      }

      if (event.payload && event.payload.closeDrawer) {
        this.toggleDrawer();
      }
    } else if (event.type === 'NavBarButtonPress') {
      if (event.id === 'settings') {
        this.toggleDrawer();
      }
    }
  }

  toggleDrawer() {
    const {
      navigator,
    } = this.props;
    const {
      drawerOpen,
    } = this.state;
    navigator.toggleDrawer({
      side: 'right',
      animated: true,
      to: drawerOpen ? 'closed' : 'open',
    });
    this.setState({
      drawerOpen: !drawerOpen,
    });
  }

  render() {
    const {
      navigator,
    } = this.props;
    return (
      <FetchCardsGate>
        { CARD_MODE ?
          <CardMenu navigator={navigator} />
          :
          <FullMenu navigator={navigator} />
        }
      </FetchCardsGate>
    );
  }
}
