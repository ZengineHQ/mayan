const chokidar = require('chokidar')
const pipe = require('callbag-pipe')
const forEach = require('callbag-for-each')
const combine = require('callbag-combine')
const { debounce } = require('callbag-debounce')

const { fromNodeEvent, printError } = require('../../util')
const deploy = require('../../deploy')

/**
 * @param {object} service
 * @param {object} argv
 */
exports.runWatcher = (service, argv) => {
  let deploying = false
  let waiting = false

  const promise = () => Promise.all([
    service.executable(),
    !argv.skipDeploy && deploy({ ...argv, frontend: false, backend: true, services: [service.configName] })
  ])

  const afterSuccess = ctx => {
    if (waiting) {
      waiting = false

      return promise().then(afterSuccess)
    } else {
      deploying = waiting = false
    }
  }

  const changeHandler = path => {
    if (deploying) {
      waiting = true
    } else if (path.some(s => s !== 'initialize')) {
      deploying = true

      return promise()
        .then(afterSuccess)
        .catch(err => {
          deploying = waiting = false
          printError('backend watcher change handler')(err)
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
