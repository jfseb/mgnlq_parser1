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

//# sourceMappingURL=data:application/json;charset=utf8;base64,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QUFJLENBQUMsQ0FBQztBQUM1QyxDQUFDO0FBUUEsb0NBQVk7QUFOYixZQUFZLENBQUMsU0FBUyxHQUFHLE1BQU0sQ0FBQyxNQUFNLENBQUMsTUFBTSxDQUFDLFNBQVMsQ0FBQyxDQUFDO0FBQ3pELFlBQVksQ0FBQyxTQUFTLENBQUMsV0FBVyxHQUFHLFlBQVksQ0FBQyIsImZpbGUiOiJwYXJzZXIuanMiLCJzb3VyY2VzQ29udGVudCI6WyIndXNlIHN0cmljdCdcclxuXHJcbi8vIGJhc2VkIG9uOiBodHRwOi8vZW4ud2lraWJvb2tzLm9yZy93aWtpL0FsZ29yaXRobV9pbXBsZW1lbnRhdGlvbi9TdHJpbmdzL0xldmVuc2h0ZWluX2Rpc3RhbmNlXHJcbi8vIGFuZDogIGh0dHA6Ly9lbi53aWtpcGVkaWEub3JnL3dpa2kvRGFtZXJhdSVFMiU4MCU5M0xldmVuc2h0ZWluX2Rpc3RhbmNlXHJcblxyXG5cclxuaW1wb3J0ICogYXMgY2hldnJvdGFpbiBmcm9tICdjaGV2cm90YWluJztcclxuaW1wb3J0ICogYXMgQVNUIGZyb20gJy4vYXN0JztcclxuXHJcbmltcG9ydCB7IEFTVE5vZGVUeXBlIGFzIE5UfSBmcm9tICcuL2FzdCc7XHJcblxyXG4gIC8vIFdyaXR0ZW4gRG9jcyBmb3IgdGhpcyB0dXRvcmlhbCBzdGVwIGNhbiBiZSBmb3VuZCBoZXJlOlxyXG4gIC8vIGh0dHBzOi8vZ2l0aHViLmNvbS9TQVAvY2hldnJvdGFpbi9ibG9iL21hc3Rlci9kb2NzL3R1dG9yaWFsL3N0ZXAyX3BhcnNpbmcubWRcclxuXHJcbiAgLy8gVHV0b3JpYWwgU3RlcCAyOlxyXG5cclxuICAvLyBBZGRpbmcgYSBQYXJzZXIgKGdyYW1tYXIgb25seSwgb25seSByZWFkcyB0aGUgaW5wdXRcclxuICAvLyB3aXRob3V0IGFueSBhY3Rpb25zKSB1c2luZyB0aGUgVG9rZW5zIGRlZmluZWQgaW4gdGhlIHByZXZpb3VzIHN0ZXAuXHJcbiAgLy8gbW9kaWZpY2F0aW9uIHRvIHRoZSBncmFtbWFyIHdpbGwgYmUgZGlzcGxheWVkIGluIHRoZSBzeW50YXggZGlhZ3JhbXMgcGFuZWwuXHJcblxyXG4vKlxyXG4gIGZ1bmN0aW9uIGEoICkgOiAge1xyXG4gICAgR1JPVVA/OiBzdHJpbmc7XHJcbiAgICBQQVRURVJOPzogUmVnRXhwO1xyXG4gICAgTEFCRUw/OiBzdHJpbmc7XHJcbiAgICBMT05HRVJfQUxUPzogY2hldnJvdGFpbi5Ub2tlbkNvbnN0cnVjdG9yO1xyXG4gICAgUE9QX01PREU/OiBib29sZWFuO1xyXG4gICAgUFVTSF9NT0RFPzogc3RyaW5nO1xyXG4gICAgdG9rZW5OYW1lPzogc3RyaW5nO1xyXG4gICAgdG9rZW5UeXBlPzogbnVtYmVyO1xyXG4gICAgZXh0ZW5kaW5nVG9rZW5UeXBlcz86IG51bWJlcltdO1xyXG4gICAgbmV3ICguLi5hcmdzOiBhbnlbXSk6IGNoZXZyb3RhaW4uSVRva2VuO1xyXG4gIH0ge1xyXG4gICAgcmV0dXJuIHsgbmV3KC4uLmFyZ3N7fSkgOiBmdW5jdGlvbigpIHtcclxuICAgICAgcmV0dXJuIHtcclxuICAgICAgICBpbWFnZSA6IFwiQWxsXCJcclxuICAgICAgfTtcclxuICAgIH1cclxuICB9O1xyXG4gIH07XHJcbiovXHJcblxyXG4gIHZhciBjcmVhdGVUb2tlbiA9IGNoZXZyb3RhaW4uY3JlYXRlVG9rZW47XHJcbiAgdmFyIExleGVyID0gY2hldnJvdGFpbi5MZXhlcjtcclxuICB2YXIgUGFyc2VyID0gY2hldnJvdGFpbi5QYXJzZXI7XHJcblxyXG4gIHZhciBXaGl0ZVNwYWNlID0gY3JlYXRlVG9rZW4oe25hbWU6IFwiV2hpdGVTcGFjZVwiLCBwYXR0ZXJuOiAvXFxzKy99KTtcclxuXHJcbiAgV2hpdGVTcGFjZS5HUk9VUCA9IExleGVyLlNLSVBQRUQ7XHJcblxyXG5cclxuaW1wb3J0IHsgT3BlcmF0b3JMb29rdXAgYXMgT0wsIFRva2VucyBhcyBUfSAgZnJvbSAnLi90b2tlbnMnO1xyXG4gIC8vIHdoaXRlc3BhY2UgaXMgbm9ybWFsbHkgdmVyeSBjb21tb24gc28gaXQgaXMgcGxhY2VkIGZpcnN0IHRvIHNwZWVkIHVwIHRoZSBsZXhlclxyXG4gIHZhciBhbGxUb2tlbnMgPSBPYmplY3Qua2V5cyhUKS5tYXAoa2V5ID0+IFRba2V5XSk7XHJcbiAgLyogWyBGQUNULCBBbmQsXHJcbiAgICBEZXNjcmliZSxcclxuICAgIEZpcnN0LCBPbGRlc3QsIExhdGVzdCwgV2hhdCxcclxuICAgIEF0LCBFdmVyeSwgQWxsLCBBdCwgTGVhc3QsIE9uZSxcclxuICAgIFRoZSxcclxuICAgIExQYXJlbiwgUlBhcmVuLFxyXG5cclxuXHJcbiAgIE1lYW5pbmcsIE9mLCBBcmUsICBJbiwgQWJvdXQsIFlvdSwgQWxsLFxyXG4gIFdoaXRlU3BhY2UsIFNlbGVjdCwgRnJvbSwgV2hlcmUsIENvbW1hLCBBQ2F0ZWdvcnksIEFsbCxcclxuICAgIExpc3QsIElkZW50aWZpZXIsIEludGVnZXIsIEdyZWF0ZXJUaGFuLCBMZXNzVGhhbiwgVG8sIFJlbGF0aW5nLCBXaXRoXTtcclxuKi9cclxuICAgIHZhciBTZWxlY3RMZXhlciA9IG5ldyBMZXhlcihhbGxUb2tlbnMpO1xyXG5cclxuICAvLyAtLS0tLS0tLS0tLS0tLS0tLSBwYXJzZXIgLS0tLS0tLS0tLS0tLS0tLS1cclxuZnVuY3Rpb24gU2VsZWN0UGFyc2VyKGlucHV0KSB7XHJcbiAgICAvLyBCeSBkZWZhdWx0IGlmIHtyZWNvdmVyeUVuYWJsZWQ6IHRydWV9IGlzIG5vdCBwYXNzZWQgaW4gdGhlIGNvbmZpZyBvYmplY3RcclxuICAgIC8vIGVycm9yIHJlY292ZXJ5IC8gZmF1bHQgdG9sZXJhbmNlIGNhcGFiaWxpdGllcyB3aWxsIGJlIGRpc2FibGVkXHJcbiAgICB2YXIgdSA9IFBhcnNlci5jYWxsKHRoaXMsIGlucHV0LCBhbGxUb2tlbnMsIHtcclxuICAgICAvLyBhdXRwdXRDc3Q6IHRydWVcclxuICAgIH0pO1xyXG5cclxuICAgIC8vY29uc29sZS5sb2codSk7XHJcbiAgICB2YXIgJCA9IHRoaXM7XHJcblxyXG4gICAgdGhpcy5saXN0QWxsID0gJC5SVUxFKCdsaXN0QWxsJywgKCkgPT4ge1xyXG4gICAgICAkLkNPTlNVTUUoVC5saXN0KTtcclxuICAgICAgJC5PUFRJT04oKCkgPT5cclxuICAgICAgICAkLkNPTlNVTUUoVC5hbGwpXHJcbiAgICAgICk7XHJcbiAgICAgIHZhciByZXNGaWVsZExpc3QgPSAkLlNVQlJVTEUoJC5maWVsZExpc3QpXHJcbiAgICAgIHJldHVybiByZXNGaWVsZExpc3Q7XHJcbiAgICB9KTtcclxuXHJcbi8qXHJcbiAgICB0aGlzLmluRG9tYWluID0gJC5SVUxFKCdpbkRvbWFpbicsICgpID0+IHtcclxuICAgICAgJC5DT05TVU1FKFQuaW4pO1xyXG4gICAgICAkLkNPTlNVTUUoVC5kb21haW4pO1xyXG4gICAgICAkLkNPTlNVTUUoVC5BRG9tYWluKTtcclxuICAgIH0pO1xyXG4qL1xyXG4vKlxyXG4gICAgdGhpcy5zZWxlY3RTdGF0ZW1lbnQgPSAkLlJVTEUoXCJzZWxlY3RTdGF0ZW1lbnRcIiwgZnVuY3Rpb24gKCkge1xyXG4gICAgICAkLlNVQlJVTEUoJC5zZWxlY3RDbGF1c2UpXHJcbiAgICAgICQuU1VCUlVMRSgkLmZyb21DbGF1c2UpXHJcbiAgICAgICQuT1BUSU9OKGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAkLlNVQlJVTEUoJC53aGVyZUNsYXVzZSlcclxuICAgICAgfSk7XHJcbiAgICAgIC8vY29uc29sZS5sb2coJ3JldHVybmluZycpO1xyXG4gICAgICByZXR1cm4geyBhOiAxMjMgfTtcclxuICAgIH0pO1xyXG4qL1xyXG5cclxuICAgIHRoaXMuYWxsQ2xhdXNlID0gJC5SVUxFKCdhbGxDbGF1c2UnLCBmdW5jdGlvbigpIHtcclxuICAgICAgJC5TVUJSVUxFKCQuY2F0TGlzdE9wTW9yZSk7XHJcbiAgICB9KTtcclxuXHJcblxyXG4gICAgdGhpcy5vcENhdCA9ICQuUlVMRSgnb3BDYXQnLCBmdW5jdGlvbigpIHtcclxuICAgICAgJC5PUihbXHJcbiAgICAgICAge0FMVDogZnVuY3Rpb24oKSB7IHJldHVybiBBU1QubWFrZU5vZGVGb3JUb2tlbihOVC5PUEZpcnN0LCAkLkNPTlNVTUUoVC5maXJzdCkpO319LFxyXG4gICAgICAgIHtBTFQ6IGZ1bmN0aW9uKCkgeyByZXR1cm4gQVNULm1ha2VOb2RlRm9yVG9rZW4oTlQuT1BPbGRlc3QsICQuQ09OU1VNRShULm9sZGVzdCkpO319LFxyXG4gICAgICAgIHtBTFQ6IGZ1bmN0aW9uKCkgeyByZXR1cm4gQVNULm1ha2VOb2RlRm9yVG9rZW4oTlQuT1BOZXdlc3QsJC5DT05TVU1FKFQubGF0ZXN0KSk7fX0sXHJcbiAgICAgICAge0FMVDogZnVuY3Rpb24oKSB7IHJldHVybiBBU1QubWFrZU5vZGVGb3JUb2tlbihOVC5PUE5ld2VzdCwkLkNPTlNVTUUoVC5uZXdlc3QpKTt9fVxyXG4gICAgICBdKVxyXG4gICAgfSk7XHJcblxyXG4gICAgdGhpcy5jYXRMaXN0T3BNb3JlID0gJC5SVUxFKFwiY2F0TGlzdE9wTW9yZVwiLCBmdW5jdGlvbigpIDogQVNULkFTVE5vZGUge1xyXG4gICAgICAgdmFyIHIgPSB1bmRlZmluZWQgYXMgQVNULkFTVE5vZGU7XHJcbiAgICAgICAkLk9QVElPTigoKSA9PlxyXG4gICAgICAgICAgciA9ICQuU1VCUlVMRSgkLm9wQ2F0KVxyXG4gICAgICAgKTtcclxuICAgICAgIHIgPSByIHx8IEFTVC5tYWtlTm9kZShOVC5PUEFsbCk7XHJcbiAgICAgICB2YXIgY2F0TGlzdCA9ICQuU1VCUlVMRTIoJC5jYXRlZ29yeUxpc3QpO1xyXG4gICAgICAgci5jaGlsZHJlbiA9IFtjYXRMaXN0XTtcclxuICAgICAgIHZhciBpbm9wID0gJC5PUFRJT04yKCgpID0+IHtcclxuICAgICAgICAgICAgdmFyIG9wID0gJC5TVUJSVUxFMygkLmJpbmFyeUZyYWdPcCk7XHJcbiAgICAgICAgICAgIHZhciBoZWFkID0gY2F0TGlzdC5jaGlsZHJlbltjYXRMaXN0LmNoaWxkcmVuLmxlbmd0aC0xXTtcclxuICAgICAgICAgICAgICBvcC5jaGlsZHJlbiA9IFtoZWFkXTtcclxuICAgICAgICAgICAgdmFyIGZhY3RPckFueSA9ICQuU1VCUlVMRTQoJC5mYWN0T3JBbnkpO1xyXG4gICAgICAgICAgICBvcC5jaGlsZHJlbi5wdXNoKGZhY3RPckFueSk7XHJcbiAgICAgICAgICAgICAgICAgIHJldHVybiBvcDtcclxuICAgICAgICB9KTtcclxuICAgICAgIHZhciByZXMgPSAkLlNVQlJVTEUoJC5jYXRMaXN0VGFpbCk7XHJcbiAgICAgICB2YXIgZmlsdGVyRG9tID0gcmVzWzBdO1xyXG4gICAgICAgdmFyIGZpbHRlciA9IChmaWx0ZXJEb20gfHwgW10pWzBdO1xyXG4gICAgICAgaWYoIWZpbHRlciAmJiBpbm9wKSB7XHJcbiAgICAgICAgICB2YXIgbiA9ICBBU1QubWFrZU5vZGUoTlQuTElTVCk7XHJcbiAgICAgICAgICBuLmNoaWxkcmVuID0gW2lub3BdO1xyXG4gICAgICAgICAgZmlsdGVyID0gbjtcclxuICAgICAgIH0gZWxzZSBpZihpbm9wKSB7XHJcbiAgICAgICAgICBmaWx0ZXIuY2hpbGRyZW4udW5zaGlmdChpbm9wKTtcclxuICAgICAgIH1cclxuICAgICAgIHZhciBvcmRlckJ5ID0gcmVzWzFdO1xyXG4gICAgICAgaWYgKCBvcmRlckJ5IClcclxuICAgICAgICAgZmlsdGVyLmNoaWxkcmVuLnB1c2gob3JkZXJCeSk7XHJcbiAgICAgICB2YXIgZG9tID0gKGZpbHRlckRvbSB8fCBbXSlbMV07XHJcbiAgICAgICB2YXIgY3VycmVudCA9IChkb20pID9cclxuICAgICAgICAgICBBU1QubWFrZU5vZGUoTlQuQklOT1AsIHIsIGZpbHRlciwgZG9tKVxyXG4gICAgICAgIDogIEFTVC5tYWtlTm9kZShOVC5CSU5PUCxyLCBmaWx0ZXIpO1xyXG4gICAgICAgcmV0dXJuIGN1cnJlbnQ7XHJcbiAgICAgICAvKlxyXG4gICAgICAgdmFyIGZpbHRlckRvbSA9IHVuZGVmaW5lZDtcclxuICAgICAgICQuT1BUSU9OMygoKSA9PiBmaWx0ZXJEb20gPSAkLlNVQlJVTEU1KCQuY2F0RmlsdGVyKSk7XHJcbiAgICAgICB2YXIgZmlsdGVyID0gKGZpbHRlckRvbSB8fCBbXSlbMF07XHJcblxyXG4gICAgICAgaWYoIWZpbHRlciAmJiBpbm9wKSB7XHJcbiAgICAgICAgICB2YXIgbiA9ICBBU1QubWFrZU5vZGUoTlQuTElTVCk7XHJcbiAgICAgICAgICBuLmNoaWxkcmVuID0gW2lub3BdO1xyXG4gICAgICAgICAgZmlsdGVyID0gbjtcclxuICAgICAgIH0gZWxzZSBpZihpbm9wKSB7XHJcbiAgICAgICAgICBmaWx0ZXIuY2hpbGRyZW4udW5zaGlmdChpbm9wKTtcclxuICAgICAgIH1cclxuICAgICAgIHZhciBvcmRlckJ5ID0gdW5kZWZpbmVkO1xyXG4gICAgICAgJC5PUFRJT040KCgpID0+IG9yZGVyQnkgPSAkLlNVQlJVTEU2KCQub3JkZXJCeSkpO1xyXG5cclxuICAgICAgIHZhciBkb20gPSAoZmlsdGVyRG9tIHx8IFtdKVsxXTtcclxuICAgICAgIHZhciBjdXJyZW50ID0gKGRvbSkgP1xyXG4gICAgICAgICAgIEFTVC5tYWtlTm9kZShOVC5CSU5PUCwgciwgZmlsdGVyLCBkb20pXHJcbiAgICAgICAgOiAgQVNULm1ha2VOb2RlKE5ULkJJTk9QLHIsIGZpbHRlcik7XHJcbiAgICAgICBpZihvcmRlckJ5KSB7XHJcbiAgICAgICAgICBvcmRlckJ5WzBdID0gY3VycmVudDtcclxuICAgICAgICAgIHJldHVybiBvcmRlckJ5O1xyXG4gICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgcmV0dXJuIGN1cnJlbnQ7XHJcbiAgICAgICB9XHJcbiAgICAgICAqL1xyXG4gICAgfSk7XHJcblxyXG4gICAgdGhpcy5jYXRMaXN0VGFpbCA9ICQuUlVMRShcImNhdExpc3RUYWlsXCIsIGZ1bmN0aW9uKCkgOiBBU1QuQVNUTm9kZVtdIHtcclxuICAgICAgICB2YXIgZmlsdGVyRG9tID0gdW5kZWZpbmVkO1xyXG4gICAgICAgICQuT1BUSU9OMygoKSA9PiBmaWx0ZXJEb20gPSAkLlNVQlJVTEUxKCQuY2F0RmlsdGVyKSk7XHJcbiAgICAgICAgdmFyIGZpbHRlciA9IChmaWx0ZXJEb20gfHwgW10pWzBdO1xyXG4gICAgICAgIHZhciBvcmRlckJ5ID0gdW5kZWZpbmVkO1xyXG4gICAgICAgICQuT1BUSU9ONCgoKSA9PiBvcmRlckJ5ID0gJC5TVUJSVUxFMigkLm9yZGVyQnkpKTtcclxuICAgICAgICByZXR1cm4gWyBmaWx0ZXJEb20sIG9yZGVyQnkgXTtcclxuICAgICAgICAvKlxyXG4gICAgICAgIGlmKCFmaWx0ZXIgJiYgaW5vcCkge1xyXG4gICAgICAgICAgdmFyIG4gPSAgQVNULm1ha2VOb2RlKE5ULkxJU1QpO1xyXG4gICAgICAgICAgbi5jaGlsZHJlbiA9IFtpbm9wXTtcclxuICAgICAgICAgIGZpbHRlciA9IG47XHJcbiAgICAgICAgfSBlbHNlIGlmKGlub3ApIHtcclxuICAgICAgICAgIGZpbHRlci5jaGlsZHJlbi51bnNoaWZ0KGlub3ApO1xyXG4gICAgICAgIH1cclxuICAgICAgICB2YXIgb3JkZXJCeSA9IHVuZGVmaW5lZDtcclxuICAgICAgICAkLk9QVElPTjQoKCkgPT4gb3JkZXJCeSA9ICQuU1VCUlVMRTYoJC5vcmRlckJ5KSk7XHJcblxyXG4gICAgICAgIHZhciBkb20gPSAoZmlsdGVyRG9tIHx8IFtdKVsxXTtcclxuICAgICAgICB2YXIgY3VycmVudCA9IChkb20pID9cclxuICAgICAgICAgICAgQVNULm1ha2VOb2RlKE5ULkJJTk9QLCByLCBmaWx0ZXIsIGRvbSlcclxuICAgICAgICA6ICBBU1QubWFrZU5vZGUoTlQuQklOT1AsciwgZmlsdGVyKTtcclxuICAgICAgICBpZihvcmRlckJ5KSB7XHJcbiAgICAgICAgICBvcmRlckJ5WzBdID0gY3VycmVudDtcclxuICAgICAgICAgIHJldHVybiBvcmRlckJ5O1xyXG4gICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICByZXR1cm4gY3VycmVudDtcclxuICAgICAgICB9XHJcbiAgICAgICAgKi9cclxuICAgIH0pO1xyXG5cclxuXHJcbiAgICB0aGlzLmZpbHRlckVudHJ5ID0gJC5SVUxFKFwiZmlsdGVyRW50cnlcIiwgZnVuY3Rpb24oKSB7XHJcbiAgICAgICQuT1IoW1xyXG4gICAgICAgIHtcclxuICAgICAgICAgIEFMVDogZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICAkLkNPTlNVTUUoVC5pbik7XHJcbiAgICAgICAgICB9XHJcbiAgICAgICAgfSxcclxuICAgICAgICB7XHJcbiAgICAgICAgICBBTFQ6IGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgICAgJC5DT05TVU1FKFQud2l0aCk7XHJcbiAgICAgICAgICB9XHJcbiAgICAgICAgfSxcclxuICAgICAgICB7XHJcbiAgICAgICAgICBBTFQ6IGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgICAgJC5DT05TVU1FKFQuZm9yKTtcclxuICAgICAgICAgIH1cclxuICAgICAgICB9LFxyXG4gICAgICAgIHtcclxuICAgICAgICAgIEFMVDogZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICAkLkNPTlNVTUUoVC5yZWxhdGluZyk7XHJcbiAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgICAgIF0pO1xyXG4gICAgfSk7XHJcblxyXG5cclxuICAgIHRoaXMub3JkZXJCeSA9ICQuUlVMRShcIm9yZGVyQnlcIiwgZnVuY3Rpb24oKSB7XHJcbiAgICAgIHZhciBvcCA9IHVuZGVmaW5lZDtcclxuICAgICAgJC5PUihbXHJcbiAgICAgICAge1xyXG4gICAgICAgIEFMVDogKCkgPT4ge1xyXG4gICAgICAgICAgdmFyIHRvayA9ICQuQ09OU1VNRTEoVC5vcmRlcl9ieSlcclxuICAgICAgICAgIG9wID0gQVNULm1ha2VOb2RlKE5ULk9QT3JkZXJCeSk7XHJcbiAgICAgICAgICBvcC5iZWFyZXIgPSB0b2s7XHJcbiAgICAgICAgfVxyXG4gICAgICB9LFxyXG4gICAgICB7XHJcbiAgICAgICAgQUxUOiAoKSA9PiB7XHJcbiAgICAgICAgdmFyIHRvayA9ICQuQ09OU1VNRTIoVC5vcmRlcl9kZXNjZW5kaW5nX2J5KVxyXG4gICAgICAgIG9wID0gQVNULm1ha2VOb2RlKE5ULk9QT3JkZXJEZXNjZW5kaW5nQnkpO1xyXG4gICAgICAgIG9wLmJlYXJlciA9IHRvaztcclxuICAgICAgfVxyXG4gICAgICB9XSk7XHJcbiAgICAgIHZhciBjYXQgPSAkLkNPTlNVTUUzKFQuQ0FUKTtcclxuICAgICAgdmFyIG5vZGVDYXQgPSBBU1QubWFrZU5vZGVGb3JDYXQoY2F0KTtcclxuICAgICAgb3AuY2hpbGRyZW5bMF0gPSBub2RlQ2F0O1xyXG4gICAgICByZXR1cm4gb3A7XHJcbiAgICB9KTtcclxuXHJcblxyXG4gICAgdGhpcy5kb21PckRvbWFpbkRvbSA9ICQuUlVMRShcImRvbU9yRG9tYWluRG9tXCIsIGZ1bmN0aW9uKCkge1xyXG4gICAgICAkLk9QVElPTigoKSA9PiAkLkNPTlNVTUUoVC5kb21haW4pKTtcclxuICAgICAgdmFyIHIgPSAkLkNPTlNVTUUyKFQuRE9NKTtcclxuICAgICAgcmV0dXJuIEFTVC5tYWtlTm9kZUZvckRvbWFpbihyKTtcclxuICAgIH0pO1xyXG5cclxuICAgIHRoaXMuY2F0RmlsdGVyID0gJC5SVUxFKFwiY2F0RmlsdGVyXCIsIGZ1bmN0aW9uKCkge1xyXG4gICAgICAgICQuU1VCUlVMRSgkLmZpbHRlckVudHJ5KTtcclxuICAgICAgICB2YXIgZG9tID0gdW5kZWZpbmVkO1xyXG4gICAgICAgIHZhciBmaWx0ZXIgPSB1bmRlZmluZWQ7XHJcbiAgICAgICAgJC5PUihbe1xyXG4gICAgICAgICAgQUxUOiAoKSA9PiB7XHJcbiAgICAgICAgICAgICAgZG9tID0gJC5TVUJSVUxFMSgkLmRvbU9yRG9tYWluRG9tKTtcclxuICAgICAgICAgICAgICAkLk9QVElPTjIoKCkgPT4ge1xyXG4gICAgICAgICAgICAgICAgJC5TVUJSVUxFMigkLmZpbHRlckVudHJ5KTtcclxuICAgICAgICAgICAgICAgIGZpbHRlciA9ICQuU1VCUlVMRTMoJC5jb21tYUFuZExpc3RGaWx0ZXIpO1xyXG4gICAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgfVxyXG4gICAgICAgIH0sXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgQUxUOiAoKSA9PiB7XHJcbiAgICAgICAgICAgIGZpbHRlciA9ICQuU1VCUlVMRTQoJC5jb21tYUFuZExpc3RGaWx0ZXIpO1xyXG4gICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgICAgICBdKTtcclxuICAgICAgICByZXR1cm4gW2ZpbHRlciwgZG9tXTtcclxuICAgIH0pO1xyXG5cclxuICAgIHRoaXMuY2F0ZWdvcnlMaXN0ID0gJC5SVUxFKFwiY2F0ZWdvcnlMaXN0XCIsIGZ1bmN0aW9uICgpIHtcclxuICAgICAgdmFyIHIgPSBbXTtcclxuICAgICAgJC5BVF9MRUFTVF9PTkUoICgpID0+IHtcclxuICAgICAgICAkLk9QVElPTiggKCkgPT4ge1xyXG4gICAgICAgICAgLy8kLkNPTlNVTUUoVC5Db21tYSk7XHJcbiAgICAgICAgICAkLk9SKFt7IEFMVDogKCk9PiAkLkNPTlNVTUUoVC5Db21tYSl9LFxyXG4gICAgICAgICAgICB7IEFMVDogKCk9PiAkLkNPTlNVTUUoVC5hbmQpfSxcclxuICAgICAgICAgIF0pXHJcbiAgICAgICAgIH0pO1xyXG4gICAgICAgIHIucHVzaChBU1QubWFrZU5vZGVGb3JDYXQoJC5DT05TVU1FKFQuQ0FUKSkpO1xyXG4gICAgICB9KTtcclxuICAgICAgLypcclxuICAgICAgJC5BVF9MRUFTVF9PTkVfU0VQKHtcclxuICAgICAgICBTRVA6IFQuQ29tbWEsIERFRjogZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgci5wdXNoKEFTVC5tYWtlTm9kZUZvckNhdCgkLkNPTlNVTUUoVC5DQVQpKSk7XHJcbiAgICAgICAgfVxyXG4gICAgICB9KTtcclxuICAgICAgKi9cclxuICAgICAgdmFyIHJlcyA9IEFTVC5tYWtlTm9kZShOVC5MSVNUKTtcclxuICAgICAgcmVzLmNoaWxkcmVuID0gcjtcclxuICAgICAgcmV0dXJuIHJlcztcclxuICAgIH0pO1xyXG5cclxuICB0aGlzLnBsYWluRmFjdCA9ICQuUlVMRShcInBsYWluRmFjdFwiLCAoKSA9PlxyXG4gICAgQVNULm1ha2VOb2RlRm9yRmFjdCgkLkNPTlNVTUUoVC5GQUNUKSlcclxuICApO1xyXG5cclxuICB0aGlzLmZhY3RPckFueSA9ICQuUlVMRShcImZhY3RPckFueVwiLCAoKSA9PlxyXG4gICAgJC5PUihbXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgQUxUOiBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgIHJldHVybiBBU1QubWFrZU5vZGVGb3JGYWN0KCQuQ09OU1VNRTEoVC5GQUNUKSk7XHJcbiAgICAgICAgICB9XHJcbiAgICAgICAgfSxcclxuICAgICAgICB7XHJcbiAgICAgICAgICBBTFQ6IGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgICAgcmV0dXJuIEFTVC5tYWtlTm9kZUZvckFueSgkLkNPTlNVTUUyKFQuQW5BTlkpKTtcclxuICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICBdKVxyXG4gICk7XHJcblxyXG4gIHRoaXMucHBGYWN0QW55ID0gJC5SVUxFKFwib3BGYWN0QW55XCIsIGZ1bmN0aW9uIChoZWFkKSB7XHJcbiAgICByZXR1cm4gJC5PUihbXHJcbiAgICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgQUxUOiAoKSA9PiB7XHJcbiAgICAgICAgICAgICAgICAgIHZhciBvcCA9IEFTVC5tYWtlTm9kZShOVC5PUEVxSW4saGVhZCk7XHJcbiAgICAgICAgICAgICAgICAgIHZhciBmYWN0ID0gJC5TVUJSVUxFKCQucGxhaW5GYWN0KTtcclxuICAgICAgICAgICAgICAgICAgb3AuY2hpbGRyZW4ucHVzaChmYWN0KTtcclxuICAgICAgICAgICAgICAgICAgcmV0dXJuIG9wO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgQUxUOiAoKSA9PiB7XHJcbiAgICAgICAgICAgICAgICAgIHZhciBvcCA9ICQuU1VCUlVMRTIoJC5iaW5hcnlWYWxPcCk7XHJcbiAgICAgICAgICAgICAgICAgIG9wLmNoaWxkcmVuID0gW2hlYWRdO1xyXG4gICAgICAgICAgICAgICAgICB2YXIgZmFjdCA9ICQuU1VCUlVMRTMoJC5wbGFpbkZhY3QpO1xyXG4gICAgICAgICAgICAgICAgICBvcC5jaGlsZHJlbi5wdXNoKGZhY3QpO1xyXG4gICAgICAgICAgICAgICAgICByZXR1cm4gb3A7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICBBTFQ6ICgpID0+IHtcclxuICAgICAgICAgICAgICAgICAgdmFyIG9wID0gJC5TVUJSVUxFNCgkLmJpbmFyeUZyYWdPcCk7XHJcbiAgICAgICAgICAgICAgICAgIG9wLmNoaWxkcmVuID0gW2hlYWRdO1xyXG4gICAgICAgICAgICAgICAgICB2YXIgZmFjdE9yQW55ID0gJC5TVUJSVUxFNSgkLmZhY3RPckFueSk7XHJcbiAgICAgICAgICAgICAgICAgIG9wLmNoaWxkcmVuLnB1c2goZmFjdE9yQW55KTtcclxuICAgICAgICAgICAgICAgICAgcmV0dXJuIG9wO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgIH1cclxuICAgICAgICBdKTtcclxuICB9KTtcclxuICAvLyBbIENBVD8gRkFDVCBdXHJcbiAgLy8gVE9ETyBDQVQgT1AgQ09OVEFJTlMgTUFOWVxyXG4gIC8vIENBVCBPUCBGQUNUXHJcbiAgLy8gRkFDVFxyXG4gIHRoaXMuTW9yZVRoYW5MZXNzVGhhbkV4YWN0bHkgPSAkLlJVTEUoXCJNb3JlVGhhbkxlc3NUaGFuRXhhY3RseVwiLCBmdW5jdGlvbiAoKSB7XHJcbiAgICByZXR1cm4gJC5PUiggWyAge1xyXG4gICAgICAgICAgQUxUOiAoKSA9PiB7XHJcbiAgICAgICAgICAgIHZhciB0b2sgPSAkLkNPTlNVTUUoVC5tb3JlX3RoYW4pO1xyXG4gICAgICAgICAgICB2YXIgb3AgPSBBU1QubWFrZU5vZGUoTlQuT1BNb3JlVGhhbik7XHJcbiAgICAgICAgICAgIG9wLmJlYXJlciA9IHRvaztcclxuICAgICAgICAgICAgdmFyIHRva2kgPSAkLkNPTlNVTUUoVC5JbnRlZ2VyKTtcclxuICAgICAgICAgICAgdmFyIG51bWJlcmFyZyA9IEFTVC5tYWtlTm9kZUZvckludGVnZXIodG9raSk7XHJcbiAgICAgICAgICAgIG9wLmNoaWxkcmVuWzBdID0gbnVtYmVyYXJnO1xyXG4gICAgICAgICAgICB2YXIgdG9rYyA9ICQuQ09OU1VNRShULkNBVCk7XHJcbiAgICAgICAgICAgIHZhciBjYXQgPSBBU1QubWFrZU5vZGVGb3JDYXQodG9rYyk7XHJcbiAgICAgICAgICAgIG9wLmNoaWxkcmVuWzFdID0gY2F0O1xyXG4gICAgICAgICAgICByZXR1cm4gb3A7XHJcbiAgICAgICAgICB9XHJcbiAgICAgICAgfSxcclxuICAgICAgICB7XHJcbiAgICAgICAgICBBTFQ6ICgpID0+IHtcclxuICAgICAgICAgICAgdmFyIHRvayA9ICQuQ09OU1VNRShULmxlc3NfdGhhbik7XHJcbiAgICAgICAgICAgIHZhciBvcCA9IEFTVC5tYWtlTm9kZShOVC5PUExlc3NUaGFuKTtcclxuICAgICAgICAgICAgb3AuYmVhcmVyID0gdG9rO1xyXG4gICAgICAgICAgICB2YXIgdG9raSA9ICQuQ09OU1VNRTIoVC5JbnRlZ2VyKTtcclxuICAgICAgICAgICAgdmFyIG51bWJlcmFyZyA9IEFTVC5tYWtlTm9kZUZvckludGVnZXIodG9raSk7XHJcbiAgICAgICAgICAgIG9wLmNoaWxkcmVuWzBdID0gbnVtYmVyYXJnO1xyXG4gICAgICAgICAgICB2YXIgdG9rYyA9ICQuQ09OU1VNRTIoVC5DQVQpO1xyXG4gICAgICAgICAgICB2YXIgY2F0ID0gQVNULm1ha2VOb2RlRm9yQ2F0KHRva2MpO1xyXG4gICAgICAgICAgICBvcC5jaGlsZHJlblsxXSA9IGNhdDtcclxuICAgICAgICAgICAgcmV0dXJuIG9wO1xyXG4gICAgICAgICAgfVxyXG4gICAgICAgIH0sXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgQUxUOiAoKSA9PiB7XHJcbiAgICAgICAgICAgIHZhciB0b2sgPSAkLkNPTlNVTUUoVC5leGFjdGx5KTtcclxuICAgICAgICAgICAgdmFyIG9wID0gQVNULm1ha2VOb2RlKE5ULk9QRXhhY3RseSk7XHJcbiAgICAgICAgICAgIG9wLmJlYXJlciA9IHRvaztcclxuICAgICAgICAgICAgdmFyIHRva2kgPSAkLkNPTlNVTUUzKFQuSW50ZWdlcik7XHJcbiAgICAgICAgICAgIHZhciBudW1iZXJhcmcgPSBBU1QubWFrZU5vZGVGb3JJbnRlZ2VyKHRva2kpO1xyXG4gICAgICAgICAgICBvcC5jaGlsZHJlblswXSA9IG51bWJlcmFyZztcclxuICAgICAgICAgICAgdmFyIHRva2MgPSAkLkNPTlNVTUUzKFQuQ0FUKTtcclxuICAgICAgICAgICAgdmFyIGNhdCA9IEFTVC5tYWtlTm9kZUZvckNhdCh0b2tjKTtcclxuICAgICAgICAgICAgb3AuY2hpbGRyZW5bMV0gPSBjYXQ7XHJcbiAgICAgICAgICAgIHJldHVybiBvcDtcclxuICAgICAgICAgIH1cclxuICAgICAgICB9LFxyXG4gICAgICAgIHtcclxuICAgICAgICAgIEFMVDogKCkgPT4ge1xyXG4gICAgICAgICAgICB2YXIgdG9rID0gJC5DT05TVU1FKFQuZXhpc3RpbmcpO1xyXG4gICAgICAgICAgICB2YXIgb3AgPSBBU1QubWFrZU5vZGUoTlQuT1BFeGlzdGluZyk7XHJcbiAgICAgICAgICAgIG9wLmJlYXJlciA9IHRvaztcclxuICAgICAgICAgICAgdmFyIHRva2MgPSAkLkNPTlNVTUU0KFQuQ0FUKTtcclxuICAgICAgICAgICAgdmFyIGNhdCA9IEFTVC5tYWtlTm9kZUZvckNhdCh0b2tjKTtcclxuICAgICAgICAgICAgb3AuY2hpbGRyZW5bMF0gPSBjYXQ7XHJcbiAgICAgICAgICAgIHJldHVybiBvcDtcclxuICAgICAgICAgIH1cclxuICAgICAgICB9LFxyXG4gICAgICAgIHtcclxuICAgICAgICAgIEFMVDogKCkgPT4ge1xyXG4gICAgICAgICAgICB2YXIgdG9rID0gJC5DT05TVU1FKFQubm90X2V4aXN0aW5nKTtcclxuICAgICAgICAgICAgdmFyIG9wID0gQVNULm1ha2VOb2RlKE5ULk9QTm90RXhpc3RpbmcpO1xyXG4gICAgICAgICAgICBvcC5iZWFyZXIgPSB0b2s7XHJcbiAgICAgICAgICAgIHZhciB0b2tjID0gJC5DT05TVU1FNShULkNBVCk7XHJcbiAgICAgICAgICAgIHZhciBjYXQgPSBBU1QubWFrZU5vZGVGb3JDYXQodG9rYyk7XHJcbiAgICAgICAgICAgIG9wLmNoaWxkcmVuWzBdID0gY2F0O1xyXG4gICAgICAgICAgICByZXR1cm4gb3A7XHJcbiAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG5cclxuXHJcblxyXG5cclxuXHJcblxyXG4gICAgICAgIC8qLFxyXG4gICAgICAgIHtcclxuICAgICAgICAgIEFMVDogKCkgPT4ge1xyXG4gICAgICAgICAgICBjb25zb2xlLmxvZyggJ3Rva2VuIGluZGV4IGlzICcgKyBULmxlc3NfdGhhbiApO1xyXG4gICAgICAgICAgICB2YXIgdG9rID0gJC5DT05TVU1FMihULmxlc3NfdGhhbik7XHJcbiAgICAgICAgICAgIHZhciBvcCA9IEFTVC5tYWtlTm9kZShOVC5PUE1vcmVUaGFuKTtcclxuICAgICAgICAgICAgb3AuYmVhcmVyID0gdG9rO1xyXG4gICAgICAgICAgICB2YXIgdG9raSA9ICQuQ09OU1VNRTMoVC5BbkFOWSk7XHJcbiAgICAgICAgICAgIHZhciBudW1iZXJhcmcgPSBBU1QubWFrZU5vZGVGb3JJbnRlZ2VyKHRva2kpO1xyXG4gICAgICAgICAgICBvcC5jaGlsZHJlblswXSA9IG51bWJlcmFyZztcclxuICAgICAgICAgICAgdmFyIHRva2MgPSAkLkNPTlNVTUUzKFQuQ0FUKTtcclxuICAgICAgICAgICAgdmFyIGNhdCA9IEFTVC5tYWtlTm9kZUZvckNhdCh0b2tjKTtcclxuICAgICAgICAgICAgb3AuY2hpbGRyZW5bMV0gPSBjYXQ7XHJcbiAgICAgICAgICAgIHJldHVybiBvcDtcclxuICAgICAgICAgIH1cclxuICAgICAgICB9Ki9cclxuICAgICAgXSk7XHJcbiAgIH0pO1xyXG5cclxuXHJcbiAgIHRoaXMuY2F0RmFjdCA9ICQuUlVMRShcImNhdEZhY3RcIiwgZnVuY3Rpb24gKCkge1xyXG4gICAgcmV0dXJuICQuT1IoW1xyXG4gICAgICAgIHtcclxuICAgICAgICAgIEFMVDogKCkgPT4ge1xyXG4gICAgICAgICAgICB2YXIgdG9rID0gJC5DT05TVU1FKFQuQ0FUKTtcclxuICAgICAgICAgICAgdmFyIGhlYWQgPSBBU1QubWFrZU5vZGVGb3JDYXQodG9rKTtcclxuICAgICAgICAgICAgdmFyIG9wID0gJC5TVUJSVUxFKCQub3BGYWN0QW55LCBoZWFkKTtcclxuICAgICAgICAgICAgb3AuY2hpbGRyZW5bMF0gPSBoZWFkO1xyXG4gICAgICAgICAgICByZXR1cm4gb3A7XHJcbiAgICAgICAgICB9XHJcbiAgICAgICAgfSxcclxuICAgICAgICB7XHJcbiAgICAgICAgICBBTFQ6ICgpID0+IHtcclxuICAgICAgICAgICAgcmV0dXJuICAkLlNVQlJVTEUoJC5Nb3JlVGhhbkxlc3NUaGFuRXhhY3RseSk7XHJcbiAgICAgICAgICAgIC8qXHJcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKCAndG9rZW4gaW5kZXggaXMgJyArIFQubW9yZV90aGFuICk7XHJcbiAgICAgICAgICAgIHZhciB0b2sgPSAkLkNPTlNVTUUoVC5tb3JlX3RoYW4pO1xyXG4gICAgICAgICAgICB2YXIgb3AgPSBBU1QubWFrZU5vZGUoTlQuT1BNb3JlVGhhbik7XHJcbiAgICAgICAgICAgIG9wLmJlYXJlciA9IHRvaztcclxuICAgICAgICAgICAgdmFyIHRva2kgPSAkLkNPTlNVTUUoVC5JbnRlZ2VyKTtcclxuICAgICAgICAgICAgdmFyIG51bWJlcmFyZyA9IEFTVC5tYWtlTm9kZUZvckludGVnZXIodG9raSk7XHJcbiAgICAgICAgICAgIG9wLmNoaWxkcmVuWzBdID0gbnVtYmVyYXJnO1xyXG4gICAgICAgICAgICB2YXIgdG9rYyA9ICQuQ09OU1VNRTIoVC5DQVQpO1xyXG4gICAgICAgICAgICB2YXIgY2F0ID0gQVNULm1ha2VOb2RlRm9yQ2F0KHRva2MpO1xyXG4gICAgICAgICAgICBvcC5jaGlsZHJlblsxXSA9IGNhdDtcclxuICAgICAgICAgICAgcmV0dXJuIG9wO1xyXG4gICAgICAgICAgICAqL1xyXG4gICAgICAgICAgfVxyXG4gICAgICAgIH0sXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgQUxUOiAoKSA9PiB7XHJcbiAgICAgICAgICAgIHZhciBvcCA9IEFTVC5tYWtlTm9kZShOVC5PUEVxSW4sXHJcbiAgICAgICAgICAgICAgQVNULm1ha2VOb2RlKEFTVC5BU1ROb2RlVHlwZS5DQVRQSCkpO1xyXG4gICAgICAgICAgICB2YXIgZmFjdCA9ICQuU1VCUlVMRTIoJC5wbGFpbkZhY3QpO1xyXG4gICAgICAgICAgICBvcC5jaGlsZHJlbi5wdXNoKGZhY3QpO1xyXG4gICAgICAgICAgICByZXR1cm4gb3A7XHJcbiAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgICBdKTtcclxuICAgfSk7XHJcblxyXG4vL1xyXG5cclxuIHRoaXMuY29tbWFBbmRMaXN0RmlsdGVyID0gJC5SVUxFKFwiY29tbWFBbmRMaXN0RmlsdGVyXCIsIGZ1bmN0aW9uICgpIHtcclxuICAgICAgdmFyIHIgPSBbJC5TVUJSVUxFKCQuY2F0RmFjdCldO1xyXG4gICAgICAkLk1BTlkoICgpID0+IHtcclxuICAgICAgICAkLk9QVElPTiggKCkgPT5cclxuICAgICAgICAgIC8vJC5DT05TVU1FKFQuQ29tbWEpKTtcclxuICAgICAgICAgICQuT1IoIFtcclxuICAgICAgICAgICAgeyBBTFQ6IGZ1bmN0aW9uKCkgeyAkLkNPTlNVTUUoVC5Db21tYSk7IH19LFxyXG4gICAgICAgICAgICB7IEFMVDogZnVuY3Rpb24oKSB7ICQuQ09OU1VNRShULmFuZCk7IH19LCAvLyBub3QgYSBsb2dpY2FsIGFuZCB5ZXRcclxuICAgICAgICAgICAgeyBBTFQ6IGZ1bmN0aW9uKCkgeyAkLkNPTlNVTUUoVC5vcik7IH19LCAvL25vdCBsb2dpY2FsIG9yIHlldFxyXG4gICAgICAgICAgICB7IEFMVDogZnVuY3Rpb24oKSB7ICQuQ09OU1VNRShULndpdGgpOyB9fVxyXG4gICAgICAgICAgXSlcclxuICAgICAgICApXHJcbiAgICAgICAgci5wdXNoKCQuU1VCUlVMRTIoJC5jYXRGYWN0KSk7XHJcbiAgICAgIH0pO1xyXG4gICAgICAvL29uc29sZS5sb2coXCJoZXJlIHByb2R1Y2luZ1wiICsgSlNPTi5zdHJpbmdpZnkobikpO1xyXG4gICAgICB2YXIgbiA9ICBBU1QubWFrZU5vZGUoTlQuTElTVCk7XHJcbiAgICAgIG4uY2hpbGRyZW4gPSByO1xyXG4gICAgICByZXR1cm4gbjtcclxuICAgIH0pO1xyXG4vKlxyXG4gIHRoaXMuY29tbWFBbmRMaXN0VGFpbCA9ICQuUlVMRShcImNvbW1hQW5kTGlzdFRhaWxcIiwgZnVuY3Rpb24gKCkge1xyXG4gICAgICAvLyQuU1VCUlVMRSgkLmNhdEZhY3QpO1xyXG4gICAgICAkLk1BTlkoICgpID0+IHtcclxuICAgICAgICAkLkNPTlNVTUUoVC5Db21tYSk7XHJcbiAgICAgICAgLyogJC5PUiggW1xyXG4gICAgICAgICAgeyBBTFQ6IGZ1bmN0aW9uKCkgeyAkLkNPTlNVTUUoQ29tbWEpOyB9fSxcclxuICAgICAgICAgIHsgQUxUOiBmdW5jdGlvbigpIHsgJC5DT05TVU1FKEFuZCk7IH19XHJcbiAgICAgICAgXSk7ICogL1xyXG4gICAgICAgICQuU1VCUlVMRSgkLmNhdEZhY3QpO1xyXG4gICAgICB9KTtcclxuICAgICAgcmV0dXJuIHsgYjogNDQ1IH07XHJcbiAgICB9KTtcclxuKi9cclxuICAgICQuUlVMRShcInVuYXJ5U2V0T3BcIiwgZnVuY3Rpb24oKSB7XHJcbiAgICAgICAkLk9SKFtcclxuICAgICAgICB7XHJcbiAgICAgICAgICBBTFQ6IGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgICAgJC5DT05TVU1FKFQuYWxsKTtcclxuICAgICAgICAgIH1cclxuICAgICAgICB9LFxyXG4gICAgICAgIHtcclxuICAgICAgICAgIEFMVDogZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICAkLkNPTlNVTUUoVC5maXJzdCk7XHJcbiAgICAgICAgICB9XHJcbiAgICAgICAgfSxcclxuICAgICAgICB7XHJcbiAgICAgICAgICBBTFQ6IGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgICAgJC5DT05TVU1FKFQubmV3ZXN0KTtcclxuICAgICAgICAgIH1cclxuICAgICAgICB9LFxyXG4gICAgICAgIHtcclxuICAgICAgICAgIEFMVDogZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICAkLkNPTlNVTUUoVC5vbGRlc3QpO1xyXG4gICAgICAgICAgfVxyXG4gICAgICAgIH0sXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgQUxUOiBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgICQuQ09OU1VNRShULmxhdGVzdCk7XHJcbiAgICAgICAgICB9XHJcbiAgICAgICAgfSxcclxuICAgICAgICB7XHJcbiAgICAgICAgICBBTFQ6IGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgICAgJC5DT05TVU1FKFQuZXZlcnkpO1xyXG4gICAgICAgICAgfVxyXG4gICAgICAgIH0sXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgQUxUOiBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgICQuQ09OU1VNRShULmFueSk7XHJcbiAgICAgICAgICB9XHJcbiAgICAgICAgfSxcclxuICAgICAgICB7XHJcbiAgICAgICAgICBBTFQ6IGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgICAgJC5DT05TVU1FKFQuYXQpO1xyXG4gICAgICAgICAgICAkLkNPTlNVTUUoVC5sZWFzdCk7XHJcbiAgICAgICAgICAgICQuQ09OU1VNRShULm9uZSk7XHJcbiAgICAgICAgICB9XHJcbiAgICAgICAgfSxcclxuXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgQUxUOiBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgICQuQ09OU1VNRShULmxhc3QpO1xyXG4gICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgICAgXSk7XHJcbiAgfSk7XHJcblxyXG4gICAgICQuUlVMRShcImJpbmFyeVZhbE9wXCIsIGZ1bmN0aW9uKCkge1xyXG4gICAgICAgcmV0dXJuICQuT1IoW1xyXG4gICAgICAgIHtcclxuICAgICAgICAgIEFMVDogZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICAkLkNPTlNVTUUzKFQuZXF1YWxzKTtcclxuICAgICAgICAgIH1cclxuICAgICAgICB9LFxyXG4gICAgICAgIHtcclxuICAgICAgICAgIEFMVDogZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICAkLkNPTlNVTUU0KFQuaXMpO1xyXG4gICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgIF0pO1xyXG4gIH0pO1xyXG5cclxuICAkLlJVTEUoXCJiaW5hcnlGcmFnT3BcIiwgZnVuY3Rpb24oKSB7XHJcbiAgICByZXR1cm4gJC5PUihbXHJcbiAgICB7XHJcbiAgICAgIEFMVDogZnVuY3Rpb24gKCkge1xyXG4gICAgICAgIHJldHVybiBBU1QubWFrZU5vZGVGb3JUb2tlbihOVC5PUENvbnRhaW5zLCAkLkNPTlNVTUUoVC5jb250YWlucykpO1xyXG4gICAgICB9XHJcbiAgICB9LFxyXG4gICAge1xyXG4gICAgICBBTFQ6IGZ1bmN0aW9uICgpIHtcclxuICAgICAgICByZXR1cm4gQVNULm1ha2VOb2RlRm9yVG9rZW4oTlQuT1BDb250YWlucywgJC5DT05TVU1FMShULmNvbnRhaW5pbmcpKTtcclxuICAgICAgfVxyXG4gICAgfSxcclxuICAgIHtcclxuICAgICAgQUxUOiBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICByZXR1cm4gQVNULm1ha2VOb2RlRm9yVG9rZW4oTlQuT1BFbmRzV2l0aCwgJC5DT05TVU1FMihULmVuZHNfd2l0aCkpO1xyXG4gICAgICB9XHJcbiAgICB9LFxyXG4gICAge1xyXG4gICAgICBBTFQ6IGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgIHJldHVybiBBU1QubWFrZU5vZGVGb3JUb2tlbihOVC5PUEVuZHNXaXRoLCAkLkNPTlNVTUUzKFQuZW5kaW5nX3dpdGgpKTtcclxuICAgICAgfVxyXG4gICAgfSxcclxuICAgIHtcclxuICAgICAgQUxUOiBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgcmV0dXJuIEFTVC5tYWtlTm9kZUZvclRva2VuKE5ULk9QU3RhcnRzV2l0aCwgJC5DT05TVU1FNChULnN0YXJ0aW5nX3dpdGgpKTtcclxuICAgICAgfVxyXG4gICAgfSxcclxuICAgIHtcclxuICAgICAgQUxUOiBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgcmV0dXJuIEFTVC5tYWtlTm9kZUZvclRva2VuKE5ULk9QU3RhcnRzV2l0aCwgJC5DT05TVU1FNShULnN0YXJ0c193aXRoKSk7XHJcbiAgICAgIH1cclxuICAgIH0sXHJcbiAgICB7XHJcbiAgICAgIEFMVDogZnVuY3Rpb24gKCkge1xyXG4gICAgICAgIHJldHVybiAkLlNVQlJVTEUyKCQub3BCaW5hcnlDb21wYXJlKTtcclxuICAgICAgfVxyXG4gICAgfVxyXG4gIF0pO1xyXG59KTtcclxuXHJcbiQuUlVMRShcIm9wQmluYXJ5Q29tcGFyZVwiLCBmdW5jdGlvbigpIHtcclxuICByZXR1cm4gJC5PUihbXHJcbiAge1xyXG4gICAgQUxUOiBmdW5jdGlvbiAoKSB7XHJcbiAgICAgIHJldHVybiBBU1QubWFrZU5vZGVGb3JUb2tlbihOVC5PUExULCAkLkNPTlNVTUUxKFQuTFQpKTtcclxuICAgIH1cclxuICB9LFxyXG4gIHtcclxuICAgIEFMVDogZnVuY3Rpb24gKCkge1xyXG4gICAgICByZXR1cm4gQVNULm1ha2VOb2RlRm9yVG9rZW4oTlQuT1BMRSwgJC5DT05TVU1FMihULkxFKSk7XHJcbiAgICB9XHJcbiAgfSxcclxuICB7XHJcbiAgICBBTFQ6IGZ1bmN0aW9uICgpIHtcclxuICAgICAgcmV0dXJuIEFTVC5tYWtlTm9kZUZvclRva2VuKE5ULk9QR1QsICQuQ09OU1VNRTMoVC5HVCkpO1xyXG4gICAgfVxyXG4gIH0sXHJcbiAge1xyXG4gICAgQUxUOiBmdW5jdGlvbiAoKSB7XHJcbiAgICAgIHJldHVybiBBU1QubWFrZU5vZGVGb3JUb2tlbihOVC5PUEdFLCAkLkNPTlNVTUU0KFQuR0UpKTtcclxuICAgIH1cclxuICB9LFxyXG4gIHtcclxuICAgIEFMVDogZnVuY3Rpb24gKCkge1xyXG4gICAgICByZXR1cm4gQVNULm1ha2VOb2RlRm9yVG9rZW4oTlQuT1BFUSwgJC5DT05TVU1FNShULkVRKSk7XHJcbiAgICB9XHJcbiAgfSxcclxuICB7XHJcbiAgICBBTFQ6IGZ1bmN0aW9uICgpIHtcclxuICAgICAgcmV0dXJuIEFTVC5tYWtlTm9kZUZvclRva2VuKE5ULk9QTkUsICQuQ09OU1VNRTYoVC5ORSkpO1xyXG4gICAgfVxyXG4gIH1cclxuICBdKTtcclxufSk7XHJcblxyXG5cclxuLy8vIFdoZXJlICBGaXJzdCAoQ0FUICBHRSAgWCAgKVxyXG5cclxuLypcclxuICAgICQuUlVMRShcImNhdFNldEV4cHJlc3Npb25cIiwgZnVuY3Rpb24oKSB7XHJcbiAgICAgICQuT1BUSU9OKCQuU1VCUlVMRSgkLnVuYXJ5U2V0T3ApKTtcclxuICAgICAgJC5DT05TVU1FKFQuQ0FUKTtcclxuICAgIH0pXHJcbiovXHJcbiAgICAvLyAgbG93ZXN0IHByZWNlZGVuY2UgdGh1cyBpdCBpcyBmaXJzdCBpbiB0aGUgcnVsZSBjaGFpblxyXG4gICAgLy8gVGhlIHByZWNlZGVuY2Ugb2YgYmluYXJ5IGV4cHJlc3Npb25zIGlzIGRldGVybWluZWQgYnkgaG93IGZhciBkb3duIHRoZSBQYXJzZSBUcmVlXHJcbiAgICAvLyBUaGUgYmluYXJ5IGV4cHJlc3Npb24gYXBwZWFycy5cclxuXHJcbiAgICAvKlxyXG4gICAgJC5SVUxFKFwiZmlsdGVyRXhwcmVzc2lvblwiLCBmdW5jdGlvbigpIHtcclxuICAgICAgICB2YXIgdmFsdWUsIG9wLCByaHNWYWw7XHJcblxyXG4gICAgICAgIC8vIHBhcnNpbmcgcGFydFxyXG4gICAgICAgIHZhbHVlID0gJC5TVUJSVUxFKCQuY2F0U2V0RXhwcmVzc2lvbik7XHJcbiAgICAgICAgJC5PUihbIHsgQUxUOiBmdW5jdGlvbigpIHtcclxuICAgICAgICAgICQuQVRfTEVBU1RfTyhmdW5jdGlvbigpIHtcclxuICAgICAgICAgICAgICAvLyBjb25zdW1pbmcgJ0FkZGl0aW9uT3BlcmF0b3InIHdpbGwgY29uc3VtZSBlaXRoZXIgUGx1cyBvciBNaW51cyBhcyB0aGV5IGFyZSBzdWJjbGFzc2VzIG9mIEFkZGl0aW9uT3BlcmF0b3JcclxuICAgICAgICAgICAgICBvcCA9ICQuU1VCUlVMRTEoJC5iaW5hcnlWYWxPcCk7XHJcbiAgICAgICAgICAgICAgLy8gIHRoZSBpbmRleCBcIjJcIiBpbiBTVUJSVUxFMiBpcyBuZWVkZWQgdG8gaWRlbnRpZnkgdGhlIHVuaXF1ZSBwb3NpdGlvbiBpbiB0aGUgZ3JhbW1hciBkdXJpbmcgcnVudGltZVxyXG4gICAgICAgICAgICAgIHJoc1ZhbCA9ICQuQ09OU1VNRShULkFGYWN0KTtcclxuICAgICAgICAgICAgICAvLyBUT0RPIGxvZ2ljYWwgZXhwclxyXG4gICAgICAgICAgfSk7XHJcbiAgICAgICAgICByZXR1cm4gdmFsdWU7XHJcbiAgICAgICAgfX0sXHJcbiAgICAgICAgeyBBTFQ6IGZ1bmN0aW9uKCkgeyAkLkNPTlNVTUUyKFQuQUZhY3QpOyB9XHJcbiAgICAgICAgfVxyXG4gICAgICAgIF0pO1xyXG4gICAgfSk7XHJcbiAgICAqL1xyXG5cclxuLypcclxuICAgICQuUlVMRShcInhhdG9taWNFeHByZXNzaW9uXCIsIGZ1bmN0aW9uKCkge1xyXG4gICAgICAgIHJldHVybiAkLk9SKFtcclxuICAgICAgICAgICAgLy8gcGFyZW50aGVzaXNFeHByZXNzaW9uIGhhcyB0aGUgaGlnaGVzdCBwcmVjZWRlbmNlIGFuZCB0aHVzIGl0IGFwcGVhcnNcclxuICAgICAgICAgICAgLy8gaW4gdGhlIFwibG93ZXN0XCIgbGVhZiBpbiB0aGUgZXhwcmVzc2lvbiBQYXJzZVRyZWUuXHJcbiAgICAgICAgICAgIHtBTFQ6IGZ1bmN0aW9uKCkgeyByZXR1cm4gJC5TVUJSVUxFKCQucGFyZW50aGVzaXNFeHByZXNzaW9uKX19LFxyXG4gICAgICAgICAgICB7QUxUOiBmdW5jdGlvbigpIHsgcmV0dXJuIHBhcnNlSW50KCQuQ09OU1VNRShULkludGVnZXIpLmltYWdlLCAxMCl9fSxcclxuICAgICAgICAgICAge0FMVDogZnVuY3Rpb24oKSB7IHJldHVybiAkLlNVQlJVTEUoJC5wb3dlckZ1bmN0aW9uKX19XHJcbiAgICAgICAgXSk7XHJcbiAgICB9KTtcclxuKi9cclxuXHJcbi8qXHJcbiAgICAkLlJVTEUoXCJwYXJlbnRoZXNpc0V4cHJlc3Npb25cIiwgZnVuY3Rpb24oKSB7XHJcbiAgICAgICAgdmFyIGV4cFZhbHVlO1xyXG4gICAgICAgICQuQ09OU1VNRShULkxQYXJlbik7XHJcbiAgICAgICAgZXhwVmFsdWUgPSAkLlNVQlJVTEUoJC5leHByZXNzaW9uKTtcclxuICAgICAgICAkLkNPTlNVTUUoVC5SUGFyZW4pO1xyXG4gICAgICAgIHJldHVybiBleHBWYWx1ZVxyXG4gICAgfSk7XHJcbiovXHJcbi8qXHJcblxyXG4gICAgdGhpcy5zZWxlY3RDbGF1c2UgPSAkLlJVTEUoXCJzZWxlY3RDbGF1c2VcIiwgZnVuY3Rpb24gKCkge1xyXG4gICAgICAkLkNPTlNVTUUoVC5zZWxlY3QpO1xyXG4gICAgICAkLkFUX0xFQVNUX09ORV9TRVAoe1xyXG4gICAgICAgIFNFUDogVC5Db21tYSwgREVGOiBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAkLkNPTlNVTUUoVC5JZGVudGlmaWVyKTtcclxuICAgICAgICB9XHJcbiAgICAgIH0pO1xyXG4gICAgICByZXR1cm4geyBiOiA0NDUgfTtcclxuICAgIH0pO1xyXG4qL1xyXG5cclxuLypcclxuICAgIHRoaXMuZnJvbUNsYXVzZSA9ICQuUlVMRShcImZyb21DbGF1c2VcIiwgZnVuY3Rpb24gKCkge1xyXG4gICAgICAkLkNPTlNVTUUoVC5mcm9tKTtcclxuICAgICAgJC5DT05TVU1FKFQuSWRlbnRpZmllcik7XHJcblxyXG4gICAgICAvLyBleGFtcGxlOlxyXG4gICAgICAvLyByZXBsYWNlIHRoZSBjb250ZW50cyBvZiB0aGlzIHJ1bGUgd2l0aCB0aGUgY29tbWVudGVkIG91dCBsaW5lc1xyXG4gICAgICAvLyBiZWxvdyB0byBpbXBsZW1lbnQgbXVsdGlwbGUgdGFibGVzIHRvIHNlbGVjdCBmcm9tIChpbXBsaWNpdCBqb2luKS5cclxuXHJcbiAgICAgIC8vICQuQ09OU1VNRShGcm9tKTtcclxuICAgICAgLy8gJC5BVF9MRUFTVF9PTkVfU0VQKHtcclxuICAgICAgLy8gICBTRVA6IENvbW1hLCBERUY6IGZ1bmN0aW9uICgpIHtcclxuICAgICAgLy8gICAgICQuQ09OU1VNRShJZGVudGlmaWVyKTtcclxuICAgICAgLy8gICB9XHJcbiAgICAgIC8vIH0pO1xyXG4gICAgfSk7XHJcbiovXHJcblxyXG4gICAgdGhpcy5maWVsZExpc3QgPSAkLlJVTEUoXCJmaWVsZExpc3RcIiwgZnVuY3Rpb24gKCkge1xyXG4gICAgICB2YXIgcmVzID0gW107XHJcbiAgICAgICQuQVRfTEVBU1RfT05FX1NFUCh7XHJcbiAgICAgICAgU0VQOiBULkNvbW1hLCBERUYgOiBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgdmFyIGF0b2sgPSAgJC5DT05TVU1FKFQuQ0FUKTtcclxuICAgICAgICAgIC8vIGNvbnNvbGUubG9nKFwidG9rZW4gXCIgKyBKU09OLnN0cmluZ2lmeShhdG9rKSk7XHJcbiAgICAgICAgICAgcmVzLnB1c2goYXRvayk7XHJcbiAgICAgICAgfVxyXG4gICAgICB9KTtcclxuICAgICAgcmV0dXJuIHJlcztcclxuICAgIH0pO1xyXG5cclxuLypcclxuICAgIHRoaXMud2hlcmVDbGF1c2UgPSAkLlJVTEUoXCJ3aGVyZUNsYXVzZVwiLCBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICQuQ09OU1VNRShULndoZXJlKVxyXG4gICAgICAkLlNVQlJVTEUoJC5leHByZXNzaW9uKVxyXG4gICAgfSk7XHJcblxyXG5cclxuICAgIHRoaXMuZXhwcmVzc2lvbiA9ICQuUlVMRShcImV4cHJlc3Npb25cIiwgZnVuY3Rpb24gKCkge1xyXG4gICAgICAkLlNVQlJVTEUoJC5hdG9taWNFeHByZXNzaW9uKTtcclxuICAgICAgJC5TVUJSVUxFKCQucmVsYXRpb25hbE9wZXJhdG9yKTtcclxuICAgICAgJC5TVUJSVUxFMigkLmF0b21pY0V4cHJlc3Npb24pOyAvLyBub3RlIHRoZSAnMicgc3VmZml4IHRvIGRpc3Rpbmd1aXNoXHJcbiAgICAgICAgICAgICAgICAgICAgICAvLyBmcm9tIHRoZSAnU1VCUlVMRShhdG9taWNFeHByZXNzaW9uKSdcclxuICAgICAgICAgICAgICAgICAgICAgIC8vIDIgbGluZXMgYWJvdmUuXHJcbiAgICB9KTtcclxuXHJcblxyXG4gICAgdGhpcy5hdG9taWNFeHByZXNzaW9uID0gJC5SVUxFKFwiYXRvbWljRXhwcmVzc2lvblwiLCBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICQuT1IoW1xyXG4gICAgICAgIHtBTFQ6IGZ1bmN0aW9uICgpIHsgJC5DT05TVU1FKFQuSW50ZWdlcil9fSxcclxuICAgICAgICB7QUxUOiBmdW5jdGlvbiAoKSB7ICQuQ09OU1VNRShULklkZW50aWZpZXIpfX1cclxuICAgICAgXSk7XHJcbiAgICB9KTtcclxuXHJcblxyXG4gICAgdGhpcy5yZWxhdGlvbmFsT3BlcmF0b3IgPSAkLlJVTEUoXCJyZWxhdGlvbmFsT3BlcmF0b3JcIiwgZnVuY3Rpb24gKCkge1xyXG4gICAgICAkLk9SKFtcclxuICAgICAgICB7QUxUOiBmdW5jdGlvbiAoKSB7ICQuQ09OU1VNRShULkdUKX19LFxyXG4gICAgICAgIHtBTFQ6IGZ1bmN0aW9uICgpIHsgJC5DT05TVU1FKFQuTFQpfX1cclxuICAgICAgXSk7XHJcbiAgICB9KTtcclxuKi9cclxuICAgIC8vIHZlcnkgaW1wb3J0YW50IHRvIGNhbGwgdGhpcyBhZnRlciBhbGwgdGhlIHJ1bGVzIGhhdmUgYmVlbiBkZWZpbmVkLlxyXG4gICAgLy8gb3RoZXJ3aXNlIHRoZSBwYXJzZXIgbWF5IG5vdCB3b3JrIGNvcnJlY3RseSBhcyBpdCB3aWxsIGxhY2sgaW5mb3JtYXRpb25cclxuICAgIC8vIGRlcml2ZWQgZHVyaW5nIHRoZSBzZWxmIGFuYWx5c2lzIHBoYXNlLlxyXG4gICAgKFBhcnNlciBhcyBhbnkpLnBlcmZvcm1TZWxmQW5hbHlzaXModGhpcyk7XHJcbiAgfVxyXG5cclxuICBTZWxlY3RQYXJzZXIucHJvdG90eXBlID0gT2JqZWN0LmNyZWF0ZShQYXJzZXIucHJvdG90eXBlKTtcclxuICBTZWxlY3RQYXJzZXIucHJvdG90eXBlLmNvbnN0cnVjdG9yID0gU2VsZWN0UGFyc2VyO1xyXG5cclxuLy9cclxuZXhwb3J0IHtcclxuICAgU2VsZWN0TGV4ZXIsXHJcbiAgIFNlbGVjdFBhcnNlclxyXG4gICAvLyBkZWZhdWx0UnVsZSA6IFwic2VsZWN0U3RhdGVtZW50XCJcclxufTtcclxuIl19
