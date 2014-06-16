/*

## Constants

*/    

    var RE_IDENTIFIER = /^[\w\.\-]+$/;
    var RE_SRC_IDENTIFIER = '([\\w\\.\\-]+)';
    var RE_PIPE = /^[\w\.\-]+(?:\|[\w\.\-]+)?$/;
    var RE_NODE_ID = /^#[\w\.\-]+$/;
    var RE_ANYTHING = '[\\s\\S]*?';
    var RE_SPACE = '\\s*';


/*
  
Default options

*/
    
    var defaultOptions = {
      delimiters: ['{{', '}}']
    };
