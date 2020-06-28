call updateloglist.bat
call npx webpack --display-modules --config webpack.prod.cjs
call surge ./dist
pause