/*

## Constants

*/    

    var RE_IDENTIFIER = /^[\w\.\-]+$/;
    var RE_SRC_IDENTIFIER = '([\\w\\.\\-]+)';
    var RE_PIPE = /^[\w\.\-]+(?:\|[\w\.\-]+)?$/;
    var RE_NODE_ID = /^#[\w\.\-]+$/;
    var RE_ANYTHING = '[\\s\\S]*?';
    var RE_SPACE = '\\s*';


    var bookkeepingProto = {
      dependents: {},
      watchers: {},
      childContexts: [],
      initialized: false
    };


/*
  
Default options

*/
    
    var defaultOptions = {
      delimiters: ['{{', '}}']
    };


/*

Browsers treat table elements in a special way, so table tags
will be replaced prior constructing DOM to force standard parsing,
then restored again after templating pass.

*/

    var replaceTagRules = [
      ['<table>', '<jtmpl-table>'],
      ['<table ', '<jtmpl-table '],
      ['</table>', '</jtmpl-table>'],
      ['<tr>', '<jtmpl-tr>'],
      ['<tr ', '<jtmpl-tr '],
      ['</tr>', '</jtmpl-tr>'],
      ['<td>', '<jtmpl-td>'],
      ['<td ', '<jtmpl-td '],
      ['</td>', '</jtmpl-td>']
    ];
