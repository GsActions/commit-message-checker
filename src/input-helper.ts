/*
 * This file is part of the "GS Commit Message Checker" Action for Github.
 *
 * Copyright (C) 2019 by Gilbertsoft LLC (gilbertsoft.org)
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
import {ICheckerArguments} from './commit-message-checker'
const fetch = require('node-fetch')

export interface PullRequestOptions {
  ignoreTitle: boolean
  ignoreDescription: boolean
  checkAllCommitMessages: boolean // requires github token
  accessToken: string
}

/**
 * Gets the inputs set by the user and the messages of the event.
 *
 * @returns   ICheckerArguments
 */
export async function getInputs(): Promise<ICheckerArguments> {
  const result = ({} as unknown) as ICheckerArguments

  // Get pattern
  result.pattern = core.getInput('pattern', {required: true})

  // Get flags
  result.flags = core.getInput('flags')

  // Get error message
  result.error = core.getInput('error', {required: true})

  let excludeTitleStr = core.getInput('excludeTitle')
  let excludeDescriptionStr = core.getInput('excludeDescription')
  let checkAllCommitMessagesStr = core.getInput('checkAllCommitMessages')

  // Get excludeDescription
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
    accessToken: core.getInput('accessToken')
  }
  // Get error message
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
  const messages: string[] = []

  switch (github.context.eventName) {
    case 'pull_request': {
      if (
        github.context.payload &&
        github.context.payload.pull_request &&
        github.context.payload.pull_request.title
      ) {
        let message: string = ''

        if (!pullRequestOptions.ignoreTitle) {
          message += github.context.payload.pull_request.title
        }

        if (
          github.context.payload.pull_request.body &&
          !pullRequestOptions.ignoreDescription
        ) {
          message = message.concat(
            message !== '' ? '\n\n' : '',
            github.context.payload.pull_request.body
          )
        }
        // dont add message if title and body were ignored
        if (
          !pullRequestOptions.ignoreTitle ||
          !pullRequestOptions.ignoreDescription
        ) {
          messages.push(message)
        }
      } else {
        throw new Error(`No pull_request found in the payload.`)
      }

      if (pullRequestOptions.checkAllCommitMessages) {
        if (!pullRequestOptions.accessToken) {
          throw new Error(
            `checkAllCommitMessaages option requires a github access token.`
          )
        }
        const commitMessages = await getCommitMessagesFromPullRequest(
          pullRequestOptions.accessToken
        )
        for (const i in commitMessages) {
          if (commitMessages[i]) {
            messages.push(commitMessages[i])
          }
        }
      }

      break
    }
    case 'push': {
      if (
        github.context.payload &&
        github.context.payload.commits &&
        github.context.payload.commits.length
      ) {
        for (const i in github.context.payload.commits) {
          if (github.context.payload.commits[i].message) {
            messages.push(github.context.payload.commits[i].message)
          }
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
  accessToken: string
): Promise<any> {
  const pullRequest = github.context.payload.pull_request
  const repo = github.context.payload.repository
  if (!repo || !pullRequest) return null

  const body = {
    query: `
    query{
      repository(owner: "${repo.owner.name}", name:"${repo.name}") {
        pullRequest(number: ${pullRequest.number}) {
          commits (last: 100) {
            edges {
              node {
                commit {
                  message
                }
              }
            }
          }
        }
      }
    }
    `
  }

  const response = await fetch('https://api.github.com/graphql', {
    method: 'post',
    body: JSON.stringify(body),
    headers: {
      'Content-Type': 'application/json',
      Authorization: 'bearer ' + accessToken
    }
  })
  const json = await response.json()
  const messages = json.data.repository.pullRequest.commits.edges.map(function(
    commit: any
  ) {
    return commit.node.commit.message
  })
  return messages
}
