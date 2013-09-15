module.exports = function(grunt) {

  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),

    concat: {
      options: {
        separator: '\n\n\n\n\n\n\n\n'
      },
      dist: {
        src: ['js/<%= pkg.name %>.js', 'components/Object.observe/Object.observe.poly.js'],
        dest: 'js/<%= pkg.name %>.js'
      }
    },

    uglify: {
      options: {
        banner: '/*! <%= pkg.name %> <%= grunt.template.today("dd-mm-yyyy") %> */\n'
      },
      dist: {
        files: {
          'js/<%= pkg.name %>.min.js': ['<%= concat.dist.dest %>']
        }
      }
    },

    qunit: {
      files: ['kitchensink.html']
    },

    jshint: {
      files: ['gruntfile.js', 'src/js/**/*.js'],
      options: {
        // options here to override JSHint defaults
        globals: {
          jQuery: true,
          console: true,
          module: true,
          document: true
        }
      }
    },

    coffee: {
      compile: {
        files: {
          'js/jtmpl.js': ['src/coffee/*.coffee'],
          'js/tests.js': ['src/tests/*.coffee']
        }
      }
    },    

    less: {
      css: {
        src: ['src/less/*.less'],
        dest: 'css/styles.css',
      }
    },

    watch: {
      jshint: {
        files: ['<%= jshint.files %>'],
        tasks: ['jshint', 'concat', 'uglify', 'copy:tests']
      },
      coffee: {
        files: ['src/coffee/*.coffee', 'src/tests/*.coffee'],
        tasks: ['coffee', 'concat', 'uglify']
      },
      less: {
        files: ['src/less/*.less'],
        tasks: ['less']
      },
      readme: {
        files: ['README.md'],
        tasks: ['copy', 'dotlit', 'md2html', 'clean'],
        options: {
          nospawn: true
        }
      },
      templates: {
        files: ['src/templates/*'],
        tasks: ['copy', 'dotlit', 'md2html', 'clean']
      }
    },

    connect: {
      server: {
        options: {
          port: 8000,
          hostname: '0.0.0.0',
          base: './',
        }
      }
    },

    copy: {
      main: { 
        files: [
          {src: 'README.md', dest: 'dot.lit.md'},
          {src: 'components/qunit/qunit/qunit.js', dest: 'js/qunit.js'},
          {src: 'components/qunit/qunit/qunit.css', dest: 'css/qunit.css'},
          {src: 'components/Object.observe/Object.observe.poly.js', dest: 'js/Object.observe.poly.js'},
          {src: 'components/highlightjs/highlight.pack.js', dest: 'js/highlight.min.js'},
          {src: 'components/highlightjs/styles/solarized_dark.css', dest: 'css/highlight.css'},
          {src: 'components/baseline/examples/baseline.css', dest: 'css/baseline.css'}
        ]
      }
    },

    dotlit: {
      options: {
        verbose: true,
        extractFiles: ['*']
      },
      files: ['dot.lit.md']
    },

    md2html: {
      index: {
        options: {
          layout: 'src/templates/layout.html'
        },
        files: [{
          src: ['README.md'],
          dest: 'index.html'
        }]
      }
    },

    clean: ['jtmpl', 'dot', 'dot.lit.md']    

  });

  grunt.loadNpmTasks('grunt-contrib-uglify');
  grunt.loadNpmTasks('grunt-contrib-jshint');
  grunt.loadNpmTasks('grunt-contrib-coffee');
  grunt.loadNpmTasks('grunt-contrib-qunit');
  grunt.loadNpmTasks('grunt-contrib-watch');
  grunt.loadNpmTasks('grunt-contrib-concat');
  grunt.loadNpmTasks('grunt-contrib-connect');
  grunt.loadNpmTasks('grunt-contrib-copy');
  grunt.loadNpmTasks('grunt-dotlit');
  grunt.loadNpmTasks('grunt-md2html');
  grunt.loadNpmTasks('grunt-contrib-clean');
  grunt.loadNpmTasks('grunt-contrib-less');
  grunt.loadNpmTasks('grunt-css');

  grunt.registerTask('default', ['coffee', 'concat', 'uglify', 'copy', 'dotlit', 'md2html', 'clean', 'connect', 'watch']);

};