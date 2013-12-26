module.exports = function(grunt) {

  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),

    // concat: {
    //   options: {
    //     separator: '\n\n\n\n\n\n\n\n'
    //   },
    //   dist: {
    //     src: ['js/<%= pkg.name %>.js'],
    //     dest: 'js/<%= pkg.name %>.js'
    //   }
    // },

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

    qunit: {
      files: ['<%= pkg.buildDir %>/kitchensink.html']
    },

    jshint: {
      files: ['Gruntfile.js', '<%= pkg.buildDir %>/js/**/*.js'],
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
          '<%= pkg.buildDir %>/js/jtmpl.js': ['src/coffee/*.coffee.md'],
          '<%= pkg.buildDir %>/js/tests.js': ['src/tests/*.coffee']
        }
      }
    },    

    less: {
      css: {
        src: ['src/less/*.less'],
        dest: '<%= pkg.buildDir %>/css/styles.css',
      }
    },

    sass: {
      dist: {
        files: {
          '<%= pkg.buildDir %>/css/styles.css' : 'src/sass/style.scss'
        }
      }
    },

    watch: {
      jshint: {
        files: ['<%= jshint.files %>'],
        tasks: ['jshint', 'concat', 'uglify', 'copy:tests']
      },
      coffee: {
        files: ['src/coffee/*.coffee', 'src/coffee/*.litcoffee', 'src/coffee/*.coffee.md', 'src/tests/*.litcoffee', 'src/tests/*.coffee.md', 'src/tests/*.coffee'],
        tasks: ['coffee', 'concat', 'uglify']
      },
      less: {
        files: ['src/less/*.less'],
        tasks: ['less']
      },
      sass: {
        files: ['src/sass/*.scss'],
        tasks: ['sass']
      },
      markdown: {
        files: ['*.md', 'src/coffee/jtmpl.coffee.md'],
        tasks: ['md2html'],
        options: {
          nospawn: true
        }
      },
      templates: {
        files: ['src/templates/*'],
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
          {src: 'hello.html', dest: '<%= pkg.buildDir %>/hello.html'},
          {src: 'kitchensink.html', dest: '<%= pkg.buildDir %>/kitchensink.html'},
          {src: 'bower_components/qunit/qunit/qunit.js', dest: '<%= pkg.buildDir %>/js/qunit.js'},
          {src: 'bower_components/qunit/qunit/qunit.css', dest: '<%= pkg.buildDir %>/css/qunit.css'},
          {src: 'bower_components/highlightjs/highlight.pack.js', dest: '<%= pkg.buildDir %>/js/highlight.min.js'},
          {src: 'bower_components/highlightjs/styles/solarized_dark.css', dest: '<%= pkg.buildDir %>/css/highlight.css'}
        ]
      }
    },

    md2html: {
      multiple_files: {
        options: {
          layout: 'src/templates/layout.html'
        },
        files: [{
          expand: true,
          cwd: './',
          src: ['*.md', 'src/**/*.md'],
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
  grunt.loadNpmTasks('grunt-gh-pages');

  grunt.registerTask('default', ['coffee', 'less', 'uglify', 'copy', 'md2html', 'connect', 'watch']);
  grunt.registerTask('build', ['coffee', 'less', 'uglify', 'copy', 'md2html']);
  grunt.registerTask('publish', ['build', 'gh-pages']);
};