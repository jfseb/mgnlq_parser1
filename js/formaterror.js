"use strict";
/**
 * @file formaterror.ts
 *
 * Formats (some) parser errors into a human understandable text
 *
 * (c) gerd forstmann 2017-2019
 */
Object.defineProperty(exports, "__esModule", { value: true });
const debug = require("debugf");
const debuglog = debug('formaterror');
const mgnlq_model_1 = require("mgnlq_model");
function getTokenText(token, sentence) {
    return getSentenceToken(token, sentence).string;
}
exports.getTokenText = getTokenText;
function getSentenceToken(token, sentence) {
    if (Number.isNaN(token.startOffset) || token.startOffset >= sentence.length) {
        throw Error('access outside of index' + token.startOffset + " / " + sentence.length);
    }
    return sentence[token.startOffset];
}
exports.getSentenceToken = getSentenceToken;
function getTokenQualifier(token, sentence) {
    return getQualifierFromWordType(getSentenceToken(token, sentence).rule.wordType);
}
exports.getTokenQualifier = getTokenQualifier;
function getQualifierFromWordType(wordType) {
    switch (wordType) {
        case mgnlq_model_1.IFModel.WORDTYPE.FACT:
            return "the fact";
        case mgnlq_model_1.IFModel.WORDTYPE.CATEGORY:
            return "the category";
        case mgnlq_model_1.IFModel.WORDTYPE.DOMAIN:
            return "the domain";
        case mgnlq_model_1.IFModel.WORDTYPE.OPERATOR:
            return "the operator";
    }
    return "";
}
exports.getQualifierFromWordType = getQualifierFromWordType;
function getExpecting(message) {
    //    return "A"
    //Error: NoViableAltException: Expecting: one of these possible Token sequences:
    //  1. [FACT]
    //  2. [AnANY]
    // todo extract and format alternatives...
    var arr = extractExpectArr(message).map(r => mapTokenStringToHumanString(r)).filter(r => !!r);
    var res = arr.join(" or a ");
    if (res.length) {
        return "a " + res;
    }
    return undefined; // 'a fact or a string fragment';
}
exports.getExpecting = getExpecting;
function mapTokenStringToHumanString(tokenstring) {
    switch (tokenstring) {
        case "FACT":
            return "fact";
        case "AnANY":
            return "string fragment";
        case 'TInteger':
        case 'Integer':
        case '12':
        case 'NUMBER':
            return 'number';
    }
    return undefined;
}
exports.mapTokenStringToHumanString = mapTokenStringToHumanString;
function extractExpectArr(message) {
    debuglog(message);
    var r = /\d+\. \[([^\]]+)\]/g;
    var results = [];
    var match = r.exec(message);
    while (match != null) {
        //console.log(' here ' + JSON.stringify(match));
        //console.log(' here  0 ' + match[0]);
        //console.log(' here  1 ' + match[1]);
        //console.log(' here  2 ' + match[2]);
        results.push(match[1]);
        match = r.exec(message);
    }
    return results;
}
exports.extractExpectArr = extractExpectArr;
function formatError(error, sentence) {
    debuglog(() => 'error : ' + JSON.stringify(error));
    if ((error.name === "NotAllInputParsedException") && error.token && (error.token.startOffset !== null)) {
        var tok = getTokenText(error.token, sentence);
        var qualifier = getTokenQualifier(error.token, sentence);
        return { text: `I do not understand ${qualifier} "${tok}" at this position in the sentence.`,
            error: error };
    }
    if ((error.name === "NoViableAltException") && error.token && (Number.isNaN(error.token.startOffset))) {
        var expect = getExpecting(error.message);
        return { text: `Sentence terminated unexpectedly, i expected ${expect}.`,
            error: error };
    }
    //(error.name === "NoViableAltException")
    return { error: error,
        text: JSON.stringify(error)
    };
}
exports.formatError = formatError;

//# sourceMappingURL=formaterror.js.map

//# sourceMappingURL=formaterror.js.map
