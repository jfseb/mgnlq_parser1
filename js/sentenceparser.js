'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
exports.parse = exports.SelectLexer = exports.parseSentenceToAsts = exports.getLexer = exports.makeToken = void 0;
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
function makeToken(t, index, OL) {
    if (!t.rule) {
        throw new Error("Token without rule " + JSON.stringify(t));
    }
    if (t.rule.wordType === mgnlq_model_1.IFModel.WORDTYPE.CATEGORY) {
        return { image: "CAT", startOffset: index, bearer: t, tokenType: tokens_1.OperatorLookup.CAT.tokenType };
    }
    ;
    if (t.rule.wordType === 'F') {
        return { image: "FACT", startOffset: index, bearer: t, tokenType: tokens_1.Tokens.FACT.tokenType };
    }
    if (t.rule.wordType === 'N') {
        //console.log( 'tokentype is ' +  T["Integer"].tokenType  +  ' ' + JSON.stringify( T["Integer"] ));
        // TODO i parses as integer -> integer
        return { image: "NUMBER", startOffset: index, bearer: t, tokenType: tokens_1.Tokens.Integer.tokenType };
    }
    if (t.rule.wordType === 'D') {
        return { image: "DOM", startOffset: index, bearer: t, tokenType: tokens_1.Tokens.DOM.tokenType };
    }
    if (t.rule.wordType === 'A') {
        return { image: "ANY", startOffset: index, bearer: t, tokenType: tokens_1.Tokens.AnANY.tokenType };
    }
    if (t.rule.wordType === 'M') {
        var tlc = t.matchedString.toLowerCase();
        var tlcClean = tlc.replace(/ /g, '_');
        //debulog(">" + tlcClean + "<");
        //debulog(Object.keys(T).indexOf("domain"));
        //debulog(">>>" + JSON.stringify(T["domain"]));
        //debulog("> token >>" + JSON.stringify(T[tlcClean]));
        if (!OL[tlcClean]) {
            //debuglog(Object.keys(T).join('\" \"'));
            throw new Error("unknown token of type M with >" + t.matchedString + "<");
        }
        //debuglog(" here we go" + typeof T["domain"]);
        return { image: t.matchedString, bearer: t, startOffset: index, tokenType: tokens_1.Tokens["domain"].tokenType };
    }
    if (t.rule.wordType === 'O') {
        var tlc = t.matchedString.toLowerCase();
        //var tlcClean = tlc; //  tlc.replace(/ /g,'_');
        var opToken = tokens_1.OperatorLookup[tlc];
        //console.log(' here mapped with _ ' + tlcClean + ' ' + Object.keys(T));
        if (!opToken) {
            debuglog(Object.keys(tokens_1.OperatorLookup).join('\" \"'));
            throw new Error("unknown token of type O with >" + t.matchedString + "< cleansed>" + (tlcClean) + "< not found in " + Object.getOwnPropertyNames(tokens_1.OperatorLookup).join('\n') + " , add to ");
            //process.exit(-1);
        }
        //console.log( ' here image  for O' + t.matchedString + ' ' + T[tlcClean].tokenType);
        return { image: t.matchedString, bearer: t, startOffset: index, tokenType: opToken.tokenType };
    }
    if (t.rule.wordType === 'I') {
        var tlc = t.matchedString.toLowerCase();
        var opToken = tokens_1.Tokens[tlc];
        if (!opToken) {
            debuglog("unknown token of type I with " + t.matchedString);
            process.exit(-1);
        }
        return { image: t.matchedString, bearer: t, startOffset: index, tokenType: opToken.tokenType };
    }
    throw new Error("unknown token " + JSON.stringify(t));
}
exports.makeToken = makeToken;
class XLexer {
    constructor() {
        this.tokenize = function (sentence) {
            debuglog(() => ' sentence prior tokenize:' + JSON.stringify(sentence));
            return sentence.map((t, index) => {
                var u = makeToken(t, index, tokens_1.OperatorLookup);
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
            debuglog(() => 'error  ' + JSON.stringify(e.error_obj, undefined, 2) + (!e.error_obj ? (e + ' ') + JSON.stringify(e) : ''));
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic2VudGVuY2VwYXJzZXIuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi9zcmMvc2VudGVuY2VwYXJzZXIudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUEsWUFBWSxDQUFBOzs7QUFFWiwrRkFBK0Y7QUFDL0YsMEVBQTBFO0FBRTFFLCtDQUFnRztBQUVoRyxnQ0FBZ0M7QUFFaEMseUNBQXlDO0FBR3pDLE1BQU0sUUFBUSxHQUFHLEtBQUssQ0FBQyxnQkFBZ0IsQ0FBQyxDQUFDO0FBRXpDLDZDQUE2QztBQUM3Qyx5Q0FBeUM7QUFDekMsNkJBQTZCO0FBSTNCLElBQUksV0FBVyxHQUFHLFVBQVUsQ0FBQyxXQUFXLENBQUM7QUFDekMsSUFBSSxLQUFLLEdBQUcsVUFBVSxDQUFDLEtBQUssQ0FBQztBQUM3QixJQUFJLE1BQU0sR0FBRyxVQUFVLENBQUMsTUFBTSxDQUFDO0FBR2pDLDZDQUFnRDtBQUU5QyxJQUFJLFVBQVUsR0FBRyxXQUFXLENBQUMsRUFBQyxJQUFJLEVBQUUsWUFBWSxFQUFFLE9BQU8sRUFBRSxLQUFLLEVBQUMsQ0FBQyxDQUFDO0FBRW5FLFVBQVUsQ0FBQyxLQUFLLEdBQUcsS0FBSyxDQUFDLE9BQU8sQ0FBQztBQUVqQyxxQ0FBMEU7QUFDMUUsaUZBQWlGO0FBQ2pGLElBQUksU0FBUyxHQUFHLE1BQU0sQ0FBQyxJQUFJLENBQUMsZUFBQyxDQUFDLENBQUMsR0FBRyxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsZUFBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUM7QUFHcEQsU0FBZ0IsU0FBUyxDQUFDLENBQWtCLEVBQUUsS0FBYyxFQUFFLEVBQVE7SUFDcEUsSUFBSSxDQUFDLENBQUMsQ0FBQyxJQUFJLEVBQUU7UUFDWCxNQUFNLElBQUksS0FBSyxDQUFDLHFCQUFxQixHQUFHLElBQUksQ0FBQyxTQUFTLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztLQUM1RDtJQUNELElBQUksQ0FBQyxDQUFDLElBQUksQ0FBQyxRQUFRLEtB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