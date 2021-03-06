import Config from 'react-native-config';
import * as Keychain from 'react-native-keychain';
import { authorize, refresh, revoke } from 'react-native-app-auth';

const config = {
  clientId: Config.OAUTH_CLIENT_ID,
  clientSecret: Config.OAUTH_CLIENT_SECRET,
  redirectUrl: 'arkhamcards://auth/redirect',
  serviceConfiguration: {
    authorizationEndpoint: 'https://arkhamdb.com/oauth/v2/auth',
    tokenEndpoint: 'https://arkhamdb.com/oauth/v2/token',
    revocationEndpoint: 'https://arkhamdb.com/oauth/v2/revoke',
  },
};

function saveAuthResponse(response) {
  const serialized = JSON.stringify(response);
  return Keychain.setGenericPassword('arkhamdb', serialized)
    .then(() => {
      return response.accessToken;
    });
}

export function getRefreshToken() {
  return Keychain.getGenericPassword()
    .then(creds => {
      if (creds) {
        const data = JSON.parse(creds.password);
        return data.refreshToken;
      }
      return null;
    });
}

export function getAccessToken() {
  return Keychain.getGenericPassword()
    .then(creds => {
      if (creds) {
        const data = JSON.parse(creds.password);
        const nowSeconds = (new Date()).getTime() / 1000;
        const expiration = new Date(data.accessTokenExpirationDate).getTime() / 1000;
        if (data.refreshToken && expiration < nowSeconds) {
          return refresh(config, { refreshToken: data.refreshToken })
            .then(saveAuthResponse);
        }
        return data.accessToken;
      }
      return null;
    });
}

export function signInFlow() {
  return authorize(config)
    .then(saveAuthResponse)
    .then(() => {
      return {
        success: true,
      };
    }, error => {
      return {
        success: false,
        error: error.message || error,
      };
    });
}

export function signOutFlow() {
  return getAccessToken().then(accessToken => {
    if (accessToken) {
      revoke(config, { tokenToRevoke: accessToken });
    }
  }, () => {
    // Ignore error.
  }).then(() => {
    return getRefreshToken().then(refreshToken => {
      if (refreshToken) {
        revoke(config, { tokenToRevoke: refreshToken });
      }
    });
  }, () => {
    // Ignore error;
  }).then(() => {
    Keychain.resetGenericPassword();
  });
}

export default {
  signInFlow,
  signOutFlow,
  getAccessToken,
};
