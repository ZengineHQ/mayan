# mayan

A port of [maya](https://github.com/ZengineHQ/maya) in NodeJS

[![CircleCI](https://circleci.com/gh/ZengineHQ/mayan.svg?style=svg)](https://circleci.com/gh/ZengineHQ/mayan)

## Install

```
npm install -g @zenginehq/mayan
```

## Using

```
$ mayan

mayan <command>

Commands:
  mayan build [plugin]    Build plugin
  mayan deploy [plugin]   Deploy plugin
  mayan watch [plugin]   Watch plugin(s) and deploy on changes
  mayan publish [plugin]  Publish plugin
  mayan register [plugin]  Register plugin in API
  mayan init [plugin]  Initialize plugin locally

Options:
  --env          Environment name
  --verbose      Display verbose debug output                          [boolean]
  --help         Show help                                             [boolean]
  --show-hidden  Show advanced options                                 [boolean]

For more information, RTFM at https://github.com/ZengineHQ/mayan

```

*Key Features*

- Write frontend plugins using ES6 features such as arrow functions, let/const, destructuring, rest/spread, etc
- Write frontend plugin styles using SCSS
- You can also keep on using vanilla js and css if that's your thing
- Support for frontend plugin modules directly in the main plugin package.json as regular dependencies (the old `src` dir approach also works)
- Follows symlinks for @zenginehq modules for a great local development experience
- Ability to `--skip-build` when deploying and publishing and `--skip-deploy` when publishing
- Minifies CSS, JS and HTML when `prod` or `production` environment used
- Supports `maya-pre-build` and `maya-post-build` package.json scripts for both backend services and frontend plugins
- `mayan watch [plugin]` will watch your frontend plugin directories and deploy on changes for faster development process (recommended: use `--frontend` flag). Takes all the same commands as `deploy`.
- *coming soon* `register` command to create/update plugins using the Zengine API and maintain your maya.json ids updated
- *coming soon* `init` command to initialize a local dev environment either from a fresh git clone (registers plugin if necessary) or from scratch (programatically invokes yeoman generator and then registers and publishes plugin)

## Directory Structure

    /my-plugin-repo
    ├── backend/ --> backend service code
    ├── plugins --> frontend UI code
    │   └── name-of-plugin --> can have several of these per repo
    │       ├── node_modules
    │       ├── src
    │       │   ├── example-main.css
    │       │   ├── example-main.html
    │       │   └── example-main.controller.js
    │       ├── package.json
    │       ├── package-lock.json
    │       └── plugin-register.js
    ├── maya_build/ --> build artifacts are kept here
    ├── maya.json --> config file for various environments/multiple plugins
    ├── maya.example.json --> save non-sensitive config info in version control
    ├── README.md
    └── .gitignore --> include maya.json here because of sensitive config info

## Running Backend Services Locally

You can expose your local backend services to the internet using `mayan watch --proxy`. Configure the proxy server by placing a `proxy_settings` key at the top level, the plugin level, and/or the backend service level. These settings inherit up the "chain," with the service-level overriding all else. Any option could feasibly be placed at any level, but obviously some options more naturally reside in certain locations. The only caveats to that would be:

  1. `subdomain`, `domain`, `authtoken`, `ngrokPort` belong at the top level because these only get referenced once to set up the ngrok tunnel

  2. `port` belongs at the service level (leaving this out will default to 3000 and increment upwards to avoid using the same port for multiple services)

Once you run mayan against a backend service the `--proxy` flag, your generated ngrok url will be displayed in the terminal and automatically copied to your clipboard. You can then use this url in your test webhook configurations or send requests to it from your frontend plugin.

### stdin commands

While your backend services are running, you can send these commands to mayan using stdin in the same terminal where mayan is running:

`.exit` will shut down all processes gracefully (same as ctrl+C)

`[backend service name]` typing the name of a service will trigger a reload of that service, similar to saving a file in that service's watched directories.

> ex: to reload the `calculate` service, type "calculate" and hit enter

`webhook-update [webhook ID]` will use the access token provided in your current environment to fetch the url of the webhook you specified with the second argument, then update that webhook's url to point to your ngrok tunnel, thus routing all of that webhook's traffic to your local service. **NB: this command requires the `--proxy` flag**

> ex:
> ```sh
> $ mayan w --sd --proxy
> # output from command indicating services are running
> https://6e12515eb18c.ngrok.io --> copied to clipboard!
> Inspect this connection in your browser at http://127.0.0.1:4040
>
> Listening on http://:::3000/workspaces/:workspaceId/:pluginNamespace/:pluginRoute
>
> Listening on http://:::3001/workspaces/:workspaceId/:pluginNamespace/:pluginRoute
>
> # user input while service is running
> webhook-update 123456
> # output in response to user's command
> Successfully updated webhook url to:
> https://6e12515eb18c.ngrok.io/workspaces/123/nameSpace/endpoint?query=param
> ```
>
> alias: `wu`
>
> ex:
> ```sh
> wu 123456
> Successfully updated webhook url to:
> https://6e12515eb18c.ngrok.io/workspaces/123/nameSpace/endpoint?query=param
> ```

Or, for scheduled webhooks:

> ```sh
> $ mayan w --sd --proxy
> # output from command indicating services are running
> https://6e12515eb18c.ngrok.io --> copied to clipboard!
> Inspect this connection in your browser at http://127.0.0.1:4040
>
> Listening on http://:::3000/workspaces/:workspaceId/:pluginNamespace/:pluginRoute
>
> Listening on http://:::3001/workspaces/:workspaceId/:pluginNamespace/:pluginRoute
>
> # user input while service is running
> scheduled-webhook-update 123456
> # output in response to user's command
> Successfully updated webhook url to:
> https://6e12515eb18c.ngrok.io/workspaces/123/nameSpace/endpoint?query=param
> ```
>
> alias: `swu`
>
> ex:
> ```sh
> swu 123456
> Successfully updated webhook url to:
> https://6e12515eb18c.ngrok.io/workspaces/123/nameSpace/endpoint?query=param
> ```


## `maya.json` format

```js
{
  "environments": {
    "dev": {
      "api_endpoint": "api.wizehive-dev.com -> you probably don't need this field",
      "access_token": "your token here -- keep out of source control",
      "plugins": {
        "name-of-directory": { // assumes a frontend code repository at ./plugins/name-of-directory
          "id": 123,
          "namespace": "my-cool-plugin",
          "route": "/my-cool-plugin", // deprecated legacy property (invalid in version 2+)
          "version": 2, // either a new or migrated plugin (leave property off for deprecated legacy process)
          "services": {
            "my-cool-service": {
              "id": 321,
              "route": "/my-cool-route",
              "proxy_settings": { // service-level proxy settings
                "x-zengine-webhook-key": "reallylongstringofcharacters",
                "port": 3008 // hardcoded specific port, used whether you're running --proxy or not
              }
            }
          },
          "proxy_settings": { // plugin-level proxy settings
            "x-firebase-url": "https://some-url-im-not-comfortable-unveiling.firebaseio.com/",
            "x-firebase-secret": "correspondingsecretforfirebase"
          }
        }
      }
      "default": true // if no --env (-e) is provided, this environment is assumed
    },
    "prod": {
      "api_endpoint": "api.zenginehq.com -> default value, you probably don't need this",
      "access_token": "your token here -- keep out of source control",
      "plugins": {
        "name-of-directory": {
          "id": 456,
          "namespace": "my-cool-prod-plugin",
          "route": "/my-cool-prod-plugin",
          "version": 2,
          "service": {
            "id": 789
          }
        }
      }
    }
  },
  "proxy_settings": { // top-level proxy settings
    "domain": "", // If you have a paid ngrok account and does not end in ngrok.io use this instead of subdomain
    "subdomain": "", // If you have a paid ngrok account
    "authtoken": "", // If you have a paid ngrok account
    "ngrokPort": 0 // 0 will be ignored and default to 5050
  }
}
```

With the advent of Zengine Plugins 2.0, any new or migrated plugins should specify version 2 in the frontend configuration, so mayan knows which build process to use.

## Docker

Running mayan from a Docker image allows for a common plugin build environment. Instead of using npm to globally install mayan, clone this repo, then build and run the Docker container using the commands below.

### Build

```
docker build -t mayan .
```

### Usage

The included `mayan.sh` script will run the mayan container with the necessary parameters.

```
/path/to/mayan/mayan.sh build
```

You can make a symlink to the `mayan.sh` script to make it easier to access from your plugin directories.

```
ln -s $(pwd)/mayan.sh /usr/local/bin/mayan.sh
```

#### MacOS SSH Config

MacOS may include the line `UseKeychain yes` in `~/.ssh/config`, which is not a supported config in the container. To prevent this error, add the line `IgnoreUnknown UseKeychain` above it.

## Contributing

### Fork

```
git clone git@github.com:ZengineHQ/mayan.git
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

## Releasing

This uses release-it to do releases. It will handle creating the release tag, updating the README and creating the github and npm releases.

To do a dry run:

    npx release-it -d

To do the real thing:

    npx release-it

