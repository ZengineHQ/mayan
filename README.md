# mayan

A port of [maya](https://github.com/ZengineHQ/maya) in NodeJS

[![CircleCI](https://circleci.com/gh/Wizehive/mayan.svg?style=svg&circle-token=7f05ffa02401a7473254df1cf61c47a7fdda0eaa)](https://circleci.com/gh/Wizehive/mayan)

## Install

```
npm install -g git+ssh://git@github.com/WizeHive/mayan
```

## Using

```
$ mayan

mayan <command>

Commands:
  mayan build [plugin]     Build plugin
  mayan deploy [plugin]    Deploy plugin
  mayan init [plugin]      Initialize plugin
  mayan publish [plugin]   Publish plugin
  mayan register [plugin]  Register plugin in Zengine API

Options:
  --env          Environment name
  --verbose      Display verbose debug output                          [boolean]
  --help         Show help                                             [boolean]
  --show-hidden  Show advanced options                                 [boolean]

For more information, RTFM at https://github.com/ZengineHQ/mayan

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
