'use strict'

const chai = require('chai')
const chaiAsPromised = require('chai-as-promised')

global.expect = chai.expect
global.assert = chai.assert

global.sinon = require('sinon')

chai.use(chaiAsPromised)

chai.should()
