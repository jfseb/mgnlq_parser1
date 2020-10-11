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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicGFyc2VyLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vc3JjL3BhcnNlci50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQSxZQUFZLENBQUE7OztBQUVaLCtGQUErRjtBQUMvRiwwRUFBMEU7QUFHMUUseUNBQXlDO0FBQ3pDLDZCQUE2QjtBQUU3QiwrQkFBeUM7QUFFdkMseURBQXlEO0FBQ3pELCtFQUErRTtBQUUvRSxtQkFBbUI7QUFFbkIsc0RBQXNEO0FBQ3RELHNFQUFzRTtBQUN0RSw4RUFBOEU7QUFFaEY7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0VBb0JFO0FBRUEsSUFBSSxXQUFXLEdBQUcsVUFBVSxDQUFDLFdBQVcsQ0FBQztBQUN6QyxJQUFJLEtBQUssR0FBRyxVQUFVLENBQUMsS0FBSyxDQUFDO0FBQzdCLElBQUksTUFBTSxHQUFHLFVBQVUsQ0FBQyxNQUFNLENBQUM7QUFFL0IsSUFBSSxVQUFVLEdBQUcsV0FBVyxDQUFDLEVBQUMsSUFBSSxFQUFFLFlBQVksRUFBRSxPQUFPLEVBQUUsS0FBSyxFQUFDLENBQUMsQ0FBQztBQUVuRSxVQUFVLENBQUMsS0FBSyxHQUFHLEtBQUssQ0FBQyxPQUFPLENBQUM7QUFHbkMscUNBQTZEO0FBQzNELGlGQUFpRjtBQUNqRixJQUFJLFNBQVMsR0FBRyxNQUFNLENBQUMsSUFBSSxDQUFDLGVBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLGVBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDO0FBQ2xEOzs7Ozs7Ozs7OztFQVdBO0FBQ0UsSUFBSSxXQUFXLEdBQUcsSUFBSSxLQUFLLENBQUMsU0FBUyxDQUFDLENBQUM7QUFrdkJ4QyxrQ0FBVztBQWh2QlosNkNBQTZDO0FBQy9DLFNBQVMsWUFBWSxDQUFDLEtBQUs7SUFDdkIsMkVBQTJFO0lBQzNFLGlFQUFpRTtJQUNqRSxJQUFJLENBQUMsR0FBRyxNQUFNLENBQUMsSUFBSSxDQUFDLElBQUksRUFBRSxLQUFLLEVBQUUs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