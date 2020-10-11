"use strict";
/**
 * @file sentence
 * @module jfseb.fdevstart.sentence
 * @copyright (c) Gerd Forstmann
 *
 * Match a tool record on a sentence,
 *
 * This will unify matching required and optional category words
 * with the requirements of the tool.
 *
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.simplifyStringsWithBitIndex = exports.dumpNiceArr = exports.dumpNiceBitIndexed = exports.dumpNiceRuled = exports.dumpNice = exports.cutoffSentenceAtRatio = exports.cmpRankingProduct = exports.rankingProduct = exports.rankingGeometricMean = exports.getDistinctCategoriesInSentence = exports.findWordByCategory = void 0;
// <reference path="../../lib/node-4.d.ts" />
const debug = require("debug");
const debuglog = debug('sentence');
function findWordByCategory(oSentence, sCategory) {
    var res = {};
    oSentence.every(function (oWord, iIndex) {
        if (oWord.category === sCategory) {
            res = { word: oWord,
                index: iIndex };
            return false;
        }
        return true;
    });
    return res;
}
exports.findWordByCategory = findWordByCategory;
function getDistinctCategoriesInSentence(oSentence) {
    var res = [];
    var resm = {};
    oSentence.forEach(function (oWord) {
        if (oWord.category === "category") {
            if (!resm[oWord.matchedString]) {
                res.push(oWord.matchedString);
                resm[oWord.matchedString] = 1;
            }
        }
    });
    return res;
}
exports.getDistinctCategoriesInSentence = getDistinctCategoriesInSentence;
function rankingGeometricMean(oSentence) {
    const length = oSentence.length;
    if (length === 0) {
        return 1.0;
    }
    var prod = oSentence.reduce(function (prev, oWord) {
        return prev * (oWord._ranking || 1.0);
    }, 1.0);
    // TODO: find somethign faster ;-)
    return Math.pow(prod, 1 / length);
}
exports.rankingGeometricMean = rankingGeometricMean;
function rankingProduct(oSentence) {
    return rankingGeometricMean(oSentence);
}
exports.rankingProduct = rankingProduct;
function cmpRankingProduct(a, b) {
    return -(rankingProduct(a) - rankingProduct(b));
}
exports.cmpRankingProduct = cmpRankingProduct;
function cutoffSentenceAtRatio(sentences) {
    if (sentences.length === 0) {
        return sentences;
    }
    var bestRank = rankingProduct(sentences[0]);
    for (var i = 1; (i < Math.min(sentences.length, 300)) && ((rankingProduct(sentences[i]) / bestRank) > 0.8); ++i) {
        // empty
    }
    debuglog("reduce sentences by " + i + "/" + sentences.length);
    return sentences.slice(0, i);
}
exports.cutoffSentenceAtRatio = cutoffSentenceAtRatio;
/*
export function simplifySentence(res : IMatch.ICategorizedStringRanged[][]) : string[][] {
  return res.map(function (r) {
    return r.map(word => { return word.string + '=>' + word.matchedString + '/' + word.category + (word.span ? '/' + word.span : '') })
  });
}
*/
function dumpNice(sentence, fn) {
    var result = [];
    sentence.forEach(function (oWord, index) {
        var sWord = `[${index}] : ${(oWord._ranking || 0).toFixed(3)} ${oWord.category} "${oWord.string}" => "${oWord.matchedString}"`;
        result.push(sWord + "\n");
    });
    result.push(".\n");
    return result.join("");
}
exports.dumpNice = dumpNice;
function dumpNiceRuled(sentence, fn) {
    var result = [];
    sentence.forEach(function (oWord, index) {
        var sWord = `[${index}] : ${(oWord._ranking || 0).toFixed(3)} ${oWord.category} "${oWord.string}" => "${oWord.matchedString}" `;
        result.push(sWord + "\n");
    });
    result.push(".\n");
    return result.join("");
}
exports.dumpNiceRuled = dumpNiceRuled;
function dumpNiceBitIndexed(sentence, fn) {
    var result = [];
    sentence.forEach(function (word, index) {
        var sWord = `[${index}] : ${(word._ranking || 0).toFixed(3)} "${word.string}" => "${word.matchedString}" `
            + word.category + (word.span ? '/' + word.span : '') + ` ${word.rule.wordType}${word.rule.bitindex}`;
        result.push(sWord + "\n");
    });
    result.push(".\n");
    return result.join("");
}
exports.dumpNiceBitIndexed = dumpNiceBitIndexed;
function dumpNiceArr(sentences, fn) {
    if (!sentences) {
        return "";
    }
    var res = sentences.reduce(function (prev, oSentence) {
        return prev + dumpNice(oSentence);
    }, "");
    return res;
}
exports.dumpNiceArr = dumpNiceArr;
function simplifyStringsWithBitIndex(sentence) {
    if (!sentence) {
        return [];
    }
    return sentence.map(word => { return word.string + '=>' + word.matchedString + '/' + word.category + (word.span ? '/' + word.span : '') + ` ${word.rule.wordType}${word.rule.bitindex}`; });
}
exports.simplifyStringsWithBitIndex = simplifyStringsWithBitIndex;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic2VudGVuY2UuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi9zcmMvbWF0Y2gvc2VudGVuY2UudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IjtBQUFBOzs7Ozs7Ozs7O0dBVUc7OztBQUVILDZDQUE2QztBQUU3QywrQkFBK0I7QUFNL0IsTUFBTSxRQUFRLEdBQUcsS0FBSyxDQUFDLFVBQVUsQ0FBQyxDQUFBO0FBRWxDLFNBQWdCLGtCQUFrQixDQUFDLFNBQVMsRUFBRSxTQUFrQjtJQUM3RCxJQUFJLEdBQUcsR0FBRyxFQUE0QyxDQUFDO0lBQ3RELFNBQVMsQ0FBQyxLQUFLLENBQUMsVUFBUyxLQUFLLEVBQUUsTUFBTTtRQUNwQyxJQUFHLEtBQUssQ0FBQyxRQUFRLEtBQUssU0FBUyxFQUFFO1lBQy9CLEdBQUcsR0FBRyxFQUFFLElBQUksRUFBRSxLQUFLO2dCQUNYLEtBQUssRUFBRyxNQUFNLEVBQUUsQ0FBQztZQUN6QixPQUFPLEtBQUssQ0FBQztTQUNkO1FBQ0QsT0FBTyxJQUFJLENBQUM7SUFDZCxDQUFDLENBQUMsQ0FBQTtJQUNGLE9BQU8sR0FBRyxDQUFDO0FBQ2YsQ0FBQztBQVhELGdEQVdDO0FBRUQsU0FBZ0IsK0JBQStCLENBQUMsU0FBNEI7SUFDMUUsSUFBSSxHQUFHLEdBQUcsRUFBRSxDQUFDO0lBQ2IsSUFBSSxJQUFJLEdBQUcsRUFBRSxDQUFDO0lBQ2QsU0FBUyxDQUFDLE9BQU8sQ0FBQyxVQUFTLEtBQUs7UUFDOUIsSUFBRyxLQUFLLENBQUMsUUFBUSxLQUFLLFVBQVUsRUFBRTtZQUNoQyxJQUFHLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxhQUFhLENBQUMsRUFBRTtnQkFDN0IsR0FBRyxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsYUFBYSxDQUFDLENBQUM7Z0JBQzlCLElBQUksQ0FBQyxLQUFLLENBQUMsYUFBYSxDQUFDLEdBQUcsQ0FBQyxDQUFDO2FBQy9CO1NBQ0Y7SUFDSCxDQUFDLENBQUMsQ0FBQztJQUNILE9B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