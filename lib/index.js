'use strict';

const Jimp = require('jimp');
const Bossy = require('bossy');
const Chalk = require('chalk');
const Helpers = require('./helpers');
const DisplayError = require('./display-error');
const Package = require('../package');

const internals = {};

exports.cli = async (options) => {

    const args = Bossy.parse(internals.definition, {
        argv: options.argv
    });

    const output = (str) => options.out.write(`${str}\n`);

    if (args instanceof Error) {
        throw new DisplayError(`${internals.usage()}\n\n` + Chalk.red(args.message));
    }

    if (args.help) {
        return output(`${internals.usage()}\n`);
    }

    if (args.version) {
        return output(Package.version);
    }

    const [,,file] = args._;

    if (!file) {
        if (args.display) {
            throw new DisplayError(`${internals.usage()}\n\n` + Chalk.red('Missing <file> parameter'));
        }
        else {
            return output(`${internals.usage()}\n`);
        }
    }

    const image = await Jimp.read(file);
    const frameRows = await Helpers.jimpToFrameRows({ file, image });

    if (args.display) {
        return frameRows.forEach((rows) => output(Helpers.displayRows(rows)));
    }

    return output('{ ' + frameRows.map(Helpers.flipRows).map(Helpers.rowsToCppArray) + ' }');
};

internals.usage = () => Bossy.usage(internals.definition, internals.usageText());

internals.usageText = () => 'lytebytes <options> <file>\n';

internals.definition = {
    help: {
        type: 'boolean',
        alias: 'h',
        description: 'show usage options',
        default: null
    },
    version: {
        type: 'boolean',
        alias: 'v',
        description: 'show version information',
        default: null
    },
    display: {
        type: 'boolean',
        alias: 'd',
        description: 'display the image output',
        default: null
    }
};
