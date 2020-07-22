module.exports = {
    entry: {
        main: './src/index.ts'
    },
    resolve: {
        extensions: [".ts", ".js"]
    },
    module: {
        rules: [
            {
                test: /\.tsx?$/,
                use: ["ts-loader"],
                exclude: /node_modules/,
                /*options: {
                    experimentalWatchApi: true
                }*/
            }
        ]
    }
};