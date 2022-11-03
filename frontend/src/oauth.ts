import Hex from 'crypto-js/enc-hex';
import md5 from 'crypto-js/md5';

import { verify } from './jwt';
import { Dispatch, login, setProfile } from './store';

const AUDIENCE = 'https://lights.krantz.dev';
const CHARSET = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz-_~.';
const SCOPE = 'openid profile email groups';

const CLIENT_ID: string = process.env.REACT_APP_AUTHELIA_CLIENT_ID as string;
const DOMAIN: string = process.env.REACT_APP_AUTHELIA_DOMAIN as string;

const encode = (value: string) => window.btoa(value);

const createQueryParams = (params: { [key: string]: string }): string =>
  Object.keys(params)
    .filter((k) => typeof params[k] !== 'undefined')
    .map((k) => encodeURIComponent(k) + '=' + encodeURIComponent(params[k]))
    .join('&');

const sha256 = async (s: string): Promise<ArrayBuffer> =>
  window.crypto.subtle.digest({ name: 'SHA-256' }, new TextEncoder().encode(s));

const createRandomString = (): string => {
  let random = '';
  window.crypto.getRandomValues(new Uint8Array(48)).forEach((v) => (random += CHARSET[v % CHARSET.length]));
  return random;
};

const base64UrlEncode = (input: number[] | Uint8Array): string => {
  const safe = new Uint8Array(input);
  const encoded = window.btoa(String.fromCharCode(...Array.from(safe)));
  return encoded.replace(/\+/g, '-').replace(/\//g, '_').replace(/=/, '');
};

interface CodeChallenge {
  codeVerifier: string;
  codeChallenge: string;
}

const createCodeChallenge = async (): Promise<CodeChallenge> => {
  const verifier = createRandomString();
  const buffer = await sha256(verifier);
  const challenge = base64UrlEncode(buffer as Uint8Array);

  return { codeVerifier: verifier, codeChallenge: challenge };
};

interface State {
  verifier: string;
  nonce: string;
  state: string;
}

const saveState = (state: State): void => sessionStorage.setItem('oidc-state', JSON.stringify(state));
const loadState = (): State | null => {
  const item = sessionStorage.getItem('oidc-state');
  return item ? JSON.parse(item) : null;
};
const deleteState = (): void => sessionStorage.removeItem('oidc-state');

export async function buildAuthorizationUrl(): Promise<string> {
  const state = encode(createRandomString());
  const nonce = encode(createRandomString());
  const { codeChallenge, codeVerifier } = await createCodeChallenge();

  const query = createQueryParams({
    audience: AUDIENCE,
    client_id: CLIENT_ID,
    scope: SCOPE,
    response_type: 'code',
    response_mode: 'query',
    state,
    nonce,
    redirect_uri: window.location.origin + '/oauth/callback',
    code_challenge: codeChallenge,
    code_challenge_method: 'S256',
  });

  saveState({
    verifier: codeVerifier,
    nonce,
    state,
  });

  return `${DOMAIN}/api/oidc/authorize?${query}`;
}

interface AuthenticationResult {
  state: string;
  code?: string;
  error?: string;
  errorDescription?: string;
}

const parseQueryParams = (): AuthenticationResult => {
  const pairs = new URLSearchParams(window.location.search);
  return {
    state: pairs.get('state') ?? '',
    code: pairs.get('code') ?? undefined,
    error: pairs.get('error') ?? undefined,
    errorDescription: pairs.get('error_description') ?? undefined,
  };
};

interface TokenResponse {
  id_token: string;
  access_token: string;
  refresh_token?: string;
  expires_in: number;
  scope?: string;
}

const getToken = async (code: string, codeVerifier: string): Promise<TokenResponse> => {
  const response = await fetch(`${DOMAIN}/api/oidc/token`, {
    method: 'POST',
    body: createQueryParams({
      audience: AUDIENCE,
      client_id: CLIENT_ID,
      code_verifier: codeVerifier,
      grant_type: 'authorization_code',
      code,
      redirect_uri: window.location.origin + '/oauth/callback',
    }),
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
  });

  if (!response.ok) throw new Error(`HTTP error. Unable to fetch: ${response.status}`);
  return (await response.json()) as TokenResponse;
};

const buildAvatarURL = (email: string): string => {
  const normalized = email.trim().toLowerCase();
  const hash = Hex.stringify(md5(normalized));
  return `https://www.gravatar.com/avatar/${hash}.png`;
};

export async function handleCallback(dispatch: Dispatch): Promise<void> {
  const { state, code, error, errorDescription } = parseQueryParams();

  if (error) throw new Error(`${error}: ${errorDescription}`);

  const transaction = loadState();
  if (!transaction) return;

  deleteState();

  if (!transaction.verifier || (transaction.state && transaction.state !== state)) throw new Error('Invalid state');

  const result = await getToken(code ?? '', transaction.verifier);
  const { token, parsed } = verify({
    idToken: result.id_token,
    issuer: DOMAIN,
    audience: CLIENT_ID,
    nonce: transaction.nonce,
  });

  const profile = {
    avatar: buildAvatarURL(parsed.claims.email),
    name: parsed.claims.name,
    email: parsed.claims.email,
  };

  dispatch(setProfile(profile));
  dispatch(login(token));

  cacheToken({
    token,
    expiration: parsed.claims.exp * 1000, // convert to milliseconds
    profile,
  });
}

interface CachedToken {
  token: string;
  expiration: number;
  profile: {
    avatar: string;
    name: string;
    email: string;
  };
}

const cacheToken = (item: CachedToken) => localStorage.setItem('cached-token', JSON.stringify(item));
export function fetchCachedToken(): CachedToken | undefined {
  const item = localStorage.getItem('cached-token');
  if (!item) return undefined;

  const contents = JSON.parse(item) as CachedToken;
  if (Date.now() > contents.expiration) {
    localStorage.removeItem('cached-token');
    return undefined;
  }

  return contents;
}

export function logout() {
  // Wipeout the cached token
  localStorage.removeItem('cached-token');
}
