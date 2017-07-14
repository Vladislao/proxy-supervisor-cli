# proxy-supervisor-cli
Run [proxy-supervisor](https://github.com/vladislao/proxy-supervisor) from command line

## Installation

```bash
$ npm install proxy-supervisor-cli -g
```

## How to play

    $ proxy-supervisor-cli start [port]

#### ARGUMENTS

    [port]      port for server      optional      default: 8080

#### OPTIONS

    -p, --proxies <proxy>        comma separated list of proxies      optional      default: []
    -f, --file <file>            file with list of proxies            optional      default: []
    -w, --watch [watch]          watch files for changes              optional      default: false
    -m, --monitor [monitor]      enable monitor for proxies           optional      default: false

#### GLOBAL OPTIONS

    -h, --help         Display help
    -V, --version      Display version
    --no-color         Disable colors
    --quiet            Quiet mode - only displays warn and error messages
    -v, --verbose      Verbose mode - will also output debug messages

## License

  [MIT](LICENSE)
