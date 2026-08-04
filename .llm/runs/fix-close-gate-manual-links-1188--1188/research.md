# Research

- Issue #1188 was read first and is the specification.
- The gate currently derives closing issues only with `extractClosingIssues(pr.body)`.
- GitHub GraphQL `closingIssuesReferences` is the authoritative union used by merge auto-close behavior.
- GitHub does not label each closing reference's origin. Source can be reconstructed by comparing the authoritative set with closing keywords in the PR body and PR commit messages; remaining references are Development-sidebar/manual links.
- The acceptance gate already operates over an issue-number set, so source-aware discovery can be added without changing checkbox semantics.

