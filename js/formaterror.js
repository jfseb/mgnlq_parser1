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

//# sourceMappingURL=data:application/json;charset=utf8;base64,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QUksQ0FBQyxNQUFNLENBQUMsS0FBSyxDQUFDLEtBQUssQ0FBQyxLQUFLLENBQUMsV0FBVyxDQUFDLENBQUMsRUFBRztRQUNwRyxJQUFJLE1BQU0sR0FBRyxZQUFZLENBQUMsS0FBSyxDQUFDLE9BQU8sQ0FBQyxDQUFDO1FBQ3pDLE9BQU8sRUFBRSxJQUFJLEVBQ0wsZ0RBQWdELE1BQU0sR0FBRztZQUN6RCxLQUFLLEVBQUcsS0FBSyxFQUFFLENBQUM7S0FDM0I7SUFDRCx5Q0FBeUM7SUFDekMsT0FBTyxFQUFFLEtBQUssRUFBRyxLQUFLO1FBQ2xCLElBQUksRUFBRyxJQUFJLENBQUMsU0FBUyxDQUFDLEtBQUssQ0FBQztLQUMvQixDQUFBO0FBQ0wsQ0FBQztBQW5CRCxrQ0FtQkMiLCJmaWxlIjoiZm9ybWF0ZXJyb3IuanMiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcclxuICogQGZpbGUgZm9ybWF0ZXJyb3IudHNcclxuICpcclxuICogRm9ybWF0cyAoc29tZSkgcGFyc2VyIGVycm9ycyBpbnRvIGEgaHVtYW4gdW5kZXJzdGFuZGFibGUgdGV4dFxyXG4gKlxyXG4gKiAoYykgZ2VyZCBmb3JzdG1hbm4gMjAxNy0yMDE5XHJcbiAqL1xyXG5cclxuaW1wb3J0ICogYXMgZGVidWcgZnJvbSAnZGVidWdmJztcclxuY29uc3QgZGVidWdsb2cgPSBkZWJ1ZygnZm9ybWF0ZXJyb3InKTtcclxuXHJcbmltcG9ydCB7IElGTW9kZWwgYXMgSUZNb2RlbCB9IGZyb20gJ21nbmxxX21vZGVsJztcclxuaW1wb3J0IHsgU2VudGVuY2UgYXMgU2VudGVuY2UsIElGRXJCYXNlIGFzIElGRXJCYXNlIH0gZnJvbSAnLi9tYXRjaC9lcl9pbmRleCc7XHJcblxyXG5leHBvcnQgZnVuY3Rpb24gZ2V0VG9rZW5UZXh0KHRva2VuIDogYW55LCBzZW50ZW5jZSA6IElGRXJCYXNlLklTZW50ZW5jZSkge1xyXG4gICAgcmV0dXJuIGdldFNlbnRlbmNlVG9rZW4odG9rZW4sc2VudGVuY2UpLnN0cmluZztcclxufVxyXG5cclxuZXhwb3J0IGZ1bmN0aW9uIGdldFNlbnRlbmNlVG9rZW4odG9rZW4gOiBhbnksIHNlbnRlbmNlIDogSUZFckJhc2UuSVNlbnRlbmNlKSA6IElGRXJCYXNlLklXb3JkIHtcclxuICAgIGlmKE51bWJlci5pc05hTih0b2tlbi5zdGFydE9mZnNldCkgfHwgdG9rZW4uc3RhcnRPZmZzZXQgPj0gc2VudGVuY2UubGVuZ3RoKSB7XHJcbiAgICAgICAgdGhyb3cgRXJyb3IoJ2FjY2VzcyBvdXRzaWRlIG9mIGluZGV4JyArIHRva2VuLnN0YXJ0T2Zmc2V0ICsgXCIgLyBcIiArIHNlbnRlbmNlLmxlbmd0aCk7XHJcbiAgICB9XHJcbiAgICByZXR1cm4gc2VudGVuY2VbdG9rZW4uc3RhcnRPZmZzZXRdO1xyXG59XHJcblxyXG5cclxuZXhwb3J0IGZ1bmN0aW9uIGdldFRva2VuUXVhbGlmaWVyKHRva2VuIDogYW55LCBzZW50ZW5jZSA6IElGRXJCYXNlLklTZW50ZW5jZSkge1xyXG4gICAgcmV0dXJuIGdldFF1YWxpZmllckZyb21Xb3JkVHlwZShnZXRTZW50ZW5jZVRva2VuKHRva2VuLHNlbnRlbmNlKS5ydWxlLndvcmRUeXBlICk7XHJcbn1cclxuXHJcbmV4cG9ydCBmdW5jdGlvbiBnZXRRdWFsaWZpZXJGcm9tV29yZFR5cGUod29yZFR5cGUgOiBzdHJpbmcpIDogc3RyaW5nIHtcclxuICAgIHN3aXRjaCh3b3JkVHlwZSkge1xyXG4gICAgICAgIGNhc2UgSUZNb2RlbC5XT1JEVFlQRS5GQUNUIDpcclxuICAgICAgICAgICAgcmV0dXJuIFwidGhlIGZhY3RcIjtcclxuICAgICAgICBjYXNlIElGTW9kZWwuV09SRFRZUEUuQ0FURUdPUlk6XHJcbiAgICAgICAgICAgIHJldHVybiBcInRoZSBjYXRlZ29yeVwiXHJcbiAgICAgICAgY2FzZSBJRk1vZGVsLldPUkRUWVBFLkRPTUFJTjpcclxuICAgICAgICAgICAgcmV0dXJuIFwidGhlIGRvbWFpblwiXHJcbiAgICAgICAgY2FzZSBJRk1vZGVsLldPUkRUWVBFLk9QRVJBVE9SOlxyXG4gICAgICAgICAgICByZXR1cm4gXCJ0aGUgb3BlcmF0b3JcIlxyXG4gICAgfVxyXG4gICAgcmV0dXJuIFwiXCI7XHJcbn1cclxuXHJcblxyXG5cclxuZXhwb3J0IGludGVyZmFjZSBJUGFyc2VFcnJvciB7XHJcbiAgICB0ZXh0IDogc3RyaW5nLFxyXG4gICAgZXJyb3IgOiBhbnlcclxufVxyXG5cclxuZXhwb3J0IGZ1bmN0aW9uIGdldEV4cGVjdGluZyhtZXNzYWdlIDogc3RyaW5nKSA6IHN0cmluZyB7XHJcbiAgICAvLyAgICByZXR1cm4gXCJBXCJcclxuICAgIC8vRXJyb3I6IE5vVmlhYmxlQWx0RXhjZXB0aW9uOiBFeHBlY3Rpbmc6IG9uZSBvZiB0aGVzZSBwb3NzaWJsZSBUb2tlbiBzZXF1ZW5jZXM6XHJcbiAgICAvLyAgMS4gW0ZBQ1RdXHJcbiAgICAvLyAgMi4gW0FuQU5ZXVxyXG4gICAgLy8gdG9kbyBleHRyYWN0IGFuZCBmb3JtYXQgYWx0ZXJuYXRpdmVzLi4uXHJcbiAgICB2YXIgYXJyID0gZXh0cmFjdEV4cGVjdEFycihtZXNzYWdlKS5tYXAociA9PiBtYXBUb2tlblN0cmluZ1RvSHVtYW5TdHJpbmcocikpLmZpbHRlcihyID0+ICEhcik7XHJcbiAgICB2YXIgcmVzID0gYXJyLmpvaW4oXCIgb3IgYSBcIik7XHJcbiAgICBpZiAocmVzLmxlbmd0aCkge1xyXG4gICAgICAgIHJldHVybiBcImEgXCIgKyByZXM7XHJcbiAgICB9XHJcbiAgICByZXR1cm4gdW5kZWZpbmVkOyAvLyAnYSBmYWN0IG9yIGEgc3RyaW5nIGZyYWdtZW50JztcclxufVxyXG5cclxuZXhwb3J0IGZ1bmN0aW9uIG1hcFRva2VuU3RyaW5nVG9IdW1hblN0cmluZyh0b2tlbnN0cmluZyA6IHN0cmluZyApIDogc3RyaW5nIHtcclxuICAgIHN3aXRjaCh0b2tlbnN0cmluZykge1xyXG4gICAgICAgIGNhc2UgXCJGQUNUXCI6XHJcbiAgICAgICAgICAgIHJldHVybiBcImZhY3RcIjtcclxuICAgICAgICBjYXNlIFwiQW5BTllcIjpcclxuICAgICAgICAgICAgcmV0dXJuIFwic3RyaW5nIGZyYWdtZW50XCI7XHJcbiAgICAgICAgY2FzZSAnVEludGVnZXInOlxyXG4gICAgICAgIGNhc2UgJ0ludGVnZXInOlxyXG4gICAgICAgIGNhc2UgJzEyJzpcclxuICAgICAgICBjYXNlICdOVU1CRVInOlxyXG4gICAgICAgICAgICByZXR1cm4gJ251bWJlcic7XHJcbiAgICB9XHJcbiAgICByZXR1cm4gdW5kZWZpbmVkO1xyXG59XHJcblxyXG5leHBvcnQgZnVuY3Rpb24gZXh0cmFjdEV4cGVjdEFycihtZXNzYWdlIDogc3RyaW5nKSA6IHN0cmluZ1tdIHtcclxuICAgIGRlYnVnbG9nKG1lc3NhZ2UpO1xyXG4gICAgdmFyIHIgPSAvXFxkK1xcLiBcXFsoW15cXF1dKylcXF0vZztcclxuICAgIHZhciByZXN1bHRzID0gW107XHJcbiAgICB2YXIgbWF0Y2ggPSByLmV4ZWMobWVzc2FnZSk7XHJcbiAgICB3aGlsZSAobWF0Y2ggIT0gbnVsbCkge1xyXG4gICAgICAgIC8vY29uc29sZS5sb2coJyBoZXJlICcgKyBKU09OLnN0cmluZ2lmeShtYXRjaCkpO1xyXG4gICAgICAgIC8vY29uc29sZS5sb2coJyBoZXJlICAwICcgKyBtYXRjaFswXSk7XHJcbiAgICAgICAgLy9jb25zb2xlLmxvZygnIGhlcmUgIDEgJyArIG1hdGNoWzFdKTtcclxuICAgICAgICAvL2NvbnNvbGUubG9nKCcgaGVyZSAgMiAnICsgbWF0Y2hbMl0pO1xyXG4gICAgICAgIHJlc3VsdHMucHVzaChtYXRjaFsxXSk7XHJcbiAgICAgICAgbWF0Y2ggPSByLmV4ZWMobWVzc2FnZSk7XHJcbiAgICB9XHJcbiAgICByZXR1cm4gcmVzdWx0cztcclxufVxyXG5cclxuZXhwb3J0IGZ1bmN0aW9uIGZvcm1hdEVycm9yKGVycm9yIDogYW55LCBzZW50ZW5jZSA6IElGRXJCYXNlLklTZW50ZW5jZSkgOiBJUGFyc2VFcnJvciB7XHJcbiAgICBkZWJ1Z2xvZygoKSA9PiAnZXJyb3IgOiAnICsgSlNPTi5zdHJpbmdpZnkoZXJyb3IpKTtcclxuICAgIGlmICgoZXJyb3IubmFtZSA9PT0gXCJOb3RBbGxJbnB1dFBhcnNlZEV4Y2VwdGlvblwiKSAmJiBlcnJvci50b2tlbiAmJiAoZXJyb3IudG9rZW4uc3RhcnRPZmZzZXQgIT09IG51bGwpICkge1xyXG4gICAgICAgIHZhciB0b2sgPSBnZXRUb2tlblRleHQoZXJyb3IudG9rZW4sIHNlbnRlbmNlKTtcclxuICAgICAgICB2YXIgcXVhbGlmaWVyID0gZ2V0VG9rZW5RdWFsaWZpZXIoZXJyb3IudG9rZW4sc2VudGVuY2UpO1xyXG4gICAgICAgIHJldHVybiB7IHRleHQgOlxyXG4gICAgICAgICAgICAgICAgYEkgZG8gbm90IHVuZGVyc3RhbmQgJHtxdWFsaWZpZXJ9IFwiJHt0b2t9XCIgYXQgdGhpcyBwb3NpdGlvbiBpbiB0aGUgc2VudGVuY2UuYCxcclxuICAgICAgICAgICAgICAgIGVycm9yIDogZXJyb3IgfTtcclxuICAgIH1cclxuICAgIGlmICgoZXJyb3IubmFtZSA9PT0gXCJOb1ZpYWJsZUFsdEV4Y2VwdGlvblwiKSAmJiBlcnJvci50b2tlbiAmJiAoTnVtYmVyLmlzTmFOKGVycm9yLnRva2VuLnN0YXJ0T2Zmc2V0KSkgKSB7XHJcbiAgICAgICAgdmFyIGV4cGVjdCA9IGdldEV4cGVjdGluZyhlcnJvci5tZXNzYWdlKTtcclxuICAgICAgICByZXR1cm4geyB0ZXh0IDpcclxuICAgICAgICAgICAgICAgIGBTZW50ZW5jZSB0ZXJtaW5hdGVkIHVuZXhwZWN0ZWRseSwgaSBleHBlY3RlZCAke2V4cGVjdH0uYCxcclxuICAgICAgICAgICAgICAgIGVycm9yIDogZXJyb3IgfTtcclxuICAgIH1cclxuICAgIC8vKGVycm9yLm5hbWUgPT09IFwiTm9WaWFibGVBbHRFeGNlcHRpb25cIilcclxuICAgIHJldHVybiB7IGVycm9yIDogZXJyb3IsXHJcbiAgICAgICAgdGV4dCA6IEpTT04uc3RyaW5naWZ5KGVycm9yKVxyXG4gICAgfVxyXG59Il19
