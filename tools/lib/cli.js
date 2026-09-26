import { parseArgs } from 'node:util';

/**
 * Runs a tool's main with its parsed options, printing any failure as a
 * plain message and a non-zero exit code rather than a stack trace.
 * `io` is { log, error, setExitCode }.
 */
export async function runCli(main, argv, options, io) {
  try {
    const { values, positionals } = parseArgs({ args: argv, options, allowPositionals: true });
    await main(values, positionals);
  } catch (e) {
    io.error(e.message);
    io.setExitCode(1);
  }
}

/** The console and process, as the tools use them. */
export const processIo = Object.freeze({
  log: (...args) => console.log(...args),
  error: (...args) => console.error(...args),
  setExitCode: (code) => {
    process.exitCode = code;
  },
});
