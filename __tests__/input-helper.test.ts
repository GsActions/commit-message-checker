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
interface IGraphqlResponseGetter {
  (parameters?: any): any
}
let graphqlResponse = {} as any

function defaultGraphqlResponseGetter(parameters?: any): any {
  return graphqlResponse
}

let getGraphqlResponse: IGraphqlResponseGetter = defaultGraphqlResponseGetter
const mockGraphql = jest.genMockFromModule('@octokit/graphql') as any
mockGraphql.graphql = (query: string, parameters?: any): any => {
  return getGraphqlResponse(parameters)
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
    getGraphqlResponse = defaultGraphqlResponseGetter
  })

  afterAll(() => {
    // Reset modules
    jest.resetModules()
  })

  it('inputs: requires pattern', async () => {
    await expect(inputHelper.getInputs()).rejects.toThrow(
      'Input required and not supplied: pattern'
    )
  })

  it('inputs: requires error message', async () => {
    inputs.pattern = 'some-pattern'
    await expect(inputHelper.getInputs()).rejects.toThrow(
      'Input required and not supplied: error'
    )
  })

  it('inputs: sets pattern', async () => {
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

  it('inputs: sets flags', async () => {
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

  it('inputs: sets error', async () => {
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

  it('event: requires event', async () => {
    inputs.pattern = 'some-pattern'
    inputs.error = 'some-error'
    await expect(inputHelper.getInputs()).rejects.toThrow(
      'Event "undefined" is not supported.'
    )
  })

  it('event: requires valid event', async () => {
    mockGitHub.context = {
      eventName: 'some-event'
    }
    inputs.pattern = 'some-pattern'
    inputs.error = 'some-error'
    await expect(inputHelper.getInputs()).rejects.toThrow(
      'Event "some-event" is not supported.'
    )
  })

  it('pull_request: requires payload', async () => {
    mockGitHub.context = {
      eventName: 'pull_request'
    }
    inputs.pattern = 'some-pattern'
    inputs.error = 'some-error'
    await expect(inputHelper.getInputs()).rejects.toThrow(
      'No payload found in the context.'
    )
  })

  it('pull_request: requires pull_request payload', async () => {
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

  it('pull_request: requires title', async () => {
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

  it('pull_request: sets title', async () => {
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

  it('pull_request: sets title and body', async () => {
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

  it('pull_request: excludes body', async () => {
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

  it('pull_request: excludes title', async () => {
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

  it('pull_request: excludes title and body', async () => {
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

  it('pull_request: requires accessToken', async () => {
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

  it('pull_request: requires number', async () => {
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

  it('pull_request: requires repository', async () => {
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

  it('pull_request: requires repository name', async () => {
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

  it('pull_request: requires repository owner (1)', async () => {
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

  it('pull_request: requires repository owner (2)', async () => {
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

  it('pull_request: sets commits', async () => {
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
                      'input: make input-helper functions async\n\nIn order to work with asynchronous call like an async http request\nin an easier way, the functions getInput and getMessages were\nconverted to async.',
                    parents: {
                      totalCount: 1
                    }
                  }
                }
              },
              {
                node: {
                  commit: {
                    message:
                      "input: PR options ignore title and check PR commits\n\nthis make it possible to igore partially or completely the PR payload.\nThe commits associated with the pull request can be checked instead of\nchecking the pull request payload. The parameter are:\n\n- excludeTitle: 'true | false'\n- excludeDescription: 'true | false'\n- checkAllCommitMessages: 'true | false'\n\nby default, all options comes false.",
                    parents: {
                      totalCount: 1
                    }
                  }
                }
              },
              {
                node: {
                  commit: {
                    message:
                      'docs: include parameters excludeTitle, checkAllCommitMessages and accessToken\n\nCo-authored-by: Gilbertsoft <25326036+gilbertsoft@users.noreply.github.com>',
                    parents: {
                      totalCount: 1
                    }
                  }
                }
              },
              {
                node: {
                  commit: {
                    message: 'merge: merge commit to be ignored',
                    parents: {
                      totalCount: 2
                    }
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
    expect(checkerArguments.messages.length).toBe(4)
  })

  it('pull_request: excludes merge commits', async () => {
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
    inputs.excludeMergeCommits = 'true'
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
                      'input: make input-helper functions async\n\nIn order to work with asynchronous call like an async http request\nin an easier way, the functions getInput and getMessages were\nconverted to async.',
                    parents: {
                      totalCount: 1
                    }
                  }
                }
              },
              {
                node: {
                  commit: {
                    message:
                      "input: PR options ignore title and check PR commits\n\nthis make it possible to igore partially or completely the PR payload.\nThe commits associated with the pull request can be checked instead of\nchecking the pull request payload. The parameter are:\n\n- excludeTitle: 'true | false'\n- excludeDescription: 'true | false'\n- checkAllCommitMessages: 'true | false'\n\nby default, all options comes false.",
                    parents: {
                      totalCount: 1
                    }
                  }
                }
              },
              {
                node: {
                  commit: {
                    message:
                      'docs: include parameters excludeTitle, checkAllCommitMessages and accessToken\n\nCo-authored-by: Gilbertsoft <25326036+gilbertsoft@users.noreply.github.com>',
                    parents: {
                      totalCount: 1
                    }
                  }
                }
              },
              {
                node: {
                  commit: {
                    message: 'merge: merge commit to be ignored',
                    parents: {
                      totalCount: 2
                    }
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
    expect(checkerArguments.messages).toBeTruthy()
    expect(checkerArguments.messages.length).toBe(3)
  })

  it('push: requires payload property', async () => {
    mockGitHub.context = {
      eventName: 'push'
    }
    inputs.pattern = 'some-pattern'
    inputs.error = 'some-error'
    await expect(inputHelper.getInputs()).rejects.toThrow(
      'No payload found in the context.'
    )
  })

  it('push: payload content is optional', async () => {
    mockGitHub.context = {
      eventName: 'push',
      payload: {}
    }
    inputs.pattern = 'some-pattern'
    inputs.error = 'some-error'
    const checkerArguments: ICheckerArguments = await inputHelper.getInputs()
    expect(checkerArguments.messages).toHaveLength(0)
  })

  it('push: payload commits is optional', async () => {
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

  it('push: requires repository', async () => {
    mockGitHub.context = {
      eventName: 'push',
      payload: {
        commits: [
          {
            id: '1',
            message: 'some-message'
          }
        ]
      }
    }
    inputs.pattern = 'some-pattern'
    inputs.error = 'some-error'
    await expect(inputHelper.getInputs()).rejects.toThrow(
      'No repository found in the payload.'
    )
  })

  it('push: requires repository name', async () => {
    mockGitHub.context = {
      eventName: 'push',
      payload: {
        commits: [
          {
            id: '1',
            message: 'some-message'
          }
        ],
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

  it('push: requires repository owner (1)', async () => {
    mockGitHub.context = {
      eventName: 'push',
      payload: {
        commits: [
          {
            id: '1',
            message: 'some-message'
          }
        ],
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

  it('push: requires repository owner (2)', async () => {
    mockGitHub.context = {
      eventName: 'push',
      payload: {
        commits: [
          {
            id: '1',
            message: 'some-message'
          }
        ],
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

  it('push: sets single commit correctly', async () => {
    mockGitHub.context = {
      eventName: 'push',
      payload: {
        commits: [
          {
            id: '1',
            message: 'some-message'
          }
        ],
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

    const response = {
      repository: {
        object: {
          message: 'some-message',
          parents: {
            totalCount: 1
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
    expect(checkerArguments.messages.length).toBe(1)
    expect(checkerArguments.messages[0]).toBe('some-message')
  })

  it('push: sets multiple commits correctly', async () => {
    mockGitHub.context = {
      eventName: 'push',
      payload: {
        commits: [
          {
            id: '1',
            message: 'some-message'
          },
          {
            id: '2',
            message: 'other-message'
          },
          {
            id: '3',
            message: 'merge-commit-message'
          }
        ],
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

    getGraphqlResponse = (parameters?: any): any => {
      if (parameters.commitSha === '3') {
        return {
          repository: {
            object: {
              message: 'merge-commit-message',
              parents: {
                totalCount: 2
              }
            }
          }
        }
      }

      return {
        repository: {
          object: {
            parents: {
              totalCount: 1
            }
          }
        }
      }
    }

    const checkerArguments: ICheckerArguments = await inputHelper.getInputs()
    expect(checkerArguments).toBeTruthy()
    expect(checkerArguments.pattern).toBe('some-pattern')
    expect(checkerArguments.error).toBe('some-error')
    expect(checkerArguments.messages).toBeTruthy()
    expect(checkerArguments.messages.length).toBe(3)
    expect(checkerArguments.messages[0]).toBe('some-message')
    expect(checkerArguments.messages[1]).toBe('other-message')
  })

  it('push: requires accessToken to exclude merge commits', async () => {
    mockGitHub.context = {
      eventName: 'push',
      payload: {
        commits: [
          {
            id: '1',
            message: 'some-message'
          }
        ],
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
    inputs.excludeMergeCommits = 'true'

    await expect(inputHelper.getInputs()).rejects.toThrow(
      'The `excludeMergeCommits` option requires a github access token.'
    )
  })

  it('push: excludes merge commits', async () => {
    mockGitHub.context = {
      eventName: 'push',
      payload: {
        commits: [
          {
            id: '1',
            message: 'merge-commit-message-1'
          },
          {
            id: '2',
            message: 'some-message'
          },
          {
            id: '3',
            message: 'merge-commit-message-2'
          }
        ],
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
    inputs.excludeMergeCommits = 'true'
    inputs.accessToken = 'some-token'

    getGraphqlResponse = (parameters?: any): any => {
      if (parameters.commitSha === '2') {
        return {
          repository: {
            object: {
              message: 'some-message',
              parents: {
                totalCount: 1
              }
            }
          }
        }
      }

      return {
        repository: {
          object: {
            parents: {
              totalCount: 2
            }
          }
        }
      }
    }

    const checkerArguments: ICheckerArguments = await inputHelper.getInputs()
    expect(checkerArguments).toBeTruthy()
    expect(checkerArguments.pattern).toBe('some-pattern')
    expect(checkerArguments.error).toBe('some-error')
    expect(checkerArguments.messages).toBeTruthy()
    expect(checkerArguments.messages.length).toBe(1)
  })
})
