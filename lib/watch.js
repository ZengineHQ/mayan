const chokidar = require('chokidar')
const deploy = require('./deploy')
const kleur = require('kleur')

module.exports = (argv) => {
  let deploying = false
  let waiting = false

  const deploySuccess = ctx => {
    if (waiting) {
      waiting = false

      return deploy(argv).then(deploySuccess)
    } else {
      deploying = waiting = false
    }
  }

  const frontend = chokidar.watch([
    `./plugins/${argv.plugin === '*' ? '**' : argv.plugin}/*`,
    './maya.json'
  ], { ignored: ['./plugins/*/node_modules', './plugins/*/build'] })

  frontend.on('ready', () => console.log(kleur.bold.green('Ready to rock...')))

  frontend.on('change', (path) => {
    if (deploying) {
      waiting = true
    } else {
      deploying = true
      deploy(argv)
        .then(deploySuccess)
        .catch(err => {
          deploying = waiting = false
          console.error(err)
        })
    }
  })
}
