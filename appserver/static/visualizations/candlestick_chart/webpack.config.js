var webpack = require('webpack');
var path = require('path');

module.exports = {
  module: {
  loaders: [
    {
      test: /plotly.js$/,
      loader: 'regexp-replace-loader',
      query: {
        match: {
          pattern: 'sprintf',
          flags: 'g'
        },
        replaceWith: 'sprintf_plotly'
      }
    }
  ]
},
    entry: 'visualization_source',
    resolve: {
        root: [
            path.join(__dirname, 'src'),
        ]
    },
    output: {
        filename: 'visualization.js',
        libraryTarget: 'amd'
    },
    externals: [
        'api/SplunkVisualizationBase',
        'api/SplunkVisualizationUtils'
    ]
};
