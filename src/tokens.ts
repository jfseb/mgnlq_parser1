

  'use strict'
  import * as chevrotain from 'chevrotain';
    var createToken = chevrotain.createToken;

    var TACategory = createToken({name: "ACategory", pattern: /CAT/i });
var TADomain = createToken({name: "ADomain", pattern: /DOM/i });
var TAFact = createToken({name: "AFact", pattern: /FACT/i });
var Tall = createToken({name: "all", pattern: /all/i });
var TAnANY = createToken({name: "AnANY", pattern: /AnANY/i });
var Tand = createToken({name: "and", pattern: /and/i });
var Tany = createToken({name: "any", pattern: /any/i });
var Tat = createToken({name: "at", pattern: /at/i });
var Ta = createToken({name: "a", pattern: /a/i });
var TComma = createToken({name: "Comma", pattern: /,/i });
var Tcontaining = createToken({name: "containing", pattern: /containing/i });
var Tcontains = createToken({name: "contains", pattern: /contains/i });
var Tdomain = createToken({name: "domain", pattern: /domain/i });
var Tending_with = createToken({name: "ending_with", pattern: /ending_with/i });
var Tending = createToken({name: "ending", pattern: /ending/i });
var Tends_with = createToken({name: "ends_with", pattern: /ends_with/i });
var Tends = createToken({name: "ends", pattern: /ends/i });
var Tequals = createToken({name: "equals", pattern: /equals/i });
var Tevery = createToken({name: "every", pattern: /every/i });
var Te = createToken({name: "e", pattern: /e/i });
var Tfirst = createToken({name: "first", pattern: /first/i });
var Tfor = createToken({name: "for", pattern: /for/i });
var Tfrom = createToken({name: "from", pattern: /from/i });
var Tgreater = createToken({name: "greater", pattern: /greater/i });
var TGT = createToken({name: "GT", pattern: />/i });
var Tin = createToken({name: "in", pattern: /in/i });
var Tis = createToken({name: "is", pattern: /is/i });
var Tlast = createToken({name: "last", pattern: /last/i });
var Tlatest = createToken({name: "latest", pattern: /latest/i });
var Tleast = createToken({name: "least", pattern: /least/i });
var Tleat = createToken({name: "leat", pattern: /leat/i });
var Tless = createToken({name: "less", pattern: /less/i });
var Tlife = createToken({name: "life", pattern: /life/i });
var Tlist = createToken({name: "list", pattern: /list/i });
var TLParen = createToken({name: "LParen", pattern: /\(/i });
var TLT = createToken({name: "LT", pattern: /</i });
var Tnewest = createToken({name: "newest", pattern: /newest/i });
var Tof = createToken({name: "of", pattern: /of/i });
var Toldest = createToken({name: "oldest", pattern: /oldest/i });
var Tone = createToken({name: "one", pattern: /one/i });
var Trelating = createToken({name: "relating", pattern: /relating/i });
var TRParen = createToken({name: "RParen", pattern: /\)/i });
var Tselect = createToken({name: "select", pattern: /select/i });
var Tshort = createToken({name: "short", pattern: /short/i });
var Tstarting_with = createToken({name: "starting_with", pattern: /starting_with/i });
var Tstarting = createToken({name: "starting", pattern: /starting/i });
var Tstarts_with = createToken({name: "starts_with", pattern: /starts_with/i });
var Tstarts = createToken({name: "starts", pattern: /starts/i });
var Tthan = createToken({name: "than", pattern: /than/i });
var Tthe = createToken({name: "the", pattern: /the/i });
var Twhere = createToken({name: "where", pattern: /where/i });
var Twith = createToken({name: "with", pattern: /with/i });
var TInteger = createToken({name: "Integer", pattern: /0[1-9]\d+/i });
var TIdentifier = createToken({name: "Identifier", pattern: /\w+/i });

    
    export const Tokens = {
   ACategory : TACategory ,
 ADomain : TADomain ,
 AFact : TAFact ,
 all : Tall ,
 AnANY : TAnANY ,
 and : Tand ,
 any : Tany ,
 at : Tat ,
 a : Ta ,
 Comma : TComma ,
 containing : Tcontaining ,
 contains : Tcontains ,
 domain : Tdomain ,
 ending_with : Tending_with ,
 ending : Tending ,
 ends_with : Tends_with ,
 ends : Tends ,
 equals : Tequals ,
 every : Tevery ,
 e : Te ,
 first : Tfirst ,
 for : Tfor ,
 from : Tfrom ,
 greater : Tgreater ,
 GT : TGT ,
 in : Tin ,
 is : Tis ,
 last : Tlast ,
 latest : Tlatest ,
 least : Tleast ,
 leat : Tleat ,
 less : Tless ,
 life : Tlife ,
 list : Tlist ,
 LParen : TLParen ,
 LT : TLT ,
 newest : Tnewest ,
 of : Tof ,
 oldest : Toldest ,
 one : Tone ,
 relating : Trelating ,
 RParen : TRParen ,
 select : Tselect ,
 short : Tshort ,
 starting_with : Tstarting_with ,
 starting : Tstarting ,
 starts_with : Tstarts_with ,
 starts : Tstarts ,
 than : Tthan ,
 the : Tthe ,
 where : Twhere ,
 with : Twith ,
 Integer : TInteger ,
 Identifier : TIdentifier 
    };
  
  