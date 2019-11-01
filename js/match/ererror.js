"use strict";
/**
 *
 * @module jfseb.fdevstart.analyze
 * @file erbase
 * @copyright (c) 2016 Gerd Forstmann
 *
 * Basic domain based entity recognition
 */
Object.defineProperty(exports, "__esModule", { value: true });
const debug = require("debug");
const debuglog = debug('erbase');
const debuglogV = debug('erbase');
const perflog = debug('perf');
const AnyObject = Object;
//import { IFModel as IFModel} from 'fdevsta_monmove';
const IMatch = require("./iferbase");
function makeError_NO_KNOWN_WORD(index, tokens) {
    if (index < 0 || index >= tokens.length) {
        throw Error("invalid index in Error construction " + index + "tokens.lenth=" + tokens.length);
    }
    return {
        err_code: IMatch.ERR_NO_KNOWN_WORD,
        text: `I do not understand "${tokens[index]}".`,
        context: {
            tokens: tokens,
            token: tokens[index],
            index: index
        }
    };
}
exports.makeError_NO_KNOWN_WORD = makeError_NO_KNOWN_WORD;
function makeError_EMPTY_INPUT() {
    return {
        err_code: IMatch.ERR_EMPTY_INPUT,
        text: `I did not get an input.`,
    };
}
exports.makeError_EMPTY_INPUT = makeError_EMPTY_INPUT;
function explainError(errors) {
    if (errors.length) {
        return "\n" + errors.map(err => err.text).join("\n");
    }
    return;
}
exports.explainError = explainError;

//# sourceMappingURL=ererror.js.map

//# sourceMappingURL=ererror.js.map
