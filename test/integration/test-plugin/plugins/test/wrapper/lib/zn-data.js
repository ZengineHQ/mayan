export function ZnData (plugin) {
  plugin.factory('znData', ['$q', function ($q) {
    /**
     * Throw an error when an unsupported method on a particular resource is called
     *
     * @param   {string}  method - method name
     * @returns {function}
     *
     */
    function unsupportedMethod (method) {
      return function () {
        throw new Error('Method "' + method + '" is not supported by this resource');
      };
    }

    const _resources = {
      Activities: ['/activities/:id'],
      AppTemplates: ['/app_templates/:id'],
      AppTemplateInstallJobs: ['/app_template_install_jobs/:id'],
      BinaryExportBatch: ['/binary_export_jobs/:binaryExportJobId/batches/:id', 'binaryExportJobId'],
      BinaryExportJob: ['/binary_export_jobs/:id'],
      Calculate: (function () {
        var _resource = resource('Calculate', '/calculate');
        var ret = {};
        // query uses POST to send request to API
        ret.query = function (params, success, error) {
          return _resource.save({}, params, success, error);
        };
        // No other methods supported for this verb endpoint
        for (var method in _resource) {
          ret[method] = ret[method] || unsupportedMethod(method);
        }

        return ret;
      })(),
      CalculationSettings: ['/calculation_settings/:id'],
      DataViews: ['/data_views/:id'],
      Events: ['/events/:id'],
      Files: ['/files/:id'],
      Forms: ['/forms/:id', null, {
        objectVersionField: 'objectVersion'
      }],
      DefaultFormPermissions: ['/forms/permissions', null, {
        objectVersionField: 'objectVersion'
      }],
      FormRecordPermissions: ['/forms/:formId/records/permissions', 'formId', {
        objectVersionField: 'objectVersion'
      }],
      FormFields: ['/forms/:formId/fields/:id'],
      FormFolders: ['/forms/:formId/folders/:id'],
      FormGroups: ['/form_groups/:id'],
      FormRecords: ['/forms/:formId/records/:id', null, {
        objectVersionField: 'objectVersion'
      }],
      FormUploads: ['/forms/:formId/uploads', null, {
        multipartKey: 'file'
      }],
      FormFieldTaxonomy: ['/form_field_taxonomy'],
      RecordImportJobs: ['/record_import_jobs/:id'],
      RecordExportJobs: ['/record_export_jobs/:id', null],
      RecordImportFiles: ['/record_import_files/:id', null, {
        multipartKey: 'file'
      }],
      Roles: ['/workspaces/:workspaceId/roles/:id'],
      Notes: ['/notes/:id'],
      NoteReplies: ['/notes/:noteId/replies/:id'],
      Notifications: ['/notifications/:id'],
      NotificationEmails: ['/notification_emails/:id'],
      Tasks: ['/tasks/:id'],
      TaskLists: ['/task_lists/:id'],
      TaskPriorities: ['/task_priorities'],
      TaskStatuses: ['/task_statuses'],
      Users: ['/users/:id'],
      TaskPreferences: ['/users/:userId/task_preferences', 'userId'],
      Webhooks: ['/webhooks/:id'],
      ScheduledWebhooks: ['/scheduled_webhooks/:id'],
      WebhookEvents: ['/webhook_events/:id'],
      Workspaces: ['/workspaces/:id'],
      WorkspaceInvitees: ['/workspaces/:workspaceId/invitees/:id'],
      WorkspaceMembers: ['/workspaces/:workspaceId/members/:id'],
      WorkspaceTransferRequests: ['/workspaces/:workspaceId/transfer_requests/:id'],
      WorkspaceTaskPreferences: ['/workspaces/:workspaceId/members/:memberId/task_preferences', 'memberId'],
      WorkspaceLogo: ['/workspaces/:workspaceId/logo', null, {
        multipartKey: 'logo'
      }],
      WorkspaceCopyJobs: ['/workspace_copy_jobs'],
      Countries: ['/countries'],
      States: ['/states'],
      Subscriptions: ['/subscriptions/:id'],
      Plugins: ['/plugins/:id', null, {
        objectVersionField: 'objectVersion'
      }],
      PluginUploads: ['/plugins/:pluginId/uploads', null, {
        multipartKey: 'draftSource'
      }],
      PluginScreenshots: ['/plugins/:pluginId/screenshots'],
      PluginServices: ['/plugins/:pluginId/services/:id'],
      PluginServiceUploads: ['/plugins/:pluginId/services/:serviceId/uploads', null, {
        multipartKey: 'draftSource'
      }],
      PluginSettings: ['/plugins/:pluginId/settings', 'pluginId'],
      WorkspacePluginLinks: ['/workspace_plugin_links/:id'],
      PluginConfigs: ['/plugins_configs/:id', null, {
        objectVersionField: 'objectVersion'
      }],
      Organizations: ['/organizations/:id'],
      OrganizationsAuthProviders: ['/organizations/:organizationId/auth_providers/:id'],
      AuthProviders: ['/auth_providers/:id']
    };

    /**
     * Build a set of resource functions
     *
     * @param  string    path
     * @param  [string]  idField
     * @param  object    options - multipart, objectVersion
     */
    function resource (name, path, idField, options) {
      idField = idField || 'id';

      const regex = new RegExp(':([a-z]+)', 'ig');
      const pathParams = path.match(regex);

      let idRemovedPath = path;
      if (path.substring(path.length - idField.length - 1) === ':' + idField) {
        idRemovedPath = path.substring(0, path.length - idField.length - 2);
      }

      var save = function (params, data, success, error) {
        if (typeof data === 'function') {
          error = success;
          success = data;
          data = params;
          params = {};
        } else if (typeof data === 'undefined') {
          data = params;
          params = {};
        }

        // These query params names will be used to check whether or not params as field attributes
        // if true will use `update` action rather then `create`.
        var updateActionWhitelist = ['timezone', 'limit', 'sort', 'page', 'direction', 'access_token', 'validate_only'];

        // Set whether it's an update or create
        var method = 'post';

        var idFieldValue = params[idField] || data[idField];

        var isMultiIdField = (typeof idFieldValue === 'string' && idFieldValue.indexOf('|') !== -1);

        var hasBatchConditions = false;

        function inPathParams (param) {
          return pathParams && pathParams.indexOf(':' + param) !== -1;
        }

        if (idFieldValue) {
          method = 'put';

          if (isMultiIdField) {
            path = idRemovedPath;
          }
        } else {
          path = idRemovedPath;

          if (params) {
            angular.forEach(params, function (value, key) {
              // Ignore param if it's a reserved param or a path param
              if (updateActionWhitelist.indexOf(key) === -1 && !inPathParams(key)) {
                hasBatchConditions = true;
              }
            });

            if (hasBatchConditions) {
              method = 'put';
            }
          }
        }

        // Set whether it's a bulk or single operation
        if (!(angular.isArray(data) || isMultiIdField || hasBatchConditions) && method === 'put' && typeof params[idField] === 'undefined') {
          params[idField] = data[idField];
        }

        // Transform multipart form data for file uploads
        if (options && options.multipartKey) {
          const key = options.multipartKey;

          data.multipart = {
            key: key,
            file: data[key]
          };
        }

        const objectVersionField = options && options.objectVersionField ? options.objectVersionField : false;  

        return request(path, { pathParams, objectVersionField }, method, params, data, success, error);
      };

      return {
        get: request.curry(path, { pathParams }, 'get'),
        query: request.curry(idRemovedPath, { pathParams }, 'get'),
        count: function (params, success, error) {
          return request(idRemovedPath + '/count', { pathParams }, 'get', params, success, error);
        },
        update: request.curry(path, { pathParams }, 'put'),
        updateAll: save,
        save: save,
        saveAll: save,
        delete: request.curry(path, { pathParams }, 'delete'),
        deleteAll: function (params, success, error) {
          return request(idRemovedPath, { pathParams }, 'delete', params, success, error);
        },
        del: request.curry(path, { pathParams }, 'delete'),
        remove: request.curry(path, { pathParams }, 'delete')
      };
    }

    function _flattenObject (ob) {
      const toReturn = {};

      for (let i in ob) {

        if (!ob[i]) {
          continue;
        }

        if ((typeof ob[i]) == 'object') {
          if (ob[i] instanceof Array) {
            toReturn[i] = ob[i].join(',');
          } else {
            let flatObject = _flattenObject(ob[i]);
            for (let x in flatObject) {

              if (!flatObject[x]) {
                continue;
              }

              toReturn[i + '.' + x] = flatObject[x];
            }
          }
        } else {
          toReturn[i] = ob[i];
        }
      }
      return toReturn;
    }

    function request (path, options, method, params, data, successCb, errorCb) {
      const { pathParams, objectVersionField } = options;

      if (typeof params === 'function') {
        errorCb = data;
        successCb = params;
        data = {};
        params = {};
      } else if (typeof data === 'function') {
        errorCb = successCb;
        successCb = data;
        data = {};
      }

      // So modded/deleted params on #265 don't make it back to caller
      params = angular.copy(params);

      let url = path;

      angular.forEach(pathParams, pathParam => {
        const param = pathParam.replace(':', '');
        if (params[param] && url.indexOf(pathParam) !== -1) {
          url = url.replace(pathParam, params[param]);
          delete params[param];
        } else {
          url = url.replace('/' + pathParam, '');
        }
      });

      const multipart = data ? data.multipart : null;

      if (data) {
        delete data.multipart;
      }

      const headers = {};

      if (method === 'put' && objectVersionField && params[objectVersionField]) {
        // Set currentObjectVersion to be used for headers, and remove from query params
        headers['X-If-ObjectVersion-Matches'] = params[options.objectVersionField];
        delete params[objectVersionField];
      }
      var deferred = $q.defer();

      //flatten param object as is done in the original implementation of znData in anglerfish
      params = _flattenObject(params);

      const call = () => {
        plugin.client.call({
          method: 'znHttp',
          timeout: 60000,
          args: {
            options: { apiVersion: 'v1' },
            request: {
              method,
              url,
              data,
              params,
              headers,
              multipart
            }
          }
        }).then(result => {
          const resp = result.data;

          const isQuery = method === 'get' && Object.keys(params).length;

          let resourceData = isQuery ? [] : null;

          if (angular.isArray(resp)) {
            resourceData = JSON.parse(angular.toJson(resp));
          }

          if (resp.data) {
            resourceData = resp.data;
          }

          if (successCb) {
            successCb(resourceData, {
              status: resp.status,
              code: resp.code,
              totalCount: resp.totalCount,
              limit: resp.limit,
              offset: resp.offset
            }, result.headers);
          }

          deferred.resolve(resourceData);
        }).catch(err => {
          if (errorCb) {
            errorCb(err.data);
          }

          deferred.reject(err.data);
        });
      };

      if (multipart) {
        const file = multipart.file;
        const reader = new FileReader();

        reader.onload = () => {
          const arrayBuffer = reader.result;
          multipart.file = arrayBuffer;
          multipart.name = file.name;
          multipart.type = file.type;
          call();
        };

        reader.readAsArrayBuffer(file);
      } else {
        call();
      }

      return deferred.promise;
    }

    return function (name) {
      if (!(name in _resources)) {
        throw new Error('Resource \'' + name + '\' doesn\'t exist.');
      }

      if (name === 'Calculate') {
        return _resources[name];
      }

      var args = _resources[name];
      // add resource name to list of arguments if not already present
      if (args[0] !== name) {
        args.unshift(name);
      }

      return resource.apply(this, args);
    };
  }]);
}
