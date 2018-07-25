const feCanonical = require('./lib/frontend/canonical');

const argv = require('yargs')
    .usage('$0 <cmd> [args]')
    .command('init <plugin>', 'create a new plugin', yargs => {
        return yargs.positional('plugin', {
            type: 'string',
        });
    })
    .command('build [plugin]', 'build the API', yargs => {
        return yargs
            .option('frontend', { default: true, description: 'Deploy the frontend', boolean: true })
            .option('backend', { default: true, description: 'Deploy the backend', boolean: true })
            .option('env', { requiresArg: true, description: 'Then environment to deploy to' })
            .positional('plugin', {
                type: 'string',
                description: 'The name of the plugin to build',
            });
    }, async argv => {
        console.log("we're building", argv);
        if (argv.frontend) {
            feCanonical.build(process.cwd(), argv.plugin);
        }
        
    })
    .command('deploy [plugin]', 'deploy the API', yargs => {
        return yargs
            .option('frontend', { default: true, description: 'Deploy the frontend', boolean: true })
            .option('backend', { default: true, description: 'Deploy the backend', boolean: true })
            .option('env', { requiresArg: true, description: 'Then environment to deploy to' })
            .positional('plugin', {
                type: 'string',
                description: 'The name of the plugin to deploy',
            });
    }, argv => {
        console.log("we're deploying", argv);
    })
    .command('publish [plugin]', 'publish the API', yargs => {
        return yargs
            .option('frontend', { default: true, description: 'Deploy the frontend', boolean: true })
            .option('backend', { default: true, description: 'Deploy the backend', boolean: true })
            .option('env', { requiresArg: true, description: 'Then environment to deploy to' })
            .option('y', { default: false, describe: 'Do not require confirmation', boolean: true })
            .positional('plugin', {
                type: 'string',
                description: 'The name of the plugin to publish',
            });
    }, argv => {
        console.log("we're publishing", argv);
    })
    .help()
    .argv;
