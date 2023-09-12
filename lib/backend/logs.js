const { context } = require('../context')
const kleur = require('kleur')
const { format } = require('util')
const request = require('request-promise')
const { spawn } = require('child_process');

module.exports = async argv => {
  // Start by gathering all the data we need to set things up properly
  const ctx = await context(argv).catch(err => err instanceof Error ? err : new Error(err))
  if (ctx instanceof Error) throw ctx
  const accessToken = ctx.accessToken || null

  const plugin = ctx.plugins.find(_ => _.services.find(s => s.configName === argv.service))
  const service = plugin.services.find(_ => _.configName === argv.service)
  const apiEndpoint = ctx.apiEndpoint
  const envPrefix = ctx.env === 'prod' ? 'prod' : 'stage';

  if (!service) {
    console.log(kleur.red(format('\r\nNo matching service %s found check your maya.json', argv.service)))
    return;
  }

  console.log(kleur.green(format('Getting Logs for service %s/%d', service.configName, service.id)))

  const url = format(
    'https://%s/v1/plugins/%d/services/%d',
    apiEndpoint,
    plugin.id,
    service.id
  )

  const options = {
    url: url,
    json: true,
    method: 'GET',
    headers: {
      authorization: 'Bearer ' + accessToken
    }
  }

  const uuid = await request(options).then((d) => {
    return argv.draft ? d.data.draftUuid : d.data.uuid;
  }).catch(e => console.log(kleur.red(`Error: ${e ? e.message : ' unknown'}`)))

  if (!uuid) {
    console.log(kleur.red(format('Could not retrieve Log Group Name check your service name and id matches in your maya.json', argv.service)))
    return;
  }
  const tailArgs = [
    'logs',
    'tail',
    `/aws/lambda/${envPrefix}_plugin_${uuid.replace(/-/g, '_')}`,
    '--follow',
    `--format=${argv.format || 'short'}`,
    `--since=${argv.hours || 10}h`
  ]
  if (argv.profile) {
    tailArgs.push(`--profile=${argv.profile}`)
  }

  const tail = spawn('aws', tailArgs);

  tail.stdout.on('data', (data) => {
    console.log(`${data}`);
  });

  tail.stderr.on('data', (data) => {
    console.log(`${data}`);
  });

  tail.on('close', (code) => {
    console.log(`Tail Log closed ${code}`);
  });
}
