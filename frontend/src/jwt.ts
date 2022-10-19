const decodeBase64 = (input: string) =>
  decodeURIComponent(
    window
      .atob(input.replace(/_/g, '/').replace(/-/g, '+'))
      .split('')
      .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
      .join(''),
  );

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const isNumber = (n: any) => typeof n === 'number';

interface IdToken {
  header: IdTokenHeader;
  claims: IdTokenClaims;
}

interface IdTokenHeader {
  alg: string;
}

interface IdTokenClaims {
  iss: string;
  aud: string | string[];
  azp: string;
  nonce: string;
  exp: number;
  iat: number;
  nbf: number;
  sub: string;

  email: string;
  groups: string[];
  name: string;
}

export const decode = (token: string): IdToken => {
  const parts = token.split('.');
  const [header, payload, signature] = parts;

  if (parts.length !== 3 || !header || !payload || !signature) {
    throw new Error('ID token could not be decoded');
  }

  return {
    header: JSON.parse(decodeBase64(header)),
    claims: JSON.parse(decodeBase64(payload)),
  };
};

interface JWTVerifyOptions {
  idToken: string;
  issuer: string;
  audience: string;
  nonce: string;
  leeway?: number;
  now?: number;
}

interface VerifiedToken {
  parsed: IdToken;
  token: string;
}

export const verify = (options: JWTVerifyOptions): VerifiedToken => {
  if (!options.idToken) {
    throw new Error('ID token is required but missing');
  }

  const decoded = decode(options.idToken);

  if (!decoded.claims.iss) {
    throw new Error('Issuer (iss) claim must be a string present in the ID token');
  }

  if (decoded.claims.iss !== options.issuer) {
    throw new Error(
      `Issuer (iss) claim mismatch in the ID token; expected "${options.issuer}", found "${decoded.claims.iss}"`,
    );
  }

  if (!decoded.claims.sub) {
    throw new Error('Subject (sub) claim must be a string present in the ID token');
  }

  if (decoded.header.alg !== 'RS256') {
    throw new Error(
      `Signature algorithm of "${decoded.header.alg}" is not supported. Expected the ID token to be signed with "RS256".`,
    );
  }

  if (!decoded.claims.aud || !(typeof decoded.claims.aud === 'string' || Array.isArray(decoded.claims.aud))) {
    throw new Error('Audience (aud) claim must be a string or array of strings present in the ID token');
  }
  if (Array.isArray(decoded.claims.aud)) {
    if (!decoded.claims.aud.includes(options.audience)) {
      throw new Error(
        `Audience (aud) claim mismatch in the ID token; expected "${
          options.audience
        }" but was not one of "${decoded.claims.aud.join(', ')}"`,
      );
    }
    if (decoded.claims.aud.length > 1) {
      if (!decoded.claims.azp) {
        throw new Error(
          'Authorized Party (azp) claim must be a string present in the ID token when Audience (aud) claim has multiple values',
        );
      }
      if (decoded.claims.azp !== options.audience) {
        throw new Error(
          `Authorized Party (azp) claim mismatch in the ID token; expected "${options.audience}", found "${decoded.claims.azp}"`,
        );
      }
    }
  } else if (decoded.claims.aud !== options.audience) {
    throw new Error(
      `Audience (aud) claim mismatch in the ID token; expected "${options.audience}" but found "${decoded.claims.aud}"`,
    );
  }
  if (options.nonce) {
    if (!decoded.claims.nonce) {
      throw new Error('Nonce (nonce) claim must be a string present in the ID token');
    }
    if (decoded.claims.nonce !== options.nonce) {
      throw new Error(
        `Nonce (nonce) claim mismatch in the ID token; expected "${options.nonce}", found "${decoded.claims.nonce}"`,
      );
    }
  }

  /* istanbul ignore next */
  if (!isNumber(decoded.claims.exp)) {
    throw new Error('Expiration Time (exp) claim must be a number present in the ID token');
  }
  if (!isNumber(decoded.claims.iat)) {
    throw new Error('Issued At (iat) claim must be a number present in the ID token');
  }

  const leeway = options.leeway || 60;
  const now = new Date(options.now || Date.now());
  const expDate = new Date(0);
  const nbfDate = new Date(0);

  expDate.setUTCSeconds(decoded.claims.exp + leeway);
  nbfDate.setUTCSeconds(decoded.claims.nbf - leeway);

  if (now > expDate) {
    throw new Error(
      `Expiration Time (exp) claim error in the ID token; current time (${now}) is after expiration time (${expDate})`,
    );
  }

  if (isNumber(decoded.claims.nbf) && now < nbfDate) {
    throw new Error(
      `Not Before time (nbf) claim in the ID token indicates that this token can't be used just yet. Currrent time (${now}) is before ${nbfDate}`,
    );
  }

  return {
    parsed: decoded,
    token: options.idToken,
  };
};
