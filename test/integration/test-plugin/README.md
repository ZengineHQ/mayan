# test-plugin

Test plugin

## How to use backend service locally (MacOS and Linux)

AWS lambda runs a specific Node version, so you need to install [NVM](https://github.com/creationix/nvm)

NVM uses node version at .nvmrc file by default

### Configuration

Setup the following configuration files

* [backend/create/config-[ENV].json](backend/create/config-ENV.json.example) (eg: config-production.json or config-stage.json)
* Copy maya.example.json to maya.json

The configuration values for production environment is available at 1password vaults

```bash
# creates the `config-local.json` file
maya build
```

### Install dependencies

* Navigate to the backend service path
* install packages using aws-lambda compatible node/npm

```bash
# install the compatible node version
nvm install
# changes terminal session to use the compatible node version
nvm use
# install node modules
npm install
```
* install _runner
 * create a new backend plugin on zengine
 * download draft zip
 * copy _runner folder to the backend plugin (alongside plugin.js and package.json)


### Run locally

* run backend service locally using aws-lambda compatible node/npm
```bash
# changes to compatible node on the terminal session
nvm use
# magic
npm start
```
