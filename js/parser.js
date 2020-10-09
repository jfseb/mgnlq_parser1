'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
exports.SelectParser = exports.SelectLexer = void 0;
// based on: http://en.wikibooks.org/wiki/Algorithm_implementation/Strings/Levenshtein_distance
// and:  http://en.wikipedia.org/wiki/Damerau%E2%80%93Levenshtein_distance
const chevrotain = require("chevrotain");
const AST = require("./ast");
const ast_1 = require("./ast");
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
var WhiteSpace = createToken({ name: "WhiteSpace", pattern: /\s+/ });
WhiteSpace.GROUP = Lexer.SKIPPED;
const tokens_1 = require("./tokens");
// whitespace is normally very common so it is placed first to speed up the lexer
var allTokens = Object.keys(tokens_1.Tokens).map(key => tokens_1.Tokens[key]);
/* [ FACT, And,
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
        $.CONSUME(tokens_1.Tokens.list);
        $.OPTION(() => $.CONSUME(tokens_1.Tokens.all));
        var resFieldList = $.SUBRULE($.fieldList);
        return resFieldList;
    });
    /*
        this.inDomain = $.RULE('inDomain', () => {
          $.CONSUME(T.in);
          $.CONSUME(T.domain);
          $.CONSUME(T.ADomain);
        });
    */
    /*
        this.selectStatement = $.RULE("selectStatement", function () {
          $.SUBRULE($.selectClause)
          $.SUBRULE($.fromClause)
          $.OPTION(function () {
            $.SUBRULE($.whereClause)
          });
          //console.log('returning');
          return { a: 123 };
        });
    */
    this.allClause = $.RULE('allClause', function () {
        $.SUBRULE($.catListOpMore);
    });
    this.opCat = $.RULE('opCat', function () {
        $.OR([
            { ALT: function () { return AST.makeNodeForToken(ast_1.ASTNodeType.OPFirst, $.CONSUME(tokens_1.Tokens.first)); } },
            { ALT: function () { return AST.makeNodeForToken(ast_1.ASTNodeType.OPOldest, $.CONSUME(tokens_1.Tokens.oldest)); } },
            { ALT: function () { return AST.makeNodeForToken(ast_1.ASTNodeType.OPNewest, $.CONSUME(tokens_1.Tokens.latest)); } },
            { ALT: function () { return AST.makeNodeForToken(ast_1.ASTNodeType.OPNewest, $.CONSUME(tokens_1.Tokens.newest)); } }
        ]);
    });
    this.catListOpMore = $.RULE("catListOpMore", function () {
        var r = undefined;
        $.OPTION(() => r = $.SUBRULE($.opCat));
        r = r || AST.makeNode(ast_1.ASTNodeType.OPAll);
        var catList = $.SUBRULE2($.categoryList);
        r.children = [catList];
        var inop = $.OPTION2(() => {
            var op = $.SUBRULE3($.binaryFragOp);
            var head = catList.children[catList.children.length - 1];
            op.children = [head];
            var factOrAny = $.SUBRULE4($.factOrAny);
            op.children.push(factOrAny);
            return op;
        });
        var res = $.SUBRULE($.catListTail);
        var filterDom = res[0];
        var filter = (filterDom || [])[0];
        if (!filter && inop) {
            var n = AST.makeNode(ast_1.ASTNodeType.LIST);
            n.children = [inop];
            filter = n;
        }
        else if (inop) {
            filter.children.unshift(inop);
        }
        var orderBy = res[1];
        if (orderBy)
            filter.children.push(orderBy);
        var dom = (filterDom || [])[1];
        var current = (dom) ?
            AST.makeNode(ast_1.ASTNodeType.BINOP, r, filter, dom)
            : AST.makeNode(ast_1.ASTNodeType.BINOP, r, filter);
        return current;
        /*
        var filterDom = undefined;
        $.OPTION3(() => filterDom = $.SUBRULE5($.catFilter));
        var filter = (filterDom || [])[0];
 
        if(!filter && inop) {
           var n =  AST.makeNode(NT.LIST);
           n.children = [inop];
           filter = n;
        } else if(inop) {
           filter.children.unshift(inop);
        }
        var orderBy = undefined;
        $.OPTION4(() => orderBy = $.SUBRULE6($.orderBy));
 
        var dom = (filterDom || [])[1];
        var current = (dom) ?
            AST.makeNode(NT.BINOP, r, filter, dom)
         :  AST.makeNode(NT.BINOP,r, filter);
        if(orderBy) {
           orderBy[0] = current;
           return orderBy;
        } else {
          return current;
        }
        */
    });
    this.catListTail = $.RULE("catListTail", function () {
        var filterDom = undefined;
        $.OPTION3(() => filterDom = $.SUBRULE1($.catFilter));
        var filter = (filterDom || [])[0];
        var orderBy = undefined;
        $.OPTION4(() => orderBy = $.SUBRULE2($.orderBy));
        return [filterDom, orderBy];
        /*
        if(!filter && inop) {
          var n =  AST.makeNode(NT.LIST);
          n.children = [inop];
          filter = n;
        } else if(inop) {
          filter.children.unshift(inop);
        }
        var orderBy = undefined;
        $.OPTION4(() => orderBy = $.SUBRULE6($.orderBy));

        var dom = (filterDom || [])[1];
        var current = (dom) ?
            AST.makeNode(NT.BINOP, r, filter, dom)
        :  AST.makeNode(NT.BINOP,r, filter);
        if(orderBy) {
          orderBy[0] = current;
          return orderBy;
        } else {
          return current;
        }
        */
    });
    this.filterEntry = $.RULE("filterEntry", function () {
        $.OR([
            {
                ALT: function () {
                    $.CONSUME(tokens_1.Tokens.in);
                }
            },
            {
                ALT: function () {
                    $.CONSUME(tokens_1.Tokens.with);
                }
            },
            {
                ALT: function () {
                    $.CONSUME(tokens_1.Tokens.for);
                }
            },
            {
                ALT: function () {
                    $.CONSUME(tokens_1.Tokens.relating);
                }
            }
        ]);
    });
    this.orderBy = $.RULE("orderBy", function () {
        var op = undefined;
        $.OR([
            {
                ALT: () => {
                    var tok = $.CONSUME1(tokens_1.Tokens.order_by);
                    op = AST.makeNode(ast_1.ASTNodeType.OPOrderBy);
                    op.bearer = tok;
                }
            },
            {
                ALT: () => {
                    var tok = $.CONSUME2(tokens_1.Tokens.order_descending_by);
                    op = AST.makeNode(ast_1.ASTNodeType.OPOrderDescendingBy);
                    op.bearer = tok;
                }
            }
        ]);
        var cat = $.CONSUME3(tokens_1.Tokens.CAT);
        var nodeCat = AST.makeNodeForCat(cat);
        op.children[0] = nodeCat;
        return op;
    });
    this.domOrDomainDom = $.RULE("domOrDomainDom", function () {
        $.OPTION(() => $.CONSUME(tokens_1.Tokens.domain));
        var r = $.CONSUME2(tokens_1.Tokens.DOM);
        return AST.makeNodeForDomain(r);
    });
    this.catFilter = $.RULE("catFilter", function () {
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
    this.categoryList = $.RULE("categoryList", function () {
        var r = [];
        $.AT_LEAST_ONE(() => {
            $.OPTION(() => {
                //$.CONSUME(T.Comma);
                $.OR([{ ALT: () => $.CONSUME(tokens_1.Tokens.Comma) },
                    { ALT: () => $.CONSUME(tokens_1.Tokens.and) },
                ]);
            });
            r.push(AST.makeNodeForCat($.CONSUME(tokens_1.Tokens.CAT)));
        });
        /*
        $.AT_LEAST_ONE_SEP({
          SEP: T.Comma, DEF: function () {
            r.push(AST.makeNodeForCat($.CONSUME(T.CAT)));
          }
        });
        */
        var res = AST.makeNode(ast_1.ASTNodeType.LIST);
        res.children = r;
        return res;
    });
    this.plainFact = $.RULE("plainFact", () => AST.makeNodeForFact($.CONSUME(tokens_1.Tokens.FACT)));
    this.factOrAny = $.RULE("factOrAny", () => $.OR([
        {
            ALT: function () {
                return AST.makeNodeForFact($.CONSUME1(tokens_1.Tokens.FACT));
            }
        },
        {
            ALT: function () {
                return AST.makeNodeForAny($.CONSUME2(tokens_1.Tokens.AnANY));
            }
        }
    ]));
    this.ppFactAny = $.RULE("opFactAny", function (head) {
        return $.OR([
            {
                ALT: () => {
                    var op = AST.makeNode(ast_1.ASTNodeType.OPEqIn, head);
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
    this.MoreThanLessThanExactly = $.RULE("MoreThanLessThanExactly", function () {
        return $.OR([{
                ALT: () => {
                    var tok = $.CONSUME(tokens_1.Tokens.more_than);
                    var op = AST.makeNode(ast_1.ASTNodeType.OPMoreThan);
                    op.bearer = tok;
                    var toki = $.CONSUME(tokens_1.Tokens.Integer);
                    var numberarg = AST.makeNodeForInteger(toki);
                    op.children[0] = numberarg;
                    var tokc = $.CONSUME(tokens_1.Tokens.CAT);
                    var cat = AST.makeNodeForCat(tokc);
                    op.children[1] = cat;
                    return op;
                }
            },
            {
                ALT: () => {
                    var tok = $.CONSUME(tokens_1.Tokens.less_than);
                    var op = AST.makeNode(ast_1.ASTNodeType.OPLessThan);
                    op.bearer = tok;
                    var toki = $.CONSUME2(tokens_1.Tokens.Integer);
                    var numberarg = AST.makeNodeForInteger(toki);
                    op.children[0] = numberarg;
                    var tokc = $.CONSUME2(tokens_1.Tokens.CAT);
                    var cat = AST.makeNodeForCat(tokc);
                    op.children[1] = cat;
                    return op;
                }
            },
            {
                ALT: () => {
                    var tok = $.CONSUME(tokens_1.Tokens.exactly);
                    var op = AST.makeNode(ast_1.ASTNodeType.OPExactly);
                    op.bearer = tok;
                    var toki = $.CONSUME3(tokens_1.Tokens.Integer);
                    var numberarg = AST.makeNodeForInteger(toki);
                    op.children[0] = numberarg;
                    var tokc = $.CONSUME3(tokens_1.Tokens.CAT);
                    var cat = AST.makeNodeForCat(tokc);
                    op.children[1] = cat;
                    return op;
                }
            },
            {
                ALT: () => {
                    var tok = $.CONSUME(tokens_1.Tokens.existing);
                    var op = AST.makeNode(ast_1.ASTNodeType.OPExisting);
                    op.bearer = tok;
                    var tokc = $.CONSUME4(tokens_1.Tokens.CAT);
                    var cat = AST.makeNodeForCat(tokc);
                    op.children[0] = cat;
                    return op;
                }
            },
            {
                ALT: () => {
                    var tok = $.CONSUME(tokens_1.Tokens.not_existing);
                    var op = AST.makeNode(ast_1.ASTNodeType.OPNotExisting);
                    op.bearer = tok;
                    var tokc = $.CONSUME5(tokens_1.Tokens.CAT);
                    var cat = AST.makeNodeForCat(tokc);
                    op.children[0] = cat;
                    return op;
                }
            }
            /*,
            {
              ALT: () => {
                console.log( 'token index is ' + T.less_than );
                var tok = $.CONSUME2(T.less_than);
                var op = AST.makeNode(NT.OPMoreThan);
                op.bearer = tok;
                var toki = $.CONSUME3(T.AnANY);
                var numberarg = AST.makeNodeForInteger(toki);
                op.children[0] = numberarg;
                var tokc = $.CONSUME3(T.CAT);
                var cat = AST.makeNodeForCat(tokc);
                op.children[1] = cat;
                return op;
              }
            }*/
        ]);
    });
    this.catFact = $.RULE("catFact", function () {
        return $.OR([
            {
                ALT: () => {
                    var tok = $.CONSUME(tokens_1.Tokens.CAT);
                    var head = AST.makeNodeForCat(tok);
                    var op = $.SUBRULE($.opFactAny, head);
                    op.children[0] = head;
                    return op;
                }
            },
            {
                ALT: () => {
                    return $.SUBRULE($.MoreThanLessThanExactly);
                    /*
                    console.log( 'token index is ' + T.more_than );
                    var tok = $.CONSUME(T.more_than);
                    var op = AST.makeNode(NT.OPMoreThan);
                    op.bearer = tok;
                    var toki = $.CONSUME(T.Integer);
                    var numberarg = AST.makeNodeForInteger(toki);
                    op.children[0] = numberarg;
                    var tokc = $.CONSUME2(T.CAT);
                    var cat = AST.makeNodeForCat(tokc);
                    op.children[1] = cat;
                    return op;
                    */
                }
            },
            {
                ALT: () => {
                    var op = AST.makeNode(ast_1.ASTNodeType.OPEqIn, AST.makeNode(AST.ASTNodeType.CATPH));
                    var fact = $.SUBRULE2($.plainFact);
                    op.children.push(fact);
                    return op;
                }
            }
        ]);
    });
    //
    this.commaAndListFilter = $.RULE("commaAndListFilter", function () {
        var r = [$.SUBRULE($.catFact)];
        $.MANY(() => {
            $.OPTION(() => 
            //$.CONSUME(T.Comma));
            $.OR([
                { ALT: function () { $.CONSUME(tokens_1.Tokens.Comma); } },
                { ALT: function () { $.CONSUME(tokens_1.Tokens.and); } },
                { ALT: function () { $.CONSUME(tokens_1.Tokens.or); } },
                { ALT: function () { $.CONSUME(tokens_1.Tokens.with); } }
            ]));
            r.push($.SUBRULE2($.catFact));
        });
        //onsole.log("here producing" + JSON.stringify(n));
        var n = AST.makeNode(ast_1.ASTNodeType.LIST);
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
    $.RULE("unarySetOp", function () {
        $.OR([
            {
                ALT: function () {
                    $.CONSUME(tokens_1.Tokens.all);
                }
            },
            {
                ALT: function () {
                    $.CONSUME(tokens_1.Tokens.first);
                }
            },
            {
                ALT: function () {
                    $.CONSUME(tokens_1.Tokens.newest);
                }
            },
            {
                ALT: function () {
                    $.CONSUME(tokens_1.Tokens.oldest);
                }
            },
            {
                ALT: function () {
                    $.CONSUME(tokens_1.Tokens.latest);
                }
            },
            {
                ALT: function () {
                    $.CONSUME(tokens_1.Tokens.every);
                }
            },
            {
                ALT: function () {
                    $.CONSUME(tokens_1.Tokens.any);
                }
            },
            {
                ALT: function () {
                    $.CONSUME(tokens_1.Tokens.at);
                    $.CONSUME(tokens_1.Tokens.least);
                    $.CONSUME(tokens_1.Tokens.one);
                }
            },
            {
                ALT: function () {
                    $.CONSUME(tokens_1.Tokens.last);
                }
            }
        ]);
    });
    $.RULE("binaryValOp", function () {
        return $.OR([
            {
                ALT: function () {
                    $.CONSUME3(tokens_1.Tokens.equals);
                }
            },
            {
                ALT: function () {
                    $.CONSUME4(tokens_1.Tokens.is);
                }
            }
        ]);
    });
    $.RULE("binaryFragOp", function () {
        return $.OR([
            {
                ALT: function () {
                    return AST.makeNodeForToken(ast_1.ASTNodeType.OPContains, $.CONSUME(tokens_1.Tokens.contains));
                }
            },
            {
                ALT: function () {
                    return AST.makeNodeForToken(ast_1.ASTNodeType.OPContains, $.CONSUME1(tokens_1.Tokens.containing));
                }
            },
            {
                ALT: function () {
                    return AST.makeNodeForToken(ast_1.ASTNodeType.OPEndsWith, $.CONSUME2(tokens_1.Tokens.ends_with));
                }
            },
            {
                ALT: function () {
                    return AST.makeNodeForToken(ast_1.ASTNodeType.OPEndsWith, $.CONSUME3(tokens_1.Tokens.ending_with));
                }
            },
            {
                ALT: function () {
                    return AST.makeNodeForToken(ast_1.ASTNodeType.OPStartsWith, $.CONSUME4(tokens_1.Tokens.starting_with));
                }
            },
            {
                ALT: function () {
                    return AST.makeNodeForToken(ast_1.ASTNodeType.OPStartsWith, $.CONSUME5(tokens_1.Tokens.starts_with));
                }
            },
            {
                ALT: function () {
                    return $.SUBRULE2($.opBinaryCompare);
                }
            }
        ]);
    });
    $.RULE("opBinaryCompare", function () {
        return $.OR([
            {
                ALT: function () {
                    return AST.makeNodeForToken(ast_1.ASTNodeType.OPLT, $.CONSUME1(tokens_1.Tokens.LT));
                }
            },
            {
                ALT: function () {
                    return AST.makeNodeForToken(ast_1.ASTNodeType.OPLE, $.CONSUME2(tokens_1.Tokens.LE));
                }
            },
            {
                ALT: function () {
                    return AST.makeNodeForToken(ast_1.ASTNodeType.OPGT, $.CONSUME3(tokens_1.Tokens.GT));
                }
            },
            {
                ALT: function () {
                    return AST.makeNodeForToken(ast_1.ASTNodeType.OPGE, $.CONSUME4(tokens_1.Tokens.GE));
                }
            },
            {
                ALT: function () {
                    return AST.makeNodeForToken(ast_1.ASTNodeType.OPEQ, $.CONSUME5(tokens_1.Tokens.EQ));
                }
            },
            {
                ALT: function () {
                    return AST.makeNodeForToken(ast_1.ASTNodeType.OPNE, $.CONSUME6(tokens_1.Tokens.NE));
                }
            }
        ]);
    });
    /// Where  First (CAT  GE  X  )
    /*
        $.RULE("catSetExpression", function() {
          $.OPTION($.SUBRULE($.unarySetOp));
          $.CONSUME(T.CAT);
        })
    */
    //  lowest precedence thus it is first in the rule chain
    // The precedence of binary expressions is determined by how far down the Parse Tree
    // The binary expression appears.
    /*
    $.RULE("filterExpression", function() {
        var value, op, rhsVal;

        // parsing part
        value = $.SUBRULE($.catSetExpression);
        $.OR([ { ALT: function() {
          $.AT_LEAST_O(function() {
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
    */
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
    /*
        $.RULE("parenthesisExpression", function() {
            var expValue;
            $.CONSUME(T.LParen);
            expValue = $.SUBRULE($.expression);
            $.CONSUME(T.RParen);
            return expValue
        });
    */
    /*
    
        this.selectClause = $.RULE("selectClause", function () {
          $.CONSUME(T.select);
          $.AT_LEAST_ONE_SEP({
            SEP: T.Comma, DEF: function () {
              $.CONSUME(T.Identifier);
            }
          });
          return { b: 445 };
        });
    */
    /*
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
    */
    this.fieldList = $.RULE("fieldList", function () {
        var res = [];
        $.AT_LEAST_ONE_SEP({
            SEP: tokens_1.Tokens.Comma, DEF: function () {
                var atok = $.CONSUME(tokens_1.Tokens.CAT);
                // console.log("token " + JSON.stringify(atok));
                res.push(atok);
            }
        });
        return res;
    });
    /*
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
    */
    // very important to call this after all the rules have been defined.
    // otherwise the parser may not work correctly as it will lack information
    // derived during the self analysis phase.
    Parser.performSelfAnalysis(this);
}
exports.SelectParser = SelectParser;
SelectParser.prototype = Object.create(Parser.prototype);
SelectParser.prototype.constructor = SelectParser;

//# sourceMappingURL=parser.js.map

//# sourceMappingURL=parser.js.map
