import { IFErBase as IFErBase } from './match/er_index';
import * as chevrotain from 'chevrotain';
import * as AST from './ast';
import { IFModel as IFModel } from 'mgnlq_model';
export declare function makeToken(t: IFErBase.IWord, index: number, T: any): {
    image: string;
    startOffset: number;
    bearer: IFErBase.IWord;
    tokenType: any;
};
export declare function getLexer(): any;
declare var SelectLexer: chevrotain.Lexer;
declare function parse(tokens: any[], startrule: string): any;
export interface IParsedSentences extends IFModel.IProcessedSentences {
    asts: AST.ASTNode[];
    domains?: string[];
}
export declare const ERR_PARSE_ERROR = "PARSE_ERROR";
export declare function parseSentenceToAsts(s: string, model: IFModel.IModels, words: any): IParsedSentences;
export { SelectLexer, parse };
