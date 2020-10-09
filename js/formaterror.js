"use strict";
/**
 * @file formaterror.ts
 *
 * Formats (some) parser errors into a human understandable text
 *
 * (c) gerd forstmann 2017-2019
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.formatError = exports.extractExpectArr = exports.mapTokenStringToHumanString = exports.getExpecting = exports.getQualifierFromWordType = exports.getTokenQualifier = exports.getSentenceToken = exports.getTokenText = void 0;
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZm9ybWF0ZXJyb3IuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi9zcmMvZm9ybWF0ZXJyb3IudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IjtBQUFBOzs7Ozs7R0FNRzs7O0FBRUgsZ0NBQWdDO0FBQ2hDLE1BQU0sUUFBUSxHQUFHLEtBQUssQ0FBQyxhQUFhLENBQUMsQ0FBQztBQUV0Qyw2Q0FBaUQ7QUFHakQsU0FBZ0IsWUFBWSxDQUFDLEtBQVcsRUFBRSxRQUE2QjtJQUNuRSxPQUFPLGdCQUFnQixDQUFDLEtBQUssRUFBQyxRQUFRLENBQUMsQ0FBQyxNQUFNLENBQUM7QUFDbkQsQ0FBQztBQUZELG9DQUVDO0FBRUQsU0FBZ0IsZ0JBQWdCLENBQUMsS0FBVyxFQUFFLFFBQTZCO0lBQ3ZFLElBQUcsTUFBTSxDQUFDLEtBQUssQ0FBQyxLQUFLLENBQUMsV0FBVyxDQUFDLElBQUksS0FBSyxDQUFDLFdBQVcsSUFBSSxRQUFRLENBQUMsTUFBTSxFQUFFO1FBQ3hFLE1BQU0sS0FBSyxDQUFDLHlCQUF5QixHQUFHLEtBQUssQ0FBQyxXQUFXLEdBQUcsS0FBSyxHQUFHLFFBQVEsQ0FBQyxNQUFNLENBQUMsQ0FBQztLQUN4RjtJQUNELE9BQU8sUUFBUSxDQUFDLEtBQUssQ0FBQyxXQUFXLENBQUMsQ0FBQztBQUN2QyxDQUFDO0FBTEQsNENBS0M7QUFHRCxTQUFnQixpQkFBaUIsQ0FBQyxLQUFXLEVBQUUsUUFBNkI7SUFDeEUsT0FBTyx3QkFBd0IsQ0FBQyxnQkFBZ0IsQ0FBQyxLQUFLLEVBQUMsUUFBUSxDQUFDLENBQUMsSUFBSSxDQUFDLFFBQVEsQ0FBRSxDQUFDO0FBQ3JGLENBQUM7QUFGRCw4Q0FFQztBQUVELFNBQWdCLHdCQUF3QixDQUFDLFFBQWlCO0lBQ3RELFFBQU8sUUFBUSxFQUFFO1FBQ2IsS0FBSyxxQkFBTyxDQUFDLFFBQVEsQ0FBQyxJQUFJO1lBQ3RCLE9BQU8sVUFBVSxDQUFDO1FBQ3RCLEtBQUsscUJBQU8sQ0FBQyxRQUFRLENBQUMs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