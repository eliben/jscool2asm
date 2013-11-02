//------------------------------------------------------------------------------
// AST Visitor.
//
// The generic NodeVisitor class and a visitor for dumping ASTs to a string.
//
// Eli Bendersky (eliben@gmail.com)
// This code is in the public domain
//------------------------------------------------------------------------------
'use strict';


// NodeVisitor - implements the classical visitor design pattern.
//
// To use a visitor - instantiate it an call .visit(node) with the AST node you
// want to start visiting from. The effects of visiting (output, accumulated
// data, etc.) are visitor-specific.
//
// To create custom visitors, inherit from NodeVisitor and define methods
// visit_Type for visiting nodes of type Type. Custom visitors inherit the
// visit_children method which can be used to generically dispatch children
// nodes if the custom visitor doesn't have special provision for them.
var NodeVisitor = exports.NodeVisitor = function() {
}

NodeVisitor.prototype.visit = function(node) {
  var visitor_name = 'visit_' + node.constructor.node_type;
  var method = (visitor_name in this) ? this[visitor_name]
                                      : this.visit_children;
  return method.call(this, node);
}

NodeVisitor.prototype.visit_children = function(node) {
  var children = node.children();
  for (var i = 0; i < children.length; i++) {
    this.visit(children[i].node);
  }
}

// NodeDumper - implements the visitor interface and dumps an AST tree/node
// into a string.
var NodeDumper = exports.NodeDumper = function(show_loc) {
  this.show_loc = show_loc || false;
}

NodeDumper.prototype = Object.create(NodeVisitor.prototype);
NodeDumper.constructor = NodeDumper;

NodeDumper.prototype.visit = function(node) {
  var output_lines = this._visit_aux(node, 0);
  return output_lines.join('\n');
}

NodeDumper.prototype._visit_aux = function(node, offset) {
  var s = node.constructor.node_type + '(';
  for (var i = 0; i < node.constructor.attributes.length; i++) {
    var attrname = node.constructor.attributes[i];
    s += attrname + '=' + node[attrname];
    if (i !== node.constructor.attributes.length - 1) {
      s += ', ';
    }
  }
  s += ')'
  if (this.show_loc) {
    s += ' @ loc: ' + node.loc;
  }
  var output = [(Array(offset + 1).join(' ') + s)];

  var children = node.children();
  for (var i = 0; i < children.length; i++) {
    output = output.concat(this._visit_aux(children[i].node, offset + 4));
  }

  return output;
}
