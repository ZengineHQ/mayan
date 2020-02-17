const { spawn } = require('child_process')
const treeKill = require('tree-kill')
const { cyan, red } = require('kleur')

exports.createScriptExecutable = (script) => {
  let instance = null

  return async function execute (killOnly) {
    if (instance) {
      const dead = await kill(instance, 'SIGKILL').catch(console.error)

      if (killOnly) return dead
    }

    instance = spawn(script, [], { shell: true })

    instance.stdout.on('data', event => {
      console.log(cyan(event.toString()))
    })

    instance.stderr.on('data', error => {
      console.log(red(error.toString()))
    })

    return 'served up!'
  }
}

/**
 * Kill a process
 * @param {ChildProcess} process ChildProcess object
 * @param {string} signal ex: 'SIGINT', 'SIGKILL'
 *
 * @returns {Promise<void>}
 */
function kill (process, signal) {
  return new Promise((resolve, reject) => treeKill(process.pid, signal, error => error ? reject(error) : resolve('dead')))
}
