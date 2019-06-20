'use strict';

const Jimp = require('jimp');
const Chalk = require('chalk');
const { GifUtil } = require('gifwrap');
const { GifCodec } = require('./gif-codec');

exports.prepImg = (img) => {

    img.contain(16, 16, null, Jimp.RESIZE_NEAREST_NEIGHBOR);

    return img;
};

exports.toRows = (img) => {

    const { width, height } = img.bitmap;

    const rows = Array(height);

    img.scan(0, 0, width, height, (x, y) => {

        rows[y] = rows[y] || Array(width);
        rows[y][x] = img.getPixelColor(x, y) >>> 8; // Ditch the alpha channel
    });

    return rows;
};

exports.flipRows = (rows) => {

    rows.forEach((row, i) => {

        if ((i % 2) === 0) {
            row.reverse();
        }
    });

    return rows;
};

exports.toHex = (rgb) => rgb.toString(16).padStart(6, 0);

exports.toPixel = (rgb) => Chalk.bgHex(`#${exports.toHex(rgb)}`)('  ');

exports.displayRows = (rows) => {

    let out = '';

    rows.forEach((row) => {

        row.forEach((rgb) => {

            out += exports.toPixel(rgb);
        });

        out += '\n';
    });

    return out;
};

exports.flatten = (arr) => arr.reduce((a, b) => a.concat(b));

exports.rowsToCppArray = (rows) => {

    const { flatten, toHex } = exports;

    return '{ ' + flatten(rows).map((rgb) => `0x${toHex(rgb)}`).join(', ') + ' }';
};

exports.jimpFromFrame = (frame) => {

    const jimpFrame = new Jimp(1, 1, 0);

    jimpFrame.bitmap = frame.bitmap;

    return jimpFrame;
};

exports.jimpToFrameRows = async ({ file, image }) => {

    const { jimpFromFrame, toRows, prepImg } = exports;

    if (image.getMIME() === 'image/gif') {

        const gif = await GifUtil.read(file, new GifCodec());
        const canvas = new Jimp(image.bitmap.width, image.bitmap.height, 0);

        return gif.frames.map((frame) => {

            canvas.blit(jimpFromFrame(frame), frame.xOffset, frame.yOffset);

            return toRows(prepImg(canvas));
        });
    }

    return [toRows(prepImg(image))];
};
