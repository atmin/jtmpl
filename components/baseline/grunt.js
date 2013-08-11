module.exports = function(grunt) {
  grunt.initConfig({
    info: '<json:bower.json>',
    meta: {
      banner: '//\n'+
              '// <%= info.name %> - <%= info.description %>\n'+
              '// v<%= info.version %>\n'+
              '// <%= info.homepage %>\n'+
              '// copyright <%= info.copyright %> <%= grunt.template.today("yyyy") %>\n'+
              '// <%= info.license %> License\n'+
              '//'
    },
    concat: {
      baseline: {
        src: [
          '<banner>',
          'lib/mixins/*.less',
          'lib/*.less',
        ],
        dest: 'baseline.less'
      }
    },
    less: {
      full: {
        files: {
          'examples/baseline.css': 'examples/sample.less'
        }
      }
    },
    watch: {
      js: {
        files: ['lib/**/*', 'examples/sample.less'],
        tasks: 'default' 
      }
    },
    reloadr: {
      main: [
        'examples/*'
      ]
    },
    server:{
      port: 8000,
      base: '.',
      hostname: '*'
    }
  });
  grunt.loadNpmTasks('grunt-reloadr');
  grunt.loadNpmTasks('grunt-contrib-less');
  grunt.registerTask('default', 'concat less');
  grunt.registerTask('dev', 'default server reloadr watch');
}
