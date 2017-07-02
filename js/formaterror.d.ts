import { IFErBase as IFErBase } from 'mgnlq_er';
export declare function getTokenText(token: any, sentence: IFErBase.ISentence): string;
export declare function getSentenceToken(token: any, sentence: IFErBase.ISentence): IFErBase.IWord;
export declare function getTokenQualifier(token: any, sentence: IFErBase.ISentence): string;
export declare function getQualifierFromWordType(wordType: string): string;
export interface IParseError {
    text: string;
    error: any;
}
export declare function getExpecting(message: string): string;
export declare function mapTokenStringToHumanString(tokenstring: string): string;
export declare function extractExpectArr(message: string): string[];
export declare function formatError(error: any, sentence: IFErBase.ISentence): IParseError;