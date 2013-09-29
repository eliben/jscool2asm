# Defines classes that represent a parsed ASDL description. In a way, this is
# a meta-AST (AST that represents a description for encoding ASTs); in practice,
# it's a useful hierarchical representation of an ASDL file created by the
# parser.
#
# Taken from Python's Parser/asdl.py and adapted a bit for 3.4+.

builtin_types = set(
    ['identifier', 'string', 'bytes', 'int', 'object', 'singleton'])

class AST:
    pass # a marker class

class Module(AST):
    def __init__(self, name, dfns):
        self.name = name
        self.dfns = dfns
        self.types = {type.name: type.value for type in dfns}

    def __repr__(self):
        return "Module(%s, %s)" % (self.name, self.dfns)

class Type(AST):
    def __init__(self, name, value):
        self.name = name
        self.value = value

    def __repr__(self):
        return "Type(%s, %s)" % (self.name, self.value)

class Constructor(AST):
    def __init__(self, name, fields=None):
        self.name = name
        self.fields = fields or []

    def __repr__(self):
        return "Constructor(%s, %s)" % (self.name, self.fields)

class Field(AST):
    def __init__(self, type, name=None, seq=False, opt=False):
        self.type = type
        self.name = name
        self.seq = seq
        self.opt = opt

    def __repr__(self):
        if self.seq:
            extra = ", seq=True"
        elif self.opt:
            extra = ", opt=True"
        else:
            extra = ""
        if self.name is None:
            return "Field(%s%s)" % (self.type, extra)
        else:
            return "Field(%s, %s%s)" % (self.type, self.name, extra)

class Sum(AST):
    def __init__(self, types, attributes=None):
        self.types = types
        self.attributes = attributes or []

    def __repr__(self):
        if self.attributes:
            return "Sum(%s, %s)" % (self.types, self.attributes)
        else:
            return "Sum(%s)" % self.types

class Product(AST):
    def __init__(self, fields, attributes=None):
        self.fields = fields
        self.attributes = attributes or []

    def __repr__(self):
        if self.attributes:
            return "Product(%s, %s)" % (self.fields, self.attributes)
        else:
            return "Product(%s)" % self.fields

class VisitorBase:
    def __init__(self, skip=False):
        self.cache = {}
        self.skip = skip

    def visit(self, object, *args):
        meth = self._dispatch(object)
        if meth:
            try:
                meth(object, *args)
            except Exception as e:
                print("Error visiting %r: %s" % (object, e))
                # XXX hack
                if hasattr(self, 'file'):
                    self.file.flush()
                raise

    def _dispatch(self, object):
        assert isinstance(object, AST), repr(object)
        klass = object.__class__
        meth = self.cache.get(klass)
        if meth is None:
            methname = "visit" + klass.__name__
            if self.skip:
                meth = getattr(self, methname, None)
            else:
                meth = getattr(self, methname)
            self.cache[klass] = meth
        return meth

class Check(VisitorBase):
    def __init__(self):
        super().__init__(skip=True)
        self.cons = {}
        self.errors = 0
        self.types = {}

    def visitModule(self, mod):
        for dfn in mod.dfns:
            self.visit(dfn)

    def visitType(self, type):
        self.visit(type.value, str(type.name))

    def visitSum(self, sum, name):
        for t in sum.types:
            self.visit(t, name)

    def visitConstructor(self, cons, name):
        key = str(cons.name)
        conflict = self.cons.get(key)
        if conflict is None:
            self.cons[key] = name
        else:
            print("Redefinition of constructor %s" % key)
            print("Defined in %s and %s" % (conflict, name))
            self.errors += 1
        for f in cons.fields:
            self.visit(f, key)

    def visitField(self, field, name):
        key = str(field.type)
        l = self.types.setdefault(key, [])
        l.append(name)

    def visitProduct(self, prod, name):
        for f in prod.fields:
            self.visit(f, name)

def check(mod):
    v = Check()
    v.visit(mod)

    for t in v.types:
        if t not in mod.types and not t in builtin_types:
            v.errors += 1
            uses = ", ".join(v.types[t])
            output("Undefined type %s, used in %s" % (t, uses))

    return not v.errors

