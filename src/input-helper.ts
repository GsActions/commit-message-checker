/*
 * This file is part of the "GS Commit Message Checker" Action for Github.
 *
 * Copyright (C) 2019-2022 by Gilbertsoft LLC (gilbertsoft.org)
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
 * THE SOFTWARE.
 *
 * For the full license information, please read the LICENSE file that
 * was distributed with this source code.
 */

/**
 * Imports
 */
import * as core from '@actions/core'
import * as github from '@actions/github'
import {graphql} from '@octokit/graphql'
import { ListenOptions } from 'net'
import {ICheckerArguments} from './commit-message-checker'

export interface PullRequestOptions {
  ignoreTitle: boolean
  ignoreDescription: boolean
  checkAllCommitMessages: boolean // requires github token
  accessToken: string
  excludUsersList: Array<string>
}

/**
 * Gets the inputs set by the user and the messages of the event.
 *
 * @returns   ICheckerArguments
 */
export async function getInputs(): Promise<ICheckerArguments> {
  const result = {} as unknown as ICheckerArguments

  core.debug('Get inputs...')

  // Get pattern
  result.pattern = core.getInput('pattern', {required: true})
  core.debug(`pattern: ${result.pattern}`)

  // Get flags
  result.flags = core.getInput('flags')
  core.debug(`flags: ${result.flags}`)

  // Get error message
  result.error = core.getInput('error', {required: true})
  core.debug(`error: ${result.error}`)

  // Get excludeTitle
  const excludeTitleStr = core.getInput('excludeTitle')
  core.debug(`excludeTitle: ${excludeTitleStr}`)

  // Get excludeDescription
  const excludeDescriptionStr = core.getInput('excludeDescription')
  core.debug(`excludeDescription: ${excludeDescriptionStr}`)

  // Get checkAllCommitMessages
  const checkAllCommitMessagesStr = core.getInput('checkAllCommitMessages')
  core.debug(`checkAllCommitMessages: ${checkAllCommitMessagesStr}`)

  const excludUsersList = core.getInput('excludUsers')
  core.debug(`excludUsersList: ${excludUsersList}`)

  // Set pullRequestOptions
  const pullRequestOptions: PullRequestOptions = {
    ignoreTitle: excludeTitleStr
      ? excludeTitleStr === 'true'
      : /* default */ false,
    ignoreDescription: excludeDescriptionStr
      ? excludeDescriptionStr === 'true'
      : /* default */ false,
    checkAllCommitMessages: checkAllCommitMessagesStr
      ? checkAllCommitMessagesStr === 'true'
      : /* default */ false,
    accessToken: core.getInput('accessToken'),
    excludUsersList: Array.from(excludUsersList)
  }
  core.debug(`accessToken: ${pullRequestOptions.accessToken}`)

  // Get commit messages
  result.messages = await getMessages(pullRequestOptions)

  return result
}

/**
 * Gets all commit messages of a push or title and body of a pull request
 * concatenated to one message.
 *
 * @returns   string[]
 */
async function getMessages(
  pullRequestOptions: PullRequestOptions
): Promise<string[]> {
  core.debug('Get messages...')
  core.debug(
    ` - pullRequestOptions: ${JSON.stringify(pullRequestOptions, null, 2)}`
  )

  const messages: string[] = []

  core.debug(` - eventName: ${github.context.eventName}`)
  // core.info(` - context: ${JSON.stringify(github.context)}`)
  core.debug(` - PR: ${github.context.actor}`)

  switch (github.context.eventName) {
    case 'pull_request_target':
    case 'pull_request': {
      if (!github.context.payload) {
        throw new Error('No payload found in the context.')
      }

      if (!github.context.payload.pull_request) {
        throw new Error('No pull_request found in the payload.')
      }

      let message = ''

      // Handle pull request title and body
      if (!pullRequestOptions.ignoreTitle) {
        if (!github.context.payload.pull_request.title) {
          throw new Error('No title found in the pull_request.')
        }

        message += github.context.payload.pull_request.title
      } else {
        core.debug(' - skipping title')
      }

      if (!pullRequestOptions.ignoreDescription) {
        if (github.context.payload.pull_request.body) {
          message = message.concat(
            message !== '' ? '\n\n' : '',
            github.context.payload.pull_request.body
          )
        }
      } else {
        core.debug(' - skipping description')
      }

      if (message) {
        messages.push(message)
      }

      // Handle pull request commits
      if (pullRequestOptions.checkAllCommitMessages) {
        if (!pullRequestOptions.accessToken) {
          throw new Error(
            'The `checkAllCommitMessages` option requires a github access token.'
          )
        }

        if (!github.context.payload.pull_request.number) {
          throw new Error('No number found in the pull_request.')
        }

        if (!github.context.payload.repository) {
          throw new Error('No repository found in the payload.')
        }

        if (!github.context.payload.repository.name) {
          throw new Error('No name found in the repository.')
        }

        if (
          !github.context.payload.repository.owner ||
          (!github.context.payload.repository.owner.login &&
            !github.context.payload.repository.owner.name)
        ) {
          throw new Error('No owner found in the repository.')
        }

        const commitMessages = await getCommitMessagesFromPullRequest(
          pullRequestOptions.accessToken,
          github.context.payload.repository.owner.name ??
            github.context.payload.repository.owner.login,
          github.context.payload.repository.name,
          github.context.payload.pull_request.number,
          pullRequestOptions.excludUsersList
        )

        for (message of commitMessages) {
          if (message) {
            messages.push(message)
          }
        }
      }

      break
    }
    case 'push': {
      if (!github.context.payload) {
        throw new Error('No payload found in the context.')
      }

      if (
        !github.context.payload.commits ||
        !github.context.payload.commits.length
      ) {
        core.debug(' - skipping commits')
        break
      }

      for (const i in github.context.payload.commits) {
        if (github.context.payload.commits[i].message) {
          messages.push(github.context.payload.commits[i].message)
        }
      }

      break
    }
    default: {
      throw new Error(`Event "${github.context.eventName}" is not supported.`)
    }
  }

  return messages
}

async function getCommitMessagesFromPullRequest(
  accessToken: string,
  repositoryOwner: string,
  repositoryName: string,
  pullRequestNumber: number,
  excludUsersList: Array<string>
): Promise<string[]> {
  core.debug('Get messages from pull request...')
  core.debug(` - accessToken: ${accessToken}`)
  core.debug(` - repositoryOwner: ${repositoryOwner}`)
  core.debug(` - repositoryName: ${repositoryName}`)
  core.debug(` - pullRequestNumber: ${pullRequestNumber}`)
  core.debug(` - excludUsersList: ${excludUsersList}`)

  const query = `
  query commitMessages(
    $repositoryOwner: String!
    $repositoryName: String!
    $pullRequestNumber: Int!
    $numberOfCommits: Int = 100
  ) 
  {
    repository(owner: $repositoryOwner, name: $repositoryName) {
      pullRequest(number: $pullRequestNumber) {
        commits(last: $numberOfCommits) {
          edges {
            node {
              commit {
                message
                author {
                  name
                }
              }
            }
          }
        }
      }
    }
  }
`
  const variables = {
    baseUrl: process.env['GITHUB_API_URL'] || 'https://api.github.com',
    repositoryOwner,
    repositoryName,
    pullRequestNumber,
    headers: {
      authorization: `token ${accessToken}`
    }
  }

  core.debug(` - query: ${query}`)
  core.debug(` - variables: ${JSON.stringify(variables, null, 2)}`)

  interface CommitEdgeItem {
    node: {
      commit: {
        message: string
        author: {
          name: string
        }
      }
    }
  }

  interface RepositoryResponseData {
    repository: {
      pullRequest: {
        commits: {
          edges: [CommitEdgeItem]
        }
      }
    }
  }

  const response = await graphql<RepositoryResponseData>(query, variables)
  const repository = response.repository

  core.debug(` - response: ${JSON.stringify(repository, null, 2)}`)

  let messages: string[] = []
  var edgedata = repository.pullRequest.commits.edges
  core.info(`before ${JSON.stringify(edgedata)}`)
  var excludUsersList = ['Amar Khan']
  core.info(`testxxxss ${excludUsersList}`)
  core.info(Object.keys(edgedata).length.toString())
  var edgedataLength: number = +Object.keys(edgedata).length;
  for (let i = 0; i < edgedataLength; i++) {
    core.info(`${i} abccc: ${edgedata[i].node.commit.author.name}`)
    if (excludUsersList.includes(edgedata[i].node.commit.author.name)) {
      core.info(`test314`)
      delete edgedata[i];
    }
  }

  core.info(`edgedata:   ${ JSON.stringify(edgedata) }`)
  if (repository.pullRequest) {
    if (edgedata.filter(obj => obj !== null) && edgedata.filter(obj => obj !== null).length > 0) {
      core.info(`test325`)
      messages = edgedata.map(function (
        edge: CommitEdgeItem
      ): string {
        return edge.node.commit.message
      })
    }
    else {
      messages = []
    }

  }

  return messages
}
