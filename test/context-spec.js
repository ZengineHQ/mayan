'use strict'

const { createNewContext } = require('../lib/context')
const mayaJSON = require('./integration/test-plugin/maya.context-test.json')
const mayaJSONNoDefaults = require('./integration/test-plugin/maya.context-test-no-defaults.json')

describe('context', () => {
  it('should fail with an empty argv object', () => {
    const argv = {}

    return createNewContext(argv, mayaJSON).should.be.rejectedWith('Invalid and/or missing argv')
  })

  it('should fail with a number argv', () => {
    const argv = 0

    return createNewContext(argv, mayaJSON).should.be.rejectedWith('Invalid and/or missing argv')
  })

  it('should fail with a string argv', () => {
    const argv = 'invalid'

    return createNewContext(argv, mayaJSON).should.be.rejectedWith('Invalid and/or missing argv')
  })

  it('should fail with a array argv', () => {
    const argv = []

    return createNewContext(argv, mayaJSON).should.be.rejectedWith('Invalid and/or missing argv')
  })

  it('should fail with an undefined argv', () => {
    return createNewContext(undefined, mayaJSON).should.be.rejectedWith('Invalid and/or missing argv')
  })

  it('should fail when no defaults are identified in maya.json or specified in command (`mayan watch/build/deploy/publish`)', async () => {
    const argv = {
      _: [ 'watch' ],
      frontend: false,
      f: false,
      backend: false,
      b: false,
      'skip-build': false,
      sb: false,
      skipBuild: false,
      'skip-minify': false,
      sm: false,
      skipMinify: false,
      cache: true,
      c: true,
      proxy: false,
      p: false,
      'skip-deploy': false,
      sd: false,
      skipDeploy: false,
      plugin: 'invalid-name',
      services: [ '*' ],
      s: [ '*' ],
      '$0': 'mayan',
      config: './maya.json'
    }

    return createNewContext(argv, mayaJSONNoDefaults).should.be.rejectedWith('Unknown environment, please update your maya.json with a default or pass a specific environment key using the --env argument.')
  })

  it('should fail with an invalid environment name (`mayan watch/build/deploy/publish -e invalid-env`)', async () => {
    const argv = {
      _: [ 'watch' ],
      frontend: false,
      f: false,
      backend: false,
      b: false,
      'skip-build': false,
      sb: false,
      skipBuild: false,
      'skip-minify': false,
      sm: false,
      skipMinify: false,
      cache: true,
      c: true,
      env: 'invalid-env',
      e: 'invalid-env',
      proxy: false,
      p: false,
      'skip-deploy': false,
      sd: false,
      skipDeploy: false,
      plugin: 'invalid-name',
      services: [ '*' ],
      s: [ '*' ],
      '$0': 'mayan',
      config: './maya.json'
    }

    return createNewContext(argv, mayaJSON).should.be.rejectedWith('Invalid environment name "invalid-env".')
  })

  it('should fail with an invalid plugin name (`mayan watch/build/deploy/publish invalid-name`)', async () => {
    const argv = {
      _: [ 'watch' ],
      frontend: false,
      f: false,
      backend: false,
      b: false,
      'skip-build': false,
      sb: false,
      skipBuild: false,
      'skip-minify': false,
      sm: false,
      skipMinify: false,
      cache: true,
      c: true,
      proxy: false,
      p: false,
      'skip-deploy': false,
      sd: false,
      skipDeploy: false,
      plugin: 'invalid-name',
      services: [ '*' ],
      s: [ '*' ],
      '$0': 'mayan',
      config: './maya.json'
    }

    return createNewContext(argv, mayaJSON).should.be.rejectedWith('Plugin "invalid-name" not found in configuration for environment "dev".')
  })

  it('should process argv for `mayan watch/build/deploy/publish` using all defaults successfully', async () => {
    const argv = {
      _: [ 'watch' ],
      frontend: false,
      f: false,
      backend: false,
      b: false,
      'skip-build': false,
      sb: false,
      skipBuild: false,
      'skip-minify': false,
      sm: false,
      skipMinify: false,
      cache: true,
      c: true,
      proxy: false,
      p: false,
      'skip-deploy': false,
      sd: false,
      skipDeploy: false,
      plugin: '*',
      services: [ '*' ],
      s: [ '*' ],
      '$0': 'mayan',
      config: './maya.json'
    }

    const ctx = await createNewContext(argv, mayaJSON)

    expect(ctx).to.deep.equal({
      ...argv,
      env: 'dev',
      accessToken: 'dev token',
      apiEndpoint: 'api.zenginehq.com',
      plugins: [
        {
          configName: 'test',
          id: 1,
          namespace: 'mayanTestDeployDev',
          route: '/mayan-test-deploy-main-dev',
          services: [
            {
              configName: 'test',
              id: 1
            }
          ]
        },
        {
          configName: 'other-test',
          id: 2,
          namespace: 'mayan-other-test-deploy-dev',
          services: [
            {
              configName: 'test',
              id: 2
            },
            {
              configName: 'other-test',
              id: 3
            }
          ]
        }
      ]
    })
  })

  it('should process argv for `mayan watch/build/deploy/publish test -e stage` successfully', async () => {
    const argv = {
      _: [ 'w' ],
      frontend: false,
      f: false,
      backend: false,
      b: true,
      'skip-build': false,
      sb: false,
      skipBuild: false,
      'skip-minify': false,
      sm: false,
      skipMinify: false,
      cache: true,
      c: true,
      proxy: false,
      p: false,
      'skip-deploy': false,
      sd: false,
      skipDeploy: false,
      e: 'stage',
      env: 'stage',
      plugin: 'test',
      services: [ '*' ],
      s: [ '*' ],
      '$0': 'mayan',
      config: './maya.json'
    }

    const ctx = await createNewContext(argv, mayaJSON)

    expect(ctx).to.deep.equal({
      ...argv,
      accessToken: '{{API_TOKEN}}',
      apiEndpoint: 'stage-api.zenginehq.com',
      plugins: [
        {
          configName: 'test',
          id: 434,
          namespace: 'mayanTestDeploy',
          route: '/mayan-test-deploy-main-stage',
          services: [
            {
              configName: 'test',
              id: 227
            }
          ]
        }
      ]
    })
  })

  it('should process argv for `mayan watch/build/deploy/publish -e prod` successfully', async () => {
    const argv = {
      _: [ 'watch' ],
      frontend: false,
      f: false,
      backend: false,
      b: false,
      'skip-build': false,
      sb: false,
      skipBuild: false,
      'skip-minify': false,
      sm: false,
      skipMinify: false,
      cache: true,
      c: true,
      proxy: false,
      p: false,
      'skip-deploy': false,
      sd: false,
      skipDeploy: false,
      e: 'prod',
      env: 'prod',
      plugin: '*',
      services: [ '*' ],
      s: [ '*' ],
      '$0': 'mayan'
    }

    const ctx = await createNewContext(argv, mayaJSON)

    expect(ctx).to.deep.equal({
      ...argv,
      env: 'prod',
      accessToken: 'prod token',
      apiEndpoint: 'api.zenginehq.com',
      plugins: [
        {
          configName: 'test',
          id: 3,
          namespace: 'mayanTestDeploy',
          route: '/mayan-test-deploy-main',
          services: [
            {
              configName: 'test',
              id: 3
            }
          ]
        },
        {
          configName: 'other-test',
          id: 4,
          namespace: 'mayan-other-test-deploy',
          services: [
            {
              configName: 'test',
              id: 4
            },
            {
              configName: 'other-test',
              id: 5
            }
          ]
        }
      ]
    })
  })
})
