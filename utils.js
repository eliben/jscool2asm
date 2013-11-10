//------------------------------------------------------------------------------
// Misc. utilities used in the jscool2asm compiler.
//
// Eli Bendersky (eliben@gmail.com)
// This code is in the public domain
//------------------------------------------------------------------------------

// A hacky way to create multi-line strings in JS. Use as follows:
//
// var s = MultiString(function() {/***
//   some multi
//   line string
//   this is the end line
// ***/});
//
var MultiString = exports.MultiString = function(f) {
  return f.toString().split('\n').slice(1, -1).join('\n');
}
