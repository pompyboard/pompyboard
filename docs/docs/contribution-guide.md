# Contribution Guide

## Project overview

Wonkle projects can be roughly broken down into 5 parts:

- [PCB](https://github.com/wonkleio/wonkle/tree/dev/pcb) - Electronics that powers the device
- [Firmware](https://github.com/wonkleio/wonkle/tree/dev/firmware) - Software that controls the electronics
- [3D models](https://github.com/wonkleio/wonkle/tree/dev/3d) - Designs for the 3D-printed case
- [Driver](https://github.com/wonkleio/OpenTabletDriver) - Device driver that allows you to use the
- [Website](https://github.com/wonkleio/wonkle/tree/dev/web) - Website for purchasing and configuring the device
- [Docs](https://github.com/wonkleio/wonkle/tree/dev/docs) - Information & Resources (hint: You are reading it)

## Setting up development environment

### For tablet driver

1. Clone the git repository
   ```bash
   git clone https://github.com/wonkleio/OpenTabletDriver
   ```
2. Follow [`CONTRIBUTING.md`](https://github.com/wonkleio/OpenTabletDriver/blob/master/CONTRIBUTING.md)
3. Send Pull request to `master` branch when contributing

### For everything else

1. Clone the git repository
   ```bash
   git clone https://github.com/wonkleio/wonkle
   ```
2. Follow `README.md` of the sub-project you want to work on
   (e.g. [`docs/README.md`](https://github.com/wonkleio/wonkle/tree/dev/docs))
3. Send pull request to `dev` branch when contributing

## Contribution standards

### AI

- ✅ OK - Using AI to write code
- ✅ OK - Using AI to help you analyze/understand
- ❌ NOT OK - Using AI to write text
  - This applies to, but not limited to code comments, HTML contents,
    documentations, commit messages, and Pull request descriptions
- ❌ NOT OK - Using AI to make slop
  - **1 year ban from the project for repeated violations**
  - Please review your changes before sending a pull request.

### Communication, communication, communication

Remember, people can't read your mind. If you did something amazing and you want others to care
about it, explain your intent and motivation using fact and logic so anyone with three digit IQ can
understand them. You don't necessarily have to dumb things down. Just be clear about it.

### Formatting

All text-based files must be formatted using the correct formatter.
See [`.vscode/settings.json`](https://github.com/wonkleio/wonkle/blob/dev/.vscode/settings.json)
for more info.

### line length

All human-written text files must have 100 characters or less per line unless absolutely necessary.
When using vscode, there should be a line that indicates where the limit is.

### Commits messages

Commit messages must be specific and concise. Prepend scope if necessary.

For example:

- `remove unused files`
- `firmware: add more test cases for functionName`
- `web: bump packageName version from v6 to v9`
