# GS Commit Message Checker

![Version](https://img.shields.io/github/v/release/gsactions/commit-message-checker?style=flat-square)
![Test](https://github.com/gsactions/commit-message-checker/workflows/build-test/badge.svg)

A GitHub action that checks that commit messages match a regex pattern. The
action is able to act on pull request and push events and check the pull
request title and body, or the commit message of the commits of a push.

On pull requests the title and body are concatenated, delimited by two line
breaks.

Designed to be very flexible in usage, you can split checks into various
workflows, use action types on pull request to listen on, define branches
for pushes etc. etc.

## Configuration

See also [action definition](action.yml) and the following example workflow.

More information about `pattern` and `flags` can be found in the
[JavaScript reference](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/RegExp).

`flags` is optional and defaults to `gm`.

`excludeDescription`, `excludeTitle` and `checkAllCommitMessages` are optional.
Default behavior is to include the description and title and not check pull
request commit messages.

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
  pull_request_target:
    types:
      - opened
      - edited
      - reopened
      - synchronize
  push:
    branches:
      - main
      - 'releases/*'

jobs:
  check-commit-message:
    name: Check Commit Message
    runs-on: ubuntu-latest
    steps:
      - name: Check Commit Type
        uses: gsactions/commit-message-checker@v2
        with:
          pattern: '\[[^]]+\] .+$'
          flags: 'gm'
          error: 'Your first line has to contain a commit type like "[BUGFIX]".'
      - name: Check Line Length
        uses: gsactions/commit-message-checker@v2
        with:
          pattern: '^[^#].{74}'
          error: 'The maximum line length of 74 characters is exceeded.'
          excludeDescription: 'true' # optional: this excludes the description body of a pull request
          excludeTitle: 'true' # optional: this excludes the title of a pull request
          checkAllCommitMessages: 'true' # optional: this checks all commits associated with a pull request
          accessToken: ${{ secrets.GITHUB_TOKEN }} # github access token is only required if checkAllCommitMessages is true
      - name: Check for Resolves / Fixes
        uses: gsactions/commit-message-checker@v2
        with:
          pattern: '^.+(Resolves|Fixes): \#[0-9]+$'
          error: 'You need at least one "Resolves|Fixes: #<issue number>" line.'
```

### Troubleshooting and debugging

Most of the questions being asked here are not about bugs or missing features in
this action, but about not enough information about what is going on in the
background. A good first starting point is to [enable debug logging](https://docs.github.com/en/actions/monitoring-and-troubleshooting-workflows/enabling-debug-logging)
for the action, which can be accomplished by adding secrets to your repository.
After that, many additional information will appear in the logs and you should
be able to set up your configuration properly.

There are some really good tools that you can use to set up your pattern
properly for your needs. My favorite tool is <https://regexr.com/> which works
very well with this action.

If you need additional support, please head to the [GitHub Discussions](https://github.com/GsActions/commit-message-checker/discussions)
of this repository.

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

Runs all the above commands.

### Debugging

More information about debugging GitHub Actions can be found at <https://github.com/actions/toolkit/blob/main/docs/action-debugging.md>.

The secrets `ACTIONS_STEP_DEBUG` and `ACTIONS_RUNNER_DEBUG` are both set to
`true` in the main repository.

## License

This project is released under the terms of the [MIT License](LICENSE)
