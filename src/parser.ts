'use strict'

// based on: http://en.wikibooks.org/wiki/Algorithm_implementation/Strings/Levenshtein_distance
// and:  http://en.wikipedia.org/wiki/Damerau%E2%80%93Levenshtein_distance


import * as chevrotain from 'chevrotain';
import * as AST from './ast';

import { ASTNodeType as NT} from './ast';

  // Written Docs for this tutorial step can be found here:
  // https://github.com/SAP/chevrotain/blob/master/docs/tutorial/step2_parsing.md

  // Tutorial Step 2:

  // Adding a Parser (grammar only, only reads the input
  // without any actions) using the Tokens defined in the previous step.
  // modification to the grammar will be displayed in the syntax diagrams panel.

/*
  function a( ) :  {
    GROUP?: string;
    PATTERN?: RegExp;
    LABEL?: string;
    LONGER_ALT?: chevrotain.TokenConstructor;
    POP_MODE?: boolean;
    PUSH_MODE?: string;
    tokenName?: string;
    tokenType?: number;
    extendingTokenTypes?: number[];
    new (...args: any[]): chevrotain.IToken;
  } {
    return { new(...args{}) : function() {
      return {
        image : "All"
      };
    }
  };
  };
*/

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
  var WhiteSpace = createToken({name: "WhiteSpace", pattern: /\s+/});

  WhiteSpace.GROUP = Lexer.SKIPPED;


import { Tokens as T}  from './tokens';
  // whitespace is normally very common so it is placed first to speed up the lexer
  var allTokens = Object.keys(T).map(key => T[key]);
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

  // ----------------- parser -----------------
function SelectParser(input) {
    // By default if {recoveryEnabled: true} is not passed in the config object
    // error recovery / fault tolerance capabilities will be disabled
    var u = Parser.call(this, input, allTokens, {
     // autputCst: true
    });

    //console.log(u);
    var $ = this;

    this.listAll = $.RULE('listAll', () => {
      $.CONSUME(T.list);
      $.OPTION(() =>
        $.CONSUME(T.all)
      );
      var resFieldList = $.SUBRULE($.fieldList)
      return resFieldList;
    });

    this.inDomain = $.RULE('inDomain', () => {
        $.CONSUME(T.in);
      $.CONSUME(T.domain);
         $.CONSUME(T.ADomain);
    });

    this.selectStatement = $.RULE("selectStatement", function () {
      $.SUBRULE($.selectClause)
      $.SUBRULE($.fromClause)
      $.OPTION(function () {
        $.SUBRULE($.whereClause)
      });
      //console.log('returning');
      return { a: 123 };
    });


    this.allClause = $.RULE('allClause', function() {
      $.SUBRULE($.catListOpMore);
    });


    this.opCat = $.RULE('opCat', function() {
      $.OR([
        {ALT: function() { return AST.makeNodeForToken(NT.OPFirst, $.CONSUME(T.first));}},
        {ALT: function() { return AST.makeNodeForToken(NT.OPOldest, $.CONSUME(T.oldest));}},
        {ALT: function() { return AST.makeNodeForToken(NT.OPNewest,$.CONSUME(T.latest))}}
      ])
    });


    this.catListOpMore = $.RULE("catListOpMore", function() : AST.ASTNode {
       var r = undefined as AST.ASTNode;
       $.OPTION(() =>
          r = $.SUBRULE($.opCat)
       );
       r = r || AST.makeNode(NT.OPAll);
       var catList = $.SUBRULE2($.categoryList);
       r.children = [catList];
       var inop = $.OPTION3(() => {
            var op = $.SUBRULE4($.binaryFragOp);
            var head = catList.children[catList.children.length-1];
              op.children = [head];
            var factOrAny = $.SUBRULE5($.factOrAny);
            op.children.push(factOrAny);
                  return op;
        });
       var filterDom = undefined;
       $.OPTION2(() => filterDom = $.SUBRULE3($.catFilter));
       var filter = (filterDom || [])[0];

       if(!filter && inop) {

          var n =  AST.makeNode(NT.LIST);
          n.children = [inop];
          filter = n;
       } else if(inop) {
          filter.children = filter.children.unshift(inop);
       }

       var dom = (filterDom || [])[1];
       if(dom) {
          return AST.makeNode(NT.BINOP, r, filter, dom);
       } else {
         return AST.makeNode(NT.BINOP,r, filter);
       }
    });

    this.filterEntry = $.RULE("filterEntry", function() {
      $.OR([
        {
          ALT: function () {
            $.CONSUME(T.in);
          }
        },
        {
          ALT: function () {
            $.CONSUME(T.with);
          }
        },
        {
          ALT: function () {
            $.CONSUME(T.for);
          }
        },
        {
          ALT: function () {
            $.CONSUME(T.relating);
          }
        }
        ]);
    });


    this.domOrDomainDom = $.RULE("domOrDomainDom", function() {
      $.OPTION(() => $.CONSUME(T.domain));
      var r = $.CONSUME2(T.ADomain);
      return AST.makeNodeForDomain(r);
    });

    this.catFilter = $.RULE("catFilter", function() {
        $.SUBRULE($.filterEntry);
        var dom = undefined;
        var filter = undefined;
        $.OR([{
          ALT: () => {
              dom = $.SUBRULE1($.domOrDomainDom);
              $.OPTION2(() => {
                $.SUBRULE2($.filterEntry);
                filter = $.SUBRULE3($.commaAndListFilter);
              });
          }
        },
        {
            ALT: () => {
              filter = $.SUBRULE4($.commaAndListFilter);
            }
        }
        ]);
        return [filter, dom];
    });

    this.selectClause = $.RULE("categoryList", function () {
      var r = [];
      $.AT_LEAST_ONE( () => {
        $.OPTION( () => { $.CONSUME(T.Comma); });
        r.push(AST.makeNodeForCat($.CONSUME(T.ACategory)));
      });
      /*
      $.AT_LEAST_ONE_SEP({
        SEP: T.Comma, DEF: function () {
          r.push(AST.makeNodeForCat($.CONSUME(T.ACategory)));
        }
      });
      */
      var res = AST.makeNode(NT.LIST);
      res.children = r;
      return res;
    });

  this.plainFact = $.RULE("plainFact", () =>
    AST.makeNodeForFact($.CONSUME(T.AFact))
  );

  this.factOrAny = $.RULE("factOrAny", () =>
    $.OR([
        {
          ALT: function () {
            return AST.makeNodeForFact($.CONSUME1(T.AFact));
          }
        },
        {
          ALT: function () {
            return AST.makeNodeForAny($.CONSUME2(T.AnANY));
          }
        }
    ])
  );

  this.ppFactAny = $.RULE("opFactAny", function (head) {
    return $.OR([
              {
                ALT: () => {
                  var op = AST.makeNode(NT.OPEqIn,head);
                  var fact = $.SUBRULE($.plainFact);
                  op.children.push(fact);
                  return op;
                }
              },
              {
                ALT: () => {
                  var op = $.SUBRULE2($.binaryValOp);
                  op.children = [head];
                  var fact = $.SUBRULE3($.plainFact);
                  op.children.push(fact);
                  return op;
                }
              },
              {
                ALT: () => {
                  var op = $.SUBRULE4($.binaryFragOp);
                  op.children = [head];
                  var factOrAny = $.SUBRULE5($.factOrAny);
                  op.children.push(factOrAny);
                  return op;
                }
              }
        ]);
  });
  // [ CAT? FACT ]
  // TODO CAT OP CONTAINS MANY
  // CAT OP FACT
  // FACT
  this.catFact = $.RULE("catFact", function () {
    return $.OR([
        {
          ALT: () => {
            var tok = $.CONSUME(T.ACategory);
            var head = AST.makeNodeForCat(tok);
            var op = $.SUBRULE($.opFactAny, head);
            op.children[0] = head;
            return op;
          }
        },
        {
          ALT: () => {
            var op = AST.makeNode(NT.OPEqIn,
              AST.makeNode(AST.ASTNodeType.CATPH));
            var fact = $.SUBRULE1($.plainFact);
            op.children.push(fact);
            return op;
          }
        }
      ]);
   });

//

 this.commaAndListFilter = $.RULE("commaAndListFilter", function () {
      var r = [$.SUBRULE($.catFact)];
      $.MANY( () => {
        $.OPTION( () => $.CONSUME(T.Comma));
        /* $.OR( [
          { ALT: function() { $.CONSUME(Comma); }},
          { ALT: function() { $.CONSUME(And); }}
        ]); */
        r.push($.SUBRULE2($.catFact));
      });
      //onsole.log("here producing" + JSON.stringify(n));
      var n =  AST.makeNode(NT.LIST);
      n.children = r;
      return n;
    });
/*
  this.commaAndListTail = $.RULE("commaAndListTail", function () {
      //$.SUBRULE($.catFact);
      $.MANY( () => {
        $.CONSUME(T.Comma);
        /* $.OR( [
          { ALT: function() { $.CONSUME(Comma); }},
          { ALT: function() { $.CONSUME(And); }}
        ]); * /
        $.SUBRULE($.catFact);
      });
      return { b: 445 };
    });
*/
    $.RULE("unarySetOp", function() {
       $.OR([
        {
          ALT: function () {
            $.CONSUME(T.all);
          }
        },
        {
          ALT: function () {
            $.CONSUME(T.first);
          }
        },
        {
          ALT: function () {
            $.CONSUME(T.newest);
          }
        },
        {
          ALT: function () {
            $.CONSUME(T.oldest);
          }
        },
        {
          ALT: function () {
            $.CONSUME(T.latest);
          }
        },
        {
          ALT: function () {
            $.CONSUME(T.every);
          }
        },
        {
          ALT: function () {
            $.CONSUME(T.any);
          }
        },
        {
          ALT: function () {
            $.CONSUME(T.at);
            $.CONSUME(T.least);
            $.CONSUME(T.one);
          }
        },

        {
          ALT: function () {
            $.CONSUME(T.last);
          }
        }
      ]);
  });

     $.RULE("binaryValOp", function() {
       return $.OR([
        {
          ALT: function () {
            $.CONSUME3(T.equals);
          }
        },
        {
          ALT: function () {
            $.CONSUME4(T.is);
          }
        }
      ]);
  });

     $.RULE("binaryFragOp", function() {
       return $.OR([
        {
          ALT: function () {
            return AST.makeNodeForToken(NT.OPContains, $.CONSUME(T.contains));
          }
        },
        {
          ALT: function () {
            return AST.makeNodeForToken(NT.OPContains, $.CONSUME1(T.containing));
          }
        },
        {
          ALT: function () {
              return AST.makeNodeForToken(NT.OPEndsWith, $.CONSUME2(T.ends_with));
          }
        },
        {
          ALT: function () {
              return AST.makeNodeForToken(NT.OPEndsWith, $.CONSUME3(T.ending_with));
          }
        },
        {
          ALT: function () {
            return AST.makeNodeForToken(NT.OPStartsWith, $.CONSUME4(T.starting_with));
          }
        },
        {
          ALT: function () {
            return AST.makeNodeForToken(NT.OPStartsWith, $.CONSUME5(T.starts_with));
          }
        }
      ]);
  });

/// Where  First (CAT  GE  X  )

    $.RULE("catSetExpression", function() {
      $.OPTION($.SUBRULE($.unarySetOp));
      $.CONSUME(T.ACategory);
    })

    //  lowest precedence thus it is first in the rule chain
    // The precedence of binary expressions is determined by how far down the Parse Tree
    // The binary expression appears.
    $.RULE("filterExpression", function() {
        var value, op, rhsVal;

        // parsing part
        value = $.SUBRULE($.catSetExpression);
        $.OR([ { ALT: function() {
          $.AT_LEAST_ON(function() {
              // consuming 'AdditionOperator' will consume either Plus or Minus as they are subclasses of AdditionOperator
              op = $.SUBRULE1($.binaryValOp);
              //  the index "2" in SUBRULE2 is needed to identify the unique position in the grammar during runtime
              rhsVal = $.CONSUME(T.AFact);
              // TODO logical expr
          });
          return value;
        }},
        { ALT: function() { $.CONSUME2(T.AFact); }
        }
        ]);
    });

/*
    $.RULE("xatomicExpression", function() {
        return $.OR([
            // parenthesisExpression has the highest precedence and thus it appears
            // in the "lowest" leaf in the expression ParseTree.
            {ALT: function() { return $.SUBRULE($.parenthesisExpression)}},
            {ALT: function() { return parseInt($.CONSUME(T.Integer).image, 10)}},
            {ALT: function() { return $.SUBRULE($.powerFunction)}}
        ]);
    });
*/

    $.RULE("parenthesisExpression", function() {
        var expValue;
        $.CONSUME(T.LParen);
        expValue = $.SUBRULE($.expression);
        $.CONSUME(T.RParen);
        return expValue
    });



    this.selectClause = $.RULE("selectClause", function () {
      $.CONSUME(T.select);
      $.AT_LEAST_ONE_SEP({
        SEP: T.Comma, DEF: function () {
          $.CONSUME(T.Identifier);
        }
      });
      return { b: 445 };
    });


    this.fromClause = $.RULE("fromClause", function () {
      $.CONSUME(T.from);
      $.CONSUME(T.Identifier);

      // example:
      // replace the contents of this rule with the commented out lines
      // below to implement multiple tables to select from (implicit join).

      // $.CONSUME(From);
      // $.AT_LEAST_ONE_SEP({
      //   SEP: Comma, DEF: function () {
      //     $.CONSUME(Identifier);
      //   }
      // });
    });


    this.fieldList = $.RULE("fieldList", function () {
      var res = [];
      $.AT_LEAST_ONE_SEP({
        SEP: T.Comma, DEF : function () {
           var atok =  $.CONSUME(T.ACategory);
          // console.log("token " + JSON.stringify(atok));
           res.push(atok);
        }
      });
      return res;
    });


    this.whereClause = $.RULE("whereClause", function () {
      $.CONSUME(T.where)
      $.SUBRULE($.expression)
    });


    this.expression = $.RULE("expression", function () {
      $.SUBRULE($.atomicExpression);
      $.SUBRULE($.relationalOperator);
      $.SUBRULE2($.atomicExpression); // note the '2' suffix to distinguish
                      // from the 'SUBRULE(atomicExpression)'
                      // 2 lines above.
    });


    this.atomicExpression = $.RULE("atomicExpression", function () {
      $.OR([
        {ALT: function () { $.CONSUME(T.Integer)}},
        {ALT: function () { $.CONSUME(T.Identifier)}}
      ]);
    });


    this.relationalOperator = $.RULE("relationalOperator", function () {
      $.OR([
        {ALT: function () { $.CONSUME(T.GT)}},
        {ALT: function () { $.CONSUME(T.LT)}}
      ]);
    });

    // very important to call this after all the rules have been defined.
    // otherwise the parser may not work correctly as it will lack information
    // derived during the self analysis phase.
    (Parser as any).performSelfAnalysis(this);
  }

  SelectParser.prototype = Object.create(Parser.prototype);
  SelectParser.prototype.constructor = SelectParser;

//
export {
   SelectLexer,
   SelectParser
   // defaultRule : "selectStatement"
};
