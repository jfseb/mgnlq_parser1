"use strict";
/**
 * @file charsequence
 * @module jfseb.mnglq_er.charsequence
 * @copyright (c) Gerd Forstmann
 *
 * Char sequence specific comparisons
 *
 * Very simple comparisons based on plain strings
 *
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.CharSequence = void 0;
// <reference path="../../lib/node-4.d.ts" />
// import * as debug from 'debug';
// import * as utils from '../utils/utils';
const Algol = require("./algol");
//import * as IMatch from './iferbase';
// <reference path="../../lib/node-4.d.ts" />
const distance = require("abot_stringdist");
exports.CharSequence = {
    isSameOrPlural: function (a, b) {
        if (Math.abs(a.length - b.length) > 1)
            return false;
        if (a == b)
            return true;
        if (a.length > b.length)
            return exports.CharSequence.isSameOrPlural(b, a);
        if (b.length > 3 && b.substr(0, b.length - 1) == a) {
            return true;
        }
        return false;
    },
    isVeryClose: function (a, b) {
        return distance.calcDistance(a, b) > Algol.Cutoff_rangeCloseMatch;
    },
    isSameOrPluralOrVeryClose: function (a, b) {
        var al = a.toLowerCase();
        var bl = b.toLowerCase();
        return exports.CharSequence.isSameOrPlural(al, bl)
            || exports.CharSequence.isVeryClose(al, bl);
    }
};

//# sourceMappingURL=charsequence.js.map

//# sourceMappingURL=charsequence.js.map
