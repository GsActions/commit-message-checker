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

// Mock @octokit/graphql
let graphqlResponse = {} as any
const mockGraphql = jest.genMockFromModule('@octokit/graphql') as any
mockGraphql.graphql = (query: string, parameters?: any): any => {
  return graphqlResponse
}

describe('input-helper tests', () => {
  beforeAll(() => {
    // Mocks
    jest.setMock('@actions/core', mockCore)
    jest.setMock('@actions/github', mockGitHub)
    jest.setMock('@octokit/graphql', mockGraphql)

    // Now import
    inputHelper = require('../lib/input-helper')
  })

  beforeEach(() => {
    // Reset inputs and context
    inputs = {}
    mockGitHub.context = {}
    graphqlResponse = {}
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

  it('sets pattern', async () => {
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
    expect(checkerArguments.pattern).toBe('some-pattern')
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

  it('sets error', async () => {
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
    expect(checkerArguments.error).toBe('some-error')
  })

  it('requires pull_request payload', async () => {
    mockGitHub.context = {
      eventName: 'pull_request'
    }
    inputs.pattern = 'some-pattern'
    inputs.error = 'some-error'
    await expect(inputHelper.getInputs()).rejects.toThrow(
      'No payload found in the context.'
    )
  })

  it('requires pull_request', async () => {
    mockGitHub.context = {
      eventName: 'pull_request',
      payload: {}
    }
    inputs.pattern = 'some-pattern'
    inputs.error = 'some-error'
    await expect(inputHelper.getInputs()).rejects.toThrow(
      'No pull_request found in the payload.'
    )
  })

  it('requires pull_request title', async () => {
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
      'No title found in the pull_request.'
    )
  })

  it('sets pull_request title', async () => {
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
    expect(checkerArguments.messages).toBeTruthy()
    expect(checkerArguments.messages[0]).toBe('some-title')
  })

  it('sets pull_request title and body', async () => {
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
    expect(checkerArguments.messages).toBeTruthy()
    expect(checkerArguments.messages[0]).toBe('some-title\n\nsome-body')
  })

  it('excludes pull_request body', async () => {
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
    inputs.excludeDescription = 'true'
    const checkerArguments: ICheckerArguments = await inputHelper.getInputs()
    expect(checkerArguments).toBeTruthy()
    expect(checkerArguments.messages).toBeTruthy()
    expect(checkerArguments.messages[0]).toBe('some-title')
  })

  it('excludes pull_request title', async () => {
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
    inputs.excludeTitle = 'true'
    const checkerArguments: ICheckerArguments = await inputHelper.getInputs()
    expect(checkerArguments).toBeTruthy()
    expect(checkerArguments.messages).toBeTruthy()
    expect(checkerArguments.messages[0]).toBe('some-body')
  })

  it('excludes pull_request title and body', async () => {
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
    inputs.excludeDescription = 'true'
    inputs.excludeTitle = 'true'
    const checkerArguments: ICheckerArguments = await inputHelper.getInputs()
    expect(checkerArguments).toBeTruthy()
    expect(checkerArguments.messages).toBeTruthy()
    expect(checkerArguments.messages.length).toBe(0)
  })

  it('requires accessToken', async () => {
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
    inputs.checkAllCommitMessages = 'true'
    await expect(inputHelper.getInputs()).rejects.toThrow(
      'The `checkAllCommitMessages` option requires a github access token.'
    )
  })

  it('requires pull_request number', async () => {
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
    inputs.checkAllCommitMessages = 'true'
    inputs.accessToken = 'dummy-token'
    await expect(inputHelper.getInputs()).rejects.toThrow(
      'No number found in the pull_request.'
    )
  })

  it('requires repository', async () => {
    mockGitHub.context = {
      eventName: 'pull_request',
      payload: {
        pull_request: {
          title: 'some-title',
          body: '',
          number: 12345
        }
      }
    }
    inputs.pattern = 'some-pattern'
    inputs.error = 'some-error'
    inputs.checkAllCommitMessages = 'true'
    inputs.accessToken = 'dummy-token'
    await expect(inputHelper.getInputs()).rejects.toThrow(
      'No repository found in the payload.'
    )
  })

  it('requires repository name', async () => {
    mockGitHub.context = {
      eventName: 'pull_request',
      payload: {
        pull_request: {
          title: 'some-title',
          body: '',
          number: 12345
        },
        repository: {}
      }
    }
    inputs.pattern = 'some-pattern'
    inputs.error = 'some-error'
    inputs.checkAllCommitMessages = 'true'
    inputs.accessToken = 'dummy-token'
    await expect(inputHelper.getInputs()).rejects.toThrow(
      'No name found in the repository.'
    )
  })

  it('requires repository owner (1)', async () => {
    mockGitHub.context = {
      eventName: 'pull_request',
      payload: {
        pull_request: {
          title: 'some-title',
          body: '',
          number: 12345
        },
        repository: {
          name: 'repository-name'
        }
      }
    }
    inputs.pattern = 'some-pattern'
    inputs.error = 'some-error'
    inputs.checkAllCommitMessages = 'true'
    inputs.accessToken = 'dummy-token'
    await expect(inputHelper.getInputs()).rejects.toThrow(
      'No owner found in the repository.'
    )
  })

  it('requires repository owner (2)', async () => {
    mockGitHub.context = {
      eventName: 'pull_request',
      payload: {
        pull_request: {
          title: 'some-title',
          body: '',
          number: 12345
        },
        repository: {
          name: 'repository-name',
          owner: {}
        }
      }
    }
    inputs.pattern = 'some-pattern'
    inputs.error = 'some-error'
    inputs.checkAllCommitMessages = 'true'
    inputs.accessToken = 'dummy-token'
    await expect(inputHelper.getInputs()).rejects.toThrow(
      'No owner found in the repository.'
    )
  })

  it('sets pull_request commits', async () => {
    mockGitHub.context = {
      eventName: 'pull_request',
      payload: {
        pull_request: {
          title: 'some-title',
          body: 'some-body',
          number: 1
        },
        repository: {
          owner: {
            name: 'some-owner'
          },
          name: 'some-repo'
        }
      }
    }

    inputs.pattern = 'some-pattern'
    inputs.error = 'some-error'
    inputs.excludeDescription = 'true'
    inputs.excludeTitle = 'true'
    inputs.checkAllCommitMessages = 'true'
    inputs.accessToken = 'some-token'

    const response = {
      repository: {
        pullRequest: {
          commits: {
            edges: [
              {
                node: {
                  commit: {
                    message:
                      'input: make input-helper functions async\n\nIn order to work with asynchronous call like an async http request\nin an easier way, the functions getInput and getMessages were\nconverted to async.'
                  }
                }
              },
              {
                node: {
                  commit: {
                    message:
                      "input: PR options ignore title and check PR commits\n\nthis make it possible to igore partially or completely the PR payload.\nThe commits associated with the pull request can be checked instead of\nchecking the pull request payload. The parameter are:\n\n- excludeTitle: 'true | false'\n- excludeDescription: 'true | false'\n- checkAllCommitMessages: 'true | false'\n\nby default, all options comes false."
                  }
                }
              },
              {
                node: {
                  commit: {
                    message:
                      'docs: include parameters excludeTitle, checkAllCommitMessages and accessToken\n\nCo-authored-by: Gilbertsoft <25326036+gilbertsoft@users.noreply.github.com>'
                  }
                }
              }
            ]
          }
        }
      }
    }

    graphqlResponse = response

    const checkerArguments: ICheckerArguments = await inputHelper.getInputs()
    expect(checkerArguments).toBeTruthy()
    expect(checkerArguments.pattern).toBe('some-pattern')
    expect(checkerArguments.error).toBe('some-error')
    expect(checkerArguments.messages).toBeTruthy()
    expect(checkerArguments.messages.length).toBe(3)
  })

  it('require push payload', async () => {
    mockGitHub.context = {
      eventName: 'push'
    }
    inputs.pattern = 'some-pattern'
    inputs.error = 'some-error'
    await expect(inputHelper.getInputs()).rejects.toThrow(
      'No payload found in the context.'
    )
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
