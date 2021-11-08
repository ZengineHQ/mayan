angular.module('wizehive.validators', [])
  .factory('regex', function () {
    return {
      ALPHA_NUMERIC: /^[a-z0-9]+$/i,
      ALPHA: /^[a-z]+$/i,
      NUMERIC: /^[-+]?([0-9]*\.[0-9]+|[0-9]+)$/,
      PASSWORD: /(?=.*\d)(?=.*[A-Z])(?=.*[\d]).{8,}/,
      DATE: /^\d{4}-\d{2}-\d{2}$/,
      DATE_US: /^(\d{2})[-\/](\d{2})[-\/](\d{4})$/,
      ZIPCODE: /(^\d{5}$)|(^\d{5}-\d{4}$)/,
      CURRENCY_DOLLARS: /^\$?(\d?\d?\d(,\d\d\d)*|\d+)(\.\d\d)?$/,
      EMAIL: /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/,
      URL: /^(https?|ftp):\/\/(((([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!\$&'\(\)\*\+,;=]|:)*@)?(((\d|[1-9]\d|1\d\d|2[0-4]\d|25[0-5])\.(\d|[1-9]\d|1\d\d|2[0-4]\d|25[0-5])\.(\d|[1-9]\d|1\d\d|2[0-4]\d|25[0-5])\.(\d|[1-9]\d|1\d\d|2[0-4]\d|25[0-5]))|((([a-z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(([a-z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])*([a-z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])))\.)+(([a-z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(([a-z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])*([a-z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])))\.?)(:\d*)?)(\/((([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!\$&'\(\)\*\+,;=]|:|@)+(\/(([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!\$&'\(\)\*\+,;=]|:|@)*)*)?)?(\?((([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!\$&'\(\)\*\+,;=]|:|@)|[\uE000-\uF8FF]|\/|\?)*)?(\#((([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!\$&'\(\)\*\+,;=]|:|@)|\/|\?)*)?$/,
      WHITESPACE: /(\S+)/g
    };
  })
  .factory('countWords', ['regex', function (regex) {
    return function countWords (string) {
      var matches = string.match(regex.WHITESPACE);
      return matches ? matches.length : 0;
    };
  }])
  .directive('znValidateAlphaNumeric', ['regex', function (regex) {
    return {
      restrict: 'A',
      require: 'ngModel',
      link: function (scope, element, attrs, ctrl) {

        var validator = function (viewValue) {
          if (!viewValue || regex.ALPHA_NUMERIC.test(viewValue)) {
            ctrl.$setValidity('alphaNumeric', true);
            return viewValue;
          } else {
            ctrl.$setValidity('alphaNumeric', false);
            return;
          }
        };

        ctrl.$parsers.unshift(validator);

        // Initial Check if Value is Set
        unwatch = scope.$watch(attrs.ngModel, function (model) {

          if (model !== undefined) {
            validator(ctrl.$viewValue);
            unwatch();
          }

        });
      }
    };
  }])
  .directive('znValidateAlpha', ['regex', function (regex) {
    return {
      restrict: 'A',
      require: 'ngModel',
      link: function (scope, element, attrs, ctrl) {

        var validator = function (viewValue) {
          if (!viewValue || regex.ALPHA.test(viewValue)) {
            ctrl.$setValidity('alpha', true);
            return viewValue;
          } else {
            ctrl.$setValidity('alpha', false);
            return;
          }
        };

        ctrl.$parsers.unshift(validator);

        // Initial Check if Value is Set
        unwatch = scope.$watch(attrs.ngModel, function (model) {

          if (model !== undefined) {
            validator(ctrl.$viewValue);
            unwatch();
          }

        });
      }
    };
  }])
  .directive('znValidateNumber', ['regex', function (regex) {
    return {
      restrict: 'A',
      require: 'ngModel',
      link: function (scope, element, attrs, ctrl) {

        var validator = function (viewValue) {
          if (!viewValue || regex.NUMERIC.test(viewValue)) {
            ctrl.$setValidity('number', true);
            return viewValue;
          } else {
            ctrl.$setValidity('number', false);
            return;
          }
        };

        ctrl.$parsers.unshift(validator);

        // Initial Check if Value is Set
        unwatch = scope.$watch(attrs.ngModel, function (model) {

          if (model !== undefined) {
            validator(ctrl.$viewValue);
            unwatch();
          }

        });
      }
    };
  }])
  .directive('znValidateMinNumber', [function () {
    return {
      restrict: 'A',
      require: 'ngModel',
      link: function (scope, element, attrs, ctrl) {

        var validator = function (viewValue) {

          var minNumber = attrs.znValidateMinNumber,
            bn;

          try {
            bn = new BigNumber(viewValue);
          } catch (err) {

          }

          if (!viewValue || !bn || bn.greaterThanOrEqualTo(minNumber)) {
            ctrl.$setValidity('minNumber', true);
            return viewValue;
          } else {
            ctrl.$setValidity('minNumber', false);
            return;
          }
        };

        ctrl.$parsers.unshift(validator);

        // Initial Check if Value is Set
        unwatch = scope.$watch(attrs.ngModel, function (model) {

          if (model !== undefined) {
            validator(ctrl.$viewValue);
            unwatch();
          }

        });
      }
    };
  }])
  .directive('znValidateMaxNumber', [function () {
    return {
      restrict: 'A',
      require: 'ngModel',
      link: function (scope, element, attrs, ctrl) {

        var validator = function (viewValue) {

          var maxNumber = attrs.znValidateMaxNumber,
            bn;

          try {
            bn = new BigNumber(viewValue);
          } catch (err) {

          }

          if (!viewValue || !bn || bn.lessThanOrEqualTo(maxNumber)) {
            ctrl.$setValidity('maxNumber', true);
            return viewValue;
          } else {
            ctrl.$setValidity('maxNumber', false);
            return;
          }
        };

        ctrl.$parsers.unshift(validator);

        // Initial Check if Value is Set
        unwatch = scope.$watch(attrs.ngModel, function (model) {

          if (model !== undefined) {
            validator(ctrl.$viewValue);
            unwatch();
          }

        });
      }
    };
  }])
  .directive('znValidateCurrency', ['regex', function (regex) {
    return {
      restrict: 'A',
      require: 'ngModel',
      link: function (scope, element, attrs, ctrl) {
        //if znValidateCurrency attribute exists
        if (attrs.znValidateCurrency) {

          //fetch currency value
          var currency = attrs.znValidateCurrency;

          var validator = function (viewValue) {

            var regexToMatch = '';

            //set regexToMatch variable based
            switch (currency) {

              case 'dollar':
                regexToMatch = 'CURRENCY_DOLLARS';
                break;
              default:
            }

            //regex to match is not empty and match the regex pattern
            if (regexToMatch && !viewValue || regex[regexToMatch].test(viewValue)) {

              ctrl.$setValidity('currency', true);
              return viewValue;
            } else {
              ctrl.$setValidity('currency', false);
              return;
            }
          };

          ctrl.$parsers.unshift(validator);

          // Initial Check if Value is Set
          unwatch = scope.$watch(attrs.ngModel, function (model) {

            if (model !== undefined) {
              validator(ctrl.$viewValue);
              unwatch();
            }

          });
        }
        else {
          ctrl.$setValidity('currency', false);
          return;
        }
      }
    };
  }])
  .directive('znValidateDate', ['regex', function (regex) {
    return {
      restrict: 'A',
      require: 'ngModel',
      link: function (scope, element, attrs, ctrl) {

        var validator = function (viewValue) {
          //check if value is empty or match the regex pattern
          if (!viewValue || regex.DATE.test(viewValue)) {
            ctrl.$setValidity('date', true);
            return viewValue;
          } else {
            ctrl.$setValidity('date', false);
            return;
          }
        };

        ctrl.$parsers.unshift(validator);

        // Initial Check if Value is Set
        unwatch = scope.$watch(attrs.ngModel, function (model) {

          if (model !== undefined) {
            validator(ctrl.$viewValue);
            unwatch();
          }

        });
      }
    };
  }])
  .directive('znValidateDateUs', ['regex', function (regex) {
    return {
      restrict: 'A',
      require: 'ngModel',
      link: function (scope, element, attrs, ctrl) {

        var validator = function (viewValue) {
          //check if value is empty or match the regex pattern
          if (!viewValue || regex.DATE_US.test(viewValue)) {
            ctrl.$setValidity('dateUs', true);
            return viewValue;
          } else {
            ctrl.$setValidity('dateUs', false);
            return;
          }
        };

        ctrl.$parsers.unshift(validator);

        // Initial Check if Value is Set
        unwatch = scope.$watch(attrs.ngModel, function (model) {

          if (model !== undefined) {
            validator(ctrl.$viewValue);
            unwatch();
          }

        });
      }
    };
  }])
  .directive('znValidatePassword', ['regex', function (regex) {
    return {
      restrict: 'A',
      require: 'ngModel',
      link: function (scope, element, attrs, ctrl) {

        var validator = function (viewValue) {
          if (!viewValue || regex.PASSWORD.test(viewValue)) {
            ctrl.$setValidity('password', true);
            return viewValue;
          } else {
            ctrl.$setValidity('password', false);
            return;
          }
        };

        ctrl.$parsers.unshift(validator);

        // Initial Check if Value is Set
        unwatch = scope.$watch(attrs.ngModel, function (model) {

          if (model !== undefined) {
            validator(ctrl.$viewValue);
            unwatch();
          }

        });
      }
    };
  }])
  .directive('znValidateEmail', ['regex', function (regex) {
    return {
      restrict: 'A',
      require: 'ngModel',
      link: function (scope, element, attrs, ctrl) {

        var validator = function (viewValue) {
          if (!viewValue || regex.EMAIL.test(viewValue)) {
            ctrl.$setValidity('email', true);
            return viewValue;
          } else {
            ctrl.$setValidity('email', false);
            return;
          }
        };

        ctrl.$parsers.unshift(validator);

        // Initial Check if Value is Set
        unwatch = scope.$watch(attrs.ngModel, function (model) {

          if (model !== undefined) {
            validator(ctrl.$viewValue);
            unwatch();
          }

        });
      }
    };
  }])
  .directive('znValidateUrl', ['regex', function (regex) {
    return {
      restrict: 'A',
      require: 'ngModel',
      link: function (scope, element, attrs, ctrl) {

        var validator = function (viewValue) {
          //check if value is empty or match the regex pattern
          if (!viewValue || regex.URL.test(viewValue)) {
            ctrl.$setValidity('url', true);
            return viewValue;
          } else {
            ctrl.$setValidity('url', false);
            return;
          }
        };

        ctrl.$parsers.unshift(validator);

        // Initial Check if Value is Set
        unwatch = scope.$watch(attrs.ngModel, function (model) {

          if (model !== undefined) {
            validator(ctrl.$viewValue);
            unwatch();
          }

        });
      }
    };
  }])
  .directive('znValidateTextboxMaxLength', function () {
    return {
      restrict: 'A',
      require: 'ngModel',
      link: function (scope, element, attrs, ctrl) {
        var maxLength = parseInt(attrs.znValidateTextboxMaxLength, 10) || -1;

        var validator = function (viewValue) {
          if (viewValue && maxLength > -1 && viewValue.length > maxLength) {
            ctrl.$setValidity('maxlength', false);
            // return viewValue - potentially used by other parsers
            return viewValue;
          } else {
            ctrl.$setValidity('maxlength', true);
            // return viewValue - potentially used by other parsers
            return viewValue;
          }
        };

        ctrl.$parsers.unshift(validator);

        // Initial Check if Value is Set
        unwatch = scope.$watch(attrs.ngModel, function (model) {

          if (model !== undefined) {
            validator(ctrl.$viewValue);
            unwatch();
          }

        });
      }
    };
  })
  .directive('znValidateMinwordcount', ['countWords', function (countWords) {
    return {
      restrict: 'A',
      require: 'ngModel',
      link: function (scope, element, attrs, ctrl) {
        var minWords = parseInt(attrs.znValidateMinwordcount, 10) || -1;

        var validator = function (viewValue) {
          viewValue = viewValue || "";
          var numWords = countWords(viewValue);
          // Empty is allowed, otherwise must meet minimum count to validate
          if (viewValue && minWords > -1 && numWords < minWords) {
            ctrl.$setValidity('minwordcount', false);
            // return viewValue - potentially used by other parsers
            return viewValue;
          } else {
            ctrl.$setValidity('minwordcount', true);
            // return viewValue - potentially used by other parsers
            return viewValue;
          }
        };

        ctrl.$parsers.unshift(validator);

        // Initial Check if Value is Set
        unwatch = scope.$watch(attrs.ngModel, function (model) {

          if (model !== undefined) {
            validator(ctrl.$viewValue);
            unwatch();
          }

        });

      }
    };
  }])
  .directive('znValidateMaxwordcount', ['countWords', function (countWords) {
    return {
      restrict: 'A',
      require: 'ngModel',
      link: function (scope, element, attrs, ctrl) {
        var maxWords = parseInt(attrs.znValidateMaxwordcount, 10) || -1;

        var validator = function (viewValue) {
          viewValue = viewValue || "";
          var numWords = countWords(viewValue);
          if (maxWords > -1 && numWords > maxWords) {
            ctrl.$setValidity('maxwordcount', false);
            // return viewValue - potentially used by other parsers
            return viewValue;
          } else {
            ctrl.$setValidity('maxwordcount', true);
            // return viewValue - potentially used by other parsers
            return viewValue;
          }
        };

        ctrl.$parsers.unshift(validator);

        // Initial Check if Value is Set - Wait for Digest
        unwatch = scope.$watch(attrs.ngModel, function (model) {

          if (model !== undefined) {
            validator(ctrl.$viewValue);
            unwatch();
          }

        });
      }
    };
  }])
  .directive('znValidateZipcode', ['regex', function (regex) {
    return {
      restrict: 'A',
      require: 'ngModel',
      link: function (scope, element, attrs, ctrl) {

        var validator = function (viewValue) {
          //check if value is empty or match the regex pattern
          if (!viewValue || regex.ZIPCODE.test(viewValue)) {
            ctrl.$setValidity('zipcode', true);
            return viewValue;
          } else {
            ctrl.$setValidity('zipcode', false);
            return;
          }
        };

        ctrl.$parsers.unshift(validator);

        // Initial Check if Value is Set - Wait for Digest
        unwatch = scope.$watch(attrs.ngModel, function (model) {

          if (model !== undefined) {
            validator(ctrl.$viewValue);
            unwatch();
          }

        });
      }
    };
  }])
	/**
	 *
	 * znValidateUnique - set unique validation on element blur using a checker function available on scope
	 * Pass function name to this attribute, e.g. <input zn-validate-unique="isUnique" />
	 * Function must return promise that resolves if unique, and rejects if not unique
	 *
	 * @author	Paul W. Smith <paul@wizehive.com>
	 * @since	0.5.51
	 */
  .directive('znValidateUnique', ['$timeout', function ($timeout) {
    return {
      restrict: 'A',
      require: 'ngModel',
      link: function (scope, element, attrs, ctrl) {
        // zn-validate-unique="nameOfUniqueCheckingFunctionOnMyScope"
        var uniqueFunc = scope[attrs.znValidateUnique];
        if (typeof uniqueFunc !== 'function') {
          throw new Error('znValidateUnique must be passed the name of a valid scope function');
        }
        var lastValue;

        function checkUnique (init) {
          if (ctrl.$viewValue === lastValue) {
            return;
          } else {
            // Reset validation until checking with server
            ctrl.$setValidity('unique', true);
            lastValue = ctrl.$viewValue;
          }

          uniqueFunc(attrs.name, init).then(function () {
            ctrl.$setValidity('unique', true);
          }, function () {
            ctrl.$setValidity('unique', false);
          });
        }

        // Initial Check if Value is Set - Wait for Digest
        $timeout(function () {
          return checkUnique(true);
        }, 0);

        // Check Value Uniqueness on Blur
        element.on('blur', function () {
          return checkUnique(false);
        });
      }
    };
  }])
	/**
	 * znValidateChoices
	 *
	 * @author	Anna Parks <anna@wizehive.com>
	 * @since	0.5.80
	 */
  .directive('znValidateChoices', [function () {
    return {
      restrict: 'A',
      require: 'ngModel',
      link: function (scope, element, attrs, ctrl) {

        if (!ctrl) {
          return;
        }

        var choices = scope.$eval(attrs.znValidateChoices) || false;

        scope.$watch(attrs.ngModel, check);
        ctrl.$viewChangeListeners.push(check);

        function check () {

          if (ctrl.$isEmpty(ctrl.$modelValue)) {
            return;
          }

          var valid = true,
            modelValue = ctrl.$modelValue,
            values = [];


          angular.forEach(choices, function (label, value) {
            values.push(value);
          });

          if (!angular.isArray(modelValue)) {
            modelValue = [modelValue];
          }

          angular.forEach(modelValue, function (value) {

            if (values.indexOf(value) == -1) {
              valid = false;
            }

          });

          ctrl.$setValidity('choices', valid);
        }

      }
    };
  }])
  .directive('znValidateMember', [function () {
    return {
      restrict: 'A',
      require: 'ngModel',
      link: function (scope, element, attrs, ctrl) {

        if (!ctrl) {
          return;
        }

        var members = scope[attrs.znValidateMember] || false;
        if (!members) {
          throw new Error('znValidateMember members array not found/set');
        }

        scope.$watch(ctrl.$viewValue, check);
        ctrl.$viewChangeListeners.push(check);

        function check () {

          if (ctrl.$isEmpty(ctrl.$viewValue)) {
            return;
          }

          var valid = false;
          angular.forEach(members, function (member) {
            if (ctrl.$viewValue === member.id) {
              valid = true;
            }
          });
          ctrl.$setValidity('member', valid);
        }

      }
    };
  }]);
