import '@babel/polyfill';
import ZnFilterMatcher from 'zn-filter-matcher';
import Client from '@zenginehq/post-rpc-client';
import ContentSizer from 'content-sizer';
import { sanitizeForPostMessage, sleep } from './utils';

var plugin = {};

Function.prototype.curry = Function.prototype.curry || function () {
  const fn = this;
  const args = Array.prototype.slice.call(arguments);
  return function () {
    return fn.apply(this, args.concat(Array.prototype.slice.call(arguments)));
  };
};

const parentOrigin = (document.location.ancestorOrigins && document.location.ancestorOrigins[0]) || getReferrerOrigin() || 'https://platform.zenginehq.com';

function getReferrerOrigin () {
  if (document.referrer) {
    const link = document.createElement('a');
    link.href = document.referrer;

    return link.origin || (link.protocol + '//' + link.hostname);
  } else {
    return '';
  }
}

export const client = new Client(parentOrigin);
client.start();

const znResize = dimensions => client.call({ method: 'resize', args: { dimensions } });

plugin.sizer = new ContentSizer(async dimensions => {
  const result = await znResize(dimensions).catch(err => err instanceof Error ? err : new Error(JSON.stringify(err)));

  if (result instanceof Error) {
    return { width: null, height: null };
  }

  return result;
});

window.addEventListener('beforeunload', () => {
  client.call({ method: 'reloadFrames' });
});

async function compileProviderIsReady () {
  if (plugin.compileProvider) {
    return;
  }

  // if we have to wait, we'll wait no longer than a 60fps frame before checking again #perf
  await sleep(16);

  return compileProviderIsReady();
}

/**
 * Wizehive controller
 *
 * Copyright (c) WizeHive - http://www.wizehive.com
 *
 * @since 0.x.x
 */
(function (plugin) {
  const controllers = {};
  let context = null;

  plugin.client = client;

  plugin.controller = function (name, locals) {
    if (locals) {
      if (name in controllers) {
        throw new Error('Duplicate Controller name: ' + name);
      }

      controllers[name] = locals;
      angular.module('wizehive').controller(name, locals);

      return plugin;
    } else {
      return controllers[name];
    }
  };

  plugin.value = function (name, locals) {
    angular.module('wizehive').value(name, locals);
    return plugin;
  };

  plugin.directive = function (name, locals) {
    angular.module('wizehive').directive(name, locals);
    return plugin;
  };

  plugin.service = function (name, locals) {
    angular.module('wizehive').service(name, locals);
    return plugin;
  };

  plugin.filter = function (name, locals) {
    angular.module('wizehive').filter(name, locals);
    return plugin;
  };

  plugin.constant = function (name, locals) {
    angular.module('wizehive').constant(name, locals);
    return plugin;
  };

  plugin.factory = function (name, locals) {
    angular.module('wizehive').factory(name, locals);
    return plugin;
  };

  plugin.register = async function (pluginName, settings) {
    if (!angular.isObject(settings)) {
      throw new Error('Plugin registration settings must be an object');
    }

    await compileProviderIsReady();

    context = await client.call({ method: 'context' });

    plugin.namespace = context.plugin.namespace;
    plugin.context = context;

    let currentInterface = {};

    const isModal = context.pluginView.type === 'modal';
    const isInline = context.pluginView.type === 'inline';

    if (isModal) {
      currentInterface.template = 'modal-template';
      currentInterface.controller = 'modalCntl';
    } else if (isInline) {
      currentInterface = (settings.interfaces &&
        settings.interfaces.find(iface => context.pluginView && iface && iface.location === context.pluginView.location)) || settings;
    } else {
      currentInterface = (settings.interfaces &&
        settings.interfaces.find(iface => context.pluginView && iface && iface.type === context.pluginView.type)) || settings;
    }

    if (!currentInterface || (!currentInterface.template && !currentInterface.templateUrl) || (!isModal && !currentInterface.controller)) {
      throw new Error('Unable to identify plugin interface');
    }

    plugin.currentInterface = currentInterface;

    plugin.compileProvider.directive('plugin', ['$rootScope', function ($rootScope) {
      return {
        restrict: 'A',
        scope: {},
        link: function (scope) {

          client.subscribe('locationChange', ({ next }) => {
            if (context) {
              context.location = next;
              scope.$apply();
            }
          });

          angular.forEach(context, (value, key) => {
            $rootScope[key] = value;
          });
        },
        controller: currentInterface.controller,
        templateUrl: currentInterface.template
      };
    }]);

    // Code inspired by: https://code.angularjs.org/1.2.21/docs/api/ng/function/angular.injector
    const pluginDiv = angular.element('<div plugin></div>');

    angular.element(document.body).append(pluginDiv);

    angular.element(document).injector().invoke(['$compile', function ($compile) {
      var scope = angular.element(pluginDiv).scope();
      scope.type = isModal? null: context.pluginView.type;
      scope.name = context.plugin.name;

      scope.navigateTo = function (path) {
        const method = 'navigate';
        const args = [`workspaces/${context.workspace.id}${path}`];
        client.call({ method: 'location', args: { method, args } });
      };

      $compile(pluginDiv)(scope);
    }]);

    if (context.pluginView.type === 'inline' || isModal) plugin.sizer.autoSize();

    return plugin;
  };

  angular.module('wizehive', [
    'ngSanitize',
    'ngGrid',
    'ng-showdown',
    'angularjs-dropdown-multiselect',
    'ui.select',
    'ui.ace',
    'ui.sortable',
    'ui.bootstrap',
    'ui.tinymce',
    'firebase',
    'LocalStorageModule'
  ])
    .value('uiTinymceConfig', {
      baseUrl: location.origin
    })
    .config(['$compileProvider', function ($compileProvider) {
      plugin.compileProvider = $compileProvider;
    }])
    .run(['$templateCache', function ($templateCache) {
      'use strict';
      $templateCache.put('/templates/partials/filters-panel/country-select.html',
        '<select class="dropdown-select-btn" ng-model="condition.value" ng-disabled="existOptionSelected()" ng-options="country.id as country.country for country in countries"></select>');
      $templateCache.put('/templates/partials/filters-panel/date.html',
        '<span ng-hide="existOptionSelected()" ng-model="condition.value" zn-datetimepicker-wrapper><input class="btn-input" type="text" ng-model="date" ng-focus="open($event)" is-open="opened" datepicker-popup="{{format}}" datepicker-options="dateOptions"></span> <input class="btn-input" type="text" disabled="disabled" ng-if="existOptionSelected()">');
      $templateCache.put('/templates/partials/filters-panel/default.html',
        '<input class="btn-input" ng-model="condition.value" type="text" ng-hide="existOptionSelected() || validationOptionSelected()"> <input class="btn-input" type="text" disabled="disabled" ng-if="existOptionSelected()"><select class="dropdown-select-btn" ng-model="condition.value" ng-if="validationOptionSelected()"><option value="{{validationKey}}" ng-selected="condition.value == validationKey" ng-repeat="(validationKey, validationLabel) in validationValues">{{validationLabel}}</option></select>');
      $templateCache.put('/templates/partials/filters-panel/draft.html',
        '<select class="dropdown-select-btn" ng-model="condition.value"><option value="true" ng-selected="condition.value !== \'false\' && condition.value">False (Show only completed)</option><option value="false" ng-selected="!condition.value || condition.value === \'false\'">True (Show only drafts)</option></select>');
      $templateCache.put('/templates/partials/filters-panel/folder.html',
        '<select class="dropdown-select-btn" ng-model="condition.value"><option value="{{folder.id}}" ng-selected="condition.value != \'\' && condition.value == folder.id" ng-repeat="folder in form.folders">{{folder.name}}</option></select>');
      $templateCache.put('/templates/partials/filters-panel/linked.html',
        '<span ng-hide="existOptionSelected() || validationOptionSelected()" record-select ng-model="selected.value" form-id="attributeOptions[condition.attribute].settings.properties.linkedForm"></span> <input class="btn-input" type="text" disabled="disabled" ng-if="existOptionSelected()"><select class="dropdown-select-btn" ng-model="condition.value" ng-if="validationOptionSelected()" ng-init="condition.value = \'unique\'"><option value="unique" ng-selected="condition.value == validationKey">No Duplicates</option></select>');
      $templateCache.put('/templates/partials/filters-panel/member.html',
        '<zn-member-select members="users" ng-model="condition.value" member-property="id"></zn-member-select>');
      $templateCache.put('/templates/partials/filters-panel/multiple.html',
        '<div ng-if="condition.prefix !== \'in\' && condition.prefix !== \'not-in\'"><select class="dropdown-select-btn" ng-model="condition.value" ng-disabled="condition.value === \'null\'"><option value="{{value}}" ng-selected="condition.value == value" ng-repeat="(value, label) in attributeOptions[condition.attribute].settings.properties.choices">{{label}}</option></select></div><div ng-if="condition.prefix === \'in\' || condition.prefix === \'not-in\'"><div zn-filter-value-in ng-model="condition.value" options="attributeOptions[condition.attribute].settings.properties.choices"></div></div>');
      $templateCache.put('/templates/partials/filters-panel/number.html',
        '<input class="btn-input" ng-model="condition.value" type="text" numbers-only>');
      $templateCache.put('/templates/partials/filters-panel/numeric.html',
        '<input class="btn-input" ng-model="condition.value" type="text" numbers-only ng-hide="existOptionSelected()"> <input class="btn-input" type="text" disabled="disabled" ng-if="existOptionSelected()">');
      $templateCache.put('/templates/partials/filters-panel/single.html',
        '<input class="btn-input" ng-if="condition.prefix !== \'\' && condition.prefix !== \'not\' && condition.prefix !== \'in\' && condition.prefix !== \'not-in\' && !existOptionSelected()" ng-model="condition.value" type="text"> <input class="btn-input" ng-if="condition.prefix !== \'\' && condition.prefix !== \'not\' && condition.prefix !== \'in\' && condition.prefix !== \'not-in\' && existOptionSelected()" ng-disabled="true"><div ng-if="condition.prefix === \'\' || condition.prefix === \'not\'"><select class="dropdown-select-btn" ng-model="condition.value" ng-disabled="condition.value === \'null\'"><option value="{{value}}" ng-selected="condition.value == value" ng-repeat="(value, label) in attributeOptions[condition.attribute].settings.properties.choices">{{label}}</option></select></div><div ng-if="condition.prefix === \'in\' || condition.prefix === \'not-in\'"><div zn-filter-value-in ng-model="condition.value" options="attributeOptions[condition.attribute].settings.properties.choices"></div></div>');
      $templateCache.put('/templates/partials/filters-panel/state-select.html',
        '<select class="dropdown-select-btn" ng-model="condition.value" ng-disabled="condition.value === \'null\'" ng-options="state.id as state.state for state in states"></select>');
      $templateCache.put('/templates/partials/filters-panel/summary.html',
        '<input class="btn-input" ng-model="condition.value" type="text" numbers-only ng-hide="existOptionSelected()"> <input class="btn-input" type="text" disabled="disabled" ng-if="existOptionSelected()">');
      $templateCache.put('/templates/partials/filters-panel/year.html',
        '<input class="btn-input full-width" min="1" max="9999" ng-model="condition.value" limit-to="4" type="number" ng-hide="existOptionSelected()"> <input class="btn-input" type="number" disabled="disabled" ng-if="existOptionSelected()">');
      $templateCache.put('/templates/partials/form-select/form-select.html',
        '<ui-select ng-model="form.selected" theme="bootstrap" ng-disabled="disabled"><ui-select-match placeholder="Select or search a form in the list...">{{$select.selected.name}}</ui-select-match><ui-select-choices repeat="form in forms | filter: { name: $select.search }"><span ng-bind-html="form.name.toString() | escapeHtmlTags | highlight: $select.search | uiSelectHighlightFixChars"></span></ui-select-choices></ui-select>');
      $templateCache.put('/templates/partials/inline-filter-attribute-condition-in.html',
        '<ng-dropdown-multiselect selected-model="value" options="multiSelectOptions" translation-texts="translations" extra-settings="extra"></ng-dropdown-multiselect>');
      $templateCache.put('/templates/partials/inline-filter-attribute-condition.html',
        '<div><div class="filter-condition-col"><div class="btn full-width no-padding"><select class="dropdown-select-btn" ng-hide="condition.attribute" ng-model="selected.attribute" ng-options="att.attribute as att.name for att in sortedAttributes"><option value="">Choose one...</option></select><select class="dropdown-select-btn" ng-if="condition.attribute" ng-model="condition.attribute"><option value="{{att.attribute}}" ng-selected="condition.attribute == att.attribute" ng-repeat="att in sortedAttributes" ng-hide="att.disabled && condition.attribute.indexOf(\'form\') === -1">{{att.name}}</option></select></div></div><div class="filter-condition-col in-line" ng-if="isLinkedAttribute() && notHasOneRelation() && isValidForFiltering()"><div class="btn-group"><a href="javascript:void(0);" class="btn btn-mini" ng-class="{selected: isCustomFilter() === false}" ng-click="setConditionType(\'specific-record\')">Specific Record</a> <a href="javascript:void(0);" class="btn btn-mini" ng-class="{selected: isCustomFilter() === true, disabled: isCustomFilter() === false && !subFilterConditionAllowed() }" ng-click="setConditionType(\'custom-filter\')">Custom Filter</a></div><div style="font-size: 0.7em"><a href="{{constants.SUPPORT_URL}}/knowledgebase/articles/381484" target="_blank"><i class="icon-help-circled"></i> Learn more about linked forms</a></div></div><div class="filter-condition-col"><div ng-if="allowedPrefixes.length == 1" class="full-width btn-input">{{allowedPrefixes[0].label}}</div><div ng-if="allowedPrefixes.length > 1 && isValidForFiltering()" class="btn full-width no-padding"><select class="dropdown-select-btn" ng-model="selected.prefix" ng-options="pre.prefix as pre.label group by pre.type for pre in allowedPrefixes"></select></div></div><div ng-if="(!isLinkedAttribute() || !isCustomFilter()) && isValidForFiltering()" class="filter-condition-col"><div zn-filter-value="fieldTypes[attributeOptions[condition.attribute].type].template"></div></div><div ng-if="conditions.length && isValidForFiltering()" class="filter-remove-col"><a href="javascript:void(0);" ng-click="removeAttributeCondition();"><i class="icon-cancel-circled"></i></a></div></div><div ng-show="condition.attribute && !attributeOptions[condition.attribute]" class="help-block error">This filter condition is no longer valid because the field was deleted. Change or delete this filter condition to make the filter valid.</div><div ng-show="!isCustomFilter() && isLinkedAttribute() && notHasOneRelation() && !subFilterBelowMaxCount()" class="help-block error">There is a limit of 2 custom sub filters for linked forms.</div><div ng-show="!isCustomFilter() && isLinkedAttribute() && notHasOneRelation() && subFilterExistsForAttribute()" class="help-block error">This field already has a sub filter.</div><div ng-show="isLinkedAttribute() && !isValidForFiltering()" class="help-block error">You do not have permission to set up a filter on this form. Please select a different option.</div><div ng-if="isLinkedAttribute() && isCustomFilter()"><p>Custom Filter for your linked form "{{linkedFormName}}" for select records matching...</p><div zn-inline-filter="customFilterinlineOptions" ng-model="condition.filter" zn-inline-filter-private-operator-options="operatorOptions" zn-inline-filter-private-level="nextLevel" zn-inline-filter-private-counts="counts" zn-inline-filter-private-remove-parent-condition="removeParentCondition()"></div></div>');
      $templateCache.put('/templates/partials/inline-filter.html',
        '<div ng-class="{\'inline-filter\': level == 1}"><div class="row"><div class="operator-col"><div class="btn no-padding full-width"><select class="dropdown-select-btn" ng-model="operator" ng-options="op.operator as op.selectorLabel for op in operatorOptions"></select></div></div><span class="operator-col-help-text" ng-if="level == 1">of the criteria below <a href="{{constants.SUPPORT_URL}}/article/463-filtering-data" target="_blank"><i class="icon-help-circled"></i></a></span></div><div ng-repeat="condition in conditions track by trackCondition(condition)"><div class="operator-col"><span ng-hide="$first" class="btn-input centered full-width in-line">{{operatorConditionLabel}}</span><div ng-if="$first" class="operator-placeholder"></div></div><div class="conditions-col"><div ng-show="$first" class="text-small"><div class="filter-condition-col no-padding">Field:</div><div class="filter-condition-col no-padding">Condition:</div><div class="filter-condition-col no-padding">Value:</div></div><div class="inline" ng-if="condition.attribute != null && attributesLoaded"><div zn-filter-attribute-condition condition="condition" conditions="conditions" prefix-options="prefixOptions" attribute-options="attributeOptions" sorted-attributes="sortedAttributes" operator-options="operatorOptions" options="options" form="form" forms="forms" users="users" next-level="nextLevel" subfilters="options.subfilters" counts="counts" remove-parent-condition="removeCondition($index)"></div></div><div ng-if="condition.attribute == null"><div zn-inline-filter="subOptions" ng-model="condition" zn-inline-filter-private-operator-options="operatorOptions" zn-inline-filter-private-level="nextLevel" zn-inline-filter-private-counts="counts" zn-inline-filter-private-remove-parent-condition="removeCondition($index)"></div></div></div></div><div class="operator-col"><span class="btn-input centered full-width in-line">{{operatorConditionLabel}}</span></div><div class="conditions-col add-filter-col"><select ng-disabled="!showAddCondition()" class="add-filter-select-btn btn-small btn btn-primary" ng-model="addFilterSelector"><option value="" disabled="disabled">+ Add a Filter</option><optgroup label="Group" ng-show="showAddSubGroup()"><option ng-repeat="op in operatorOptions" value="{{op.operator}}">{{op.selectorLabel}}</option></optgroup><optgroup label="Field"><option ng-repeat="attribute in sortedAttributes" value="{{attribute.attribute}}" ng-if="!attribute.disabled">{{attribute.name}}</option></optgroup></select><span ng-show="level == 1 && !showAddCondition()" class="help-inline danger">You have reached the filter criteria limit of 10. To add more, delete existing criteria.</span></div></div>');
      $templateCache.put('/templates/partials/record-list.html',
        '<div class="record-list"><div ng-hide="workspace">Please choose a Workspace.</div><div ng-show="workspace && workspace.forms.length > 1"><ul class="tabs"><li ng-repeat="form in workspace.forms"><a ng-click="selectForm(form)">{{form.name}}</a></li></ul></div><div ng-hide="records">There are no records to show.</div><div ng-show="records" class="record-list-records"><ul><li ng-repeat="record in records"><a href="" ng-click="selectRecord(record)"><i class="icon-doc"></i><span class="record-list-records-text">{{record.name}}</span></a></li></ul></div></div>');
      $templateCache.put('/templates/partials/top-nav.html',
        '<div class="navbar navbar-fixed-top"><div class="container-fluid"><div class="navbar-header navbar-right"><ul class="nav navbar-nav navbar-top-links pull-left"><li><a class="navbar-toggle" ng-init="navCollapsed = true" ng-click="navCollapsed = !navCollapsed"><i class="icon icon-menu"></i></a></li></ul><ul class="nav navbar-nav navbar-top-links pull-right"><li ng-show="workspace.id" class="navbar-marketplace"><a href="javascript:void(0);" ng-click="navOpenMarketplace();"><i class="icon icon-puzzle"></i><span class="tablet-hidden">&nbsp;Marketplace</span></a></li><li class="dropdown"><a href class="dropdown-toggle navbar-memberitem" tooltip="{{user.displayText}}"><span class="avatar avatar-sm"><img ng-src="{{user.settings.avatarUrl}}" ng-show="user.settings.avatarUrl"> <i class="icon-member" ng-hide="user.settings.avatarUrl"></i></span> <i class="icon-down-dir"></i></a><ul class="dropdown-menu dropdown-menu-right"><li><a href="/account" app-path>My Account</a></li><li><a href="#" ng-click="logout()">Sign out</a></li></ul></li><li class="zn-top-nav"><div plugin="zn-top-nav" class="plugin"></div></li><li ng-show="workspace.isAdmin" class="tablet-hidden"><a href="{{workspacePath}}/admin" app-path tooltip="Settings &amp; Tools"><i class="icon icon-cog"></i></a></li><li ng-show="workspace.isAdmin" class="tablet-visible"><a href="/templates/partials/feature-not-available.html" class="topnav-section-link" modal title="Sorry!" tooltip="Settings &amp; Tools"><i class="icon icon-cog"></i></a></li><li class="dropdown"><a href class="dropdown-toggle" tooltip="Help"><i class="icon icon-help-circled"></i></a><ul class="dropdown-menu dropdown-menu-right"><li><a href="javascript:void(0);" onclick="return SnapEngage.startLink()"><i class="icon-comment-empty"></i> Chat &amp; Support</a></li><li><a href="{{services.uservoice}}" target="_blank"><i class="icon-info-circled"></i> Help Center</a></li></ul></li><li class="logo"><a href="/" app-path><img class="zengine-icon" src="/images/zengine-icon-white-sm.png"> <span class="tablet-hidden" ng-bind-html="branding.logo"></span></a></li><li class="top-nav-right-plugin-item"><div plugin="top-nav-right-corner" class="plugin"></div></li></ul></div><div class="navbar-collapse" collapse="navCollapsed" id="navbar-collapse"><ul class="nav navbar-nav"><li class="dropdown navbar-workspacemenu"><a href class="dropdown-toggle"><span class="navbar-home-onworkspace">{{workspaceName}}</span> <i class="icon-down-dir"></i></a><ul class="dropdown-menu navbar-workspacemenu-dropdown"><li class="dropdown-headeritem navbar-home-onworkspace"><a href="/"><i class="icon icon-home"></i> Home</a></li><li ng-class="workspace.activeClass" ng-repeat="workspace in workspaces | orderBy:\'name\'"><a href="/workspaces/{{workspace.id}}/data" app-path>{{workspace.name}}</a></li></ul></li></ul><ul class="nav navbar-nav nav-icons zn-var-width-list" zn-var-width-list="navBarItems" zn-var-width-edge-selector="div.navbar-header.navbar-right"><li></li><li class="{{item.classes()}}" ng-if="item.show()" ng-mouseenter="item.mouseenter()" ng-mouseleave="item.mouseleave()" ng-repeat="item in visibleItems" zn-var-width-main-item><a href="{{item.path()}}" app-path tooltip="{{item.tooltip}}"><i class="icon {{item.icon}}"></i> <span class="navbar-itemtext">{{item.title}}</span></a><div class="tooltip-menu tooltip-menu-large{{item.showMenu}}"><div class="pointer pointer-left"><div class="arrow"></div><div class="arrow_border"></div></div><div class="tooltip-menu-body"><ul ng-show="forms.length"><li ng-repeat="menuItem in item.menu"><a href="{{item.path}}/{{menuItem.id}}" app-path>{{menuItem.name}}</a></li></ul></div></div></li><li class="dropdown zn-var-width-more-button topnav-nav-item" zn-var-width-more-button ng-show="extraItems.length > 0"><a class="dropdown-toggle" tooltip="More"><i class="icon-ellipsis"></i></a><ul class="dropdown-menu nav-icons-extra" zn-var-width-extra-list><li class="{{item.classes()}}" ng-if="item.show()" ng-mouseenter="item.mouseenter()" ng-mouseleave="item.mouseleave()" ng-repeat="item in extraItems"><a tooltip="{{item.title}}" href="{{item.path()}}" app-path><i class="icon {{item.icon}}"></i> <span class="navbar-itemtext">{{item.title}}</span></a></li></ul></li></ul></div></div></div>');
    }])
    .service('znPluginEvents', ['$rootScope', function ($rootScope) {
      function subscribe (event, optionalCB) {
        if (event === 'form-record-synchronized') {
          event = 'zn-data-form-records-saved';
        }

        client.subscribe(event, optionalCB);
        return angular.noop; // dummy deregister function
      }

      var scope = $rootScope.$new(true);

      return {
        $id: scope.$id,
        $on: subscribe,
        $emit: scope.$emit,
        $broadcast: scope.$broadcast,
        $$listeners: scope.$$listeners,
        $$listenerCount: scope.$$listenerCount
      };
    }])
    .service('znConfirm', [function () {
      return async function (message, callback, cancelCallback) {
        const confirmed = await client.call({ method: 'confirm', args: { message }, timeout: Infinity });

        if (confirmed && callback) {
          callback();
        } else if (!confirmed && cancelCallback) {
          cancelCallback();
        }
      };
    }])
    .service('znLocalStorage', ['localStorageService', function (localStorageService) {
      return {
        set: localStorageService.set,
        get: localStorageService.get,
        remove: localStorageService.remove,
        isSupported: localStorageService.isSupported
      };
    }])
    .service('znCookies', ['localStorageService', function (localStorageService) {
      return {
        set: localStorageService.cookie.set,
        get: localStorageService.cookie.get,
        remove: localStorageService.cookie.remove,
        isSupported: localStorageService.cookie.isSupported
      };
    }])
    .service('znMessage', [function () {
      return function (message, type, duration) {
        return client.call({ method: 'message', args: { params: { message, type, duration } } });
      };
    }])
    .controller('modalCntl', ['$scope', '$rootScope', '$templateCache', function ($scope, $rootScope, $templateCache) {

      const escListener = e => e.which === 27 && $scope.close();

      $rootScope.$watch('seedData', seedData => {
        if (seedData) {

          angular.forEach(seedData, (value, key) => {
            if (key === 'scope') {
              angular.forEach(seedData[key], (v, k) => {
                $scope[k] = v;
              });
            } else {
              $scope[key] = value;
            }
          });

          if ($scope.closeButton !== false) {
            window.addEventListener('keydown', escListener);
            window.focus();
            client.subscribe('esc', () => $scope.close());
          }

          if (seedData.template && !seedData.templateUrl) {
            $templateCache.put('modal-body-template', seedData.template);
            $scope.templateUrl = 'modal-body-template';
          }

          $scope.setBtnDisabled = (name, disabled = true) => {
            const btn = $scope.btns.find(b => b.name === name);
            if (btn) btn.disabled = disabled;
          };
        }

        const sendStuff = name => (data, keepOpen) => {
          client.call({
            method: 'childToParent',
            args: {
              key: name,
              payload: {
                data: sanitizeForPostMessage(data),
                keepOpen
              }
            }
          });
        };

        $scope.setBtnAction = (name, callback) => {
          $scope.callbacks[name] = () => {
            callback(sendStuff(name));
          };
        };

        $scope.callbacks = {};

        $scope.cancelButton = Object.keys(seedData.btns).length;

        // Backwards compat: If we get an old style object, convert it to an
        // array in the natural JS object key order.
        if (Object.prototype.toString.call(seedData.btns) === '[object Object]') {
          let btnArray = [];
          angular.forEach(seedData.btns, (btn, name) => {
            btn.name = name;
            btnArray.push(btn);
          });
          $scope.btns = seedData.btns = btnArray;
        }

        angular.forEach(seedData.btns, btn => {
          if (btn.template) {
            $templateCache.put(btn.name, btn.template);
          }

          if (btn.action) {
            $scope.callbacks[btn.name] = function () {
              client.call({
                method: 'childToParent',
                args: { key: btn.name, payload: {} }
              });
            };
          } else {
            $scope.callbacks[btn.name] = function () {
              if (btn.close !== false) {
                $scope.close();
              }
            };
          }
        });
      });

      $scope.close = function () {
        client.call({ method: 'close', args: { key: 'close', payload: {} } });
      };

      $scope.$on('$destroy', () => {
        window.removeEventListener('keydown', escListener);
        client.unsubscribe('esc');
      });
    }])
    .service('znPluginData', ['$q', function ($q) {
      return function (namespace) {

        function request (method, route, options, data, successCb, errorCb) {
          if (data) {
            options.data = data;
          }

          const deferred = $q.defer();

          const callback = (err, result) => {
            if (err) {
              const { data, status, headers } = err.data;

              if (errorCb) {
                errorCb(data, status, headers);
              }

              return deferred.reject(data);
            }

            const { data, status, headers } = result;

            if (successCb) {
              successCb(data, status, headers);
            }

            return deferred.resolve(data);
          };

          client.call({
            method: 'znPluginData',
            callback: callback,
            args: {
              namespace,
              method,
              route,
              options
            }
          });

          return deferred.promise;
        }

        return {
          get: request.curry('get'),
          post: request.curry('post'),
          put: request.curry('put'),
          delete: request.curry('delete')
        };
      };
    }])
    .service('znFilterMatcher', [function () {
      return ZnFilterMatcher;
    }])
    .service('znWindow', ['$window', function ($window) {
      var znWindow = this;

      // Pass through open method
      znWindow.open = function (strUrl, strWindowName, strWindowFeatures) {
        strWindowName = strWindowName || null;
        strWindowFeatures = strWindowFeatures || null;

        return $window.open(strUrl, strWindowName, strWindowFeatures);
      };

      znWindow.location = {
        reload: function () {
          return client.call({ method: 'location', args: { method: 'reload', args: [] } });
        }
      };
    }])
    .service('$routeParams', [function () {

      var routeParams = {};
      var currentPluginRoute = context.location.pathParams.plugin_route || '';
      var routePieces = currentPluginRoute.split('/');

      if (plugin.currentInterface.routes) {

        angular.forEach(plugin.currentInterface.routes, function (routeDefinition) {

          // strip out any * or ? - not supported for now
          var routeDef = routeDefinition.replace(/\*|\?/g, '');

          // replace any route parameters in the definition
          // with its value from the current route
          // e.g. /:plugin_id/users/:user_id => /4/users/5
          if (routeDef) {

            var paramsArr = routeDef.split('/');

            var additionalRouteParams = {};

            angular.forEach(paramsArr, function (param, index) {

              if (param.indexOf(':') === 0) {

                param = param.replace(/^:/, '');
                var paramValue = routePieces[index];

                if (paramValue) {
                  paramsArr[index] = paramValue;
                  additionalRouteParams[param] = paramValue;
                }
              }

            });

            // construct expected route from the route definition
            // and compare to the current route
            var expectedRoute = plugin.namespace + paramsArr.join('/');

            if (expectedRoute === currentPluginRoute) {

              // so the paramter values can be accessed when
              // the $routeParams service is injected
              angular.extend(routeParams, additionalRouteParams);

            }

          }
        });
      }
      return angular.extend({}, context.location.pathParams, context.location.searchParams, routeParams);
    }])
    .service('$location', [function () {
      const locationAsync = (method, args) => {
        args = args || [];
        return client.call({ method: 'location', args: { method, args } });
      };

      return {
        host: () => { return context.location.host; },
        protocol: () => { return context.location.protocol; },
        port: () => { return context.location.port; },
        absUrl: () => { return context.location.href; },
        hash: (...args) => {
          if (args.length) {
            locationAsync('hash', args);
          } else {
            return context.location.hash;
          }
        },
        search: (...args) => {
          if (args.length) {
            locationAsync('searchParams', args);
          } else {
            return context.location.searchParams;
          }
        },
        url: (...args) => {
          if (args.length) {
            locationAsync('navigate', args);
          } else {
            var index = context.location.href.indexOf(context.location.pathname);
            return context.location.href.substr(index, context.location.href.length);
          }
        },
        path: (...args) => {
          if (args.length) {
            locationAsync('navigate', args);
          } else {
            return context.location.pathname;
          }
        }
      };
    }]);
})(plugin);

export default plugin;
