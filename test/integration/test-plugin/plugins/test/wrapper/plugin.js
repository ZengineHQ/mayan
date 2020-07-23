import '../vendor/import-jquery';
import 'jquery-ui';

import 'angular';
import 'angular-sanitize';
import 'angular-local-storage';

/* eslint-disable no-unused-vars */
import BigNumber from 'bignumber.js';

import Handlebars from 'handlebars';

import moment from 'moment';

import 'firebase';
import 'angularfire';

import showdown from 'showdown';
import 'ng-showdown';
/* eslint-enable no-unused-vars */

import 'angular-ui-sortable';

/* ui-tinymce import examples (alter as needed or remove if not needed) */
import 'tinymce/tinymce';
import 'tinymce/plugins/autoresize';
import 'tinymce/plugins/table';
import 'tinymce/themes/modern/theme';
// do not import skins.
// they are copied directly by the legacy builder.
import 'angular-ui-tinymce';

/* ui-ace import examples (alter as needed or remove if not needed) */
import 'ace-builds/src-min-noconflict/ace';
import 'ace-builds/src-min-noconflict/theme-twilight';
import 'ace-builds/src-min-noconflict/mode-css';
// do not import any ace workers.
// they are copied directly by the legacy builder.
import 'angular-ui-ace/src/ui-ace';

import '../vendor/bootstrap.js';
import 'angular-bootstrap';
import '../vendor/validators.js';

import 'ui-select';

import 'ng-dropdown-multiselect';

import 'ng-grid/ng-grid-2.0.12.min.js';

import plugin from './lib/wrapper';
import { Services } from './lib/services';
import { Filters } from './lib/filters';
import { Directives } from './lib/directives';
import { ZnForm } from './lib/zn-form';
import { ZnData } from './lib/zn-data';

Services(plugin);
Filters(plugin);
Directives(plugin);
ZnForm(plugin);
ZnData(plugin);

/* PLUGIN_JS */
