# mayan

A port of [maya](https://github.com/ZengineHQ/maya) in NodeJS

[![Build Status](https://drone.appsrv.com/api/badges/Wizehive/mayan/status.svg)](https://drone.appsrv.com/Wizehive/mayan)

## Install

```
npm install -g git+ssh://git@github.com/WizeHive/mayan
```

## Using

```
$ mayan

mayan <command>

Commands:
  mayan build [plugin]    Build plugin
  mayan deploy [plugin]   Deploy plugin
  mayan publish [plugin]  Publish plugin

Options:
  --version      Show version number                                   [boolean]
  --concurrency  Concurrency limit                         [number] [default: 2]
  --env          Environment name
  --config       Path to JSON config file
  --help         Show help                                             [boolean]

```

## Contributing


### Fork

```
git clone git@github.com:Wizehive/mayan.git
```

### Install dependencies

```
npm install
```

### Test and lint

```
npm test
npm run eslint
```

### Install binary locally

```
npm link
```

### Adding new commands

Follow this [approach/strategy](https://github.com/yargs/yargs/blob/master/docs/advanced.md#example-command-hierarchy-using-commanddir) to organize commands
