import moment from 'moment';

export function Directives (plugin) {
  plugin
    .directive('dropdownMenuPersist', [function () {
      return {
        restrict: 'A',
        link: function (scope, element) {
          // Prevent menu from closing on inside click, unless it has persistent-close class
          // (to allow for save/cancel buttons)
          $(element).click(function (e) {
            if (!$(e.target).hasClass('dropdown-menu-close')) {
              e.stopPropagation();
            }
          });
        }
      };
    }])
    .directive('znFileSelect', ['$parse', function ($parse) {
      return {
        restrict: 'A',
        require: 'ngModel',
        scope: true,
        link: function (scope, el, attrs, ngModel) {
          var fn = $parse(attrs.znFileSelect);

          // Clear File
          scope.$watch(attrs.ngModel, function (value) {
            if (!value) {
              el.val(null);
            }
          }, true);

          // On File Selection, Execute Callback and
          // Update Model Value with the FileList object
          el.bind('change', function () {
            ngModel.$setViewValue(this.files);

            scope.$apply(function () {
              fn(scope);
            });

            this.value = null;
          });
        }
      };
    }])
    .directive('znDatetimepickerWrapper', ['$rootScope', function ($rootScope) {
      return {
        restrict: 'A',
        require: 'ngModel',
        scope: true,
        replace: false,
        controller: ['$scope', '$timeout', function ($scope, $timeout) {
          $scope.dateOptions = {
            'show-weeks': false
          };

          $scope.today = new Date();

          // Default Format
          $scope.format = 'yyyy-MM-dd';

          $scope.open = function ($event) {
            $event.preventDefault();
            $event.stopPropagation();

            $timeout(function () {
              $scope.opened = true;
            });
          };

          $rootScope.$watch('user', function (user) {
            if (user && user.settings.dateFormat) {
              $scope.format = user.settings.dateFormat.replace('mm', 'MM');
              $scope.user = user;
            }
          });
        }],
        link: function (scope, element, attrs, ngModelCtrl) {
          var syncTime = scope.$eval(attrs.syncTime);
          var apiDateFormat = 'YYYY-MM-DD';
          var apiDateTimeFormat = 'YYYY-MM-DDTHH:mm:ssZZ';

          var apiFormat = apiDateFormat;
          var datepicker = element.find('[datepicker-popup]');
          var datepickerNgModelCtrl = datepicker.controller('ngModel');

          setApiFormat(syncTime);

          scope.$watch(attrs.syncTime, function (val) {
            setApiFormat(val);
          });

          function setApiFormat (val) {
            if (val) {
              apiFormat = apiDateTimeFormat;
              syncTime = true;
            } else {
              apiFormat = apiDateFormat;
              syncTime = false;
            }
          }

          function setValue (value) {
            if (value != ngModelCtrl.$modelValue) {
              ngModelCtrl.$setViewValue(value);
            }
          }

          function parse (value, strict) {
            if (!value) {
              return value;
            }

            if (typeof value === 'object' &&
              value.constructor.name === 'Date') { // valid Date object
              var apiDate = moment(scope.date);

              if (syncTime && moment(scope.time).isValid()) {
                var apiTime = moment(scope.time);

                apiDate.hour(apiTime.hour());
                apiDate.minute(apiTime.minute());
                apiDate.second(0);
              }

              value = apiDate.format(apiFormat);
            } else { // manually typed string
              var userFormat = scope.format.toUpperCase();
              var parsedDate = moment(value, userFormat, strict);

              if (parsedDate.isValid()) {
                value = parsedDate.format(apiFormat);
              }
            }

            return value;
          }

          // Take User Data, Convert it to Model Data
          ngModelCtrl.$parsers.unshift(function (value) {
            return parse(value, true);
          });

          // Take Model Data, Convert it to View Data
          ngModelCtrl.$formatters.push(function (value) {
            var result;

            if (value) {
              var mDate = moment(value, apiFormat, true);

              if (mDate.isValid()) {
                result = mDate.toDate();
              }
            }

            return result;
          });

          // Update Directive Data
          ngModelCtrl.$render = function () {
            var value = ngModelCtrl.$viewValue;

            scope.date = value;
            scope.time = value;
          };

          scope.$watch(function () {
            return datepickerNgModelCtrl.$viewValue;
          }, function (value) {
            // Pass Along Date Validation to Directive
            ngModelCtrl.$setValidity('date', datepickerNgModelCtrl.$valid);

            value = parse(value, true);

            setValue(value);
          });

          if (syncTime) {
            scope.$watch('time', function (time) {
              time = parse(time, true);
              setValue(time);
            });
          }
        }
      };
    }])
    .directive('esc', ['$rootScope', function ($rootScope) {
      return {
        restrict: 'A',
        link: function (scope, element) {
          $(element).keydown(function (evt) {
            if (evt.which === 27) {
              $rootScope.$apply(function () {
                $rootScope.$broadcast('esc');
              });
            }
          });
        }
      };
    }])
    .directive('validate', [function () {
      return {
        restrict: 'A',
        link: function (scope, element, attrs) {
          var parents = $(element).parents('form[name]');
          var controlNames = attrs.validate.split(',');
          var form;
          var controls = [];

          function evaluate (submitted) {
            var valid = true;

            if (submitted) {
              angular.forEach(controls, function (control) {
                valid = valid && control.$valid;
              });
            }

            element[valid ? 'removeClass' : 'addClass']('error');
          }

          if (parents.length) {
            var formName = parents.first().attr('name');

            if (formName && scope[formName]) {
              form = scope[formName];

              angular.forEach(controlNames, function (controlName) {
                if (controlName in form) {
                  controls.push(form[controlName]);

                  scope.$watch(formName + '.' + controlName + '.$valid', function () {
                    evaluate(form.submitted);
                  });

                  $('[name=' + controlName + ']', element).change(function () {
                    $(this).trigger('input');
                  });
                }
              });

              scope.$watch(formName + '.submitted', function (submitted) {
                evaluate(submitted);
              });
            }
          }
        }
      };
    }])
    .directive('formError', [function () {
      return {
        restrict: 'A',
        scope: false,
        link: function (scope, element, attrs) {
          var name = attrs.name;

          function serializeError (error) {
            var errorMessages = {};
            var p, x;
            for (var i in error) {
              if (Object.prototype.hasOwnProperty.call(error, i)) {
                if (!angular.isObject(error[i]) || angular.isArray(error[i])) {
                  errorMessages[i] = error[i];
                } else {
                  p = serializeError(error[i]);
                  for (x in p) {
                    if (Object.prototype.hasOwnProperty.call(p, x)) {
                      errorMessages[i + '.' + x] = p[x];
                    }
                  }
                }
              }
            }
            return errorMessages;
          }

          scope.$watch(name, function (form) {
            if (!form) {
              return;
            }

            scope.$watch(name + '.errorObject', function (error) {
              if (!error) {
                return;
              }

              var errors = serializeError(error);

              form.submitted = true;

              var remove = function (path, initialValue, errorContainer) {
                var unwatcher = scope.$watch(path, function (value) {
                  if (initialValue !== value) {
                    // Change has been made so clear server validation error
                    field.$setValidity('server-validation', true);
                    errorContainer.remove();
                    unwatcher();
                  }
                });
              };

              // Variable path is the path of the error (same thing you would set as ng-model)
              // Variable x is the content of the error
              // Variable p is the current value of the field with error
              for (var path in errors) {
                if (Object.prototype.hasOwnProperty.call(errors, path)) {
                  var x, field, fieldElement, fieldContainer,
                    fieldName, errorContainer, controls;

                  x = (errors[path] && errors[path].join && errors[path].join('')) || errors[path];

                  // Get the field
                  fieldElement = $(element).find('[ng-model="' + path + '"]');
                  fieldName = fieldElement.attr('name');
                  fieldContainer = fieldElement.closest('[validate="' + fieldName + '"]');
                  field = form[fieldName];

                  if (!field) {
                    // No field for this error, skip to prevent errors
                    continue;
                  }

                  // Set the field as problematic
                  field.$setValidity('server-validation', false);

                  fieldContainer.addClass('error');
                  errorContainer = $('<div>').addClass('form-error error help-block').text(x);
                  controls = fieldContainer.find('.controls');

                  if (!controls.length) {
                    controls = fieldContainer;
                  }

                  controls.append(errorContainer);
                  remove(path, field.$modelValue, errorContainer);
                }
              }
            });
          });
        }
      };
    }])
    .directive('modal', ['znModal', function (modal) {
      return {
        restrict: 'A',
        replace: false,
        link: function (scope, element, attrs) {
          if (!attrs.href && !attrs.modal) {
            return;
          }
          element.bind('click', function (e) {
            e.preventDefault();
            modal({
              title: attrs.title || '',
              templateUrl: attrs.href || attrs.modal,
              classes: attrs.modalclass || ''
            });
          });
        }
      };
    }])
    /**
     * Draggable Wrapper Directive
     *
     */
    .directive('uiDraggable', [function () {
      return {
        restrict: 'A',
        link: function (scope, elem, attrs) {
          scope.$watch(attrs.uiDraggable, function (newVal) {
            angular.forEach(newVal, function (value, key) {
              elem.draggable('option', key, value);
            });
          }, true);

          elem.draggable();
        }
      };
    }])
    /**
     * checkList directive - allow multi value checkboxes to with with ng-model
     *
     * @author	Unknown
     * @since	0.5.x
     */
    .directive('checkList', [function () {
      return {
        scope: {
          checkValue: '=',
          list: '=checkList'
        },
        link: function (scope, elem, attrs) {
          var handler = function (setup) {
            if (setup) {
              if (!angular.isArray(scope.list)) {
                var value;
                if (scope.list) {
                  if (scope.list.id) {
                    // old member field value is
                    // still in single response format {id: 2, 'name': anna}
                    // and was converted from dropdown to checklist.
                    value = parseInt(scope.list.id, 10);
                  } else {
                    // single checkbox value came back as string
                    value = scope.list;
                  }
                }
                scope.list = [];
                if (value) {
                  scope.list.push(value);
                }
              } else {
                var map = scope.list.map(
                  function (obj) {
                    if (typeof obj === 'object' && obj.id) {
                      return obj.id.toString();
                    } else {
                      return obj;
                    }
                  }
                );
                scope.list = map;
              }
            }
            var checked = elem.prop('checked');

            var checkValue;

            if (scope.checkValue) {
              checkValue = scope.checkValue.toString();
            } else {
              checkValue = attrs.checkValue;
            }

            var index = scope.list.indexOf(checkValue);

            if (checked && index == -1) {
              if (setup) {
                elem.prop('checked', false);
              } else {
                scope.list.push(checkValue);
              }
            } else if (!checked && index != -1) {
              if (setup) {
                elem.prop('checked', true);
              } else {
                scope.list.splice(index, 1);
              }
            }
          };

          var setupHandler = handler.bind(null, true);
          var changeHandler = handler.bind(null, false);

          elem.bind('change', function () {
            scope.$apply(changeHandler);
          });
          scope.$watch('list', setupHandler, true);
        }
      };
    }])
    /**
     * Auto Expanding Textarea
     *
     * @author	http://blog.justonepixel.com/geek/2013/08/14/angularjs-auto-expand/
     * @author	Roberto Carraretto <roberto@wizehive.com>
     */
    .directive('ngAutoExpand', ['$timeout', function ($timeout) {
      return {
        restrict: 'A',
        require: 'ngModel',
        link: function ($scope, elem, attrs, ngModelCtrl) {
          var lockHeight = function (element) {
            element.css('height', element.height());
          };

          var unlockHeight = function (element) {
            element.css('height', 'auto');
          };

          var changeToIdealHeight = function (element) {
            $(element).height(0);
            var height = $(element)[0].scrollHeight;

            // 8 is for the padding
            if (height < 20) {
              height = 28;
            }
            $(element).height(height - 8);
          };

          elem.bind('keyup', function ($event) {
            var element = $event.target;
            var parent = $(element).parent();

            // Lock parent's height
            // to prevent a quick shrinking and expanding glitch
            // that happens when the text area is at a considerable size (WIZ-3363)
            lockHeight(parent);

            changeToIdealHeight(element);

            // Now that the element has shrinked or expanded
            // We can unlock the parent's height (WIZ-3363)
            unlockHeight(parent);
          });

          // Expand the textarea as soon as it is added to the DOM
          $timeout(function () {
            changeToIdealHeight(elem);
          }, 0);

          $scope.$watch(function () {
            return ngModelCtrl.$viewValue;
          }, function () {
            changeToIdealHeight(elem);
          });
        }
      };
      /**
       * Height match widget
       *
       * Automatically adjust an element's height to equal that of an ancestor element
       *
       * Copyright (c) WizeHive - http://www.wizehive.com
       *
       * @author	Paul W. Smith <paul@wizehive.com>
       * @since	0.5.48
       * @param	heightMatch - selector of ancestor element to match.
       */
    }])
    /**
     * Limit an input to numeric values only. Invalid characters will be removed
     *
     * @author	Paul W. Smith <paul@wizehive.com>
     * @since	0.5.79
     * @param	{string}	input value
     */
    .directive('numbersOnly', [function () {
      return {
        require: 'ngModel',
        link: function (scope, element, attr, ngModel) {
          ngModel.$parsers.push(function (input) {
            if (!input) {
              return '';
            }

            // Toggle Negative Value
            function toggleNegativeValue (value) {
              const numNegatives = value.length - value.replace(/-/g, '').length;

              if (numNegatives > 1 || value.indexOf('-') !== 0) {
                value = value.replace(/-/g, '');

                if (numNegatives % 2 !== 0) {
                  // Prepend Negative
                  value = '-' + value;
                }
              }

              return value;
            }

            var matches = input.match(/^[-\d]+\.?[-\d]*/);
            var newValue = (matches && matches.length && matches[0]) || '';

            newValue = toggleNegativeValue(newValue);

            if (newValue !== input) {
              ngModel.$setViewValue(newValue);
              ngModel.$render();
            }

            return newValue;
          });
        }
      };
    }])
    .directive('znFormSelect', [function () {
      return {
        restrict: 'E',
        scope: {
          ngModel: '=ngModel',
          ngDisabled: '=',
          ngChange: '&',
          forms: '=',
          formProperty: '@'
        },
        templateUrl: '/templates/partials/form-select/form-select.html',
        link: function (scope, element, attr) {
          scope.form = {};

          scope.$watch('ngDisabled', function (ngDisabled) {
            scope.disabled = (!ngDisabled && !Object.prototype.hasOwnProperty.call(attr, 'ngDisabled')) ? false : ngDisabled || true;
          });

          // update zn-form-select ngModel
          scope.$watch('form.selected', function (selected) {
            var value;
            if (selected) {
              value = scope.formProperty ? selected[scope.formProperty] : selected;
            }
            if (value) {
              scope.ngModel = value;
              scope.ngChange();
            }
          });

          // update ui-select ngModel
          scope.$watch('ngModel', function (ngModel) {
            var value;
            if (ngModel && scope.formProperty) {
              angular.forEach(scope.forms, function (form) {
                if (form[scope.formProperty] == ngModel) {
                  value = angular.copy(form);
                }
              });
            } else if (ngModel) {
              value = ngModel;
            }
            if (value) {
              scope.form.selected = value;
            }
          });
        }
      };
    }])
    .directive('znInlineFilter', ['RecursionHelper', 'filterDefinition', 'inlineFilter', function (RecursionHelper, filterDefinition, inlineFilter) {
      return {
        restrict: 'A',
        scope: {
          options: '=znInlineFilter',
          model: '=ngModel',
          level: '=?znInlineFilterPrivateLevel',
          removeParentCondition: '&znInlineFilterPrivateRemoveParentCondition',
          counts: '=?znInlineFilterPrivateCounts',
          operatorOptions: '=?znInlineFilterPrivateOperatorOptions'
        },
        require: 'ngModel',
        compile: function (element) {
          var link = {
            post: function (scope, element, attrs, ngModelCtrl) {
              scope.operator = null,
                scope.conditions = [];

              function getOperators () {
                return scope.options.operators || inlineFilter.operators;
              }

              function getDefaultOperator () {
                return inlineFilter.getDefaultOperator(getOperators());
              }

              // Convert Model Value to View Value
              ngModelCtrl.$formatters.push(function (modelValue) {
                var filter = filterDefinition(modelValue);

                if (!filter.getOperator()) {
                  filter.setOperator(getDefaultOperator());
                }

                if (!filter.getConditions()) {
                  filter.setConditions([]);
                }

                return filter;
              });

              // Convert View Value to Model Value
              ngModelCtrl.$parsers.push(function (viewValue) {
                // Update model without breaking prototypal inheritance
                angular.forEach(Object.keys(ngModelCtrl.$modelValue), function (key) {
                  delete ngModelCtrl.$modelValue[key];
                });
                return angular.extend(ngModelCtrl.$modelValue, viewValue.getFilter());
              });

              // Render Filter to Scope Variables
              ngModelCtrl.$render = function () {
                scope.operator = ngModelCtrl.$viewValue.getOperator();
                scope.conditions = ngModelCtrl.$viewValue.getConditions();
              };

              function watchFilter () {
                var filter = filterDefinition();
                filter.setOperator(scope.operator);
                filter.setConditions(scope.conditions);

                ngModelCtrl.$setViewValue(filter);
              }

              // Update View Value
              scope.$watch('operator', watchFilter);

              // Update View Value
              scope.$watch('conditions', watchFilter, true);
            }
          };

          // Use the compile function from the RecursionHelper,
          // And return the linking function(s) which it returns
          return RecursionHelper.compile(element, link);
        },
        controller: 'inlineFilterCntl',
        templateUrl: '/templates/partials/inline-filter.html'
      };
    }])
    .controller('inlineFilterCntl', ['$scope', '$rootScope', 'inlineFilter', 'filterDefinition', 'filterWorkspace', 'validateFilterOptions',
      function ($scope, $rootScope, inlineFilter, filterDefinition, filterWorkspace, validateFilterOptions) {
        // Default Options
        var defaultOptions = {
          attributesLoaded: false,
          formId: null,
          subfilters: true,
          groups: true,
          dynamicValues: true,
          operators: inlineFilter.operators,
          prefixBlacklist: [],
          attributeBlacklist: [],
          fieldTypeBlacklist: []
        };

        if (!$scope.options) {
          $scope.options = {};
        }

        angular.forEach(defaultOptions, function (value, option) {
          if (!Object.prototype.hasOwnProperty.call($scope.options, option)) {
            $scope.options[option] = value;
          }
        });

        $scope.options.fieldTypeBlacklist = inlineFilter.combineFieldTypeBlacklist($scope.options.fieldTypeBlacklist);

        // Default Scope
        $scope = angular.extend($scope, {
          users: [],
          forms: null,
          form: null,
          attributeOptions: {},
          sortedAttributes: [],
          operatorConditionLabel: '',
          subOptions: $scope.options,
          addFilterSelector: ''
        });

        $scope.emptyCondition = {
          prefix: '',
          attribute: '',
          value: ''
        };

        $rootScope.$watch('constants', function (constants) {
          if (constants) {
            $scope.constants = constants;
          }
        });

        // Current Condition Level
        $scope.level = $scope.level || 1;
        $scope.level = parseInt($scope.level, 10);

        // Top Level Counts
        if ($scope.level == 1) {
          $scope.counts = {
            conditionCount: 0,
            dynamicCount: 0
          };
        }

        // Next Condition Level
        $scope.nextLevel = $scope.level + 1;

        // Operator Options
        if (!$scope.operatorOptions) {
          $scope.operatorOptions = inlineFilter.getOperatorOptions($scope.options.operators);
        }

        // Record Attributes
        $scope.recordAttributes = [
          {
            attribute: 'id',
            name: 'Record ID',
            type: 'calculated-field',
            attributeOrder: 0
          },
          {
            attribute: 'name',
            name: 'Record Title',
            attributeOrder: 1
          },
          {
            attribute: 'folder.id',
            name: 'Folder',
            attributeOrder: 2
          },
          {
            attribute: 'createdByUser.id',
            name: 'Created By User',
            attributeOrder: 3
          },
          {
            attribute: 'created',
            name: 'Date Created',
            type: 'datetime',
            attributeOrder: 4
          },
          {
            attribute: 'modified',
            name: 'Last Edited',
            type: 'datetime',
            attributeOrder: 5
          },
          {
            attribute: 'isComplete',
            name: 'Draft',
            attributeOrder: 6
          }
        ];

        // Prefix Options
        var prefixOptions = [
          {
            prefix: '',
            label: 'is',
            type: 'String'
          },
          {
            prefix: 'not',
            label: 'isn\'t',
            type: 'String'
          },
          {
            prefix: 'min',
            label: 'since'
          },
          {
            prefix: 'max',
            label: 'before'
          },
          {
            prefix: 'contains',
            label: 'contains',
            type: 'String'
          },
          {
            prefix: 'not-contains',
            label: 'does not contain',
            type: 'String'
          },
          {
            prefix: 'starts-with',
            label: 'starts with',
            type: 'String'
          },
          {
            prefix: 'ends-with',
            label: 'ends with',
            type: 'String'
          },
          {
            prefix: 'in',
            label: 'is any of',
            type: 'String'
          },
          {
            prefix: 'not-in',
            label: 'is not any of',
            type: 'String'
          },
          {
            prefix: 'notexists',
            label: 'exists',
            type: 'String'
          },
          {
            prefix: 'exists',
            label: 'does not exist',
            type: 'String'
          },
          {
            prefix: 'min',
            label: 'is greater than or equal to',
            type: 'Number'
          },
          {
            prefix: 'max',
            label: 'is less than or equal to',
            type: 'Number'
          },
          {
            prefix: 'not-validates',
            label: 'does not validate',
            type: 'Validation'
          }
        ];

        $scope.prefixOptions = [];

        angular.forEach(prefixOptions, function (option) {
          if (skipBlacklistedPrefix(option.prefix)) {
            return;
          }

          $scope.prefixOptions.push(option);
        });

        /**
       * Track condition - tracking function for ng-repeat. This lets us track distinct conditions without depending on $index, which
       * changes if the position of a condition changes (e.g. because another condition was deleted), while also avoiding dependence
       * on ng-repeat's built in indexing which adds an unwanted $$hashKey property to the conditions.
       *
       * @author	Paul W. Smith <paul@wizehive.com>
       * @since	0.5.76
       */
        var trackedConditions = [];
        $scope.trackCondition = function (condition) {
          if (trackedConditions.indexOf(condition) === -1) {
            trackedConditions.push(condition);
          }
          return trackedConditions.indexOf(condition);
        };

        /**
       * Sort conditions - so multiple conditions on the same attribute are displayed together
       *
       * @author	Anna Parks <anna@wizehive.com>
       * @since	0.5.75-32
       */
        function sortConditions (conditions) {
          if (conditions && conditions.length) {
            conditions.sort(function (cond1, cond2) {
              if (!cond1.attribute && !cond2.attribute) {
                // sort AND before OR groups
                if (cond1.and) {
                  return -1;
                }

                return 1;
              }

              // put grouped conditions at the bottom
              if (!cond1.attribute) {
                return 1;
              }

              if (!cond2.attribute) {
                return -1;
              }

              // Attribute is Missing/Deleted
              if (!$scope.attributeOptions[cond1.attribute]) {
                return 1;
              }

              // Attribute is Missing/Deleted
              if (!$scope.attributeOptions[cond2.attribute]) {
                return -1;
              }

              var attributeOption1 = $scope.attributeOptions[cond1.attribute];
              var attributeOption2 = $scope.attributeOptions[cond2.attribute];
              var order1 = attributeOption1.order;
              var order2 = attributeOption2.order;

              // sort by record attribute order
              if (order1 === undefined && order2 === undefined) {
                return attributeOption1.attributeOrder - attributeOption2.attributeOrder;
              }

              // record attributes come before field attributes
              if (order1 === undefined) {
                return -1;
              }

              if (order2 === undefined) {
                return 1;
              }

              // sort by field order
              return order1 - order2;
            });
          }

          return conditions;
        }

        /**
       * Get Workspace Users
       *
       * @author	Wes DeMoney <wes@wizehive.com>
       * @since	0.5.75
       * @param	{array}	users
       * @returns	{array}
       */
        function getWorkspaceUsers (users) {
          if ($scope.options.dynamicValues && users && users[0].id !== 'logged-in-user') {
            users.unshift({
              id: 'logged-in-user',
              displayName: 'Logged In User'
            });
          }

          return users;
        }

        /**
       * Set record attributes
       */
        function setRecordAttributes () {
          angular.forEach($scope.recordAttributes, function (attribute) {
            if (!attribute.type) {
              attribute.type = attribute.attribute;
            }

            pushAttribute(attribute);
          });
        }

        function getWorkspace (skipCache) {
          if (!$scope.options.formId && !$scope.options.workspaceId) {
            return;
          }

          return filterWorkspace.getWorkspace($scope.options, skipCache)
            .then(setFormsAndUsers)
            .then(function () {
              $scope.attributesLoaded = true;
            });
        }

        /**
       * Set Forms and Users
       */
        function setFormsAndUsers (workspace) {
          $scope.users = getWorkspaceUsers(workspace.users);
          $scope.forms = workspace.forms;

          if ($scope.model) {
            validateFilterOptions($scope.model, $scope.options, $scope.forms);
          }

          if ($scope.options.formId) {
            // Specific Form
            $scope.form = workspace.forms[$scope.options.formId];

            // Field Attributes
            setFormFieldAttributes($scope.form.fields);

            // Adds hasOne relations
            setFormLinkedFormAttributes($scope.form.linkedForms);
          }

          return true;
        }

        /**
       * Set Form Field Attributes
       *
       * @author	Wes DeMoney <wes@wizehive.com>
       * @since	0.5.75
       * @param	{array}	fields
       */
        function setFormFieldAttributes (fields) {
          angular.forEach(fields, function (field) {
            if (skipBlacklistedFieldType(field.type)) {
              return;
            }

            var attribute = angular.extend({}, field, {
              attribute: 'field' + field.id,
              name: field.name || field.label
            });

            pushAttribute(attribute);
          });
        }

        /**
       * Set Form Linked Form Attributes
       *
       * @since	0.5.75
       * @param	{array}	linkedForms
       */
        function setFormLinkedFormAttributes (linkedForms) {
          if (!$scope.options.subfilters) {
            return;
          }

          angular.forEach(linkedForms, function (form) {
            // Make sure it also exists in the forms object. If the user
            // doesn't have permission to the linked form, then it won't
            // have been sent back from the API and we shouldn't show
            // it in the filter.
            if (form.type == 'hasOne' && $scope.forms[form.form.id]) {
              var attribute = {
                attribute: 'form' + form.form.id,
                name: $scope.forms[form.form.id].name,
                type: 'linked'
              };

              pushAttribute(attribute);
            }
          });
        }

        /**
       * Skip Blacklisted Field Type
       *
       * @author	Wes DeMoney <wes@wizehive.com>
       * @since	0.5.75
       * @param	{string}	type
       * @returns	{boolean}
       */
        function skipBlacklistedFieldType (type) {
          return $scope.options.fieldTypeBlacklist.indexOf(type) !== -1;
        }

        /**
       * Skip Blacklisted Attribute
       *
       * @author	Wes DeMoney <wes@wizehive.com>
       * @since	0.5.75
       * @param	{string}	attribute
       * @returns	{boolean}
       */
        function skipBlacklistedAttribute (attribute) {
          return $scope.options.attributeBlacklist.indexOf(attribute) !== -1;
        }

        /**
       * Skip Blacklisted Prefix
       *
       * @author	Anna Parks <anna@wizehive.com>
       * @since	0.5.85
       * @param	{string}	prefix
       * @returns	{boolean}
       */
        function skipBlacklistedPrefix (prefix) {
          return $scope.options.prefixBlacklist.indexOf(prefix) !== -1;
        }

        /**
       * Push Attribute to Attributes Lists
       *
       * @author	Wes DeMoney <wes@wizehive.com>
       * @since	0.5.75
       * @param	{object}	attribute
       */
        function pushAttribute (attribute) {
          if (skipBlacklistedAttribute(attribute.attribute)) {
            return;
          }

          $scope.attributeOptions[attribute.attribute] = attribute;
          $scope.sortedAttributes.push(attribute);
        }

        // Unused
        /**
       * Update Filter Model
       *
       * @author	Wes DeMoney <wes@wizehive.com>
       * @since	0.5.75
       */
        // function updateFilter () {
        //   src = filter.getFilter()

        //   // Update model without breaking prototypical inheritance
        //   angular.forEach(Object.keys($scope.model), function (key) {
        //     delete $scope.model[key]
        //   })

        //   $scope.model = angular.extend($scope.model, src)
        // }

        /**
       * Set Operator
       *
       * @author	Wes DeMoney <wes@wizehive.com>
       * @since	0.5.75
       * @param	{string}	operator
       */
        function setOperator (operator) {
          if (operator) {
            setOperatorConditionLabel(operator);
          }
        }

        /**
       * Get Operator Option
       *
       * @author	Wes DeMoney <wes@wizehive.com>
       * @since	0.5.75
       * @param	{string}	operator
       * @returns	{object}
       */
        function operatorOption (operator) {
          var found = null;
          angular.forEach($scope.operatorOptions, function (option) {
            if (option.operator == operator) {
              found = option;
            }
          });
          return found;
        }

        /**
       * Set Operator Condition Label
       *
       * @author	Wes DeMoney <wes@wizehive.com>
       * @since	0.5.75
       * @param	{string}	operator
       */
        function setOperatorConditionLabel (operator) {
          var option = operatorOption(operator);

          $scope.operatorConditionLabel = option.conditionLabel;
        }

        /**
       * Add Filter Condition
       *
       * @author	Wes DeMoney <wes@wizehive.com>
       * @since	0.5.75
       * @param	{object}	condition
       */
        function addCondition (condition) {
          $scope.conditions.push(condition);
        }

        /**
       * Get Condition Count
       *
       * @author	Wes DeMoney <wes@wizehive.com>
       * @since	0.5.75
       * @returns	{int}
       */
        function getConditionCount () {
          if ($scope.operator && $scope.conditions && $scope.conditions.length) {
            var filter = filterDefinition();
            filter.setOperator($scope.operator);
            filter.setConditions($scope.conditions);

            return filter.getConditionCount();
          }

          return 0;
        }

        function setConditionCount (count) {
          if ($scope.counts) {
            count = count || getConditionCount();
            $scope.counts.conditionCount = count;
          }
        }

        /**
       * Show Add Sub Group
       *
       * @author	Wes DeMoney <wes@wizehive.com>
       * @since	0.5.75
       * @returns	{boolean}
       */
        $scope.showAddSubGroup = function () {
          return $scope.options.groups && ($scope.level < 5);
        };

        /**
       * Show Add Condition
       *
       * @author	Wes DeMoney <wes@wizehive.com>
       * @since	0.5.75
       * @returns	{boolean}
       */
        $scope.showAddCondition = function () {
          return $scope.counts.conditionCount < 10;
        };

        /**
       * Add Attribute Condition
       *
       * @author	Wes DeMoney <wes@wizehive.com>
       * @since	0.5.75
       * @param	{object}	attribute
       */
        $scope.addAttributeCondition = function (attribute) {
          var condition = inlineFilter.getEmptyCondition(attribute);
          $scope.counts.conditionCount++;
          addCondition(condition);
        };

        /**
       * Add Sub Filter Condition
       *
       * @author	Wes DeMoney <wes@wizehive.com>
       * @since	0.5.75
       * @param	{object}	attribute
       */
        $scope.addSubCondition = function (operator) {
          var subfilter = inlineFilter.getEmptyFilter(operator);
          subfilter = inlineFilter.mergeConditions(subfilter, [inlineFilter.getEmptyCondition()]);

          $scope.counts.conditionCount++;
          addCondition(subfilter);
        };

        /**
       * Remove Condition
       *
       * @author	Wes DeMoney <wes@wizehive.com>
       * @since	0.5.75
       * @param	{int}	index
       */
        $scope.removeCondition = function (index) {
          $scope.conditions.splice(index, 1);

          // Empty Conditions
          if (!$scope.conditions.length) {
            if ($scope.level === 1) {
              // Top Level, Reset Default Condition
              $scope.addAttributeCondition();
            } else {
              // Nested Condition, Remove from Parent
              $scope.removeParentCondition();
            }
          }
        };

        /**
       * Watch Filter Model
       *
       * @author	Wes DeMoney <wes@wizehive.com>
       * @since	0.5.75
       * @param	{object}	filter
       */
        $scope.$watch('conditions && options', function (allSet) {
          if (allSet) {
            // Empty Conditions
            if (!$scope.conditions.length) {
              $scope.conditions = $scope.conditions.concat([inlineFilter.getEmptyCondition()]);
            }

            setAttributes(false).then(function () {
              $scope.conditions = sortConditions($scope.conditions);

              // Initial Condition Count
              if ($scope.level === 1) {
                setConditionCount();
              }
            });
          }
        });

        /**
       * Watch Options
       */
        $scope.$watch('options', function (options, oldOptions) {
          if (!options || angular.equals(options, oldOptions)) {
            return;
          }

          // Reset Attributes if Options Change
          setAttributes(false);
        }, true);

        /**
       * Watch form fields updates
       */
        $scope.$on('form-fields-saved', function () {
          setAttributes(true);
        });

        function setAttributes (skipCache) {
          $scope.attributesLoaded = false;
          $scope.attributeOptions = {};
          $scope.sortedAttributes = [];
          setRecordAttributes();
          return getWorkspace(skipCache);
        }

        /**
       * Watch Operator
       *
       * @author	Wes DeMoney <wes@wizehive.com>
       * @since	0.5.75
       * @param	{string}	operator
       */
        $scope.$watch('operator', setOperator);

        /**
       * Watch Add Filter Button
       *
       * @author	Wes DeMoney <wes@wizehive.com>
       * @since	0.5.75
       * @param	{string}	selected
       */
        $scope.$watch('addFilterSelector', function (selected) {
          if (!selected) {
            return;
          }

          var isSubCondition = inlineFilter.inOperators(selected);

          if (isSubCondition) {
            $scope.addSubCondition(selected);
          } else {
            $scope.addAttributeCondition(selected);
          }

          // Reset
          $scope.addFilterSelector = '';
        });
      }])
    .directive('znFilterValueIn', [function () {
      return {
        restrict: 'A',
        scope: {
          model: '=ngModel',
          options: '='
        },
        require: 'ngModel',
        link: function (scope, element, attrs, ngModelCtrl) {
          scope.value = [];

          // Convert Model Value to View Value
          ngModelCtrl.$formatters.push(function (modelValue) {
            if (!modelValue) {
              return;
            }

            if (typeof modelValue === 'string') {
              modelValue = JSON.parse(modelValue);
            }

            return modelValue.map(function (value) {
              return {
                id: value
              };
            });
          });

          // Convert View Value to Model Value
          ngModelCtrl.$parsers.push(function (viewValue) {
            if (!viewValue) {
              return;
            }

            return viewValue.map(function (option) {
              return option.id;
            });
          });

          // Render to Scope Variables
          ngModelCtrl.$render = function () {
            scope.value = ngModelCtrl.$viewValue || [];
          };

          scope.$watch('value', function (value, previous) {
            if (!value) {
              return;
            }

            if (!angular.equals(value, previous)) {
              ngModelCtrl.$setViewValue(value);
            }
          }, true);
        },
        controller: ['$scope', function ($scope) {
          $scope.multiSelectOptions = [];

          $scope.multiSelectTranslations = {
            buttonDefaultText: '',
            checkAll: 'Select All',
            uncheckAll: 'Select None',
            selectionCount: 'selected',
            dynamicButtonTextSuffix: 'selected'
          };

          $scope.multiSelectExtras = {
            enableSearch: false,
            scrollable: true
          };

          function getMultiSelectOptions (options) {
            if (!options) {
              return;
            }

            var keys = Object.keys(options);

            return keys.map(function (value) {
              return {
                id: value,
                label: options[value]
              };
            });
          }

          $scope.$watch('options', function (options) {
            $scope.multiSelectOptions = getMultiSelectOptions(options);
            $scope.multiSelectExtras.enableSearch = (options && Object.keys(options).length > 10);
          });
        }],
        templateUrl: '/templates/partials/inline-filter-attribute-condition-in.html'
      };
    }])
    .directive('znFilterAttributeCondition', [function () {
      return {
        restrict: 'A',
        scope: {
          condition: '=',
          conditions: '=',
          prefixOptions: '=',
          attributeOptions: '=',
          sortedAttributes: '=',
          operatorOptions: '=',
          options: '=',
          users: '=',
          forms: '=',
          form: '=',
          nextLevel: '=',
          subfilters: '=',
          counts: '=',
          removeParentCondition: '&'
        },
        controller: 'filterAttributeConditionCntl',
        templateUrl: '/templates/partials/inline-filter-attribute-condition.html'
      };
    }])
    .controller('filterAttributeConditionCntl', ['$scope', '$rootScope', 'znData', 'inlineFilter',
      function ($scope, $rootScope, znData, inlineFilter) {
        $scope.subFilterConditionAllowed = function () {
          return $scope.subfilters &&
            ($scope.subFilterBelowMaxCount()) &&
            ($scope.subFilterBelowMaxLevel()) &&
            !$scope.subFilterExistsForAttribute();
        };

        $scope.subFilterExistsForAttribute = function () {
          var exists = false;

          angular.forEach($scope.conditions, function (condition) {
            if (condition.filter &&
              condition.attribute == $scope.condition.attribute) {
              exists = true;
            }
          });

          return exists;
        };

        $scope.subFilterBelowMaxCount = function () {
          return $scope.counts.dynamicCount < 2;
        };

        $scope.subFilterBelowMaxLevel = function () {
          return $scope.nextLevel <= 5;
        };

        $scope.isLinkedAttribute = function () {
          return ($scope.attributeOptions[$scope.condition.attribute] &&
            $scope.attributeOptions[$scope.condition.attribute].type == 'linked'
          );
        };

        $scope.isCustomFilter = function () {
          return Object.prototype.hasOwnProperty.call($scope.condition, 'filter');
        };

        $scope.notHasOneRelation = function () {
          return ($scope.condition.attribute.indexOf('form') == -1);
        };

        $scope.isValidForFiltering = function () {
          return ($scope.isLinkedAttribute() && $scope.attrIsValidForFiltering !== undefined) ? $scope.attrIsValidForFiltering : true;
        };

        $scope.setAllowedPrefixes = function (allowedPrefixes, template) {
          $scope.allowedPrefixes = [];

          var types = []; // e.g. Number, String

          angular.forEach($scope.prefixOptions, function (option) {
            if (allowedPrefixes.indexOf(option.label) !== -1) {
              if (option.type && types.indexOf(option.type) == -1) {
                types.push(option.type);
              }

              $scope.allowedPrefixes.push(angular.copy(option));
            }
          });

          // don't group by type, if less than 2 types
          if (types.length < 2 || template === 'number') {
            angular.forEach($scope.allowedPrefixes, function (prefix) {
              delete prefix.type;
            });
          }
        };

        // Set countries and states
        $rootScope.$watch('states', function (states) {
          if (states) {
            $scope.states = states;
          }
        });

        $rootScope.$watch('countries', function (countries) {
          if (countries) {
            $scope.countries = countries;
          }
        });

        $rootScope.$watch('constants', function (constants) {
          if (constants) {
            $scope.constants = constants;
          }
        });

        var defaultPrefixes = ['is', 'isn\'t'];
        var stringPrefixes = ['contains', 'does not contain', 'starts with', 'ends with'];
        var validationPrefixes = ['does not validate'];
        var existPrefixes = ['exists', 'does not exist'];
        var numberPrefixes = ['is greater than or equal to', 'is less than or equal to'];
        var datePrefixes = ['is', 'since', 'before'];
        var datetimePrefixes = ['since', 'before'];
        var containsPrefixes = ['contains', 'does not contain'];
        var listPrefixes = ['is any of', 'is not any of'];
        var allWithListPrefixes = defaultPrefixes.concat(stringPrefixes, listPrefixes, existPrefixes, numberPrefixes);
        var allPrefixes = defaultPrefixes.concat(stringPrefixes, existPrefixes, numberPrefixes);

        $scope.fieldTypes = {
          'text-input': {
            prefixes: allPrefixes.concat(validationPrefixes)
          },
          'hidden-field': {
            prefixes: allPrefixes
          },
          radio: {
            prefixes: allWithListPrefixes,
            template: 'single'
          },
          dropdown: {
            prefixes: allWithListPrefixes
          },
          checkbox: {
            prefixes: containsPrefixes.concat(listPrefixes, existPrefixes),
            template: 'multiple'
          },
          name: {
            prefixes: defaultPrefixes.concat(stringPrefixes)
          },
          'file-upload': {
            prefixes: defaultPrefixes.concat(stringPrefixes, existPrefixes)
          },
          'text-area': {
            prefixes: stringPrefixes.concat(existPrefixes)
          },
          date: {
            prefixes: datePrefixes,
            template: 'date'
          },
          datetime: {
            prefixes: datetimePrefixes,
            template: 'date'
          },
          'date-picker': {
            prefixes: datePrefixes.concat(existPrefixes),
            template: 'date'
          },
          year: {
            prefixes: datePrefixes.concat(existPrefixes),
            template: 'year'
          },
          linked: {
            prefixes: defaultPrefixes.concat(existPrefixes, validationPrefixes),
            template: 'linked'
          },
          member: {
            template: 'member'
          },
          'createdByUser.id': {
            prefixes: defaultPrefixes,
            template: 'member'
          },
          'state-select': {
            template: 'state-select'
          },
          'country-select': {
            template: 'country-select'
          },
          'calculated-field': {
            prefixes: defaultPrefixes.concat(numberPrefixes),
            template: 'number'
          },
          'link-counter': {
            prefixes: defaultPrefixes.concat(numberPrefixes),
            template: 'number'
          },
          numeric: {
            prefixes: defaultPrefixes.concat(numberPrefixes, existPrefixes),
            template: 'numeric'
          },
          summary: {
            prefixes: defaultPrefixes.concat(numberPrefixes, existPrefixes),
            template: 'summary'
          },
          'folder.id': {
            prefixes: defaultPrefixes,
            template: 'folder'
          },
          isComplete: {
            prefixes: ['is'],
            template: 'draft'
          }
        };

        $scope.selected = {};

        $scope.validationValues = {
          alpha: 'Alphabetic',
          alphaNumeric: 'Alphanumeric',
          emailAddress: 'Email Address',
          numeric: 'Numeric',
          zipCode: 'Zip',
          // 'required': 'Required',
          unique: 'No Duplicates'
        };

        $scope.existOptionSelected = function () {
          return $scope.selected.prefix &&
            $scope.selected.prefix.indexOf('exists') !== -1;
        };

        $scope.validationOptionSelected = function () {
          return $scope.selected.prefix &&
            $scope.selected.prefix.indexOf('validates') !== -1;
        };

        /**
       * Upate Filter Condition Attribute & Value
       * If Exists/Does Not Exists Options Selected
       *
       * @author	Anna Parks
       * @since	0.5.76
       */
        $scope.$watch('selected.prefix', function (prefix) {
          if (typeof prefix === 'string') {
            if ($scope.existOptionSelected()) {
              prefix = prefix.replace('exists', '');
              $scope.condition.value = 'null';
            } else if ($scope.condition.value == 'null') {
              $scope.condition.value = '';
            }

            $scope.condition.prefix = prefix;
          }
        });

        /**
       * When an Attribute is Chosen for First Time, Add to Conditions
       *
       * @author	Anna Parks
       * @since	0.5.76
       */
        $scope.$watch('selected.attribute', function (attribute) {
          if (attribute) {
            $scope.condition.attribute = attribute;
          }
        });

        /**
       * Select Exists/Does Not Exists Dropdown Options
       * Based on Existing Filter Condition
       *
       * @author	Anna Parks
       * @since	0.5.76
       */
        $scope.$watch('condition.prefix', function (prefix) {
          if ((prefix === '' || prefix === 'not') &&
            $scope.condition.value === 'null') {
            prefix = prefix + 'exists';
          }

          $scope.selected.prefix = prefix;
        });

        $scope.$watch('condition.attribute', function (attr, oldAttr) {
          var allowedPrefixes = defaultPrefixes.concat(existPrefixes);
          var type = '';
          var template = 'default';

          if (!attr) {
            return $scope.setAllowedPrefixes(defaultPrefixes, template);
          }

          if ($scope.attributeOptions[attr] &&
            $scope.attributeOptions[attr].type) {
            type = $scope.attributeOptions[attr].type;

            if ($scope.fieldTypes[type] &&
              $scope.fieldTypes[type].prefixes) {
              allowedPrefixes = $scope.fieldTypes[type].prefixes;
              template = $scope.fieldTypes[type].template;

              if (type === 'dropdown') {
                $scope.fieldTypes.dropdown.template = 'single';

                if ($scope.attributeOptions[attr].settings.properties.multiple) {
                  allowedPrefixes = $scope.fieldTypes.checkbox.prefixes;
                  $scope.fieldTypes.dropdown.template = 'multiple';
                }
              }
            }
          }

          $scope.setAllowedPrefixes(allowedPrefixes, template);

          if (oldAttr && oldAttr !== attr) { // reset value
            if ($scope.isCustomFilter()) {
              $scope.removeSubfilter();
            } else {
              $scope.condition.value = '';
            }

            $scope.selected.prefix = $scope.allowedPrefixes[0].prefix;
          }

          // set prefix
          var prefixFound = false;

          angular.forEach($scope.allowedPrefixes, function (prefix) {
            if (prefix.prefix == $scope.selected.prefix) {
              prefixFound = true;
            }
          });

          if (!prefixFound) {
            $scope.selected.prefix = $scope.allowedPrefixes[0].prefix;
          }

          $scope.initLinkedAttribute();
        });

        /**
       * Set linked form name, custom filter options and filter prop if not set
       *
       * @author	Anna Parks
       * @since	0.5.76
       * @param	{boolean}	disabled
       */
        $scope.initLinkedAttribute = function () {
          if ($scope.isLinkedAttribute()) {
            var linkedFormId;

            if ($scope.notHasOneRelation()) {
              linkedFormId = $scope.attributeOptions[$scope.condition.attribute].settings.properties.linkedForm;
            } else {
              linkedFormId = $scope.condition.attribute.substring(4);
            }

            // set empty subfilter if hasOne relation
            if (!$scope.notHasOneRelation()) {
              $scope.initSubFilter();
            } else if ($scope.condition.value) {
              $scope.selected.value = { id: $scope.condition.value };

              znData('FormRecords').get({ id: $scope.condition.value, formId: linkedFormId }).then(function (record) {
                $scope.selected.value.name = record.name;
              });
            }
            if ($scope.forms[linkedFormId]) {
              $scope.linkedFormName = $scope.forms[linkedFormId].name;
              $scope.attrIsValidForFiltering = true;
            } else {
              $scope.attrIsValidForFiltering = false;
            }

            $scope.customFilterinlineOptions = angular.extend({},
              $scope.options,
              {
                formId: linkedFormId
              }
            );
          }
        };

        /**
       * Disable/Enable Attributes
       *
       * @author	Anna Parks
       * @since	0.5.76
       * @param	{boolean}	disabled
       */
        $scope.disableHasOneAttributes = function (disable) {
          angular.forEach($scope.sortedAttributes, function (attribute, index) {
            var hasOneRelation = attribute.attribute.indexOf('form') === 0;

            if (hasOneRelation) {
              $scope.sortedAttributes[index].disabled = !!disable;
            }
          });
        };

        $scope.conditionType = function () {
          return Object.prototype.hasOwnProperty.call($scope.condition, 'filter') ? 'custom-filter' : 'specific-record';
        };

        $scope.removeAttributeCondition = function () {
          $scope.removeSubfilter();

          $scope.counts.conditionCount--;

          $scope.removeParentCondition();
        };

        /**
       * Remove Filter From Condition
       * Decrement Dynamic Conditions Count
       *
       * @author	Anna Parks
       * @since	0.5.76
       */
        $scope.removeSubfilter = function () {
          if ($scope.condition.filter) {
            $scope.counts.dynamicCount--;

            // enable hasOne attributes
            if ($scope.subFilterConditionAllowed()) {
              $scope.disableHasOneAttributes(false);
            }

            delete $scope.condition.filter;
          }
        };

        /**
       * Add Subfilter to Condition (or Reset if Changing Attributes)
       * Increment Dynamic Conditions Count
       *
       * @author	Anna Parks
       * @since	0.5.76
       */
        $scope.initSubFilter = function () {
          // Sub Filter Not Allowed
          if (!$scope.subFilterConditionAllowed()) {
            return;
          }

          // set empty filter
          if (!$scope.condition.filter) {
            var subfilter = inlineFilter.getDefaultFilter($scope.options.operators);

            $scope.condition.filter = subfilter;
          }

          // Increment Dynamic Count
          $scope.counts.dynamicCount++;

          if ($scope.counts.dynamicCount >= 2) {
            $scope.disableHasOneAttributes(true);
          }

          // remove condition attribute
          delete $scope.condition.value;

          $scope.setAllowedPrefixes(defaultPrefixes);
        };

        $scope.setConditionType = function (type) {
          // Unchanged
          if (type == $scope.conditionType()) {
            return;
          }

          if (type == 'specific-record') {
            // set empty value
            $scope.condition.value = null;

            // remove filter
            $scope.removeSubfilter();

            $scope.setAllowedPrefixes(defaultPrefixes.concat(existPrefixes));
            $scope.selected.prefix = $scope.allowedPrefixes[0].prefix;
          } else {
            $scope.initSubFilter();
          }
        };
      }])
    .directive('znFilterValue', ['$http', '$compile', '$templateCache', function ($http, $compile, $templateCache) {
      return {
        restrict: 'A',
        scope: true,
        controller: ['$scope', function ($scope) {
          var unbind = $scope.$watch('condition.value', function (value) {
            if (value !== undefined) {
              if (value == null) {
                $scope.condition.value = '';
              }

              unbind();
            }
          });

          $scope.$watch('selected.value', function (value) {
            if (value && value.id) {
              $scope.condition.value = value.id;
            }
          });
        }],
        link: function (scope, element, attrs) {
          var baseUrl = '/templates/partials/filters-panel/';

          function setElementHtml (content) {
            element.html($compile(content)(scope.$new()));
          }

          scope.$watch(attrs.znFilterValue, function (valueTemplate) {
            var templateUrl;

            if (valueTemplate) {
              templateUrl = baseUrl + valueTemplate + '.html';
            } else {
              templateUrl = baseUrl + 'default.html';
            }

            var template = $templateCache.get(templateUrl);

            if (template) {
              setElementHtml(template);
            } else {
              $http.get(templateUrl).then(function (response) {
                $templateCache.put(templateUrl, response.data);

                setElementHtml(response.data);
              });
            }
          });
        }
      };
    }]);

  function href ($location) {
    return {
      restrict: 'A',
      scope: {
        relative: '='
      },
      link: function (scope, element, attrs) {
        element.bind('click', e => {
          const platformUrl = $location.protocol() + '://' + $location.host();
          let url = attrs.href;
          const withinPlatform = url.indexOf(platformUrl) === 0;

          // open external links in new tab
          if (url.match(/^https?|www|mailto|\/\//) &&
            (url.indexOf(platformUrl) === -1 || attrs.target === '_blank')) {
            e.preventDefault();

            return window.open(url, attrs.target || '_top');
          } else if (url.match(/^\/|\?|#/) || withinPlatform || scope.relative) {
            e.preventDefault();

            if (withinPlatform) {
              url = url.replace(platformUrl, '');
            }

            if (scope.relative) {
              if (url.indexOf('/' !== 0)) {
                url = '/' + url;
              }

              url = $location.path() + url;
            }

            $location.url(url);
          }
        });
      }
    };
  }

  plugin.directive('href', ['$location', href])
    .directive('ngHref', ['$location', href])
    .directive('znTooltip', [function () {
      return {
        restrict: 'A',
        link: function (scope, element, attrs) {
          let isOpen = false;

          element.on('mouseenter', () => {
            const { top, left, right, bottom } = element.context.getBoundingClientRect();
            const options = {
              top,
              left,
              bottom,
              right,
              message: attrs.znTooltip,
              side: attrs.tooltipPlacement,
              delay: Number(attrs.tooltipPopupDelay)
            };

            plugin.client.call({
              method: 'openTooltip',
              args: {
                options
              }
            });

            isOpen = true;
          });

          element.on('mouseleave', () => {
            isOpen && plugin.client.call({
              method: 'closeTooltip'
            });

            isOpen = false;
          });

          element.on('$destroy', () => {
            isOpen && plugin.client.call({
              method: 'closeTooltip'
            });
          });
        }
      };
    }]);
}
