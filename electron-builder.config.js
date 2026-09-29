const requireSigning = process.env.WINDOWS_SIGNING_REQUIRED === 'true';
const releaseIdentity = require('./release-identity.json');
const localArtifacts = require('./scripts/local-build-label').localArtifactNames(process.env.HD2CSM_LOCAL_BUILD_LABEL);
const enableSigning = process.env.WINDOWS_SIGNING_ENABLED === 'true' || requireSigning;

const requiredSigningEnv = [
  'AZURE_TENANT_ID',
  'AZURE_CLIENT_ID',
  'AZURE_CLIENT_SECRET',
  'AZURE_TRUSTED_SIGNING_ENDPOINT',
  'AZURE_TRUSTED_SIGNING_ACCOUNT_NAME',
  'AZURE_TRUSTED_SIGNING_CERTIFICATE_PROFILE_NAME',
  'WINDOWS_SIGNING_PUBLISHER_NAME',
];

if (requireSigning) {
  const missing = requiredSigningEnv.filter((name) => !process.env[name]);
  if (missing.length > 0) {
    throw new Error(`Windows release signing is required, but these environment variables are missing: ${missing.join(', ')}`);
  }
}

const win = {
  target: [
    {
      target: 'zip',
      arch: ['x64'],
    },
    {
      // `nsis` embeds the application payload. Unlike `nsis-web`, the finished
      // installer does not need an internet connection to install the app.
      target: 'nsis',
      arch: ['x64'],
    },
  ],
  icon: 'build/icon.ico',
};

if (!enableSigning) {
  win.signExecutable = false;
}

if (enableSigning) {
  win.azureSignOptions = {
    publisherName: process.env.WINDOWS_SIGNING_PUBLISHER_NAME,
    endpoint: process.env.AZURE_TRUSTED_SIGNING_ENDPOINT,
    codeSigningAccountName: process.env.AZURE_TRUSTED_SIGNING_ACCOUNT_NAME,
    certificateProfileName: process.env.AZURE_TRUSTED_SIGNING_CERTIFICATE_PROFILE_NAME,
    fileDigest: 'SHA256',
    timestampDigest: 'SHA256',
    timestampRfc3161: process.env.WINDOWS_SIGNING_TIMESTAMP_RFC3161 || 'http://timestamp.acs.microsoft.com',
  };
}

module.exports = {
  // Fail closed even when the builder is called directly instead of via npm.
  beforePack: async () => {
    require('./scripts/prepare-installer-shell').assertPrepared(__dirname);
    require('./scripts/installer-component-policy').verifySourceMaterials(__dirname);
  },
  productName: releaseIdentity.productName,
  executableName: releaseIdentity.productName,
  appId: 'com.bootsoftango.helldivers2chaosslotmachine',
  forceCodeSigning: requireSigning,
  electronFuses: {
    runAsNode: false,
    enableNodeOptionsEnvironmentVariable: false,
    enableNodeCliInspectArguments: false,
    enableEmbeddedAsarIntegrityValidation: true,
    onlyLoadAppFromAsar: true,
    // Electron 44 denies file-origin localStorage when false. Retain only for
    // the script-free legacy reader; the application itself uses hd2-slot://.
    grantFileProtocolExtraPrivileges: true,
  },
  files: [
    'index.html',
    'electron/**/*',
    'assets/**/*',
    'build/icon.ico',
    'build/icon.png',
    '*.png',
    'LICENSE.txt',
    'NOTICE.txt',
    'README.md',
    'package.json',
    'release-identity.json',
    '!**/.git/**',
    '!**/node_modules/**',
    '!test/**',
    '!scripts/**',
    '!*.md',
    'README.md',
    '!RELEASE_NOTES*.md',
    'THIRD_PARTY_NOTICES.md',
    'SECURITY.md',
    '!sample-card-tidied.html',
    '!**/*.map',
    '!**/*.tmp',
    '!**/*.log',
    '!**/.env*',
    '!**/*secret*',
    '!**/coverage/**',
  ],
  directories: {
    buildResources: 'build',
  },
  win,
  // Keep this in sync with scripts/verify_win_zip.py and the release workflow.
  artifactName: localArtifacts?.archive || `${releaseIdentity.artifactStem}-v${releaseIdentity.publicVersion}-win-\${arch}.\${ext}`,
  nsis: {
    include: 'installer/integration.nsh',
    // Keep the installer distinguishable from the portable ZIP while retaining
    // the same version/architecture fields used by release automation.
    artifactName: localArtifacts?.installer || `${releaseIdentity.artifactStem}-Setup-v${releaseIdentity.publicVersion}-win-\${arch}.\${ext}`,
    oneClick: false,
    perMachine: false,
    allowElevation: true,
    allowToChangeInstallationDirectory: true,
    createDesktopShortcut: true,
    createStartMenuShortcut: true,
    shortcutName: releaseIdentity.productName,
    uninstallDisplayName: `${releaseIdentity.productName} ${releaseIdentity.displayVersion}`,
    deleteAppDataOnUninstall: false,
  },
  extraFiles: [
    { from: 'licenses/builder', to: 'licenses/builder' },
    { from: 'installer', to: 'licenses/hd2-shell' },
    { from: 'licenses/installer', to: 'licenses/installer' },
    { from: 'LICENSE.txt', to: 'LICENSE.txt' },
    { from: 'NOTICE.txt', to: 'NOTICE.txt' },
    { from: 'THIRD_PARTY_NOTICES.md', to: 'THIRD_PARTY_NOTICES.md' },
    { from: 'SECURITY.md', to: 'SECURITY.md' },
    {
      from: 'README-FIRST.txt',
      to: 'README-FIRST.txt',
    },
  ],
  extraResources: [
    {
      from: 'build/icon.ico',
      to: 'build/icon.ico',
    },
    {
      from: 'build/icon.png',
      to: 'build/icon.png',
    },
  ],
};
