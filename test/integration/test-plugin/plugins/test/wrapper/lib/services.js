import { client } from './wrapper';
import { sanitizeForPostMessage, sleep } from './utils';

export function Services (plugin) {
  plugin
    .factory('RecursionHelper', ['$compile', function RecursionHelperFactory ($compile) {
      return {
        /**
         * Manually compiles the element, fixing the recursion loop.
         * @param element
         * @param [link] A post-link function, or an object with function(s) registered via pre and post properties.
         * @returns An object containing the linking functions.
         */
        compile: function (element, link) {
          // Normalize the link parameter
          if (angular.isFunction(link)) {
            link = { post: link };
          }

          // Break the recursion loop by removing the contents
          var contents = element.contents().remove();
          var compiledContents;
          return {
            pre: (link && link.pre) ? link.pre : null,
            /**
                 * Compiles and re-adds the contents
                 */
            post: function (scope, element) {
              // Compile the contents
              if (!compiledContents) {
                compiledContents = $compile(contents);
              }
              // Re-add the compiled contents to the element
              compiledContents(scope, function (clone) {
                element.append(clone);
              });

              // Call the post-linking function, if any
              if (link && link.post) {
                link.post.apply(null, arguments);
              }
            }
          };
        }
      };
    }])
    .factory('filterDefinition', ['inlineFilter', function filterDefinitionFactory (inlineFilter) {
      /**
       * Get Operator
       *
       * @author	Wes DeMoney <wes@wizehive.com>
       * @since	0.5.75
       * @param	{object}	filter
       * @returns	{string}
       */
      function getOperator (filter) {
        return inlineFilter.getOperator(filter);
      }

      /**
     * Parse Filter
     *
     * @author	Wes DeMoney <wes@wizehive.com>
     * @since	0.5.75
     * @param	{object}	filter
     * @returns	{object}	parsed
     */
      function parseFilter (filter) {
        var operator = getOperator(filter);

        if (!operator) {
          return false;
        }

        return {
          operator: operator,
          conditions: filter[operator]
        };
      }

      /**
     * Filter Definition
     *
     * @author	Wes DeMoney <wes@wizehive.com>
     * @since	0.5.75
     * @param	{object}	filter
     * @returns	{object}	definition
     */
      var filterDef = function (filter) {
        // Definition Object
        var def = {};

        /**
       * Set Filter
       *
       * @author	Wes DeMoney <wes@wizehive.com>
       * @since	0.5.75
       * @param	{object}	options
       */
        def.setFilter = function (options) {
          var filter = parseFilter(options);

          if (!filter) {
            return false;
          }

          def.setOperator(filter.operator);

          def.setConditions(filter.conditions);
        };

        /**
       * Set Operator
       *
       * @author	Wes DeMoney <wes@wizehive.com>
       * @since	0.5.75
       * @param	{string}	operator
       */
        def.setOperator = function (operator) {
          def.operator = operator;
        };

        /**
       * Set Conditions
       *
       * @author	Wes DeMoney <wes@wizehive.com>
       * @since	0.5.75
       * @param	{array}	conditions
       */
        def.setConditions = function (conditions) {
          conditions = conditions || [];

          var results = [];

          var emptyCondition = inlineFilter.getEmptyCondition();

          angular.forEach(conditions, function (condition, key) {
            // Ignore Empty Conditions
            if (angular.equals(condition, emptyCondition)) {
              return;
            }

            if (getOperator(condition)) {
              var nestedFilterDef = new filterDef(condition);
              condition = nestedFilterDef.getFilter();
            } else if (condition.filter) {
              var subFilterDef = new filterDef(condition.filter);

              condition.filter = subFilterDef.getFilter();
            } else if (condition.value && condition.value.split &&
              condition.value.split('|').length > 1) {
              var operator = 'or';

              if (condition.prefix.indexOf('not') == 0) {
                operator = 'and';
              }

              var pipedFilter = {};
              pipedFilter[operator] = [];

              var values = condition.value.split('|');

              angular.forEach(values, function (value) {
                var pipedFilterCondition = {
                  prefix: condition.prefix,
                  attribute: condition.attribute,
                  value: value
                };

                pipedFilter[operator].push(pipedFilterCondition);
              });
              var pipedFilterDef = new filterDef(pipedFilter);

              condition = pipedFilterDef.getFilter();
            }

            results[key] = condition;
          });

          def.conditions = results;
        };

        /**
       * Get Operator
       *
       * @author	Wes DeMoney <wes@wizehive.com>
       * @since	0.5.75
       * @returns	{string}	operator
       */
        def.getOperator = function () {
          return def.operator;
        };

        /**
       * Get Conditions
       *
       * @author	Wes DeMoney <wes@wizehive.com>
       * @since	0.5.75
       * @returns	{array}	conditions
       */
        def.getConditions = function () {
          return def.conditions;
        };

        /**
       * Get Condition
       *
       * @author	Wes DeMoney <wes@wizehive.com>
       * @since	0.5.75
       * @param	{int}	index
       * @returns	{object}	condition
       */
        def.getCondition = function (index) {
          var conditions = def.getConditions();
          if (index < 0) {
            index += conditions.length;
          }
          return conditions[index];
        };

        /**
       * Get Condition Count
       *
       * @author	Wes DeMoney <wes@wizehive.com>
       * @since	0.5.75
       * @returns	{int}	count
       */
        def.getConditionCount = function () {
          var conditions = def.getConditions();
          conditions = conditions || [];
          var count = 0;
          angular.forEach(conditions, function (condition) {
            if (condition.operator) {
              count += condition.getConditionCount();
            } else if (condition.or || condition.and) {
              count += condition.or ? def.getRecursiveConditionCount(condition.or) : def.getRecursiveConditionCount(condition.and);
            } else {
              count++;
            }
          });
          return count;
        };

        /**
       * Get Recursive Condition Count
       * Inline filter conditions doesn't have condition.operator but condition.and or condition.or  and are just javascript Arrays
       *
       * @author	Juan Scarton <juan.scarton@wizehive.com>
       * @since	2.2.1
       * @returns	{int}	count
       */
        def.getRecursiveConditionCount = function (arr) {
          var count = 0;
          angular.forEach(arr, function (condition) {
            if (condition.or || condition.and) {
              count += condition.or ? def.getRecursiveConditionCount(condition.or) : def.getRecursiveConditionCount(condition.and);
            } else {
              count++;
            }
          });
          return count;
        };
        /**
       * Get Attribute Condition
       *
       * @author	Wes DeMoney <wes@wizehive.com>
       * @since	0.5.75
       * @param	{object}	options
       * @returns	{object}	condition
       */
        def.attributeCondition = function (options) {
          options = options || {};

          var condition = {};

          condition.prefix = options.prefix || '';
          condition.attribute = options.attribute || '';

          if (options.filter) {
            condition.filter = options.filter;
          } else {
            condition.value = options.value || '';
          }

          return condition;
        };

        /**
       * Add Condition
       *
       * @author	Wes DeMoney <wes@wizehive.com>
       * @since	0.5.75
       * @param	{object}	condition
       */
        def.addCondition = function (condition) {
          def.conditions.push(condition);
        };

        /**
       * Rempve Condition
       *
       * @author	Wes DeMoney <wes@wizehive.com>
       * @since	0.5.75
       * @param	{int}	index
       */
        def.removeCondition = function (options) {
          var index = 0;

          if (isNaN(options)) {
            // Find Condition Index
          } else {
            index = options;
          }

          // Remove by Index
          def.conditions.splice(index, 1);
        };

        /**
       * Get Filter
       *
       * @author	Wes DeMoney <wes@wizehive.com>
       * @since	0.5.75
       * @return	{object}	filter
       */
        def.getFilter = function () {
          var operator = def.getOperator();
          var conditions = def.getConditions();
          var filter = {};

          filter[operator] = conditions;

          return filter;
        };

        def.setFilter(filter);

        return def;
      };

      return filterDef;
    }])
    /**
     * Inline Filter Operators
     *
     * @since	0.5.75
     * @param	{array}
     */
    .value('inlineFilterOperators', [
      {
        operator: 'and',
        conditionLabel: 'And',
        selectorLabel: 'All'
      },
      {
        operator: 'or',
        conditionLabel: 'Or',
        selectorLabel: 'Any'
      }
    ])
    /**
     * Inline Filter Service
     *
     * Copyright (c) WizeHive - http://www.wizehive.com
     *
     * @author	Wes DeMoney <wes@wizehive.com>
     * @since	0.5.75
     */
    .service('inlineFilter', ['inlineFilterOperators', '$rootScope',
      function inlineFilterService (inlineFilterOperators, $rootScope) {
        var svc = this;

        /**
     * Valid Operators
     *
     * @since	0.5.75
     */
        svc.operators = ['and', 'or'];

        /**
     * Get Default Operator
     *
     * @author	Wes DeMoney <wes@wizehive.com>
     * @since	0.5.75
     * @param	{array}	operators
     * @returns	{boolean|string}
     */
        svc.getDefaultOperator = function (operators) {
          operators = operators || [];

          if (!operators.length) {
            return false;
          }

          return operators[0];
        };

        /**
     * Operator in Valid Operators
     *
     * @author	Wes DeMoney <wes@wizehive.com>
     * @since	0.5.75
     * @param	{string}	operator
     * @returns	{boolean}
     */
        svc.inOperators = function (operator) {
          return svc.operators.indexOf(operator) !== -1;
        };

        /**
     * Get Operator
     *
     * @author	Everton Yoshitani <everton@wizehive.com>
     * @since	0.5.75
     * @param	{object}	operator
     * @returns	{string}
     */
        svc.getOperator = function (filter) {
          if (filter && Object.prototype.hasOwnProperty.call(filter, 'and')) return 'and';
          if (filter && Object.prototype.hasOwnProperty.call(filter, 'or')) return 'or';
          return false;
        };

        /**
     * Get Valid Operators from Filter Options
     *
     * @author	Wes DeMoney <wes@wizehive.com>
     * @since	0.5.75
     * @param	{object}	options
     * @returns	{array}
     */
        svc.getOperators = function (options) {
          var operators;
          var valid = [];

          if (options.operators) {
            operators = options.operators;
          } else {
            operators = svc.operators;
          }

          angular.forEach(operators, function (operator) {
            if (svc.inOperators(operator)) {
              valid.push(operator);
            }
          });

          return valid;
        };

        /**
     * Get Operator Options
     *
     * @author	Wes DeMoney <wes@wizehive.com>
     * @since	0.5.75
     * @param	{array}	operators
     * @returns	{array}
     */
        svc.getOperatorOptions = function (operators) {
          operators = operators || [];

          var options = [];

          angular.forEach(inlineFilterOperators, function (operator) {
            if (operators.indexOf(operator.operator) !== -1) {
              options.push(operator);
            }
          });

          return options;
        };

        /**
     * Get Default Filter
     *
     * @author	Wes DeMoney <wes@wizehive.com>
     * @since	0.5.75
     * @param	{array}	operators
     * @returns	{object}
     */
        svc.getDefaultFilter = function (operators) {
          var defaultOperator = svc.getDefaultOperator(operators);

          if (!defaultOperator) {
            return false;
          }

          return svc.getEmptyFilter(defaultOperator);
        };

        /**
     * Get Empty Filter
     *
     * @param	{string}	operator
     * @returns	{object}
     */
        svc.getEmptyFilter = function (operator) {
          var filter = {};

          filter[operator] = [];

          return filter;
        };

        /**
     * Get Empty Condition
     *
     * @param	{string}	attribute
     * @returns	{object}
     */
        svc.getEmptyCondition = function (attribute) {
          attribute = attribute || '';

          return {
            prefix: '',
            attribute: attribute,
            value: ''
          };
        };

        /**
     * Merge Conditions into Filter
     *
     * @param	{object}	filter
     * @param	{array}		conditions
     * @returns	{object}
     */
        svc.mergeConditions = function (filter, conditions) {
          var operator = svc.getOperator(filter);

          if (!operator) {
            return false;
          }

          filter[operator] = filter[operator].concat(conditions);

          return filter;
        };

        /**
     * Filter has Empty Conditions
     *
     * @param	{object}	filter
     * @returns	{Boolean}
     */
        svc.hasEmptyConditions = function (filter) {
          var operator = svc.getOperator(filter);

          if (!operator) {
            return false;
          }

          return filter[operator].length === 0;
        };

        /**
     * Combine User Field Type Blacklist with System Blacklist
     *
     * @author	Wes DeMoney <wes@wizehive.com>
     * @since	0.5.51
     * @param	{array}	fieldTypeBlacklist
     * @returns {array}
     */
        svc.combineFieldTypeBlacklist = function (fieldTypeBlacklist) {
          fieldTypeBlacklist = fieldTypeBlacklist || [];

          var disallowedFieldTypes = [];

          // Allowed non-input fields
          var allowedExceptions = ['calculated-field', 'link-counter', 'summary'];

          angular.forEach($rootScope.formFieldTaxonomy, function (taxonomy) {
            if (!taxonomy.isInput && allowedExceptions.indexOf(taxonomy.id) == -1) {
              disallowedFieldTypes.push(taxonomy.id);
            }
          });

          return disallowedFieldTypes.concat(fieldTypeBlacklist);
        };
      }])
    .service('filterWorkspace', ['$rootScope', '$q', function filterWorkspaceService ($rootScope, $q) {
      /**
       * Workspace Data Indexed by Workspace Id
       *
       * @type	{object}
       */
      var workspaces = {};

      /**
     * Get Workspace by Workspace Id or Form Id
     *
     * @param	{object}	options
     * @returns	{promise}
     */
      function getWorkspace () {
        if ($rootScope.workspace) {
          return $q.when($rootScope.workspace);
        }

        const deferred = $q.defer();

        client.call(
          { method: 'context' }
        ).then(context => {
          deferred.resolve(context.workspace);
        });

        return deferred.promise;
      }

      /**
     * Index Forms by Form Id
     *
     * @param	{array}	workspaceForms
     * @returns	{object}
     */
      function indexWorkspaceForms (workspaceForms) {
        var forms = {};

        angular.forEach(workspaceForms, function (form) {
          forms[form.id] = form;
        });

        return forms;
      }

      /**
     * Set Workspace Users
     *
     * @param	{array}	workspaceMembers
     * @returns	{object}
     */
      function setWorkspaceUsers (workspaceMembers) {
        var users = [];
        angular.forEach(workspaceMembers, function (member) {
          users.push(member.user);
        });

        var compare = function (a, b) {
          var compareA = a.displayName && a.displayName.toLowerCase();
          var compareB = b.displayName && b.displayName.toLowerCase();
          if (compareA < compareB) {
            return -1;
          }
          if (compareA > compareB) {
            return 1;
          }
          return 0;
        };

        users.sort(compare);

        return users;
      }

      return {
        getWorkspace: function (options, skipCache) {
          return getWorkspace(options, skipCache)
            .then(function (workspace) {
              if (skipCache && workspaces[workspace.id]) {
                return workspaces[workspace.id];
              }

              workspaces[workspace.id] = angular.copy(workspace);

              // Index Forms
              workspaces[workspace.id].forms = indexWorkspaceForms(workspace.forms);

              // Set Users
              workspaces[workspace.id].users = setWorkspaceUsers(workspace.members);

              return workspaces[workspace.id];
            }, function () {
              return false;
            });
        }
      };
    }])
    .factory('validateFilterOptions', ['inlineFilter', function validateFilterOptions (inlineFilter) {
      var genericMessage = 'Invalid filter passed to znFiltersPanel. ';

      function optionsError (message) {
        throw new Error(genericMessage + message);
      }

      function getOperator (filter) {
        return inlineFilter.getOperator(filter);
      }

      function getAttributeType (attribute, fields) {
        if (attribute.indexOf('field') === -1) {
          return undefined;
        }

        var fieldId = attribute.substring(5);

        var type;

        angular.forEach(fields, function (field) {
          if (field.id == fieldId) {
            type = field.type;
          }
        });

        return type;
      }

      function validateSubfilters (filter, subfilters) {
        if (subfilters !== false) {
          return;
        }

        var operator = getOperator(filter);

        angular.forEach(filter[operator], function (condition) {
          if (Object.prototype.hasOwnProperty.call(condition, 'filter')) {
            optionsError('Subfilters is not allowed by filter options');
          }

          if (Object.prototype.hasOwnProperty.call(condition, 'and') || Object.prototype.hasOwnProperty.call(condition, 'or')) {
            validateSubfilters(condition, subfilters);
          }
        });
      }

      function validateGroups (filter, groups) {
        if (groups !== false) {
          return;
        }

        var operator = getOperator(filter);

        angular.forEach(filter[operator], function (condition) {
          if (Object.prototype.hasOwnProperty.call(condition, 'and') || Object.prototype.hasOwnProperty.call(condition, 'or')) {
            optionsError('Groups is not allowed by filter options');
          }

          if (Object.prototype.hasOwnProperty.call(condition, 'filter')) {
            validateGroups(condition.filter, groups);
          }
        });
      }

      function validateDynamicValues (filter, dynamicValues) {
        if (dynamicValues !== false) {
          return;
        }

        var operator = getOperator(filter);

        angular.forEach(filter[operator], function (condition) {
          if (Object.prototype.hasOwnProperty.call(condition, 'value') && condition.value === 'logged-in-user') {
            optionsError('Dynamic value "logged-in-user" is not allowed by filter options');
          }

          if (Object.prototype.hasOwnProperty.call(condition, 'and') || Object.prototype.hasOwnProperty.call(condition, 'or')) {
            validateDynamicValues(condition, dynamicValues);
          }

          if (Object.prototype.hasOwnProperty.call(condition, 'filter')) {
            validateDynamicValues(condition.filter, dynamicValues);
          }
        });
      }

      function validateOperators (filter, operators) {
        var allowedOperators = ['and', 'or'];

        if (!angular.isArray(operators)) {
          return;
        }

        if (operators == allowedOperators) {
          return;
        }

        if (operators.length > 2 || operators.length == 2) {
          return;
        }

        var notAllowedOperator;

        angular.forEach(operators, function (operator) {
          if (allowedOperators.indexOf(operator) === -1) {
            return;
          }

          notAllowedOperator = (operator == 'and') ? 'or' : 'and';
        });

        var operator = getOperator(filter);

        if (operator == notAllowedOperator) {
          optionsError('Operator "' + notAllowedOperator + '" is not allowed by filter options');
        }

        angular.forEach(filter[operator], function (condition) {
          if (Object.prototype.hasOwnProperty.call(condition, 'and') || Object.prototype.hasOwnProperty.call(condition, 'or')) {
            validateOperators(condition, operators);
          }

          if (Object.prototype.hasOwnProperty.call(condition, 'filter')) {
            validateOperators(condition.filter, operators);
          }
        });
      }

      function validateAttributesBlacklist (filter, attributeBlacklist) {
        if (!angular.isArray(attributeBlacklist)) {
          return;
        }

        if (!attributeBlacklist.length) {
          return;
        }

        var operator = getOperator(filter);

        angular.forEach(filter[operator], function (condition) {
          if (Object.prototype.hasOwnProperty.call(condition, 'attribute') && attributeBlacklist.indexOf(condition.attribute) === 0) {
            optionsError('Attribute "' + condition.attribute + '" is not allowed by filter options');
          }

          if (Object.prototype.hasOwnProperty.call(condition, 'and') || Object.prototype.hasOwnProperty.call(condition, 'or')) {
            validateAttributesBlacklist(condition, attributeBlacklist);
          }

          if (Object.prototype.hasOwnProperty.call(condition, 'filter')) {
            validateAttributesBlacklist(condition.filter, attributeBlacklist);
          }
        });
      }

      function validateFieldTypesBlacklist (filter, fieldTypeBlacklist, formId, forms) {
        if (!angular.isArray(fieldTypeBlacklist)) {
          return;
        }

        if (!fieldTypeBlacklist.length) {
          return;
        }

        if (!Object.prototype.hasOwnProperty.call(forms, formId)) {
          return;
        }

        var operator = getOperator(filter);

        angular.forEach(filter[operator], function (condition) {
          if (Object.prototype.hasOwnProperty.call(condition, 'attribute') && Object.prototype.hasOwnProperty.call(forms[formId], 'fields')) {
            var type = getAttributeType(condition.attribute, forms[formId].fields);
            if (undefined !== type && fieldTypeBlacklist.indexOf(type) === 0) {
              optionsError('Attribute "' + condition.attribute + '" which have type "' + type + '" is not allowed by filter options');
            }
          }

          if (Object.prototype.hasOwnProperty.call(condition, 'and') || Object.prototype.hasOwnProperty.call(condition, 'or')) {
            validateFieldTypesBlacklist(condition, fieldTypeBlacklist, formId, forms);
          }

          if (Object.prototype.hasOwnProperty.call(condition, 'filter')) {
            var subfilterFormId = condition.attribute.substring(4);
            validateFieldTypesBlacklist(condition.filter, fieldTypeBlacklist, subfilterFormId, forms);
          }
        });
      }

      return function (filter, options, forms) {
        var operator = getOperator(filter);

        if (operator === false) {
          return;
        }

        if (!options) {
          return;
        }

        if (!options.formId) {
          return;
        }

        if (Object.prototype.hasOwnProperty.call(options, 'operators')) {
          validateOperators(filter, options.operators);
        }

        if (Object.prototype.hasOwnProperty.call(options, 'subfilters')) {
          validateSubfilters(filter, options.subfilters);
        }

        if (Object.prototype.hasOwnProperty.call(options, 'groups')) {
          validateGroups(filter, options.groups);
        }

        if (Object.prototype.hasOwnProperty.call(options, 'dynamicValues')) {
          validateDynamicValues(filter, options.dynamicValues);
        }

        if (Object.prototype.hasOwnProperty.call(options, 'attributeBlacklist')) {
          validateAttributesBlacklist(filter, options.attributeBlacklist);
        }

        if (!forms) {
          return;
        }

        if (Object.prototype.hasOwnProperty.call(options, 'fieldTypeBlacklist')) {
          validateFieldTypesBlacklist(filter, options.fieldTypeBlacklist, options.formId, forms);
        }
      };
    }])
    .service('znFiltersPanel', ['$rootScope', function ($rootScope) {
      return {
        open: (options) => {
          client.call({
            method: 'filtersPanel',
            args: {
              options: sanitizeForPostMessage(options)
            },
            callback: (err, filter) => {
              if (options.onSave) {
                options.onSave(filter);
                $rootScope.$apply();
              }
            }
          });
        }
      };
    }])
    .service('znModal', ['$rootScope', function ($rootScope) {

      return function (options) {
        let modalId = '';

        options = angular.extend({
          title: 'Dialog',
          template: '',
          templateUrl: '',
          classes: '',
          unique: true,
          btns: {},
          header: null,
          closeButton: true,
          error: false,
          width: null,
        }, options);

        if (options.error) {
          options.header = angular.extend(options.header || {}, {
            icon: 'icon-attention',
            classes: 'message-alert'
          });

          options.classes = options.classes + ' app-error';
        }

        const callbacks = {};

        Object.keys(options.btns)
          .forEach(key => {
            let name = key;
            if (options.btns[key].name) {
              name = options.btns[key].name;
            }
            const hasAction = typeof options.btns[key].action === 'function';

            if (hasAction) {
              callbacks[name] = options.btns[key].action;
              options.btns[key].action = name;
            }

            client.subscribe(name, ({ fromChildId, data = {} }) => {
              if (fromChildId !== modalId) {
                return;
              }

              if (hasAction) {
                callbacks[name](data.data);
              }

              if (options.btns[key].close !== false && !data.keepOpen) {
                client.call({ method: 'closeChild', args: { id: modalId } });
              }
            });
          });

        let isOpen = true;
        let width = options.width;

        if (!options.width && options.classes) {

          if (options.classes.indexOf('wide-modal') > -1) {
            width = '80%';
          } else if (options.classes.indexOf('modal-filter-panel') > -1) {
            width = '830px';
          } else if (options.classes.indexOf('modal-narrow') > -1) {
            width = '450px';
          }

        }

        client.call({
          method: 'modal',
          args: {
            options: {
              src: '/index.html',
              context: sanitizeForPostMessage(options),
              width: width
            }
          },
          callback: (err, id) => {
            modalId = id;
          }
        });

        client.subscribe('close', () => {
          if (typeof options.afterClose === 'function' && isOpen) {
            options.afterClose();
          }

          $rootScope.$apply();

          isOpen = false;
        });

        return {
          close: async function () {

            async function modalIdIsReady () {
              if (modalId) {
                return;
              }

              // if we have to wait, we'll wait no longer than a 60fps frame before checking again #perf
              await sleep(16);

              return modalIdIsReady();
            }

            await modalIdIsReady();

            client.call({ method: 'closeChild', args: { id: modalId } });

            if (typeof options.afterClose === 'function' && isOpen) {
              options.afterClose();
            }

            $rootScope.$apply();

            isOpen = false;
          }
        };
      };
    }]);
}
