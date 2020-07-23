/* eslint no-useless-escape: "off" */
import BigNumber from 'bignumber.js';
import moment from 'moment';

export function Filters (plugin) {
  /**
   * Wizehive filters
   *
   * Copyright (c) WizeHive - http://www.wizehive.com
   *
   * @since 0.x.x
   */
  plugin
    .filter('truncate', [function () {
      return function (input, length) {
        if (input) {
          length = length || 100;
          if (input.length > length) {
            return input.substr(0, length) + '...';
          }
          return input;
        }
      };
    }])
    /**
     * Identity filter
     *
     * @param   {Object} User object
     * @param   {Array} WorkspaceMembers array
     * @returns {String} Format user name
     */
    .filter('identity', [function () {
      return function (input) {
        if (input) {
          switch (input.resource) {
            case 'workspaces': return 'a workspace integration';
            default: return input.displayName || input.username || input.email;
          }
        }

        return '';
      };
    }])
    /**
     * Created By Filter
     *
     * If Real Person, User CreatedByUser o/w CreatedByClient
     *
     * @param   {Object} object
     * @param   {Array} WorkspaceMembers array
     * @returns {String} Formatted created by name
     */
    .filter('createdBy', ['identityFilter', function (identityFilter) {
      return function (input) {
        if (input) {
          if (input.createdByUser && !input.createdByUser.resource) {
            return identityFilter(input.createdByUser);
          }

          if (input.createdByClient) {
            return input.createdByClient.appName;
          }
        }
        return '';
      };
    }])
    /**
     * User date filter - formats a date according to user's "dateFormat" preference
     *
     * @param   {Date|String} input
     * @returns {String}
     */
    .filter('userDate', ['$rootScope', function ($rootScope) {
      // Default presentation format in case user profile not available
      var defaultFormat = 'MM/DD/YYYY';

      return function (input) {
        var format;

        try {
          format = $rootScope.user.settings.dateFormat.toUpperCase();
        } catch (e) {
          format = defaultFormat;
        }

        var mdate = moment(input);
        if (!mdate.isValid()) {
          return input;
        } else {
          return mdate.format(format);
        }
      };
    }])
    /**
     * To string filter
     *
     * @author Unknown
     * @since 0.x.x
     */
    .filter('toString', [function () {
      return function (input) {
        if (typeof input === 'undefined') {
          return '';
        }
        return input.toString();
      };
    }])
    /**
     * Pluralize filter
     *
     * @author Unknown
     * @since 0.x.x
     */
    .filter('pluralize', [function () {
      return function (input) {
        input = input || '';
        if (input.length) {
          if (input[input.length - 1] === 'y') {
            return input.substr(0, input.length - 1) + 'ies';
          } else {
            return input + 's';
          }
        }
        return input;
      };
    }])
    /**
     * Singularize filter
     *
     * @author Unknown
     * @since 0.x.x
     */
    .filter('singularize', [function () {
      return function (input) {
        input = input || '';
        if (input.length) {
          if (input.substr(input.length - 3) === 'ies') {
            return input.substr(0, input.length - 3) + 'y';
          } else if (input[input.length - 1] === 's') {
            return input.substr(0, input.length - 1);
          }
        }
        return input;
      };
    }])
    /**
     * Capitalize filter
     *
     * @author Unknown
     * @since 0.x.x
     */
    .filter('capitalize', [function () {
      return function (input) {
        var parts = (input || '').split(' ');
        var len = parts.length;
        while (len--) {
          parts[len] = parts[len][0].toUpperCase() + parts[len].substr(1);
        }
        return parts.join(' ');
      };
    }])
    /**
     * Article filter
     *
     * Returns 'a' or 'an' depending on the first letter of the following word
     *
     * @author Paul W. Smith <paul@wizehive.com>
     * @since 0.5.25
     * @param {Null|String} input Input text
     * @returns {String}
     */
    .filter('article', [function () {
      return function (input) {
        if (!input) {
          return '';
        }
        if (/^[aeiouAEIOU]/.test(input)) {
          return 'an';
        }
        return 'a';
      };
    }])
    /**
     * URL encode filter
     *
     * @author Unknown
     * @since 0.x.x
     */
    .filter('urlEncode', [function () {
      return function (input) {
        return window.encodeURIComponent(input);
      };
    }])
    /**
     * State filter
     *
     * @author Unknown
     * @since 0.x.x
     */
    .filter('state', ['$rootScope', function ($rootScope) {
      return function (input) {
        if ($rootScope.states) {
          angular.forEach($rootScope.states, function (state) {
            if (input === state.id) {
              input = state.state;
              return false;
            }
          });
        }
        return input;
      };
    }])
    /**
     * Country filter
     *
     * @author Unknown
     * @since 0.x.x
     */
    .filter('country', ['$rootScope', function ($rootScope) {
      return function (input) {
        if ($rootScope.countries) {
          angular.forEach($rootScope.countries, function (country) {
            if (input === country.id) {
              input = country.country;
              return false;
            }
          });
        }
        return input;
      };
    }])
    /**
     * Field title - name if present, otherwise label
     *
     */
    .filter('formFieldTitle', [function () {
      return function (field) {
        return ((field && field.name) || (field && field.label) || field);
      };
    }])
    /**
     * Trim
     *
     * @see  https://github.com/willmendesneto/keepr/blob/master/app/scripts/filters/trim.js
     * @since  0.5.41
     */
    .filter('trim', [function () {
      return function (input) {
        var str;
        if (input === undefined || input === null) {
          input = '';
        }
        str = String(input);
        if (String.prototype.trim !== null) {
          return str.trim();
        } else {
          return str.replace(/^\s+|\s+$/gm, '');
        }
      };
    }])
    /**
     * Camel case
     *
     * @see https://github.com/willmendesneto/keepr/blob/master/app/scripts/filters/camelcase.js
     * @since  0.5.41
     */
    .filter('camelCase', ['$filter', function ($filter) {
      return function (input, firstWordWithCase) {
        if (input === null || input === undefined) {
          input = '';
        }

        var $trim = $filter('trim');

        // First character with camel case
        if (firstWordWithCase) {
          input = $filter('capitalize')(input);
        }

        return $trim(input).replace(/[-_\s]+(.)?/g, function (match, c) {
          return c.toUpperCase();
        });
      };
    }])
    /**
     * Numeric Value Filter
     *
     * Formats a numeric value for display based on form field settings
     *
     * @param   {number}
     * @param   {object} form field
     * @returns {string}
     */
    .filter('znNumericValue', ['$filter', function ($filter) {
      return function (amount, field) {
        var properties = {};
        var decimal = 0;
        var result = '';
        var bn;

        if (field && field.settings && field.settings.properties) {
          properties = field.settings.properties;
        }

        if (properties.decimal) {
          decimal = properties.decimal;
        }

        try {
          bn = new BigNumber(amount);
        } catch (err) {
          return '';
        }

        // Use Absolute Value for Currency Formatting
        var isNegative = bn.isNegative();

        if (isNegative) {
          bn = bn.abs();
        }

        // Format as string '1,234.56', to decimal places
        result = bn.toFormat(decimal);

        // Prepend Currency Symbol
        if (properties.currency) {
          var symbol = $filter('znCurrencySymbol')(properties.currency);

          result = symbol + result;
        }

        // Prepend Sign if Negative
        if (isNegative) {
          result = '-' + result;
        }

        return result;
      };
    }])
    /**
     * Currency Symbol from Currency Code
     *
     * @param   {string}  code
     * @returns {string}  symbol
     */
    .filter('znCurrencySymbol', ['$rootScope', function ($rootScope) {
      return function (code) {
        var symbol = '';

        angular.forEach($rootScope.currencies, function (currency) {
          if (currency.id === code) {
            symbol = currency.symbol;
          }
        });

        return symbol;
      };
    }])
    /**
     * Presentation Text Filter
     *
     * Formats a presentation text field for display based on form field settings
     *
     * @param   {object} form field
     * @returns {string}
     */
    .filter('znPresentationalText', ['$filter', function ($filter) {
      return function (field) {
        var znMarkdown = $filter('znMarkdown');
        var label = '';
        var properties = {};
        var result;

        if (field && field.label) {
          label = field.label;
        }

        if (field && field.settings && field.settings.properties) {
          properties = field.settings.properties;
        }

        if (properties.markdown) {
          result = znMarkdown(label);
        } else {
          result = label;
        }

        return result;
      };
    }])
    /**
     * Markdown Filter
     *
     * Sanitize markdown, strips input HTML tags, and renders Markdown
     *
     * @param   {markdown}
     * @returns {html}
     */
    .filter('znMarkdown', ['$filter', '$showdown', function ($filter, $showdown) {
      return function (markdown) {
        if (!markdown) {
          return markdown;
        }

        var sanitizeMarkdown = $filter('sanitizeMarkdown');

        return $showdown.makeHtml(sanitizeMarkdown($showdown.stripHtml(markdown)));
      };
    }])
    /**
     * Sanitize un-safe/unsupported markdown
     */
    .filter('sanitizeMarkdown', [function () {
      return function (str) {
        if (!str) {
          return '';
        }

        // Images
        var escapeImageLink = function (wholeMatch /* , altText, linkId, url, width, height, m5, title */) {
          return '<div>' + wholeMatch + '</div>';
        };

        var inlineImageRegex = /!\[([^\]]*?)][ \t]*()\([ \t]?<?([\S]+?(?:\([\S]*?\)[\S]*?)?)>?(?: =([*\d]+[A-Za-z%]{0,4})x([*\d]+[A-Za-z%]{0,4}))?[ \t]*(?:(["'])([^"]*?)\6)?[ \t]?\)/g;
        var crazyImageRegex = /!\[([^\]]*?)][ \t]*()\([ \t]?<([^>]*)>(?: =([*\d]+[A-Za-z%]{0,4})x([*\d]+[A-Za-z%]{0,4}))?[ \t]*(?:(?:(["'])([^"]*?)\6))?[ \t]?\)/g;
        var base64ImageRegex = /!\[([^\]]*?)][ \t]*()\([ \t]?<?(data:.+?\/.+?;base64,[A-Za-z0-9+/=\n]+?)>?(?: =([*\d]+[A-Za-z%]{0,4})x([*\d]+[A-Za-z%]{0,4}))?[ \t]*(?:(["'])([^"]*?)\6)?[ \t]?\)/g;
        var referenceImageRegex = /!\[([^\]]*?)] ?(?:\n *)?\[([\s\S]*?)]()()()()()/g;
        var shortcutImageRegex = /!\[([^\[\]]+)]()()()()()/g;

        str = str.replace(inlineImageRegex, escapeImageLink);
        str = str.replace(crazyImageRegex, escapeImageLink);
        str = str.replace(base64ImageRegex, escapeImageLink);
        str = str.replace(referenceImageRegex, escapeImageLink);
        str = str.replace(shortcutImageRegex, escapeImageLink);

        // Auto Links
        var escapeAutoLink = function (wholeMatch, leadingMagicChars, url /* , m2, m3, trailingPunctuation, trailingMagicChars */) {
          if (url && (url.substring(0, 8) === 'https://')) {
            return wholeMatch;
          } else {
            return '<div>' + wholeMatch + '</div>';
          }
        };

        var simpleAutoLinkRegex = /([*~_]+|\b)(((https?|ftp|dict):\/\/|www\.)[^'">\s]+?\.[^'">\s]+?)()(\1)?(?=\s|$)(?!["<>])/gi;
        var simple2AutoLinkRegex = /([*~_]+|\b)(((https?|ftp|dict):\/\/|www\.)[^'">\s]+\.[^'">\s]+?)([.!?,()\[\]])?(\1)?(?=\s|$)(?!["<>])/gi;
        var delimAutoLinkRegex = /()<(((https?|ftp|dict):\/\/|www\.)[^'">\s]+)()>()/gi;
        var mailAutoLinkRegex = /(^|\s)(?:mailto:)?([A-Za-z0-9!#$%&'*+-/=?^_`{|}~.]+@[-a-z0-9]+(\.[-a-z0-9]+)*\.[a-z]+)(?=$|\s)/gmi;
        var delimMailRegex = /<()(?:mailto:)?([-.\w]+@[-a-z0-9]+(\.[-a-z0-9]+)*\.[a-z]+)>/gi;

        str = str.replace(simpleAutoLinkRegex, escapeAutoLink);
        str = str.replace(simple2AutoLinkRegex, escapeAutoLink);
        str = str.replace(delimAutoLinkRegex, escapeAutoLink);
        str = str.replace(mailAutoLinkRegex, escapeAutoLink);
        str = str.replace(delimMailRegex, escapeAutoLink);

        // Links
        var escapeLink = function (wholeMatch, linkText, linkId, url /* , m5, m6, title */) {
          if (url && (url.substring(0, 8) === 'https://')) {
            return wholeMatch;
          } else {
            return '<div>' + wholeMatch + '</div>';
          }
        };

        var crazyLinkRegex = /\[((?:\[[^\]]*]|[^\[\]])*)]()[ \t]*\([ \t]?<([^>]*)>(?:[ \t]*((["'])([^"]*?)\5))?[ \t]?\)/g;
        var normalLinkRegex = /\[((?:\[[^\]]*]|[^\[\]])*)]()[ \t]*\([ \t]?<?([\S]+?(?:\([\S]*?\)[\S]*?)?)>?(?:[ \t]*((["'])([^"]*?)\5))?[ \t]?\)/g;
        var referencesLinkRegex = /\[([^\[\]]+)]:[ \t]*()(.*)()()()/g;

        str = String(str);
        str = str.replace(crazyLinkRegex, escapeLink);
        str = str.replace(normalLinkRegex, escapeLink);
        str = str.replace(referencesLinkRegex, escapeLink);

        return str;
      };
    }])
    /**
     * Escape HTML Simplified Version. It only escape </> characters.
     * It is based on the original escapeHtml filter but only escape the tags
     * @author Juan Scarton <juan.scarton@wizehive.com>
     * @since 2.5.1
     */
    .filter('escapeHtmlTags', [function () {
      var entityMap = {
        '<': '&lt;',
        '>': '&gt;',
        '/': '&#x2F;'
      };

      return function (str) {
        return String(str).replace(/[<>\/]/g, function (s) {
          return entityMap[s];
        });
      };
    }])
    /**
     * Fix escaped HTML issues on ui-select
     * @author Juan Scarton <juan.scarton@wizehive.com>
     * @since 2.5.3
     */
    .filter('uiSelectHighlightFixChars', [function () {
      return function (str) {
        return String(str)
          .replace(/\&<span class=\"ui-select-highlight\">(l|g)<\/span>t\;/g, '\&$1t;')
          .replace(/\&<span class=\"ui-select-highlight\">(lt|gt|#x2F)<\/span>\;/g, '\&$1;')
          .replace(/\&<span class=\"ui-select-highlight\">(lt\;|gt\;|\#x2F\;)<\/span>/g, '\&$1')
          .replace(/\&(l|g)<span class=\"ui-select-highlight\">t<\/span>\;/g, '\&$1t;')
          .replace(/\&(lt|gt|\#x2F)<span class=\"ui-select-highlight\">\;<\/span>/g, '\&$1;')
          .replace(/<span class=\"ui-select-highlight\">\&<\/span>(lt\;|gt\;|\#x2F\;)/g, '\&$1')
          .replace(/<span class=\"ui-select-highlight\">\&(l|g)<\/span>t\;/g, '\&$1t;')
          .replace(/<span class=\"ui-select-highlight\">\&(lt|gt|#x2F)<\/span>\;/g, '\&$1;')
          .replace(/<span class=\"ui-select-highlight\">\&(lt\;|gt\;|#x2F\;)<\/span>/g, '\&$1')
          .replace(/<span class=\"ui-select-highlight\">\&\#<\/span>x2F\;/g, '\&#x2F;')
          .replace(/<span class=\"ui-select-highlight\">\&\#x<\/span>2F\;/g, '\&#x2F;')
          .replace(/<span class=\"ui-select-highlight\">\&\#x2<\/span>F\;/g, '\&#x2F;')
          .replace(/<span class=\"ui-select-highlight\">\&\#x2F<\/span>\;/g, '\&#x2F;')
          .replace(/\&<span class=\"ui-select-highlight\">\#<\/span>x2F\;/g, '\&#x2F;')
          .replace(/\&<span class=\"ui-select-highlight\">\#x<\/span>2F\;/g, '\&#x2F;')
          .replace(/\&<span class=\"ui-select-highlight\">\#x2<\/span>F\;/g, '\&#x2F;')
          .replace(/\&<span class=\"ui-select-highlight\">\#x2F<\/span>\;/g, '\&#x2F;')
          .replace(/\&<span class=\"ui-select-highlight\">\#x2F\;<\/span>/g, '\&#x2F;')
          .replace(/\&\#<span class=\"ui-select-highlight\">x<\/span>2F\;/g, '\&#x2F;')
          .replace(/\&\#<span class=\"ui-select-highlight\">x2<\/span>F\;/g, '\&#x2F;')
          .replace(/\&\#<span class=\"ui-select-highlight\">x2F<\/span>\;/g, '\&#x2F;')
          .replace(/\&\#<span class=\"ui-select-highlight\">x2F\;<\/span>/g, '\&#x2F;')
          .replace(/\&\#x<span class=\"ui-select-highlight\">2<\/span>F\;/g, '\&#x2F;')
          .replace(/\&\#x<span class=\"ui-select-highlight\">2F<\/span>\;/g, '\&#x2F;')
          .replace(/\&\#x<span class=\"ui-select-highlight\">2F\;<\/span>/g, '\&#x2F;')
          .replace(/\&\#x2<span class=\"ui-select-highlight\">F<\/span>\;/g, '\&#x2F;')
          .replace(/\&\#x2<span class=\"ui-select-highlight\">F\;<\/span>/g, '\&#x2F;');
      };
    }])
    /**
     * Escape HTML
     *
     * http://stackoverflow.com/questions/14462612/escape-html-text-in-an-angularjs-directive/28537958#28537958
     */
    .filter('escapeHtml', [function () {
      var entityMap = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        '\'': '&#39;',
        '/': '&#x2F;'
      };

      return function (str) {
        return String(str).replace(/[&<>"'\/]/g, function (s) {
          return entityMap[s];
        });
      };
    }])
    /**
     * Field Name
     *
     * Get field name from field id
     *
     * @param   {Number}	fieldId
     * @returns {String}
     */
    .filter('fieldName', [function () {
      return function (fieldId) {
        return 'field' + fieldId;
      };
    }])
    .filter('znUserDate', ['userDateFilter', function (userDateFilter) {
      return userDateFilter;
    }]);
}

export default {
  Filters
};
