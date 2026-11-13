'use strict'

const chai = require('chai')
const chaiAsPromised = require('chai-as-promised').default

global.expect = chai.expect
global.assert = chai.assert

chai.use(chaiAsPromised)

chai.should()
