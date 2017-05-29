export declare enum ASTNodeType {
    BINOP = 0,
    OP = 1,
    OPEqIn = 2,
    OPContains = 3,
    OPStartsWith = 4,
    OPEndsWith = 5,
    OPAll = 6,
    OPFirst = 7,
    OPLatest = 8,
    OPNewest = 9,
    OPOldest = 10,
    CAT = 11,
    CATPH = 12,
    FACT = 13,
    LIST = 14,
    ANY = 15,
    DOM = 16,
}
export declare class NodeType {
    nt: ASTNodeType;
    constructor(nt: ASTNodeType);
    toString(): string;
}
export interface ASTNode {
    type: ASTNodeType;
    bearer?: any;
    children?: ASTNode[];
}
export declare function makeNode(type: ASTNodeType, ...args: ASTNode[]): ASTNode;
export declare function makeNodeForCat(cat: any): ASTNode;
export declare function makeNodeForDomain(cat: any): ASTNode;
export declare function makeNodeForToken(type: ASTNodeType, opToken: any): ASTNode;
export declare function makeNodeForFact(fact: any): ASTNode;
export declare function makeNodeForAny(fact: any): ASTNode;
export declare function typeToString(type: ASTNodeType): string;
export declare function dumpNodeNice(node: ASTNode): any;
export declare function astToText(node: ASTNode, indent?: number, prefix?: number): any;
