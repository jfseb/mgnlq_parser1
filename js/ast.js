'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
exports.astToText = exports.dumpNodeNice = exports.typeToString = exports.makeNodeForInteger = exports.makeNodeForAny = exports.makeNodeForFact = exports.makeNodeForToken = exports.makeNodeForDomain = exports.makeNodeForCat = exports.makeNode = exports.NodeType = exports.ASTNodeType = void 0;
// based on: http://en.wikibooks.org/wiki/Algorithm_implementation/Strings/Levenshtein_distance
// and:  http://en.wikipedia.org/wiki/Damerau%E2%80%93Levenshtein_distance
const debugf = require("debugf");
const _ = require("lodash");
const debuglog = debugf('ast');
var ASTNodeType;
(function (ASTNodeType) {
    ASTNodeType[ASTNodeType["BINOP"] = 0] = "BINOP";
    ASTNodeType[ASTNodeType["OP"] = 1] = "OP";
    ASTNodeType[ASTNodeType["OPEqIn"] = 2] = "OPEqIn";
    ASTNodeType[ASTNodeType["OPContains"] = 3] = "OPContains";
    ASTNodeType[ASTNodeType["OPStartsWith"] = 4] = "OPStartsWith";
    ASTNodeType[ASTNodeType["OPEndsWith"] = 5] = "OPEndsWith";
    ASTNodeType[ASTNodeType["OPAll"] = 6] = "OPAll";
    ASTNodeType[ASTNodeType["OPFirst"] = 7] = "OPFirst";
    ASTNodeType[ASTNodeType["OPLatest"] = 8] = "OPLatest";
    ASTNodeType[ASTNodeType["OPNewest"] = 9] = "OPNewest";
    ASTNodeType[ASTNodeType["OPOldest"] = 10] = "OPOldest";
    ASTNodeType[ASTNodeType["CAT"] = 11] = "CAT";
    ASTNodeType[ASTNodeType["CATPH"] = 12] = "CATPH";
    ASTNodeType[ASTNodeType["FACT"] = 13] = "FACT";
    ASTNodeType[ASTNodeType["LIST"] = 14] = "LIST";
    ASTNodeType[ASTNodeType["ANY"] = 15] = "ANY";
    ASTNodeType[ASTNodeType["OPMoreThan"] = 16] = "OPMoreThan";
    ASTNodeType[ASTNodeType["OPLessThan"] = 17] = "OPLessThan";
    ASTNodeType[ASTNodeType["OPExactly"] = 18] = "OPExactly";
    ASTNodeType[ASTNodeType["OPLT"] = 19] = "OPLT";
    ASTNodeType[ASTNodeType["OPLE"] = 20] = "OPLE";
    ASTNodeType[ASTNodeType["OPNE"] = 21] = "OPNE";
    ASTNodeType[ASTNodeType["OPEQ"] = 22] = "OPEQ";
    ASTNodeType[ASTNodeType["OPGT"] = 23] = "OPGT";
    ASTNodeType[ASTNodeType["OPGE"] = 24] = "OPGE";
    ASTNodeType[ASTNodeType["OPOrderBy"] = 25] = "OPOrderBy";
    ASTNodeType[ASTNodeType["OPOrderDescendingBy"] = 26] = "OPOrderDescendingBy";
    ASTNodeType[ASTNodeType["OPExisting"] = 27] = "OPExisting";
    ASTNodeType[ASTNodeType["OPNotExisting"] = 28] = "OPNotExisting";
    ASTNodeType[ASTNodeType["OPLogicalAnd"] = 29] = "OPLogicalAnd";
    ASTNodeType[ASTNodeType["OPLogicalOr"] = 30] = "OPLogicalOr";
    ASTNodeType[ASTNodeType["NUMBER"] = 31] = "NUMBER";
    ASTNodeType[ASTNodeType["DOM"] = 32] = "DOM";
})(ASTNodeType = exports.ASTNodeType || (exports.ASTNodeType = {}));
class NodeType {
    constructor(nt) {
        this.nt = nt;
    }
    toString() {
        return astNodeTypes[this.nt];
    }
}
exports.NodeType = NodeType;
const astNodeTypes = ["BINOP",
    "OP",
    "OPEqIn",
    "OPContains",
    "OPStartsWith",
    "OPEndsWith",
    "OPAll",
    "OPFirst",
    "OPLatest",
    "OPNewest",
    "OPOldest",
    "CAT",
    "CATPH",
    "FACT",
    "LIST",
    "ANY",
    "OPMoreThan",
    "OPLessThan",
    "OPExactly",
    "OPLT",
    "OPLE",
    "OPNE",
    "OPEQ",
    "OPGT",
    "OPGE",
    "OPOrderBy",
    "OPOrderDescendingBy",
    "OPExisting",
    "OPNotExisting",
    "OPLogicalAnd",
    "OPLogicalOr",
    "NUMBER",
    "DOM"
];
;
function makeNode(type, ...args) {
    return {
        type: type,
        children: args
    };
}
exports.makeNode = makeNode;
function makeNodeForCat(cat) {
    return {
        type: ASTNodeType.CAT,
        bearer: cat
    };
}
exports.makeNodeForCat = makeNodeForCat;
function makeNodeForDomain(cat) {
    return {
        type: ASTNodeType.DOM,
        bearer: cat
    };
}
exports.makeNodeForDomain = makeNodeForDomain;
function makeNodeForToken(type, opToken) {
    return {
        type: type,
        bearer: opToken
    };
}
exports.makeNodeForToken = makeNodeForToken;
function makeNodeForFact(fact) {
    return {
        type: ASTNodeType.FACT,
        bearer: fact
    };
}
exports.makeNodeForFact = makeNodeForFact;
function makeNodeForAny(fact) {
    return {
        type: ASTNodeType.ANY,
        bearer: fact
    };
}
exports.makeNodeForAny = makeNodeForAny;
function makeNodeForInteger(inttok) {
    return {
        type: ASTNodeType.NUMBER,
        bearer: inttok
    };
}
exports.makeNodeForInteger = makeNodeForInteger;
function typeToString(type) {
    return astNodeTypes[type];
}
exports.typeToString = typeToString;
function dumpNodeNice(node) {
    if (!node) {
        return undefined;
    }
    var r = { type: typeToString(node.type) };
    r.index = getIndex(node);
    if (node.children && node.children.length) {
        r.children = node.children.map(n => dumpNodeNice(n));
    }
    return r;
}
exports.dumpNodeNice = dumpNodeNice;
function getIndex(node) {
    if (!node || !node.bearer) {
        return -1;
    }
    return node.bearer.startOffset;
}
function makePrefix(prefix, indent) {
    var s = '';
    for (var i = 0; i < indent * prefix; ++i) {
        s += ' ';
    }
    return s;
}
function astToText(node, indent, prefix) {
    prefix = prefix || 0;
    indent = indent || 2;
    debuglog(() => JSON.stringify(node, undefined, 2));
    var sprefix = makePrefix(prefix, indent);
    var index = getIndex(node);
    var ln = node ? `${typeToString(node.type)} ${index}` : '(undefined)';
    if (!node) {
        return sprefix + node + "\n";
    }
    if (node.children && typeof node.children.length === "number") {
        var schildren = node.children.map(c => astToText(c, indent, prefix + 1));
        return sprefix + ln + `(${schildren.length})` + '\n' + schildren.join('');
    }
    else {
        if (node.children && !_.isArray(node.children)) {
            throw new Error('weird children node' + node.children);
        }
    }
    return sprefix + ln + "\n";
}
exports.astToText = astToText;

//# sourceMappingURL=ast.js.map

//# sourceMappingURL=ast.js.map
