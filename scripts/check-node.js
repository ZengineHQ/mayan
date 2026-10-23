const required = require('../package.json').engines.node
const requiredMajor = Number(required.replace(/[^0-9.]/g, '').split('.')[0])
const currentMajor = Number(process.versions.node.split('.')[0])

if (currentMajor < requiredMajor) {
  console.error(`\nmayan requires Node.js ${required} but you are installing with ${process.version}.`)
  console.error('Upgrade Node.js (e.g. "nvm install 24 && nvm use 24") and run the install again. If you are working with a version below 24 use a previous version of mayan.\n')
  process.exit(1)
}
