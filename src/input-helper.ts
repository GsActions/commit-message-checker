/*
 * This file is part of the "GS Commit Message Checker" Action for Github.
 *
 * Copyright (C) 2019 by Gilbertsoft LLC (gilbertsoft.org)
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
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

/**
 * Gets the inputs set by the user and the messages of the event.
 *
 * @returns   ICheckerArguments
 */
export function getInputs(): ICheckerArguments {
  const result = ({} as unknown) as ICheckerArguments

  // Get pattern
  result.pattern = core.getInput('pattern', {required: true})

  // Get error message
  result.error = core.getInput('error', {required: true})

  // Get error message
  result.messages = getMessages()

  return result
}

/**
 * Gets all commit messages of a push or title and body of a pull request
 * concatenated to one message.
 *
 * @returns   string[]
 */
function getMessages(): string[] {
  const messages: string[] = []

  switch (github.context.eventName) {
    case 'pull_request': {
      if (
        github.context.payload &&
        github.context.payload.pull_request &&
        github.context.payload.pull_request.title
      ) {
        let message: string = github.context.payload.pull_request.title
        if (github.context.payload.pull_request.body) {
          message = message.concat(
            '\n\n',
            github.context.payload.pull_request.body
          )
        }
        messages.push(message)
      } else {
        throw new Error(`No pull_request found in the payload.`)
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
      if (messages.length === 0) {
        throw new Error(`No commits found in the payload.`)
      }
      break
    }
    default: {
      throw new Error(`Event "${github.context.eventName}" is not supported.`)
    }
  }

  return messages
}
