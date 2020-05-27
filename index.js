#!/usr/bin/env node

// Usage: proxigen -c /path/to/rc
const minimist = require("minimist");
const args = minimist(process.argv.splice(2), {
  alias: {
    c: "config",
  },
  string: ["config"],
});

const { readFileSync, realpathSync } = require("fs");
const { parse } = require("yaml");
const { homedir } = require("os");

const configPath = args.config || `${homedir()}/.proxigenrc`;
const config = parse(readFileSync(configPath, "utf8"));

const proxy = require("redbird")({
  ...(config.server || {}),
  bunyan: false,
});

const levelColors = {
  trace: "gray",
  debug: "gray",
  info: "green",
  warn: "yellow",
  error: "red",
  fatal: "redBright",
};

const chalk = require("chalk");

proxy.log = new Proxy(
  {
    log(level, ...rawArgs) {
      const levelColor = levelColors[level] || "white";
      let containerObjects = false;
      const args = rawArgs.map((arg) => {
        if (typeof arg === "object") {
          containerObjects = true;
          if (arg.from && arg.to) {
            return `${arg.from.href} => ${arg.to.href}`;
          }
        }
        return arg;
      });
      if (containerObjects) {
        console.log(
          new Date().toISOString(),
          chalk[levelColor](level),
          ...args
        );
      } else {
        const [fmt, ...others] = args;
        console.log(
          new Date().toISOString(),
          chalk[levelColor](level),
          require("util").format(
            fmt,
            ...others.map((v) => chalk[levelColor](v))
          )
        );
      }
    },
  },
  {
    get: (self, key) => {
      if (console[key]) {
        return (...args) => self.log(key, ...args);
      }
    },
  }
);

const port = parseInt(config.server.port) || 8080;
const sslPort = config.server.ssl
  ? parseInt(config.server.ssl.port || 443)
  : undefined;
console.log(
  `Proxigen started at ${chalk.green(`HTTP:${port}`)}${
    sslPort && ` and ${chalk.green(`HTTPS:${sslPort}`)}`
  }...`
);

(config.mappings || []).map(({ from, to, options }) => {
  const urls = [`http://${from}${port !== 80 && `:${port}`}`];
  if (config.server.ssl) {
    urls.push(
      `https://${from}${sslPort && sslPort !== 443 ? `:${sslPort}` : ""}`
    );
  }
  proxy.register(from, to, options || {});
});
