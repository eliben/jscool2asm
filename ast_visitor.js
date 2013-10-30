'use strict';


var NodeVisitor = exports.NodeVisitor = function() {
}


NodeVisitor.prototype.visit = function(node) {
  var visitor_name = 'visit_' + node.constructor.node_type;
  var method = (visitor_name in this) ? this['visitor_name']
                                      : this._generic_visit;
  return method.call(this, node);
}


NodeVisitor.prototype._generic_visit = function(node) {
  
}
