const Spider = require('./spider');
const DocumentExtractor = require('./document-extractor');
const URLResolver = require('./url-resolver');
const filenamify = require('filenamify');
const program = require('commander');
const chalk = require('chalk');
const path = require('path');
const fs = require('fs-extra');

program.version('0.1.0')
  .usage('[options] <domains>', 'Crawl a list of domains')
  .option('-o --output', 'Specify the output directory')
  .option('-w --wait', 'The duration of waiting time between each chunks')
  .option('-n --number', 'The number of pages will be crawl')
  .option('-q --queue-size', 'The queue size')
  .option('-c --chunk', 'The chunk size');

program.parse(process.argv);

class Lexa extends Spider {
  constructor() {
    super();
    this.waitingTime = program.wait || 100;
    this.maxCounter = program.number || 5000;
    this.maxQueueSize = program.queueSize || 1000;
    this.chunkSize = program.chunkSize || 10;
    this.bootstrapLinks = program.args;
    this.directory = program.output || './output';
  }

  crawlerOnInit() {
    fs.ensureDir(this.directory);
  }

  resolveFileName(link) {
    const encoded = link.split(/\//gi)
      .slice(2)
      .map(part => filenamify(part))
      .join('/');

    return path.resolve(
      this.directory,
      `${encoded}.json`
    );
  }

  render($, page, link) {
    console.log(
      chalk.default.bgGreen.dim.bold(' RENDERING '),
      link
    );

    const document = DocumentExtractor.extractDocument($);

    /**
     * Maximum 5000 link.
     * */

    if (this.counter >= this.maxCounter) {
      this.stop = true;
    }

    /**
     * Encode filename so that it's suitable for filesystem.
     * */

    const filename = this.resolveFileName(link);

    fs.pathExists(filename)
      .then(exists => {
        if (exists) {
          fs.outputJSON(
            filename,
            document,
            {},
            (err) => this.handleError(err)
          );
        } else {
          return Promise.resolve();
        }
      })
      .catch(err => this.handleError(err));
  }

  crawlerOnFinish() {
    console.log(
      chalk.default.bgCyan.dim.bold(' FINISHED! ')
    );
  }

  handleError(err) {
    if (err) {
      console.log(
        chalk.default.bgRed.dim.bold(' ERROR '),
        err
      );
    }
  }

  resolveURL(relative, base) {
    return URLResolver.resolveURL(relative, base);
  }

  filterHrefs(relatives) {
    return URLResolver.filterHrefs(relatives);
  }
}

module.exports = Lexa;