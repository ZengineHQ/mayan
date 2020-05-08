const chokidar = require('chokidar')
const pipe = require('callbag-pipe')
const forEach = require('callbag-for-each')
const combine = require('callbag-combine')
const { debounce } = require('callbag-debounce')

const { fromNodeEvent, printErrorAndAbort } = require('../../util')
const deploy = require('../../deploy')

/**
 * @param {object} service
 * @param {object} argv
 */
exports.runWatcher = (service, argv) => {
  let deploying = false

  const changeHandler = path => {
    if (!deploying && path.some(s => s !== 'initialize')) {
      deploying = true

      return Promise.all([
        service.executable(),
        !argv.skipDeploy && deploy({
          ...argv,
          frontend: false,
          backend: true,
          services: [service.configName]
        })
      ])
        .then(() => {
          deploying = false
        })
        .catch(err => {
          deploying = false
          printErrorAndAbort('backend watcher change handler')(err)
        })
    }
  }

  const watcher = chokidar.watch([`./backend/${service.configName}/**/*`, './maya.json'], {
    ignored: [`./backend/${service.configName}/node_modules`]
  })

  watcher.on('ready', () => {
    pipe(
      combine(
        fromNodeEvent(watcher, 'change'),
        fromNodeEvent(watcher, 'add'),
        fromNodeEvent(watcher, 'unlink')
      ),
      debounce(100),
      forEach(changeHandler)
    )
  })
}
