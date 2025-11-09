# Contribution Guide

> [!CAUTION]
> This page is made for contributors building pompyboard.
> From this point onward we assume you know what you are doing.

## Project overview

The pompyboard project can be roughly broken down into 5 parts:

| Part     | Location                                       |
| -------- | ---------------------------------------------- |
| PCB      | [`./pcb/`](./pcb/)                             |
| Firmware | [`./firmware/`](./firmware/)                   |
| 3D model | [`./3d/`](./3d/)                               |
| Website  | [`./web/`](./web/)                             |
| Driver   | [pompyboard/OpenTabletDriver][otd-fork] (fork) |

## Setting up development environment

1. Clone this git repository
2. Open `README.md` file of the sub-project you want to work on
   (e.g. [`./firmware/README.md`](./firmware/README.md)) and go from there.

## Branch structure

- There are three major branches:
  - `dev` - open Pull Requests here
  - `staging` - testing before production
  - `master` - production
- For OpenTabletDriver, follow their [`CONTRIBUTING.md`][otd-contrib].

## Contribution standards

### AI

- ✅ Using AI to write code
- ✅ Using AI to help you understand the code
- ❌ Using AI to write text
  - This applies to, but not limited to code comments, HTML contents,
    documentations, commit messages, and Pull request descriptions.

### Communication, communication, communication

Remember, people can't read your mind. If you did something amazing and you want
others to care about it, explain your motivation using fact and logic so anyone
with three digit IQ can understand. You don't necessarily have to dumb things
down. Just be clear about it.

### Formatting

It is expected that all text-based files are formatted using the correct
formatter. See [`./.vscode/settings.json`](./.vscode/settings.json) for more
info.

### line length

Keep your text under 80 characters and rust code under 100 characters per line
unless absolutely necessary. If you are using vscode, a ruler should help you
know when you are over that limit.

### Commit

Size of the commit should be reviewable and ideally be atomic.

Commit messages must be specific and concise. Prepend scope if necessary.\
For example:

- `remove unused files`
- `firmware: add more test cases for functionName`
- `web: bump packageName version from v6 to v9`

<!-- Links -->

[otd-fork]: https://github.com/pompyboard/OpenTabletDriver
[otd-contrib]: https://github.com/OpenTabletDriver/OpenTabletDriver/blob/master/CONTRIBUTING.md
