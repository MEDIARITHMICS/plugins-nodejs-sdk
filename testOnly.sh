#!/bin/bash
set -eu


function doTest(){
    ./node_modules/.bin/mocha --no-forbid-only -r ts-node/register src/tests/$1
}

if [ "$#" -gt 0 ]
then
    for arg in $@;do
         doTest "*${arg}*ts"
    done
else
    doTest "*.ts"
fi

