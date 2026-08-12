# CodeType Appwrite Schema

Use these exact IDs by default.

## `profiles`

Document ID: Appwrite user ID.

| Attribute | Type | Required | Size/default |
| --- | --- | --- | --- |
| `githubUsername` | string | no | 100 |
| `displayName` | string | no | 160 |
| `avatarUrl` | URL | no | - |
| `currentStreak` | integer | yes | default `0`, min `0` |
| `bestStreak` | integer | yes | default `0`, min `0` |
| `lastActiveDate` | datetime | no | - |

Permissions:

- Read: `any`
- Update/Delete: the owning user
- Create: authenticated users, or a server function that provisions profiles

Indexes:

- Unique key on `githubUsername`

## `runs`

| Attribute | Type | Required |
| --- | --- | --- |
| `userId` | string (36) | yes |
| `sessionId` | string (36) | no |
| `language` | string (64) | yes |
| `mode` | enum: `snippet`, `timed`, `zen` | yes |
| `durationMs` | integer | yes |
| `durationSeconds` | integer | no |
| `wpm` | float | yes |
| `rawWpm` | float | yes |
| `accuracy` | float | yes |
| `consistency` | float | yes |
| `correctChars` | integer | yes |
| `keystrokes` | integer | yes |
| `mistakes` | integer | yes |
| `snippetsCompleted` | integer | yes |
| `sourceRepo` | string (255) | no |
| `verified` | boolean | yes, default `false` |

Permissions:

- Read verified leaderboard documents: `any`
- Read private/unverified documents: owning user
- Create/update verified documents: server API key only

Indexes:

- `userId`, `$createdAt` descending
- `verified`, `mode`, `durationSeconds`, `wpm` descending
- `verified`, `language`, `mode`, `durationSeconds`, `wpm` descending

## `run_sessions`

| Attribute | Type | Required |
| --- | --- | --- |
| `userId` | string (36) | yes |
| `challenge` | string (255) | yes |
| `mode` | enum: `snippet`, `timed`, `zen` | yes |
| `language` | string (64) | yes |
| `durationSeconds` | integer | no |
| `expiresAt` | datetime | yes |
| `completedAt` | datetime | no |

Permissions:

- Read: owning user
- Create/update/delete: server API key only

Indexes:

- Unique key on `challenge`
- `userId`, `$createdAt` descending
