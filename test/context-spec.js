'use strict'

const context = require('../lib/context')

describe('context', () => {

  it('should fail with an empty context object', () => {

    let ctx = {}

    return context(ctx).should.be.rejectedWith('Invalid and/or missing context')

  })

  it('should fail with a number context', () => {

    let ctx = 0

    return context(ctx).should.be.rejectedWith('Invalid and/or missing context')


  })

  it('should fail with a string context', () => {

    let ctx = 'invalid'

    return context(ctx).should.be.rejectedWith('Invalid and/or missing context')


  })

  it('should fail with a array context', () => {

    let ctx = []

    return context(ctx).should.be.rejectedWith('Invalid and/or missing context')


  })

  it('should fail with an undefined context', () => {

    let ctx = undefined

    return context(ctx).should.be.rejectedWith('Invalid and/or missing context')

  })

})
