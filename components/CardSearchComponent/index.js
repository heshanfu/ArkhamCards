import React from 'react';
import PropTypes from 'prop-types';
import { forEach } from 'lodash';
import {
  Platform,
  Text,
  StyleSheet,
  Switch,
  View,
} from 'react-native';

import SearchBox from '../SearchBox';
import {
  SORT_BY_TYPE,
  SORT_BY_ENCOUNTER_SET,
} from '../CardSortDialog/constants';
import CardResultList from './CardResultList';
import { iconsMap } from '../../app/NavIcons';
import { applyFilters } from '../../lib/filters';
import DefaultFilterState from '../filter/DefaultFilterState';
import { STORY_CARDS_QUERY } from '../../data/query';

const SEARCH_OPTIONS_HEIGHT = 44;

export default class CardSearchComponent extends React.Component {
  static propTypes = {
    navigator: PropTypes.object.isRequired,
    // Function that takes 'realm' and gives back a base query.
    baseQuery: PropTypes.string,
    sort: PropTypes.string,

    // Keyed by code, count of current deck.
    deckCardCounts: PropTypes.object,
    onDeckCountChange: PropTypes.func,
    backPressed: PropTypes.func,
    backButtonText: PropTypes.string,
    limits: PropTypes.object,
    footer: PropTypes.node,
    storyToggle: PropTypes.bool,
  };

  constructor(props) {
    super(props);

    this.state = {
      searchText: false,
      searchFlavor: false,
      searchBack: false,
      searchTerm: '',
      selectedSort: props.sort || SORT_BY_TYPE,
      filters: DefaultFilterState,
      storyFilters: DefaultFilterState,
      storyMode: false,
    };

    this._cardPressed = this.cardPressed.bind(this);
    this._toggleSearchText = this.toggleSearchMode.bind(this, 'searchText');
    this._toggleSearchFlavor = this.toggleSearchMode.bind(this, 'searchFlavor');
    this._toggleSearchBack = this.toggleSearchMode.bind(this, 'searchBack');
    this._sortChanged = this.sortChanged.bind(this);
    this._searchUpdated = this.searchUpdated.bind(this);
    this._applyFilters = this.applyFilters.bind(this);

    const leftButton = Platform.OS === 'ios' ? {
      id: 'back',
      title: props.backButtonText,
    } : {
      id: 'back',
      icon: iconsMap['arrow-left'],
    };
    const defaultButton = Platform.OS === 'ios' ? [] : null;
    const rightButtons = [
      {
        icon: iconsMap.tune,
        id: 'filter',
      },
      {
        icon: iconsMap['sort-by-alpha'],
        id: 'sort',
      },
    ];
    if (props.storyToggle) {
      rightButtons.push({
        icon: iconsMap.book,
        id: 'story',
      });
    }

    props.navigator.setButtons({
      leftButtons: props.backButtonText ? [leftButton] : defaultButton,
      rightButtons,
    });
    props.navigator.setOnNavigatorEvent(this.onNavigatorEvent.bind(this));
  }

  cardPressed() {
    this.isOnTop = false;
  }

  toggleSearchMode(mode) {
    this.setState({
      [mode]: !this.state[mode],
    });
  }

  applyFilters(filters) {
    if (this.state.storyMode) {
      this.setState({
        storyFilters: filters,
      });
    } else {
      this.setState({
        filters: filters,
      });
    }
  }

  sortChanged(selectedSort) {
    this.setState({
      selectedSort,
    });
  }

  onNavigatorEvent(event) {
    const {
      navigator,
      baseQuery,
    } = this.props;
    const {
      storyMode,
    } = this.state;
    if (event.type === 'NavBarButtonPress') {
      if (event.id === 'filter') {
        this.isOnTop = false;
        navigator.push({
          screen: 'SearchFilters',
          animationType: 'slide-down',
          backButtonTitle: 'Apply',
          passProps: {
            applyFilters: this._applyFilters,
            currentFilters: storyMode ? this.state.storyFilters : this.state.filters,
            baseQuery: storyMode ? STORY_CARDS_QUERY : baseQuery,
          },
        });
      } else if (event.id === 'sort') {
        this.isOnTop = false;
        navigator.showLightBox({
          screen: 'Dialog.Sort',
          passProps: {
            sortChanged: this._sortChanged,
            selectedSort: this.state.selectedSort,
            query: this.query(),
            searchTerm: this.state.searchTerm,
          },
          style: {
            backgroundColor: 'rgba(128,128,128,.75)',
          },
        });
      } else if (event.id === 'story') {
        const {
          storyMode,
        } = this.state;
        this.setState({
          storyMode: !storyMode,
        });

        const rightButtons = [
          {
            icon: iconsMap.tune,
            id: 'filter',
          },
          {
            icon: iconsMap['sort-by-alpha'],
            id: 'sort',
          },
          {
            icon: storyMode ? iconsMap.book : iconsMap.per_investigator,
            id: 'story',
          },
        ];
        navigator.setButtons({
          rightButtons,
        });
        navigator.setTitle({
          title: storyMode ? '' : 'Special',
        });
      }
    } else if (event.id === 'willDisappear') {
      if (this.isOnTop) {
        this.handleBackPress();
        this.isOnTop = false;
      }
    } else if (event.id === 'willAppear') {
      this.isOnTop = true;
    }
  }

  handleBackPress() {
    const {
      backPressed,
    } = this.props;
    backPressed && backPressed();
    return true;
  }

  searchUpdated(text) {
    this.setState({
      searchTerm: text,
    });
  }

  applyQueryFilter(query) {
    const {
      searchTerm,
      searchText,
      searchFlavor,
      searchBack,
    } = this.state;

    if (searchTerm !== '') {
      const parts = searchBack ? [
        'name contains[c] $0',
        'linked_card.name contains[c] $0',
        'back_name contains[c] $0',
        'linked_card.back_name contains[c] $0',
        'subname contains[c] $0',
        'linked_card.subname contains[c] $0',
      ] : [
        'renderName contains[c] $0',
        'renderSubname contains[c] $0',
      ];
      if (searchText) {
        parts.push('real_text contains[c] $0');
        parts.push('linked_card.real_text contains[c] $0');
        if (searchBack) {
          parts.push('back_text contains[c] $0');
          parts.push('linked_card.back_text contains[c] $0');
        }
      }

      if (searchFlavor) {
        parts.push('flavor contains[c] $0');
        parts.push('linked_card.flavor contains[c] $0');
        if (searchBack) {
          parts.push('back_flavor contains[c] $0');
          parts.push('linked_card.back_flavor contains[c] $0');
        }
      }
      query.push(`(${parts.join(' or ')})`);
    }
  }

  query() {
    const {
      baseQuery,
    } = this.props;
    const {
      selectedSort,
      storyMode,
      filters,
      storyFilters,
    } = this.state;
    const queryParts = [];
    if (storyMode) {
      queryParts.push(STORY_CARDS_QUERY);
    } else if (baseQuery) {
      queryParts.push(baseQuery);
    }
    queryParts.push('(back_linked != true)');
    this.applyQueryFilter(queryParts);
    forEach(
      applyFilters(storyMode ? storyFilters : filters),
      clause => queryParts.push(clause));

    if (selectedSort === SORT_BY_ENCOUNTER_SET) {
      queryParts.push(`(encounter_code != null OR linked_card.encounter_code != null)`);
    }
    return queryParts.join(' and ');
  }

  renderTextSearchOptions() {
    const {
      searchText,
      searchFlavor,
      searchBack,
    } = this.state;
    return (
      <View style={styles.textSearchOptions}>
        <Text style={styles.searchOption}>{ 'Game\nText' }</Text>
        <Switch
          value={searchText}
          onValueChange={this._toggleSearchText}
          onTintColor="#222222"
        />
        <Text style={styles.searchOption}>{ 'Flavor\nText' }</Text>
        <Switch
          value={searchFlavor}
          onValueChange={this._toggleSearchFlavor}
          onTintColor="#222222"
        />
        <Text style={styles.searchOption}>{ 'Card\nBacks' }</Text>
        <Switch
          value={searchBack}
          onValueChange={this._toggleSearchBack}
          onTintColor="#222222"
        />
      </View>
    );
  }

  renderHeader() {
    return (
      <SearchBox
        onChangeText={this._searchUpdated}
        placeholder="Search for a card"
        focusComponent={this.renderTextSearchOptions()}
        focusComponentHeight={SEARCH_OPTIONS_HEIGHT}
      />
    );
  }

  render() {
    const {
      navigator,
      deckCardCounts,
      onDeckCountChange,
      limits,
      footer,
    } = this.props;
    const {
      selectedSort,
      searchTerm,
    } = this.state;
    const query = this.query();
    return (
      <View style={styles.wrapper}>
        { this.renderHeader() }
        <View style={styles.container}>
          <CardResultList
            navigator={navigator}
            query={query}
            searchTerm={searchTerm}
            sort={selectedSort}
            deckCardCounts={deckCardCounts}
            onDeckCountChange={onDeckCountChange}
            limits={limits}
            cardPressed={this._cardPressed}
          />
        </View>
        { !!footer && <View style={[
          styles.footer,
        ]}>{ footer }</View> }
      </View>
    );
  }
}

const styles = StyleSheet.create({
  wrapper: {
    position: 'relative',
    flex: 1,
  },
  container: {
    flex: 1,
    backgroundColor: '#fff',
    flexDirection: 'column',
    justifyContent: 'flex-start',
  },
  textSearchOptions: {
    paddingLeft: 4,
    paddingRight: 8,
    paddingBottom: 4,
    flexDirection: 'row',
    alignItems: 'center',
    height: SEARCH_OPTIONS_HEIGHT,
  },
  searchOption: {
    fontFamily: 'System',
    fontSize: 12,
    marginLeft: 10,
    marginRight: 2,
  },
  footer: {
    position: 'absolute',
    left: 0,
    bottom: 0,
    width: '100%',
    backgroundColor: 'red',
  },
});
