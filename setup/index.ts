import { Client, ResourceServer, Role } from "@pulumi/auth0";
import { Config, Output } from "@pulumi/pulumi";

const config = new Config();
const domain = config.require("domain");
const logo = config.get("logo");

const SCOPES = {
  ANIMATION_EDITOR: "edit:animations",
  PRESET_EDITOR: "edit:presets",
  SCHEDULE_EDITOR: "edit:schedules",
  LIGHT_CONTROL: "control:lights",
};

// Create the API permissions
const api = new ResourceServer("api", {
  allowOfflineAccess: true,
  name: "Lights",
  identifier: "https://lights.krantz.dev",
  signingAlg: "RS256",
  skipConsentForVerifiableFirstPartyClients: true,
  scopes: [
    {
      description: "Allow editing animations",
      value: SCOPES.ANIMATION_EDITOR,
    },
    {
      description: "Allow editing presets",
      value: SCOPES.PRESET_EDITOR,
    },
    {
      description: "Allow editing schedules",
      value: SCOPES.SCHEDULE_EDITOR,
    },
    {
      description: "Allow controlling the lights",
      value: SCOPES.LIGHT_CONTROL,
    },
  ],

  // Enable RBAC
  enforcePolicies: true,
  tokenDialect: "access_token_authz",
});

// Create the roles for editing stuff and controlling the lights
new Role("editor", {
  name: "Lights Editor",
  description: "Allows editing the different lights constructs",
  permissions: [
    SCOPES.ANIMATION_EDITOR,
    SCOPES.PRESET_EDITOR,
    SCOPES.SCHEDULE_EDITOR,
  ].map((s) => ({
    name: s,
    resourceServerIdentifier: api.identifier as Output<string>,
  })),
});
new Role("lights", {
  name: "Lights Controller",
  description: "Allows controlling the lights",
  permissions: [
    {
      name: SCOPES.LIGHT_CONTROL,
      resourceServerIdentifier: api.identifier as Output<string>,
    },
  ],
});

// Create the client used for authentication
const urls = [
  "http://127.0.0.1:3000",
  "https://127.0.0.1:3000",
  "http://localhost:3000",
  "https://localhost:3000",
  `https://${domain}`,
];
const client = new Client("lights", {
  name: "Lights",
  description: "Control a light strip remotely",
  logoUri: logo,
  appType: "spa",
  isFirstParty: true,
  tokenEndpointAuthMethod: "none",
  grantTypes: ["implicit", "authorization_code", "refresh_token"],
  refreshToken: {
    expirationType: "expiring",
    leeway: 0,
    tokenLifetime: 2592000,
    idleTokenLifetime: 1296000,
    infiniteTokenLifetime: false,
    infiniteIdleTokenLifetime: false,
    rotationType: "rotating",
  },
  jwtConfiguration: {
    alg: "RS256",
    lifetimeInSeconds: 36000,
    secretEncoded: false,
  },
  oidcConformant: true,
  callbacks: urls,
  allowedLogoutUrls: urls,
  webOrigins: urls,
});

export const clientId = client.clientId;
