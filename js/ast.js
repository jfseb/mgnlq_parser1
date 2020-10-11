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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYXN0LmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vc3JjL2FzdC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQSxZQUFZLENBQUE7OztBQUVaLCtGQUErRjtBQUMvRiwwRUFBMEU7QUFFMUUsaUNBQWlDO0FBQ2pDLDRCQUE0QjtBQUM1QixNQUFNLFFBQVEsR0FBRyxNQUFNLENBQUMsS0FBSyxDQUFDLENBQUM7QUFFL0IsSUFBWSxXQWtDWDtBQWxDRCxXQUFZLFdBQVc7SUFDckIsK0NBQUssQ0FBQTtJQUNMLHlDQUFFLENBQUE7SUFDRixpREFBTSxDQUFBO0lBQ04seURBQVUsQ0FBQTtJQUNWLDZEQUFZLENBQUE7SUFDWix5REFBVSxDQUFBO0lBQ1YsK0NBQUssQ0FBQTtJQUNMLG1EQUFPLENBQUE7SUFDUCxxREFBUSxDQUFBO0lBQ1IscURBQVEsQ0FBQTtJQUNSLHNEQUFRLENBQUE7SUFDUiw0Q0FBRyxDQUFBO0lBQ0gsZ0RBQUssQ0FBQTtJQUNMLDhDQUFJLENBQUE7SUFDSiw4Q0FBSSxDQUFBO0lBQ0osNENBQUcsQ0FBQTtJQUNILDBEQUFVLENBQUE7SUFDViwwREFBVSxDQUFBO0lBQ1Ysd0RBQVMsQ0FBQTtJQUNULDhDQUFJLENBQUE7SUFDSiw4Q0FBSSxDQUFBO0lBQ0osOENBQUksQ0FBQTtJQUNKLDhDQUFJLENBQUE7SUFDSiw4Q0FBSSxDQUFBO0lBQ0osOENBQUksQ0FBQTtJQUNKLHdEQUFTLENBQUE7SUFDVCw0RUFBbUIsQ0FBQTtJQUNuQiwwREFBVSxDQUFBO0lBQ1YsZ0VBQWEsQ0FBQTtJQUNiLDhEQUFZLENBQUE7SUFDWiw0REFBVyxDQUFBO0lBQ1gsa0RBQU0sQ0FBQTtJQUNOLDRDQUFHLENBQUE7QUFDTCxDQUFDLEVBbENXLFdBQVcsR0FBWCxtQkFBVyxLQUFYLG1CQUFXLFFBa0N0QjtBQUVELE1BQWEsUUFBUTtJQUVuQixZQUFZLEVBQWdCO1FBQzFCLElBQUksQ0FBQyxFQUFFLEdBQUcsRUFBRSxDQUFDO0lBQ2YsQ0FB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