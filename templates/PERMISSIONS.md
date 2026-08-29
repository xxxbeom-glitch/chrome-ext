# Permissions Review

## Effective permission table

| Permission / host | User-visible feature | Why narrower access is insufficient | Optional? |
|---|---|---|---|
|  |  |  |  |

## Review questions

- Can `activeTab` replace persistent host access?
- Can the permission become optional?
- Can a narrower host/path pattern be used?
- Is every permission exercised by shipped code?
- Did this change add a new Chrome warning to the user?
- Does the privacy disclosure still match behavior?

Any undocumented permission is a release blocker.
