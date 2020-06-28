call updateloglist.bat
call npx webpack --display-modules --config webpack.prod-fast.cjs
call surge ./dist
pause