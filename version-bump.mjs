import { readFileSync, writeFileSync } from 'fs';

const targetVersion = process.env.npm_package_version;

// read minAppVersion from manifest.json and bump version to target version
let manifest = JSON.parse(readFileSync('manifest.json', 'utf8'));
const { minAppVersion } = manifest;
manifest.version = targetVersion;
writeFileSync('manifest.json', JSON.stringify(manifest, null, '\t'));

// update versions.json with target version and minAppVersion from manifest.json
let versions = JSON.parse(readFileSync('versions.json', 'utf8'));
versions[targetVersion] = minAppVersion;
writeFileSync('versions.json', JSON.stringify(versions, null, '\t'));

// Create a git tag for the new version
import { execSync } from 'child_process';
// First check tag doesn't already exist
try {
  // Supress output
  execSync(`git rev-parse v${targetVersion}`, { stdio: 'ignore' });
  console.log(`Tag v${targetVersion} already exists`);
  process.exit(1);
} catch (e) {
  // Tag doesn't exist, so we can continue
}
execSync(`git add . && git commit -m "Bump version to ${targetVersion}"`);
execSync(`git tag -a ${targetVersion} -m "${targetVersion}"`);
