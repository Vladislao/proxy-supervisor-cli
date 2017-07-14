#!/usr/bin/env node
const http = require('http');
const fs = require('fs');
const prog = require('caporal');
const supervisor = require('proxy-supervisor');

const read = (path, logger) =>
  new Promise((res, rej) => {
    fs.readFile(path, 'utf-8', (err, data) => {
      if (err) {
        logger.warn(err.message);
        return rej(err);
      }
      try {
        let lines = data.split(/(?:,|\n)+/).map(x => x.trim()).filter(x => x);
        return res(lines);
      } catch (e) {
        logger.warn(e.message);
        return rej(e);
      }
    })
  });

prog
  .version('1.0.0')
  .command('start', 'start proxy-balancer')
  .alias('listen')
  .argument('[port]', 'port for server', prog.INT, 8080)
  .option('-p, --proxies <proxy>', 'comma separated list of proxies', prog.ARRAY, [])
  .option('-f, --file <file>', 'file with list of proxies', prog.REPEATABLE, [])
  // .option('-s, --strategy <strategy>', 'balancer strategy')
  .option('-w, --watch [watch]', 'watch files for changes TODO', prog.BOOL, false)
  .option('-m, --monitor [monitor]', 'enable monitor for proxies', prog.BOOL, false)
  .action(async (args, options, logger) => {
    // read all provided files for proxies
    const fileProxies = await Promise.all(options.file.map((path) => read(path, logger)));
    // concat single list of proxies
    const proxies = fileProxies.reduce((acc, list) => acc.concat(list), []).concat(options.proxies);

    if (proxies.length === 0) {
      throw new Error('no proxies specified');
    }

    logger.debug("Found " + proxies.length + " proxies");

    // add provided proxies to balancer
    let balancer = supervisor.balancer().add(proxies);
    if (options.monitor) {
      logger.debug("Activating monitor");
      balancer = balancer.subscribe(supervisor.monitor);
    }

    const middleware = balancer.proxy();

    const server = http.createServer((req, res) => {
      logger.debug(req.url);
      return middleware(req, res, (err) => { logger.debug(err); });
    });

    server.listen(args.port, () => {
      logger.info("listening on port " + args.port);
    });

    return 0;
  });

prog.parse(process.argv);