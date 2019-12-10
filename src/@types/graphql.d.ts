/** Temporary Fix
 * 
 * Fixes an issue of the GH actions toolkit see
 * - https://github.com/actions/toolkit/issues/199
 * - https://github.com/actions/toolkit/pull/228
 * 
 * This file should be removed once this change is in the official release.
 */
declare module '@octokit/graphql' {
  export type Variables = any
  export type GraphQlQueryResponse = any
}
