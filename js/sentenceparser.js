'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
// based on: http://en.wikibooks.org/wiki/Algorithm_implementation/Strings/Levenshtein_distance
// and:  http://en.wikipedia.org/wiki/Damerau%E2%80%93Levenshtein_distance
const er_index_1 = require("./match/er_index");
const debug = require("debugf");
const SelectParser = require("./parser");
const debuglog = debug('sentenceparser');
const FormatError = require("./formaterror");
const chevrotain = require("chevrotain");
const AST = require("./ast");
var createToken = chevrotain.createToken;
var Lexer = chevrotain.Lexer;
var Parser = chevrotain.Parser;
const mgnlq_model_1 = require("mgnlq_model");
var WhiteSpace = createToken({ name: "WhiteSpace", pattern: /\s+/ });
WhiteSpace.GROUP = Lexer.SKIPPED;
const tokens_1 = require("./tokens");
// whitespace is normally very common so it is placed first to speed up the lexer
var allTokens = Object.keys(tokens_1.Tokens).map(key => tokens_1.Tokens[key]);
function makeToken(t, index, T) {
    if (!t.rule) {
        throw new Error("Token without rule " + JSON.stringify(t));
    }
    if (t.rule.wordType === mgnlq_model_1.IFModel.WORDTYPE.CATEGORY) {
        return { image: "CAT", startOffset: index, bearer: t, tokenType: T["ACategory"].tokenType };
    }
    ;
    if (t.rule.wordType === 'F') {
        return { image: "FACT", startOffset: index, bearer: t, tokenType: T["AFact"].tokenType };
    }
    if (t.rule.wordType === 'N') {
        //console.log( 'tokentype is ' +  T["Integer"].tokenType  +  ' ' + JSON.stringify( T["Integer"] ));
        // TODO i parses as integer -> integer
        return { image: "NUMBER", startOffset: index, bearer: t, tokenType: T["Integer"].tokenType };
    }
    if (t.rule.wordType === 'D') {
        return { image: "DOM", startOffset: index, bearer: t, tokenType: T["ADomain"].tokenType };
    }
    if (t.rule.wordType === 'A') {
        return { image: "ANY", startOffset: index, bearer: t, tokenType: T["AnANY"].tokenType };
    }
    if (t.rule.wordType === 'M') {
        var tlc = t.matchedString.toLowerCase();
        var tlcClean = tlc.replace(/ /g, '_');
        //debulog(">" + tlcClean + "<");
        //debulog(Object.keys(T).indexOf("domain"));
        //debulog(">>>" + JSON.stringify(T["domain"]));
        //debulog("> token >>" + JSON.stringify(T[tlcClean]));
        if (!T[tlcClean]) {
            //debuglog(Object.keys(T).join('\" \"'));
            throw new Error("unknown token of type M with " + t.matchedString);
        }
        //debuglog(" here we go" + typeof T["domain"]);
        return { image: t.matchedString, bearer: t, startOffset: index, tokenType: T["domain"].tokenType };
    }
    if (t.rule.wordType === 'O') {
        var tlc = t.matchedString.toLowerCase();
        var tlcClean = tlc.replace(/ /g, '_');
        //console.log(' here mapped with _ ' + tlcClean + ' ' + Object.keys(T));
        if (!T[tlcClean]) {
            debuglog(Object.keys(T).join('\" \"'));
            throw new Error("unknown token of type O with " + t.matchedString);
            //process.exit(-1);
        }
        //console.log( ' here image  for O' + t.matchedString + ' ' + T[tlcClean].tokenType);
        return { image: t.matchedString, bearer: t, startOffset: index, tokenType: T[tlcClean].tokenType };
    }
    if (t.rule.wordType === 'I') {
        var tlc = t.matchedString.toLowerCase();
        if (!T[tlc]) {
            debuglog("unknown token of type I with " + t.matchedString);
            process.exit(-1);
        }
        return { image: t.matchedString, bearer: t, startOffset: index, tokenType: T[tlc].tokenType };
    }
    throw new Error("unknown token " + JSON.stringify(t));
}
exports.makeToken = makeToken;
class XLexer {
    constructor() {
        this.tokenize = function (sentence) {
            debuglog(() => ' sentence prior tokenize:' + JSON.stringify(sentence));
            return sentence.map((t, index) => {
                var u = makeToken(t, index, tokens_1.Tokens);
                debuglog("produced nr   " + index + " > " + JSON.stringify(u));
                return u;
            });
        };
    }
}
;
function getLexer() {
    return new XLexer();
}
exports.getLexer = getLexer;
/* [ AFact, And,
  Describe,
  First, Oldest, Latest, What,
  At, Every, All, At, Least, One,
  The,
  LParen, RParen,


 Meaning, Of, Are,  In, About, You, All,
WhiteSpace, Select, From, Where, Comma, ACategory, All,
  List, Identifier, Integer, GreaterThan, LessThan, To, Relating, With];
*/
var SelectLexer = new Lexer(allTokens);
exports.SelectLexer = SelectLexer;
function parse(tokens, startrule) {
    const parser = new SelectParser.SelectParser(tokens);
    //console.log( ' ' + JSON.stringify( tokens ));
    var res = parser[startrule]();
    if (parser.errors.length > 0) {
        debuglog(() => 'parsing error in  input:' + JSON.stringify(parser.errors, undefined, 2));
        var u = new Error(parser.errors[0]);
        u.error_obj = parser.errors[0];
        throw u;
    }
    return res;
}
exports.parse = parse;
;
function parseSentenceToAsts(s, model, words) {
    var res = er_index_1.ErBase.processString(s, model.rules, words, {} /*model.operators*/);
    debuglog(() => 'res > ' + JSON.stringify(res, undefined, 2));
    var res2 = Object.assign({}, res);
    res2.errors = res2.errors || [];
    res2.asts = res.sentences.map((sentence, index) => {
        res2.errors[index] = false;
        var lexingResult = getLexer().tokenize(sentence);
        debuglog(() => {
            var sStrings = lexingResult.map((t, indext) => `[${indext}] ${t.image} (${t.bearer && t.bearer.matchedString || JSON.stringify(sentence[index][t.startIndex])})`);
            return 'tokens: #' + index + '...\n' + sStrings.join('\n');
        });
        //test.deepEqual(sStrings, ['CAT', 'CAT', 'CAT', 'CAT', 'with', 'CAT', 'FACT', 'CAT', 'FACT', 'FACT' ]);
        try {
            var ast = parse(lexingResult, 'catListOpMore');
            debuglog(() => {
                return 'ast: #' + index + '...\n' + AST.astToText(ast);
            });
            return ast;
        }
        catch (e) {
            debuglog(() => 'error  ' + JSON.stringify(e.error_obj, undefined, 2));
            debuglog(() => ' sentence : ' + er_index_1.Sentence.dumpNice(sentence));
            var e2 = FormatError.formatError(e.error_obj, sentence);
            res2.errors = res2.errors || [];
            debuglog('parse error ' + e.toString());
            res2.errors[index] = {
                err_code: exports.ERR_PARSE_ERROR,
                text: e.toString().split(',\"token\":')[0]
            };
        }
        return undefined;
    });
    return res2;
}
exports.parseSentenceToAsts = parseSentenceToAsts;

//# sourceMappingURL=sentenceparser.js.map

//# sourceMappingURL=sentenceparser.js.map
