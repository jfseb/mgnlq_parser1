# mgnlq_parser1 [![Build Status](https://travis-ci.org/jfseb/mgnlq_parser1.svg?branch=master)](https://travis-ci.org/jfseb/mgnlq_parser1)[![Coverage Status](https://coveralls.io/repos/github/jfseb/mgnlq_parser1/badge.svg)](https://coveralls.io/github/jfseb/mgnlq_parser1)

Parse sentences into actions or queries

Parser for queries  List all CAT CAT where CAT FACT = XX in DOM


```javascript
npm i

gulp
```



# scratch

Filtering elements in an array


https://stackoverflow.com/questions/3985214/retrieve-only-the-queried-element-in-an-object-array-in-mongodb-collection


db.test.aggregate([
    // Get just the docs that contain a shapes element where color is 'red'
    {$match: {'shapes.color': 'red'}},
    {$project: {
        shapes: {$filter: {
            input: '$shapes',
            as: 'shape',
            cond: {$eq: ['$$shape.color', 'red']}
        }},
        _id: 0
    }}
])


db.coll.aggregate(
    [
        { "$match": { "_id": "123456" } },
        { "$project": {
            "detailLine": {
                "$map": {
                    "input": "$detailLine",
                    "as": "dline",
                    "in": {
                        "amount": "$$dline.value.detailLineCharges.allowedAmount.amount",
                        "reasonCode": "$$dline.value.detailLineCharges.allowedAmount.reasonCode"
                    }
                }
           }
        }}
    ]
)

# environment

the default model name is "testmodel"

environment ABOT_MONGODB controls the used model, e.g. ABOT_MONGODB=testdb2


# record

set MONGO_RECORD_REPLAY=



# history

* 0.0.3  showURI, auxiliary categories
* 0.0.4  change in output format
* 0.0.5  add mass tests, upgrade gulp etc.



# Todo
     more than N CAT    (List all Application Components with more than 3 Fiori Apps)

     real or
     associativity, parentheis

     and  CATA FACT_A or CATB FACTB =>   (( CAT_A )

     CAT_A FACT_A OR FACT_A   AND  XX   =     ( CAT_A FACT_A or CAT_A FACT_B )

     (FACT_A OR FACT_B ) OR  X    AND

     FA AND FB OR FC AND FE  =>    FA AND ( FB OR FC) AND FA