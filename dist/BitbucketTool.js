"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.BitbucketTool = void 0;

var _minimist = _interopRequireDefault(require("minimist"));

var _version = require("./version");

var _autobindDecorator = _interopRequireDefault(require("autobind-decorator"));

var _fs = require("fs");

var _child_process = _interopRequireDefault(require("child_process"));

var _commandExists = _interopRequireDefault(require("command-exists"));

var _stream = _interopRequireDefault(require("stream"));

var _util = require("util");

var _opn = _interopRequireDefault(require("opn"));

var _class;

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function streamToString(readable) {
  if (!(readable instanceof _stream.default.Readable)) {
    return readable.toString();
  }

  return new Promise((resolve, reject) => {
    let string = "";
    readable.on("readable", buffer => {
      string += buffer.read().toString();
    });
    readable.on("end", () => {
      resolve(string);
    });
    readable.on("error", error => {
      reject(error);
    });
    readable.pipe(writeable);
  });
}

const execAsync = (0, _util.promisify)(_child_process.default.exec);

let BitbucketTool = (0, _autobindDecorator.default)(_class = class BitbucketTool {
  constructor(toolName, log) {
    this.toolName = toolName;
    this.log = log;
  }

  async ensureCommands(cmds) {
    this.cmds = this.cmds || new Set();
    const newCmds = cmds.filter(cmd => !this.cmds.has(cmd));
    const exists = await Promise.all(newCmds.map(cmd => (0, _commandExists.default)(cmd)));
    newCmds.forEach(cmd => {
      if (!!exists[cmd]) {
        throw new Error(`Command '${cmd}' does not exist.  Please install it.`);
      } else {
        this.cmds.add(cmd);
      }
    });
  }

  async browse() {
    await this.ensureCommands(["git"]);
    const result = await execAsync("git remote -vv");
    const output = await streamToString(result.stdout);
    const re = new RegExp("^(?<remote>[a-zA-Z0-9-]+)\\s+git@(?<site>bitbucket\\.org|github\\.com):(?<user>[a-zA-Z0-9-]+)/(?<slug>[a-zA-Z0-9-]+).git\\s+\\(fetch\\)$", "gm");
    let arr = null;

    while ((arr = re.exec(output)) !== null) {
      if (this.args.upstream && arr.groups.remote.match(/upstream|official|parent/) || !this.args.upstream && arr.groups.remote === "origin") {
        const url = `https://${arr.groups.site}/${arr.groups.user}/${arr.groups.slug}`;
        this.log.info(`Opening ${url}...`);
        (0, _opn.default)(url, {
          wait: false
        });
        return;
      }
    }

    this.log.warning("No appropriate git remote was found");
  }

  async pullRequest() {
    // TODO: Implement pull request creation
    this.log.warning("Not yet implemented");
  }

  async run(argv) {
    const options = {
      string: ["remote"],
      boolean: ["help", "version", "debug", "upstream"],
      alias: {
        u: "upstream"
      },
      default: {
        remote: "origin"
      }
    };
    this.args = (0, _minimist.default)(argv, options);

    if (this.args.version) {
      this.log.info(`v${_version.fullVersion}`);
      return 0;
    }

    let command = this.args._[0];
    command = command ? command.toLowerCase() : "help";
    const subCommand = this.args._[1];

    switch (command) {
      case "pull-request":
      case "prq":
        // TODO: Make configurable
        if (this.args.help && !subCommand) {
          this.log.info(`Usage: ${this.toolName} pull-request <options>

Description:

Create, modify, list or remove pull requests.
`);
          return 0;
        }

        await this.pullRequest();
        break;

      case "browse":
      case "brw":
        // TODO: Make configurable
        if (this.args.help && !subCommand) {
          this.log.info(`Usage: ${this.toolName} browse <options>

Description:

Browse to the current repository in your browser.

Options:

  --upstream, -u      Use the remote named 'upstream', 'parent' or 'official' to
                      open the upstream repository for a fork.
`);
          return 0;
        }

        await this.browse();
        break;

      case "help":
      default:
        this.log.info(`
Bitbucket Tool

Usage: ${this.toolName} <command> ...

Provides command line Bitbucket integration.

Commands:
  browse            Browse to the current or parent repository
  pull-request      Create, modify, list or remove pull requests

Global Options:
  --help      Displays this help
  --version   Displays tool version
  --debug     Show debug output
`);
        return 0;
    }

    return 0;
  }

}) || _class;

exports.BitbucketTool = BitbucketTool;
//# sourceMappingURL=BitbucketTool.js.map