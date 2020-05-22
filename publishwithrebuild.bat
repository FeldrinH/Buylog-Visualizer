call updateloglist.bat
call npx webpack --config webpack.prod.js
call surge ./dist
pause