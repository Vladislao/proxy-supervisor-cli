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
  .option('-w, --watch [watch]', 'watch files for changes', prog.BOOL, false)
  .option('-m, --monitor [monitor]', 'enable monitor for proxies', prog.BOOL, false)
  .action(async (args, options, logger) => {

    // read all provided files for proxies
    options.file = Array.isArray(options.file) ? options.file : [options.file];
    const fileProxies = await Promise.all(options.file.map((path) => read(path, logger)));

    // concat single list of proxies
    const proxies = fileProxies.reduce((acc, list) => acc.concat(list), []).concat(options.proxies);
    logger.debug("Proxies specified: " + proxies.length);

    // add provided proxies to balancer
    let balancer = supervisor.balancer().add(proxies);
    if (balancer.proxies.size === 0) {
      if (proxies.length > 0) {
        throw new Error('check proxies format, none of them are valid');
      } else {
        throw new Error('you should specify proxies with -p or -f');
      }
    }

    logger.debug("Unique and valid proxies: " + balancer.proxies.size);
    // activate monitor
    if (options.monitor) {
      logger.debug("Activating monitor");
      balancer = balancer.subscribe(supervisor.monitor);
    }

    // activate watchers
    if (options.watch) {
      logger.debug("Activating watchers");
      options.file.forEach((path) => {
        fs.watch(path, 'utf-8', (e) => {
          if(e !== 'change') return;
          read(path, logger).then(res => {
            logger.debug("Refreshing " + path);
            balancer.add(res);
          });
        });
      });
    }


    // initialize server
    const middleware = balancer.proxy();
    const server = http.createServer((req, res) => {
      logger.debug(req.url);
      return middleware(req, res, (err) => { logger.debug(err); });
    });

    server.listen(args.port, () => {
      logger.info("Listening on port " + args.port);
    });

    return 0;
  });

prog.parse(process.argv);