# Release process

## Versioning

Releases use calendar versioning in the Home Assistant style: `YYYY.M.PATCH`.
`YYYY.M` is the year and month of the release, `PATCH` starts at 0 and counts
releases within that month. Tags have no `v` prefix (for example `2026.7.0`).

## Steps

1. Update `version` in `package.json`.
2. Add a new entry at the top of `CHANGELOG.md` following
   [Common Changelog](https://common-changelog.org/): a
   `## [VERSION](release-url) - YYYY-MM-DD` heading with changes grouped under
   `### Changed`, `### Added`, `### Removed`, `### Fixed`. Entries use
   imperative mood with a commit reference in parentheses.
3. Commit with the message `chore: bump version to VERSION` and push.
4. Create the release:

   ```bash
   gh release create VERSION --title VERSION --notes-file <notes>
   ```

   The release body is the changelog entry with two changes: no version
   heading and no commit hashes. It is copied verbatim into the add-on
   repository's `CHANGELOG.md`, where hashes have nothing to link to.

## What automation does on release publish

- `docker-publish.yml` builds and pushes `ghcr.io/knowald/ha-fusion` for
  amd64, arm64 and armv7, tagged `VERSION` and `latest`.
- `sync-addon.yml` updates `config.yaml` and `CHANGELOG.md` in
  [knowald/addon-ha-fusion](https://github.com/knowald/addon-ha-fusion) and
  pushes. That push triggers the add-on publish workflow, which builds the
  release tag (via the `BUILD_VERSION` build argument in its Dockerfile) and
  pushes the add-on images to Docker Hub.

`sync-addon.yml` needs the `ADDON_REPO_TOKEN` repository secret: a
fine-grained personal access token with contents read/write access to
`knowald/addon-ha-fusion`.
