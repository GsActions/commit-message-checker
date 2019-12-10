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

/**
 * Interface used as arguments for the check function containing the pattern,
 * error message and the messages.
 */
export interface ICheckerArguments {
  pattern: string
  error: string
  messages: string[]
}

/**
 * Checks commit messages given by args.
 *
 * @param     args messages, pattern and error message to process.
 * @returns   void
 */
export async function checkCommitMessages(
  args: ICheckerArguments
): Promise<void> {
  // Check arguments
  if (args.pattern.length === 0) {
    throw new Error(`PATTERN not defined.`)
  }

  if (args.error.length === 0) {
    throw new Error(`ERROR not defined.`)
  }

  if (args.messages.length === 0) {
    throw new Error(`MESSAGES not defined.`)
  }

  // Check messages
  let result = true

  core.info(`Checking commit messages against "${args.pattern}"...`)

  for (const message of args.messages) {
    if (checkMessage(message, args.pattern)) {
      core.info(`- OK: "${message}"`)
    } else {
      core.info(`- failed: "${message}"`)
      result = false
    }
  }

  // Throw error in case of failed test
  if (!result) {
    throw new Error(args.error)
  }
}

/**
 * Checks the message against the regex pattern.
 *
 * @param     message message to check against the pattern.
 * @param     pattern regex pattern for the check.
 * @returns   boolean
 */
function checkMessage(message: string, pattern: string): boolean {
  const regex = new RegExp(pattern, 'gm')
  return regex.test(message)
}
