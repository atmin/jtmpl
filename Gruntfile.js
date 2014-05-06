module.exports = function(grunt) {

  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),

    concat: {
      options: {
        separator: '\n\n'
      },
      dist: {
        src: [
          'src/jtmpl/_iife_begin',
          'src/jtmpl/main.js',
          'src/jtmpl/consts.js',
          'src/jtmpl/util.js',
          'src/jtmpl/store.js',
          'src/jtmpl/observable_array.js',
          'src/jtmpl/getset.js',
          'src/jtmpl/compiler.js',
          'src/jtmpl/watch.js',
          'src/jtmpl/rules.js',
          'src/jtmpl/xhr.js',
          'src/jtmpl/_iife_end'
        ],
        dest: '<%= pkg.buildDir %>/js/<%= pkg.name %>.js'
      }
    },

    uglify: {
      options: {
        banner: '/*! <%= pkg.name %> <%= grunt.template.today("dd-mm-yyyy") %> */\n'
      },
      dist: {
        files: {
          '<%= pkg.buildDir %>/js/<%= pkg.name %>.min.js': ['<%= pkg.buildDir %>/js/<%= pkg.name %>.js']
        }
      }
    },

    jasmine : {
      src : ['src/jtmpl/main.js', 'src/jtmpl/store.js', 'src/jtmpl/*.js'],
      options : {
        specs : 'spec/**/*.js',
        template : require('grunt-template-jasmine-istanbul'),
        templateOptions: {
          coverage: '<%= pkg.buildDir %>/reports/coverage.json',
          report: '<%= pkg.buildDir %>/reports/coverage'
        }
      }
    },

    jshint: {
      files: ['Gruntfile.js', 'src/jtmpl/*.js', 'spec/*.js'],
      options: {
        // options here to override JSHint defaults
        globals: {
          document: true
        }
      }
    },

    less: {
      css: {
        src: ['styles/*.less'],
        dest: '<%= pkg.buildDir %>/css/styles.css',
      }
    },

    watch: {
      jshint: {
        files: ['<%= jshint.files %>'],
        tasks: ['jshint', 'jasmine', 'concat', 'uglify']
      },
      less: {
        files: ['styles/*.less'],
        tasks: ['less']
      },
      markdown: {
        files: ['*.md'],
        tasks: ['md2html'],
        options: {
          nospawn: true
        }
      },
      templates: {
        files: ['templates/*'],
        tasks: ['md2html']
      }
    },

    connect: {
      server: {
        options: {
          port: 8000,
          hostname: '0.0.0.0',
          base: '<%= pkg.buildDir %>/',
        }
      }
    },

    copy: {
      main: { 
        files: [
          {src: 'CNAME', dest: '<%= pkg.buildDir %>/CNAME'},
          {src: 'favicon.ico', dest: '<%= pkg.buildDir %>/favicon.ico'},
          {src: 'hello.html', dest: '<%= pkg.buildDir %>/hello.html'},
          {src: 'kitchensink.html', dest: '<%= pkg.buildDir %>/kitchensink.html'},
          {src: '<%= pkg.buildDir %>/js/jtmpl.js', dest: 'build/jtmpl.js'},
          {src: '<%= pkg.buildDir %>/js/jtmpl.min.js', dest: 'build/jtmpl.min.js'},
          {src: 'src/js/highlight-coffee.js', dest: '<%= pkg.buildDir %>/js/highlight-coffee.js'},
          {src: 'bower_components/highlightjs/highlight.pack.js', dest: '<%= pkg.buildDir %>/js/highlight.min.js'},
          {src: 'bower_components/highlightjs/styles/solarized_dark.css', dest: '<%= pkg.buildDir %>/css/highlight.css'}
        ]
      }
    },

    md2html: {
      multiple_files: {
        options: {
          layout: 'templates/layout.html'
        },
        files: [{
          expand: true,
          cwd: './',
          src: ['**/*.md', '!bower_components/**', '!node_modules/**'],
          dest: 'gh-pages',
          ext: '.html'
        }]
      }
    },

    'gh-pages': {
      options: {
        base: 'gh-pages'
      },
      src: ['**']
    }

  });

  grunt.loadNpmTasks('grunt-contrib-uglify');
  grunt.loadNpmTasks('grunt-contrib-jshint');
  grunt.loadNpmTasks('grunt-contrib-jasmine');
  grunt.loadNpmTasks('grunt-contrib-watch');
  grunt.loadNpmTasks('grunt-contrib-concat');
  grunt.loadNpmTasks('grunt-contrib-connect');
  grunt.loadNpmTasks('grunt-contrib-copy');
  grunt.loadNpmTasks('grunt-md2html');
  grunt.loadNpmTasks('grunt-contrib-clean');
  grunt.loadNpmTasks('grunt-contrib-less');
  grunt.loadNpmTasks('grunt-gh-pages');

  grunt.registerTask('build', ['jshint', 'jasmine', 'concat', 'uglify', 'less', 'copy', 'md2html']);
  grunt.registerTask('default', ['build', 'connect', 'watch']);
  grunt.registerTask('publish', ['build', 'gh-pages']);
};