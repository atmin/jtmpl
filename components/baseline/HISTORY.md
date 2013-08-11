
0.6.2 / 2013-05-19 
==================

  * [lib/bar] added option for font-size
  * [lib/bar] added box-shadow to bar
  * [examples] added colors example
  * [lib] add colors less for warning, error and success

0.6.1 / 2013-05-09 
==================

  * [lib/typography] fixed font-family

0.6.0 / 2013-05-09 
==================

  * [examples/button] added class to reset button
  * [example/modal] updated
  * [lib/modal] added button.close style and tweaked padding
  * [example] updated typography example
  * [lib] updated typography to be closer to what bootstrap does
  * [example] added tabs example
  * [lib] added bl-tabs
  * [bower] renamed component.json to bower.json
  * [example] fixed title on arrows example
  * [example] added bar example
  * [lib] added bl-bar

0.5.2 / 2013-03-08 
==================

  * [grunt] hostname="*"
  * [modal] fixed opacity for ie8

0.5.1 / 2013-03-04 
==================

  * [examples/grid] added right side fixed column example
  * [grid] added .bl-grid-fixed-right for a right side fixed column

0.5.0 / 2013-03-01 
==================

  * [maint] moved info to component.json
  * [spacing] namespaced variables
  * [examples] added spacing example
  * [lib] added spacing.less to provide helper mixins/classes for margin
  * [examples] updated sample.less to include a .bl-size example
  * [lib] .bl-size now will take 1 or 2 args
  * [examples] added reset example
  * [lib] added .bl-reset() and .bl-reset-html5()

0.4.4 / 2013-02-13 
==================

  * [grid] add option to change the grid prefix

0.4.3 / 2013-01-16 
==================

  * [mixin/vendor] added bl-transition
  * [lists] changed list-inline to float with clearfix
  * [arrows] renamed up/down to top/bottom

0.4.2 / 2013-01-15 
==================

  * [helpers] removed !important from hide

0.4.1 / 2013-01-15 
==================

  * [messages] fixed bl-messages to be a mixing and not auto include

0.4.0 / 2013-01-15 
==================

  * [arrows] added bl-arrow-[dir]
  * [mixins/utils] added bl-size and bl-vcenter mixins
  * [helpers] added !important to hide
  * [lib] bl-messages helper

0.3.2 / 2013-01-04 
==================

  * [grid] fixed bug in fixed grid

0.3.1 / 2013-01-03 
==================

  * [examples] updated grid example
  * [grid] fixed equal columns

0.3.0 / 2012-12-18 
==================

  * example[grid] option to go between fluid and fixed width
  * example[grid] added fixed column example
  * feature[grid] added support for a fixed column
  * feature[grid] added bl-grid-debug to draw outlines around all grids
  * fix[grid] fixed padding when using offset, more accurate gutter size, updated example

0.2.0 / 2012-12-17 
==================

  * fix[sample] pointed to correct baseline include, added lists
  * feature[lists] added list helpers

0.1.0 / 2012-12-14 
==================

  * refactor[core] prefixed all mixins with .bl-

0.0.5 / 2012-12-14 
==================

  * built[example]
  * fix[grunt] watch for subfolder canges in lib
  * refactor[vendor] removed box-shadow and border-radius vendor helpers
  * added grunt-reloadr

0.0.4 / 2012-12-11 
==================

  * build[example] rebuilt
  * feature[core] build single file instead of includes
  * fix[grid] updated comment to use less comment instead of css
  * fix[modal] added () to bl-modal-backdrop

0.0.3 / 2012-12-11 
==================

  * [refactor] update grid to use bl-border-box helper
  * [feature] modal
  * [grid] added docs inline

0.0.2 / 2012-12-11 
==================

  * [bower] updated main

0.0.1 / 2012-12-11 
==================

  * [grunt] removed unneeded code
  * tweaks to examples
  * [grid] update to use box-sizing mixin
  * buttons, gradient mixins, vendor mixins, renamed utils to helpers
  * [grid] offset
  * removed recss
  * removed dist, moved sample into examples
  * gitignore
  * built default css
  * initial work on buttons
  * added component.json for bower
  * initial commit.  grid, normalize, typography, utils
