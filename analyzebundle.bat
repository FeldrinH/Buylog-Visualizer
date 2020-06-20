call npx webpack --config webpack.prod.cjs --profile --json > stats.json
call npx webpack-bundle-analyzer stats.json
pause