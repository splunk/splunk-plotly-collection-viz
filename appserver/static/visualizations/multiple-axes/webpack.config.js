var webpack = require('webpack');
var path = require('path');

module.exports = {
  entry: {
    filename: path.join(__dirname, 'src') + '/visualization_source.js'
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
