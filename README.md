# GS Commit Message Checker

![Version](https://img.shields.io/github/v/release/gsactions/commit-message-checker?style=flat-square)
![Test](https://github.com/gsactions/commit-message-checker/workflows/test/badge.svg)

A GitHub action that checks that commit messages match a regex patter. The
action is able to act on pull request and push events and check the pull
request title and body or the commit message of the commits of a push.

On pull requests the title and body are concatenated delimited by two line
breaks.

Designed to be very flexible in usage you can split checks into various
workflows, using action types on pull request to listen on, define branches
for pushes etc. etc.

## Configuration

### Example Workflow

```yml
name: 'Commit Message Check'
on:
  pull_request:
    types:
      - opened
      - edited
      - reopened
      - synchronize
  push:
    branches:
      - master
      - 'releases/*'

jobs:
  check-commit-message:
    name: Check Commit Message
    runs-on: ubuntu-latest
    steps:
      - name: Check Title Length
        uses: gsactions/commit-message-checker@v1
        with:
          pattern: '^[^#].{54}'
          error: '${error-common}: the maximum line length of 74 characters is exceeded.'
      - name: Check Commit Type
        uses: gsactions/commit-message-checker@v1
        with:
          pattern: '\[[^]]+\] .+$'
          error: '${error-common}: your first line has to contain a commit type like "[BUGFIX]".'
      - name: Check Line Length
        uses: gsactions/commit-message-checker@v1
        with:
          pattern: '^[^#].{74}'
          error: '${error-common}: the maximum line length of 74 characters is exceeded.'
      - name: Check for Resolves / Fixes
        uses: gsactions/commit-message-checker@v1
        with:
          pattern: '^.+(Resolves|Fixes): \#[0-9]+$'
          error: '${error-common}: you need at least one "Resolves|Fixes: #<issue number>" line.'
```

## Development

### Quick Start

```sh
git clone https://github.com/gsactions/commit-message-checker.git
npm install
npm run build
```

That's it, just start editing the sources...

### Commands

Below is a list of commands you will probably find useful during the development
cycle.

#### `npm run build`

Builds the package to the `lib` folder.

#### `npm run format`

Runs Prettier on .ts and .tsx files and fixes errors.

#### `npm run format-check`

Runs Prettier on .ts and .tsx files without fixing errors.

#### `npm run lint`

Runs Eslint on .ts and .tsx files.

#### `npm run pack`

Bundles the package to the `dist` folder.

#### `npm run test`

Runs Jest test suites.

#### `npm run all`

Runs all of the above commands.

## License

This project is released under the terms of the [MIT License](LICENSE)
