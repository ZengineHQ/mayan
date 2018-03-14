# mayan

A port of [maya](https://github.com/ZengineHQ/maya) in NodeJS

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
  mayan login             Login
  mayan publish [plugin]  Publish plugin

Options:
  --version   Show version number                                      [boolean]
  --frontend  Frontend plugin name                                     [boolean]
  --backend   Backend plugin name                                      [boolean]
  --env       Environment name
  --help      Show help                                                [boolean]
  
```

## Contributing


### Fork

```bash
git clone git@github.com:Wizehive/mayan.git
```

### Install dependencies

```bash
npm install
```

### Test and lint

```bash
npm test
npm run lint
```

### Install binary locally

```bash
npm link
```

### Adding new commands

Follow this [approach/strategy](https://github.com/yargs/yargs/blob/master/docs/advanced.md#example-command-hierarchy-using-commanddir) to organize commands
