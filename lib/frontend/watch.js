const chokidar = require('chokidar')
const kleur = require('kleur')

const pipe = require('callbag-pipe')
const forEach = require('callbag-for-each')
const combine = require('callbag-combine')
const { debounce } = require('callbag-debounce')
const { fromNodeEvent } = require('../util')

const deploy = require('../deploy')

module.exports = argv => new Promise((resolve, reject) => {
  let deploying = false
  let waiting = false

  const deploySuccess = ctx => {
    if (waiting) {
      waiting = false

      return deploy({ ...argv, frontend: true, backend: false }).then(deploySuccess)
    } else {
      deploying = waiting = false
    }
  }

  const changeHandler = path => {
    if (deploying) {
      waiting = true
    } else if (path.some(s => s !== 'initialize')) {
      deploying = true

      return deploy({ ...argv, frontend: true, backend: false })
        .then(deploySuccess)
        .catch(err => {
          deploying = waiting = false
          console.error(err)
        })
    }
  }

  const frontend = chokidar.watch([
    `./plugins/${argv.plugin === '*' ? '**' : argv.plugin + '/**'}/*`,
    './maya.json'
  ], { ignored: ['./plugins/*/node_modules', './plugins/*/build'] })

  frontend.on('ready', () => {
    pipe(
      combine(
        fromNodeEvent(frontend, 'change'),
        fromNodeEvent(frontend, 'add'),
        fromNodeEvent(frontend, 'unlink')
      ),
      debounce(50),
      forEach(changeHandler)
    )

    if (argv.backend || (!argv.frontend && !argv.backend)) {
      process.on('SIGINT', () => {
        process.emit('cleanup', 0)
      })
    }

    console.log(kleur.bold.green('Ready to rock...'))
    resolve()
  })

  frontend.on('error', error => reject(error))
})
