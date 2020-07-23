# Migrating a Zengine Plugin to Version 2

## Requirements
NodeJS: version 10.10+

## Quick and Dirty (for mayan repos)

If you just want a snapshot of the steps for migrating an existing mayan repo, try walking through this first, and consult the [expanded docs below](#migration-steps) if you get stuck.

**If you're using Mayan, and you haven't created a maya.json in the repo you intend to migrate, do that first!**

1. cd into your plugin's frontend code directory (in mayan projects: `cd ./plugins/name-of-plugin`)
2. `npm i -g ZengineHQ/zengine-migrator` to install the migrator tool globally
3. `zmig && npm install && npm start` to migrate and spin up a local dev server for testing
4. configure your plugin's Live Mode to point to https://localhost:1234 and approve the SSL in your browser
5. Do any acceptance testing to verify your plugin works and fix any issues
6. `npm run build` to create zip file
7. Use Zengine Developer UI to post a draft and/or publish the fully migrated plugin

## Background

Originally, our plugin system applied plugin code to Zengine Admin UI by directly injecting valid AngularJS code and CSS into the Admin UI. For a variety of reasons, we at WizeHive felt this was not ideal long term, and so our solution has been to make each plugin an independent application that can run independently from the Admin UI in an iframe. This has two implications for how existing plugins need to be adjusted in order to work in the future:

1. Previously plugins had immediate access to certain AngularJS directives or other javascript APIs. Now, those APIs are on the other side of the "iframe wall," and so accessing them requires use of a communication bridge we built over [`postMessage`](https://developer.mozilla.org/en-US/docs/Web/API/Window/postMessage). This means those APIs require a _wrapper_ that internally makes use of `postMessage` to retrieve the data, but externally exposes the original API to the plugin code.

2. In certain cases, like for many AngularJS directives (UI components), the only way to regain access to these elements is for the directive code to be injected into each plugin (so that it is now present with the plugin code in the iframe). Therefore, this _wrapper_ contains certain pieces of code from the Admin UI application to ensure that plugins have _nearly_ exactly the same look, feel, and functionality before and after a migration.

Therefore, this project forms the basis for converting "legacy" plugins into full-blown SPAs designed to run within an iframe in the new Zengine plugin system.

## Migration Steps

1. Ensure your structure is correct

    - Non-mayan repo:

    ```sh
    # cd into empty directory
    # (this will end up being the top-level of a new mayan project)
    mkdir my-zengine-plugin
    cd my-zengine-plugin
    ```

    - Existing mayan repo:

    ```
    ├── backend/**/*.*
    ├── plugins
    │   └── name-of-plugin
    │       ├── node_modules
    │       ├── src
    │       │   ├── example-main.css
    │       │   ├── example-main.html
    │       │   └── example-main.controller.js
    │       ├── package.json
    │       ├── package-lock.json
    │       └── plugin-register.js
    ├── maya_build/**/*.*
    ├── maya.json   # If you don't have this, you need it!
    ├── maya.example.json
    ├── README.md
    └── .gitignore
    ```

2. Install the migration cli tool

    `npm i -g ZengineHQ/zengine-migrator`

3. Run the migration commands in the proper frontend directory

    - Non-mayan repo:

    ```sh
    zmig --id 123 --token abc456
    # --dirname name-of-plugin
    # can also be passed, otherwise, you'll be prompted to name your frontend directory
    # during the migration

    # your source code will be pulled from the Zengine API and inserted at
    # ./plugins/name-of-plugin/src/plugin.(css|js|html)
    ```

    - Existing mayan repo:

    ```sh
    cd ./plugins/name-of-plugin
    zmig # this will scaffold the legacy wrapper around the frontend code in this directory
    npm install # install deps
    cd ../.. # back to top-level of project
    mayan w name-of-plugin -f # spins up development server at localhost:1234 for your migrated frontend code
    ```

    New structure of your project:

        ├── backend/ <-- if applicable
        ├── plugins
        │   └── name-of-plugin <-- this folder is where all of the changes take place
        │       ├── .legacy-output (this is a cached version of the collated and modified source files)
        │       ├── dist (this has the final deliverable files after running a dev or build command)
        │       ├── docs
        │       │   └── README.md (the one you're reading right now)
        │       ├── node_modules (after you npm install, at least)
        │       ├── src
        │       │   ├── example-main.css
        │       │   ├── example-main.html
        │       │   └── example-main.controller.js
        │       ├── vendor
        │       │   ├── bootstrap.js
        │       │   ├── import-jquery.js
        │       │   └── validators.js
        │       ├── wrapper
        │       │   ├── css
        │       │   ├── fonts
        │       │   ├── images
        │       │   ├── imgs
        │       │   ├── lib
        │       │   │   ├── directives.js
        │       │   │   ├── filters.js
        │       │   │   ├── services.js
        │       │   │   ├── wrapper.js
        │       │   │   ├── zn-data.js
        │       │   │   └── zn-form.js
        │       │   ├── index.html
        │       │   ├── plugin.js
        │       │   ├── plugin.scss
        │       │   └── zn-form.js
        │       ├── .eslint-legacy.json
        │       ├── .eslint-src.json
        │       ├── .eslint-wrapper.json
        │       ├── .gitignore
        │       ├── package.json
        │       ├── package-lock.json
        │       └── plugin-register.js
        ├── maya_build/**/*.*
        ├── maya.json
        ├── maya.example.json
        ├── README.md
        ├── package.json
        ├── package-lock.json
        └── .gitignore

    Please Note:

    - The migrator automatically updates your source code (your original files in `./src/`) in a few specific ways. See List of [Migration Code Mods](#migration-code-mods) for more details.

    - There are some [build time nuances](#build-process-nuances) you should read about

    - You'll definitely want to read about [Namespaces and Environments](#environments) to understand how to execute your dev and build commands.

4. Configure your plugin's live mode to point to `https://localhost:1234` in the Zengine UI

    ![Zengine UI Live Mode Screenshot](https://i.ibb.co/ZNtT4GP/Screen-Shot-2019-11-01-at-16-32-53.png)

    You will also need to visit your dev server (https://localhost:1234) in a separate tab in whatever browser you're using to test, so you can approve the self-signed SSL certificate generated by Parcel.

5. Acceptance test your plugin (and fix anything that broke)

    In the case of "simpler" plugins, the migration should be sufficient to convert the plugin to a working version 2 plugin. However, acceptance testing is strongly recommended to ensure the plugin's behavior has not changed or broken. Below are some known issues that may arise and how to fix them if they do. You can also run `npm run lint-legacy` to get immediate feedback on some of these issues.

    - Using native `Promise`s in your source code will create unexpected behavior. Refactor those Promises to use $q from angular instead

        Example:

        ```js
        plugin.controller('myController', ['$scope', 'asyncService', function ($scope, asyncService) {
          function myAsyncMethod(arg) {
            return new Promise((resolve, reject) => {
              asyncService.method(arg, (err, result) => {
                if (err) return reject(err)

                resolve(result)
              })
            })
          }
        }])
        ```

        Fix:

        ```js
        plugin.controller('myController', ['$scope', 'asyncService', '$q', function ($scope, asyncService, $q) {
          function myAsyncMethod(arg) {
            var deferred = $q.defer()

            asyncService.method(arg, (err, result) => {
              if (err) return deferred.reject(err)
              deferred.resolve(result)
            })

            return deferred.promise
          }
        }])
        ```

    - Uninitialized variables will often break the build or throw strange runtime errors

        Example:

        ```js
        plugin.controller('myController', ['$scope', function ($scope) {
          variable = 42
        }])
        ```

        Fix:

        ```js
        plugin.controller('myController', ['$scope', '$q', function ($scope, $q) {
          var variable = 42
        }])
        ```

    - certain usages of `znModal` will need to be refactored:
      - opening a second modal before the first one is closed
      - accessing `$scope` properties that are functions. If you are passing the entire `$scope` to the modal and it contains functions, but you aren't using those functions in the modal, no refactor is necessary.
      
        Example:

        ```js
        plugin.controller('myController', ['$scope', 'znModal', function ($scope, znModal) {
          
          $scope.someFunction = function() { 
            console.log('hey!')
          }
                    
          znModal({
            template: '<div ng-click="someFunction()"></div>',
            scope: $scope
          })
        }])
        ```

        Fix:

        ```js
        plugin.controller('myController', ['$scope', 'znModal', function ($scope, znModal) {          
          znModal({
            template: '<div ng-controller="modalController"><div ng-click="someFunction()"></div></div>',
            scope: $scope
          })
        }])
        .controller('modalController', ['$scope', function ($scope) {
          $scope.someFunction = function() { 
            console.log('hey!')
          }
        }]) 
        ```

      
      - accessing `$scope` properties inherited from one or more levels up the scope tree.
      
        Example:

        ```js
        plugin.controller('myController', ['$scope', 'znModal', function ($scope, znModal) {
          znModal({
            template: '<div>{{someParentScopeProperty}}</div>',
            scope: $scope
          })
        }])
        ```

        Fix:

        ```js
        plugin.controller('myController', ['$scope', 'znModal', function ($scope, znModal) {          
          znModal({
            template: '<div>{{someParentScopeProperty}}</div>',
            scope: {
              someParentScopeProperty: $scope.someParentScopeProperty
            }
          })
        }])
        ```

      
      - in the parent context, trying to access properties that were manipulated in the modal. To fix this, refactor to use `setBtnAction` in the modal controller and pass any data needed by the parent through that button callback.
      
        Example:

        ```js
        plugin.controller('myController', ['$scope', 'znModal', function ($scope, znModal) {
          
          $scope.modalData = {};
          
          znModal({
            template: '<div ng-init="modalData.prop = 123"></div>',
            scope: $scope,
            btns: {
                'Save': {
                   primary: true,
                   action: function() {
                     console.log($scope.modalData.prop)
                   }
                }
            }
          })
        }])
        ```

        Fix:

        ```js
        plugin.controller('myController', ['$scope', 'znModal', function ($scope, znModal) {
                    
          znModal({
            template: '<div ng-init="modalData.prop = 123"></div>',
            scope: $scope,
            btns: {
                'Save': {
                   primary: true,
                   action: function(modalData) {
                     console.log(modalData.prop)
                   }
                }
            }
          })
        }])
        .controller('modalController', ['$scope', function ($scope) {
          $scope.modalData = {}
          
          $scope.setBtnAction('Save', function(callback) {
            callback($scope.modalData)
          })
        }]) 
        ```

      
      - using a custom defined css class to set the modal width. The custom classes will continue to apply other styling, but it won't affect the width.
    
        Example:

        ``` css 
        .custom-css-wdth-class {
          width: 100px
        }
        ```

        ```js
        plugin.controller('myController', ['$scope', 'znModal', function ($scope, znModal) {
                    
          znModal({
            template: '<div>Hello</div>',
            classes: 'custom-css-width-class'
          })
        }])
        ```

        Fix:

        ```js
        plugin.controller('myController', ['$scope', 'znModal', function ($scope, znModal) {
          
          znModal({
            template: '<div>Hello</div>',
            width: '100px'
          })
        }])
        ```

    
    - custom modals. If you are using a regular Bootstrap modal without `znModal`, the grey backdrop won't span the entire page. It will be bound by the dimensions of iframe. Refactor to use `znModal`

    - using $location in `$scope.$on('$destroy')`. You can no longer clear query/hash params when the user leaves the plugin
    - **Patterns that don't work in Version 2 and are only fixable by non-trivial refactoring:**

        - Setting global variables to communicate between individual interfaces of same plugin

        - `$scope.$parent`: any attempt to access `$scope` outside of the plugin context is restricted now, so you'll just have to figure out a more creative (and secure) means of acquiring/storing/passing that information.

          NB: obviously using `$scope.$parent` to access properties _within_ your plugin context is a perfectly safe and legitimate use of this strange angularJS feature.


6. Push up a draft version to test in a "production" environment

    - `npm run build` produces a `dist.zip` file in your frontend directory (`/plugins/name-of/plugin/dist.zip`)
    - In the Zengine UI, click on the Upload Code button to upload it as a draft, and change the mode to "Draft."

        ![Zengine UI Upload Screenshot](https://i.ibb.co/tLzJTgj/Screen-Shot-2019-11-01-at-16-46-52.png)

    - Do any acceptance testing deemed necessary, as the assets are now being served via the same mechanisms and services that your published code will be served through. This gives you the chance to vet your plugin as thoroughly as possible before making it public.

7. Publish

    In the Zengine UI, you can observe the status of your uploaded frontend plugin code. If you have any changes in draft that have not been published or made public yet, the status will be "unpublished."

    ![Unpublished Code](https://i.ibb.co/L1c7NFV/Screen-Shot-2019-11-01-at-16-56-13.png)

    To publish, visit the publish page and click "Save & Publish"

    ![Publish Page Button](https://i.ibb.co/yYR4TPv/Screen-Shot-2019-11-01-at-17-05-24.png)

    ![Publish Page](https://i.ibb.co/S5gC4gQ/Screen-Shot-2019-11-01-at-17-06-50.png)

    Your plugin is now fully migrated and ready for public use!

    ![Published Code Screenshot](https://i.ibb.co/qRyCDBT/Screen-Shot-2019-11-01-at-17-07-35.png)

## Build Process Nuances

The Zengine Legacy Wrapper uses Parcel (version 1.12.3) to transpile, serve, and build plugin source code. See the [parcel documentation](https://parceljs.org/) for a closer look into the various options available to you through this tool. A special [parcel plugin](https://github.com/ZengineHQ/parcel-plugin-zengine-migrator) was built to do the Zengine-specific heavy lifting behind the scenes.

With that in mind, here are a few nuances to be aware of during the build process

- When building a plugin with Handlebars imported (true by default), ignore the build error that shows up regarding the fs library. It’s a red herring and won’t affect your plugin from running successfully. _On occasion, the build will appear to hang_, **simply wait** (usually no more than 10s) and it often will kick in again and fix itself. Otherwise, just restart the server (`npm start`), and possibly delete `.cache/`. If you are not using Handlebars in your plugin, feel free to [remove it](#removing-dependencies).

## Environments

Use `mayan` commands to serve, build, deploy, and publish your plugin's various environments. 

The `ZENGINE_ENV` shell variable is used to determine that environment from the maya.json.

One way to take advantage of this variable in your migrated legacy plugin, is to choose from the list of build and dev scripts which are automatically created in the `package.json` based on the current maya.json environments at the time of migration. Specify an environment with `npm run dev-env-name` to serve locally and `npm run build-env-name` to build for deployment. Check out your package.json to see what commands are currently available or to adjust them to your needs after the same patterns.

Alternatively, use `mayan` to pass the right environment variables to the default `start` or `build` scripts. Marking a plugin with `"version": 2` will cause mayan to use the new build process of your migrated plugin.

#### Example:

maya.json:

```js
{
  "environments": {
    "dev": {
      "plugins": {
        "name-of-directory": { // assumes a frontend code directory at ./plugins/name-of-directory
          "id": 123,
          "namespace": "my-cool-plugin",
          "route": "/my-cool-plugin", // deprecated legacy property (invalid in version 2+)
          "version": 2
        }
      }
      "default": true
    }
  }
}
```

bash:

```
mayan watch -f -e dev
```

This configuration and command will serve up (`watch`) the frontend (`-f`) of your plugin locally with HMR so you can see changes to your plugin live in the Admin UI as you make them. The plugin id 123 and namespace 'my-cool-plugin' will be used to build your app, based on the environment (`-e dev`) specified in the command. This is a migrated plugin, so having `"version": 2` in the configuration is critical to ensuring the build process is correct.

## Managing Dependencies

### Adding Dependencies

A typical `npm install package-name` with `import object from 'package-name'` development flow should work great in most cases. In some rare cases (maybe trying to import a very old library?), relying on `<script src="http://url.com/package"></script>` may be a better move. Either way, you are in full control of all the source code to handle dependencies the way you see fit.

### Dependencies with Dynamic Imports

Some libraries do some fancy things with dynamic importing, like tiny-mce and ace editor. These libraries were available for use in version 1, and as such we wanted to make sure they were available "out of the box" in this migration process. However, because of the size and complexity of these libraries, they are not included by default. Rather, you will find commented imports are available in the `./wrapper/plugin.js` file, for your reference. To use any theme, mode, or plugin with those libraries, the respective files from those directories need to be specifically imported.

### Removing Dependencies

To remove a library, you can simply find the import statement for that library in `./wrapper/plugin.js` and delete it, and optionally also `npm uninstall` it to remove it entirely. If the library is an angularjs module, you will also need to remove it from the module declarations in `./wrapper/lib/wrapper.js`, as well.

## Migration Code Mods

During the migration process (running `zmig` in your frontend code directory), some code modifications are directly applied to your source code:

### Plugin Namespace

Access to the plugin's namespace in frontend code was previously possible via `$scope.pluginName` or `$scope.$parent.pluginName`. This is no longer true, but the namespace _is_ available via `plugin.namespace`, so your source code is automatically modified accordingly.

Example: `var namespace = $scope.pluginName` => `var namespace => plugin.namespace`

### $window

`$window` from Angular made some assumptions about the plugin's runtime context that couldn't be supported properly in Version 2, so this modification changes all references to `$window` to point to a custom service in the legacy wrapper: `znWindow`. Behavior is expected to be consistent after this change.

## Adding a Separate Frontend App to your Migrated Plugin Code

Here are the steps to take to keep your migrated views (like a settings page, for example), and also develop a _new_ view (like a main fullPage) using your frontend technology of choice (like React) with the same parcel build process already present in your plugin repo.

1. Create your new frontend in a new folder (I called mine main):
    ```
    /zn-plugin-my-plugin
      /plugins
        /my-plugin
          /src <-- v1 settings code still lives here
          /main <-- new, separate frontend (React maybe) lives here
            main.js <-- React code :)
            styles.css <-- way better styles I'm sure lol
          main.html <-- entry point for new frontend page, at "top level" of frontend directory
    ```

    NB: name your new html entry point something different than index.html, because parcel will use that name to build your stuff and distinguish from the other entry points. index.html is already being used by the old code.

2. Move several files (and adjust a few imports as a result)
    - index.html needs to move out of /wrapper so it is an immediate child of /my-plugin (just like our new main.html). Adjust the imports in index.html link and script tags (`"plugin.js" => "wrapper/plugin.js"` and `"plugin.scss" => "wrapper/plugin.scss"`).
    - the directories `/wrapper/fonts`, `/wrapper/images`, and `/wrapper/imgs` all need to be moved to the top of /my-plugin, as well. You actually won’t need to adjust any imports for this movement, surprisingly. This is to align them with the updated parcel build configuration, since we will now have two entry points at the top level /my-plugin and not just one at /my-plugin/wrapper.

3. `npm i parcel-plugin-copy-files -D` and put this in your package.json:

    ```
    {
      ...,
      "files-to-copy: ["plugin.json"]
    }
    ```

4. Having two entry points in parcel breaks some of the legacy-builder’s ability to dynamically generate the plugin.json, and so you will need to manually create a /my-plugin/plugin.json file. Here is an example of what it might look like now:

    ```
    {
      "icon": "icon-share",
      "views": [
        {
          "src": "/index.html",
          "type": "settings"
        },
        {
          "src": "/index.html",
          "type": "inline",
          "location": "zn-plugin-form-top"
        },
        {
          "src": "/main.html", <-- new one!
          "type": "fullPage",
          "hideIcon": false
        }
      ]
    }
    ```

    If you’re not sure what it should look like, you can start by looking at your previously generated plugin.json file in the dist folder, and then just add a view for your new entry point.

5. Adjust your start and build scripts in your frontend package.json (compare with your current to make sure any other additions to your scripts are captured in these changes):

    ```
    {
      "scripts": {
        "start": "rm -rf dist; parcel serve main.html index.html --https",
        "build": "rm -rf dist; parcel build main.html index.html --no-cache"
      }
    }
    ```

    What's important about these changes is the two positionals reflecting the new entry points that parcel will serve and build `main.html index.html`.
