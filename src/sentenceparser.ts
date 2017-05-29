'use strict'

// based on: http://en.wikibooks.org/wiki/Algorithm_implementation/Strings/Levenshtein_distance
// and:  http://en.wikipedia.org/wiki/Damerau%E2%80%93Levenshtein_distance

import { ErBase as ErBase, Sentence as Sentence, IFErBase as IFErBase } from 'mgnlq_er';

import * as debug from 'debugf';

import * as SelectParser from './parser';


const debuglog = debug('sentenceparser');

import * as chevrotain from 'chevrotain';
import * as AST from './ast';

import { ASTNodeType as NT} from './ast';

  var createToken = chevrotain.createToken;
  var Lexer = chevrotain.Lexer;
  var Parser = chevrotain.Parser;



/*

var LogicalOperator = createToken({name: "AdditionOperator", pattern: Lexer.NA});
var And = createToken({name: "And", pattern: /and/i, parent: LogicalOperator});
var Or = createToken({name: "Or", pattern: /Or/i, parent: LogicalOperator});


// using the NA pattern marks this Token class as 'irrelevant' for the Lexer.
// AdditionOperator defines a Tokens hierarchy but only the leafs in this hierarchy define
// actual Tokens that can appear in the text


var AdditionOperator = createToken({name: "AdditionOperator", pattern: Lexer.NA});
var Plus = createToken({name: "Plus", pattern: /\+/, parent: AdditionOperator});
var Minus = createToken({name: "Minus", pattern: /-/, parent: AdditionOperator});

var MultiplicationOperator = createToken({name: "MultiplicationOperator", pattern: Lexer.NA});
var Multi = createToken({name: "Multi", pattern: /\* /, parent: MultiplicationOperator});
var Div = createToken({name: "Div", pattern: /\//, parent: MultiplicationOperator});

var LParen = createToken({name: "LParen", pattern: /\(/});
var RParen = createToken({name: "RParen", pattern: /\)/});
var NumberLiteral = createToken({name: "NumberLiteral", pattern: /[1-9]\d* /});

var PowerFunc = createToken({name: "PowerFunc", pattern: /power/});

  var List = createToken({name: "List", pattern: /LIST/i});
  var Describe = createToken({name: "Describe", pattern : /DESCRIBE/i});
  var Is = createToken({name: "Is", pattern : /Is/i});
  var What = createToken({name: "What", pattern : /What/i});
  var Me = createToken({name: "Me", pattern : /Me/i});
  var The = createToken({name: "The", pattern : /The/i});
  var Meaning = createToken({name: "Meaning", pattern : /Meaning/i});
  var Of = createToken({name: "Of", pattern : /Of/i});
  var Relating = createToken({name: "Relating", pattern : /RElating/i});
  var All = createToken({name: "All", pattern : /All/i});
  var First = createToken({name: "First", pattern : /First/i});
  var Oldest = createToken({name: "Oldest", pattern : /Oldest/i});
  var Latest = createToken({name: "Latest", pattern : /(Latest)|(Newest)/i});
  var In = createToken({name: "In", pattern : /In/i});
  var Are = createToken({name: "Are", pattern : /Are/i});
  var To = createToken({name: "To", pattern : /To/i});
  var With = createToken({name: "With", pattern : /With/i});
  var About = createToken({name: "About", pattern : /About/i});
  var You = createToken({name: "You", pattern : /You/i});
  var AFact = createToken({name: "AFact", pattern : /FACT/i});
  var All = createToken({name: "All", pattern: /ALL/});
  var Select = createToken({name: "Select", pattern: /SELECT/});
  var From = createToken({name: "From", pattern: /FROM/});
  var Where = createToken({name: "Where", pattern: /WHERE/});
  var Comma = createToken({name: "Comma", pattern: /,/});
  var And = createToken({name: "And", pattern: /And/i});
  var Every = createToken({name: "And", pattern: /And/i});

  var ACategory = createToken({name: "ACategory", pattern: /CAT/});
  var Identifier = createToken({name: "Identifier", pattern: /\w+/});
  var Integer = createToken({name: "Integer", pattern: /0|[1-9]\d+/});
  var GreaterThan = createToken({name: "GreaterThan", pattern: /</});
  var LessThan = createToken({name: "LessThan", pattern: />/});
*/


import { IFModel as IFModel} from 'mgnlq_model';

  var WhiteSpace = createToken({name: "WhiteSpace", pattern: /\s+/});

  WhiteSpace.GROUP = Lexer.SKIPPED;

  import { Tokens as T }  from './tokens';
  // whitespace is normally very common so it is placed first to speed up the lexer
  var allTokens = Object.keys(T).map(key => T[key]);


export function makeToken(t : IFErBase.IWord, index : number, T : any ) {
  if (!t.rule) {
    throw new Error("Token without rule " + JSON.stringify(t));
  }
  //console.log(Object.keys(T).join("\n"));
  if (t.rule.wordType === IFModel.WORDTYPE.CATEGORY) {
    return { image : "CAT",  startOffset : index, bearer : t, tokenType : T["ACategory"].tokenType };
  };
  if (t.rule.wordType === 'F') {
    //console.log(JSON.stringify(t));
    return { image : "FACT",  startOffset : index, bearer : t, tokenType : T["AFact"].tokenType };
  }
  if (t.rule.wordType === 'D') {
    //console.log(JSON.stringify(t));
    return { image : "DOM",  startOffset : index, bearer : t, tokenType : T["ADomain"].tokenType };
  }
  if (t.rule.wordType === 'A') {
    //console.log(JSON.stringify(t));
    return { image : "ANY",  startOffset : index, bearer : t, tokenType : T["AnANY"].tokenType };
  }
  if (t.rule.wordType === 'M') {
    //console.log(JSON.stringify(t));
    var tlc = t.matchedString.toLowerCase();
    var tlcClean = tlc.replace(/ /g,'_');
    //console.log(">" + tlcClean + "<");
    //console.log(Object.keys(T).indexOf("domain"));
    //console.log(">>>" + JSON.stringify(T["domain"]));
    //console.log("> token >>" + JSON.stringify(T[tlcClean]));
    if (!T[tlcClean]) {
      //console.log(Object.keys(T).join('\" \"'));
      throw new Error("unknown token of type M with " + t.matchedString);
    }
    //console.log(" here we go" + typeof T["domain"]);
    return { image : t.matchedString, bearer : t, startOffset : index, tokenType : T["domain"].tokenType };
  }
  if (t.rule.wordType === 'O') {
    var tlc = t.matchedString.toLowerCase();
    var tlcClean = tlc.replace(/ /g,'_');
    if (!T[tlcClean]) {
      console.log(Object.keys(T).join('\" \"'));
      throw new Error("unknown token of type O with " + t.matchedString);
      //process.exit(-1);
    }
    return { image : t.matchedString, bearer : t, startOffset : index, tokenType : T[tlcClean].tokenType };
  }
  if (t.rule.wordType === 'I') {
    var tlc = t.matchedString.toLowerCase();
    if (!T[tlc]) {
      console.log("unknown token of type I with " + t.matchedString);
      process.exit(-1);
    }
    return { image : t.matchedString, bearer : t, startOffset : index, tokenType : T[tlc].tokenType };
  }
  throw new Error("unknown token " + JSON.stringify(t));
}

class XLexer {
   tokenize = function(sentence : IFErBase.ISentence) : any[]  {
    // console.log(JSON.stringify(sentence));
    return sentence.map( (t,index) => {
         var u =  makeToken(t, index, T);
        debuglog("produced nr   " + index + " > " + JSON.stringify(u));
        return u;
    });
  }
};

export function getLexer()  : any {
  return new XLexer();
}

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


function parse(tokens : any[], startrule : string) {
  const parser = new SelectParser.SelectParser(tokens);
  var res = parser[startrule]();
   if (parser.errors.length > 0) {
    throw new Error('parsing error in  input' + JSON.stringify(parser.errors));
  }
  return res;
}

export interface IParsedSentences  extends IFModel.IProcessedSentences {
  asts : AST.ASTNode[],
  domains? : string[]
};

export declare const ERR_PARSE_ERROR = "PARSE_ERROR";

export function parseSentenceToAsts(s : string, model : IFModel.IModels, words : any) : IParsedSentences {
  var res = ErBase.processString(s, model.rules, words);
  debuglog(function() { 'res > ' + JSON.stringify(res, undefined, 2)});
  var res2 = Object.assign({}, res) as IParsedSentences;
  res2.asts = res.sentences.map((sentence, index) => {
    var lexingResult = getLexer().tokenize(sentence);
    debuglog( () => {
      var sStrings = lexingResult.map((t, indext) =>  `[${indext}] ${t.image} (${t.bearer && t.bearer.matchedString || JSON.stringify(sentence[index][t.startIndex])})` );
      return 'tokens: #' + index + '...\n' + sStrings.join('\n');}
    );
    //test.deepEqual(sStrings, ['CAT', 'CAT', 'CAT', 'CAT', 'with', 'CAT', 'FACT', 'CAT', 'FACT', 'FACT' ]);
    try {
      var ast = parse(lexingResult, 'catListOpMore');
      debuglog(() => {
        return 'ast: #' + index + '...\n' + AST.astToText(ast);
      });
      return ast;
    } catch (e) {
      res2.errors = res2.errors || [];
      res2.errors[index] = {
        err_code : ERR_PARSE_ERROR,
        text : e.toString()
      }  as IFErBase.IERError;
    }
    return undefined;
  });
  return res2;
}
//
export {
   SelectLexer,
   parse
   // defaultRule : "selectStatement"
};
