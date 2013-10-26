//------------------------------------------------------------------------------
// Parser for COOL.
//
// Produces an AST from COOL source code.
//
// Eli Bendersky (eliben@gmail.com)
// This code is in the public domain
//------------------------------------------------------------------------------
'use strict';

// EBNF for the COOL grammar.
// Keywords and tokens are in uppercase. Operators stand for themselves. [ and ]
// are used for "optional", followed by * for "zero or more", followed by + for
// "one or more".
//
// program       ::= [class;]+
// 
// class         ::= CLASS TYPE [INHERITS TYPE] { [feature ;]∗ }
// 
// feature       ::= ID ( [formal [, formal]∗] ) : TYPE { expr }
//               |   ID : TYPE [ <- expr ]
// 
// formal        ::= ID : TYPE
// 
// expr          ::= ID <- expr
//               |   expr[@TYPE].ID ( [expr [, expr]∗] )
//               |   ID ( [expr [, expr]*] )
//               |   IF expr THEN expr ELSE expr FI
//               |   WHILE expr LOOP expr POOL
//               |   { [expr; ]+ }
//               |   LET ID : TYPE [<- expr] [, ID : TYPE [ <- expr]]* IN expr
//               |   CASE expr OF [ID : TYPE => expr ;]+ ESAC
//               |   NEW TYPE
//               |   ISVOID expr
//               |   expr + expr | expr − expr
//               |   expr ∗ expr | expr / expr
//               |   expr < expr | expr <= expr
//               |   expr = expr | ~ expr
//               |   NOT expr
//               |   ( expr )
//               |   ID | NUMBER | STRING | TRUE | FALSE

