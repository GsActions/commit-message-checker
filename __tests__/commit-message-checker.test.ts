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
import {ICheckerArguments} from '../src/commit-message-checker'

// Late bind
let commitMessageChecker: any

describe('commit-message-checker tests', () => {
  beforeAll(() => {
    // Now import
    commitMessageChecker = require('../lib/commit-message-checker')
  })

  it('requires pattern', async () => {
    const checkerArguments: ICheckerArguments = {
      pattern: '',
      flags: '',
      error: '',
      messages: []
    }
    await expect(
      commitMessageChecker.checkCommitMessages(checkerArguments)
    ).rejects.toThrow('PATTERN not defined.')
  })

  it('requires valid flags', async () => {
    const checkerArguments: ICheckerArguments = {
      pattern: 'some-pattern',
      flags: 'abcdefgh',
      error: '',
      messages: []
    }
    await expect(
      commitMessageChecker.checkCommitMessages(checkerArguments)
    ).rejects.toThrow('FLAGS contains invalid characters "abcdefh".')
  })

  it('requires error message', async () => {
    const checkerArguments: ICheckerArguments = {
      pattern: 'some-pattern',
      flags: '',
      error: '',
      messages: []
    }
    await expect(
      commitMessageChecker.checkCommitMessages(checkerArguments)
    ).rejects.toThrow('ERROR not defined.')
  })

  it('requires messages', async () => {
    const checkerArguments: ICheckerArguments = {
      pattern: 'some-pattern',
      flags: '',
      error: 'some-error',
      messages: []
    }
    await expect(
      commitMessageChecker.checkCommitMessages(checkerArguments)
    ).rejects.toThrow('MESSAGES not defined.')
  })

  describe('single message, without a match', () => {
    const checkerArguments: ICheckerArguments = {
      pattern: 'some-pattern',
      flags: '',
      error: 'some-error',
      messages: ['some-message']
    }

    it('fails by default', async () => {
      await expect(
        commitMessageChecker.checkCommitMessages(checkerArguments)
      ).rejects.toThrow('some-error')
    })

    it('succeeds via `failOnMatch`', async () => {
      await expect(
        commitMessageChecker.checkCommitMessages({
          ...checkerArguments,
          failOnMatch: true
        })
      ).resolves.toBeUndefined()
    })
  })

  describe('single message, with a match', () => {
    const checkerArguments: ICheckerArguments = {
      pattern: '.*',
      flags: '',
      error: 'some-error',
      messages: ['some-message']
    }

    it('succeeds by default', async () => {
      await expect(
        commitMessageChecker.checkCommitMessages(checkerArguments)
      ).resolves.toBeUndefined()
    })

    it('fails via `failOnMatch`', async () => {
      await expect(
        commitMessageChecker.checkCommitMessages({
          ...checkerArguments,
          failOnMatch: true
        })
      ).rejects.toThrow('some-error')
    })
  })

  describe('multiple messages, with a single match', () => {
    const checkerArguments: ICheckerArguments = {
      pattern: 'some-pattern',
      flags: '',
      error: 'some-error',
      messages: ['some-message', 'some-pattern']
    }

    it('fails by default', async () => {
      await expect(
        commitMessageChecker.checkCommitMessages(checkerArguments)
      ).rejects.toThrow('some-error')
    })

    it('fails via `failOnMatch`', async () => {
      await expect(
        commitMessageChecker.checkCommitMessages({
          ...checkerArguments,
          failOnMatch: true
        })
      ).rejects.toThrow('some-error')
    })
  })

  describe('multiple messages, without any match', () => {
    const checkerArguments: ICheckerArguments = {
      pattern: 'some-pattern',
      flags: '',
      error: 'some-error',
      messages: ['some-message', 'other-message']
    }

    it('fails by default', async () => {
      await expect(
        commitMessageChecker.checkCommitMessages(checkerArguments)
      ).rejects.toThrow('some-error')
    })

    it('succeeds via `failOnMatch`', async () => {
      await expect(
        commitMessageChecker.checkCommitMessages({
          ...checkerArguments,
          failOnMatch: true
        })
      ).resolves.toBeUndefined()
    })
  })

  describe('multiple messages, all matching', () => {
    const checkerArguments: ICheckerArguments = {
      pattern: '.*',
      flags: '',
      error: 'some-error',
      messages: ['some-message', 'other-message']
    }

    it('succeeds by default', async () => {
      await expect(
        commitMessageChecker.checkCommitMessages(checkerArguments)
      ).resolves.toBeUndefined()
    })

    it('fails via `failOnMatch`', async () => {
      await expect(
        commitMessageChecker.checkCommitMessages({
          ...checkerArguments,
          failOnMatch: true
        })
      ).rejects.toThrow('some-error')
    })
  })
})
