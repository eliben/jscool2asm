'use strict';


// NodeVisitor - implements the classical visitor design pattern.
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
