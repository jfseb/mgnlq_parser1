'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
// based on: http://en.wikibooks.org/wiki/Algorithm_implementation/Strings/Levenshtein_distance
// and:  http://en.wikipedia.org/wiki/Damerau%E2%80%93Levenshtein_distance
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
    ASTNodeType[ASTNodeType["DOM"] = 16] = "DOM";
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
    var sprefix = makePrefix(prefix, indent);
    var index = getIndex(node);
    var ln = node ? `${typeToString(node.type)} ${index}` : '(undefined)';
    if (!node) {
        return sprefix + node + "\n";
    }
    if (node.children) {
        var schildren = node.children.map(c => astToText(c, indent, prefix + 1));
        return sprefix + ln + `(${schildren.length})` + '\n' + schildren.join('');
    }
    return sprefix + ln + "\n";
}
exports.astToText = astToText;

//# sourceMappingURL=ast.js.map
