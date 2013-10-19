import sys

import asdl_ast
import asdl_parser


def main():
    if len(sys.argv) < 2:
        print('Usage: %s <input ASDL>' % sys.argv[0])
        return 1


if __name__ == '__main__':
    sys.exit(main())
