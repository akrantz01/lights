import { Client, ResourceServer, Role } from "@pulumi/auth0";
import { Config, Output } from "@pulumi/pulumi";

const config = new Config();
const domain = config.require("domain");
const logo = config.get("logo");

const SCOPES = {
  ANIMATION_EDITOR: "animations:edit",
  PRESET_EDITOR: "presets:edit",
  SCHEDULE_EDITOR: "schedules:edit",
  LIGHT_CONTROL: "lights:control",
};

// Create the API permissions
const api = new ResourceServer("api", {
  allowOfflineAccess: false,
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
  "http://localhost:3000",
  `https://${domain}`,
];
const client = new Client("lights", {
  name: "Lights",
  description: "Control a light strip remotely",
  logoUri: logo,
  appType: "spa",
  isFirstParty: true,
  callbacks: urls,
  allowedLogoutUrls: urls,
  webOrigins: urls,
});

export const clientId = client.clientId;
