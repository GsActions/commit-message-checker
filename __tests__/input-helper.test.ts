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
import {InputOptions} from '@actions/core'

// Late bind
let inputHelper: any

// Mock @actions/core
let inputs = {} as any
const mockCore = jest.genMockFromModule('@actions/core') as any
mockCore.getInput = (name: string, options?: InputOptions) => {
  const val = inputs[name] || ''
  if (options && options.required && !val) {
    throw new Error(`Input required and not supplied: ${name}`)
  }
  return val.trim()
}

// Mock @actions/github
const mockGitHub = jest.genMockFromModule('@actions/github') as any
mockGitHub.context = {}

describe('input-helper tests', () => {
  beforeAll(() => {
    // Mocks
    jest.setMock('@actions/core', mockCore)
    jest.setMock('@actions/github', mockGitHub)

    // Now import
    inputHelper = require('../lib/input-helper')
  })

  beforeEach(() => {
    // Reset inputs and context
    inputs = {}
    mockGitHub.context = {}
  })

  afterAll(() => {
    // Reset modules
    jest.resetModules()
  })

  it('requires pattern', async () => {
    await expect(inputHelper.getInputs()).rejects.toThrow(
      'Input required and not supplied: pattern'
    )
  })

  it('requires error message', async () => {
    inputs.pattern = 'some-pattern'
    await expect(inputHelper.getInputs()).rejects.toThrow(
      'Input required and not supplied: error'
    )
  })

  it('requires event', async () => {
    inputs.pattern = 'some-pattern'
    inputs.error = 'some-error'
    await expect(inputHelper.getInputs()).rejects.toThrow(
      'Event "undefined" is not supported.'
    )
  })

  it('requires valid event', async () => {
    mockGitHub.context = {
      eventName: 'some-event'
    }
    inputs.pattern = 'some-pattern'
    inputs.error = 'some-error'
    await expect(inputHelper.getInputs()).rejects.toThrow(
      'Event "some-event" is not supported.'
    )
  })

  it('sets flags', async () => {
    mockGitHub.context = {
      eventName: 'pull_request',
      payload: {
        pull_request: {
          title: 'some-title',
          body: ''
        }
      }
    }
    inputs.pattern = 'some-pattern'
    inputs.flags = 'abcdefgh'
    inputs.error = 'some-error'
    const checkerArguments: ICheckerArguments = await inputHelper.getInputs()
    expect(checkerArguments.flags).toBe('abcdefgh')
  })

  it('requires pull_request payload', async () => {
    mockGitHub.context = {
      eventName: 'pull_request',
      payload: {
        pull_request: {
          title: '',
          body: ''
        }
      }
    }
    inputs.pattern = 'some-pattern'
    inputs.error = 'some-error'
    await expect(inputHelper.getInputs()).rejects.toThrow(
      'No pull_request found in the payload.'
    )
  })

  it('sets correct pull_request title payload', async () => {
    mockGitHub.context = {
      eventName: 'pull_request',
      payload: {
        pull_request: {
          title: 'some-title',
          body: ''
        }
      }
    }
    inputs.pattern = 'some-pattern'
    inputs.error = 'some-error'
    const checkerArguments: ICheckerArguments = await inputHelper.getInputs()
    expect(checkerArguments).toBeTruthy()
    expect(checkerArguments.pattern).toBe('some-pattern')
    expect(checkerArguments.error).toBe('some-error')
    expect(checkerArguments.messages).toBeTruthy()
    expect(checkerArguments.messages[0]).toBe('some-title')
  })

  it('sets correct pull_request title and body payload', async () => {
    mockGitHub.context = {
      eventName: 'pull_request',
      payload: {
        pull_request: {
          title: 'some-title',
          body: 'some-body'
        }
      }
    }
    inputs.pattern = 'some-pattern'
    inputs.error = 'some-error'
    const checkerArguments: ICheckerArguments = await inputHelper.getInputs()
    expect(checkerArguments).toBeTruthy()
    expect(checkerArguments.pattern).toBe('some-pattern')
    expect(checkerArguments.error).toBe('some-error')
    expect(checkerArguments.messages).toBeTruthy()
    expect(checkerArguments.messages[0]).toBe('some-title\n\nsome-body')
  })

  it('excludes pull_request body payload', async () => {
    mockGitHub.context = {
      eventName: 'pull_request',
      payload: {
        pull_request: {
          title: 'some-title',
          body: 'some-body'
        }
      }
    }
    inputs.pattern = 'some-pattern'
    inputs.error = 'some-error'
    inputs.excludeDescription = '1'
    const checkerArguments: ICheckerArguments = await inputHelper.getInputs()
    expect(checkerArguments).toBeTruthy()
    expect(checkerArguments.pattern).toBe('some-pattern')
    expect(checkerArguments.error).toBe('some-error')
    expect(checkerArguments.messages).toBeTruthy()
    expect(checkerArguments.messages[0]).toBe('some-title')
  })

  it('push payload is optional', async () => {
    mockGitHub.context = {
      eventName: 'push',
      payload: {}
    }
    inputs.pattern = 'some-pattern'
    inputs.error = 'some-error'
    const checkerArguments: ICheckerArguments = await inputHelper.getInputs()
    expect(checkerArguments.messages).toHaveLength(0)
  })

  it('push payload commits is optional', async () => {
    mockGitHub.context = {
      eventName: 'push',
      payload: {
        commits: {}
      }
    }
    inputs.pattern = 'some-pattern'
    inputs.error = 'some-error'
    const checkerArguments: ICheckerArguments = await inputHelper.getInputs()
    expect(checkerArguments.messages).toHaveLength(0)
  })

  it('sets correct single push payload', async () => {
    mockGitHub.context = {
      eventName: 'push',
      payload: {
        commits: [
          {
            message: 'some-message'
          }
        ]
      }
    }
    inputs.pattern = 'some-pattern'
    inputs.error = 'some-error'
    const checkerArguments: ICheckerArguments = await inputHelper.getInputs()
    expect(checkerArguments).toBeTruthy()
    expect(checkerArguments.pattern).toBe('some-pattern')
    expect(checkerArguments.error).toBe('some-error')
    expect(checkerArguments.messages).toBeTruthy()
    expect(checkerArguments.messages[0]).toBe('some-message')
  })

  it('sets correct multiple push payload', async () => {
    mockGitHub.context = {
      eventName: 'push',
      payload: {
        commits: [
          {
            message: 'some-message'
          },
          {
            message: 'other-message'
          }
        ]
      }
    }
    inputs.pattern = 'some-pattern'
    inputs.error = 'some-error'
    const checkerArguments: ICheckerArguments = await inputHelper.getInputs()
    expect(checkerArguments).toBeTruthy()
    expect(checkerArguments.pattern).toBe('some-pattern')
    expect(checkerArguments.error).toBe('some-error')
    expect(checkerArguments.messages).toBeTruthy()
    expect(checkerArguments.messages[0]).toBe('some-message')
    expect(checkerArguments.messages[1]).toBe('other-message')
  })
})
