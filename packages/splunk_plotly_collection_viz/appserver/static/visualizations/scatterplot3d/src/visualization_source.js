define([
  'jquery',
  'underscore',
  'plotly.js-dist',
  'api/SplunkVisualizationBase',
  'api/SplunkVisualizationUtils'
  // Add required assets to this list
], function (
  $,
  _,
  Plotly,
  SplunkVisualizationBase,
  SplunkVisualizationUtils
) {

  var MAX_MARKER_SZ = 50;
  var isDarkTheme = SplunkVisualizationUtils.getCurrentTheme &&
                    SplunkVisualizationUtils.getCurrentTheme() === 'dark';

  return SplunkVisualizationBase.extend({

    initialize: function() {
      // Save this.$el for convenience
      this.$el = $(this.el);

      // Handle multiple Graphs
      this.__uniqueID = Math.floor(Math.random() * 100000);

      // Add a css selector class
      this.$el.attr('id', 'scatterplot3dContainer_' + this.__uniqueID);
    },

    getInitialDataParams: function() {
      return ({
        outputMode: SplunkVisualizationBase.ROW_MAJOR_OUTPUT_MODE,
        count: 50000
      });
    },

    formatData: function(data, config) {
      // Expects to have 4 columns corresponding to 4 fields:
      // (0) trace_name
      // (1) x_value
      // (2) y_value
      // (3) z_value
      // (4) (optional) marker_size

      var fields = data.fields;
      var rows = data.rows;
      var idxMarkerSize = -1;

      //This returns nothing if there is no data passed in
      if (rows.length < 1) {
        return;
      }

      // Extra customisation fields given
      if (fields.length > 4) {
        idxMarkerSize = 4;
      }

      //This checks if all data being passed in are numbers and displays an error if not.
      if (_.isNaN(data)) {
        throw new SplunkVisualizationBase.VisualizationError(
          'This chart only supports numbers'
        );
      }

      var traces = rows.map(x => x[0])
                    .filter(function(x, i, rows){
                      return rows.indexOf(x) === i;
                    });

      var traceValues = [];
      var markerSizes = [];

      _.each(traces, function(trace) {
          // get all objects of each trace
          var arr = rows.filter(function(el){
                            return el[0] === trace;
                         });
          // Collect all the x values
          traceValues.push(arr.map(x => x[1]));
          // Collect all the y values
          traceValues.push(arr.map(x => x[2]));
          // Collect all the z values
          traceValues.push(arr.map(x => x[3]));
          if (idxMarkerSize > 0) {
            // Collect all the marker sizes
            markerSizes.push(arr.map(x => x[idxMarkerSize]));
          }
      });

      // console.log("traceValues:", traceValues);
      return {
        "fields": fields,
        "content": {
          "labels": traces,
          "values": traceValues,
          "msizes": markerSizes
        }
      }
    },

    updateView: function(data, config) {
      if (!data) {
        return;
      }
      // console.log(data);

      var dataset = data.content,
          traces = dataset.labels,
          tracesValues = dataset.values,
          markersSizes = dataset.msizes;

      //get info from config
      var modeBar = SplunkVisualizationUtils.normalizeBoolean(
        this._getEscapedProperty('mbDisplay', config));
      var dispLegend = SplunkVisualizationUtils.normalizeBoolean(
        this._getEscapedProperty('showLegend', config));
      var xTickAngle = this._getEscapedProperty('xAngle', config) || 0;
      var yTickAngle = this._getEscapedProperty('yAngle', config) || 0;
      var zTickAngle = this._getEscapedProperty('zAngle', config) || 0;
      var xAxisLabel = this._getEscapedProperty('xAxisName', config) || "x";
      var yAxisLabel = this._getEscapedProperty('yAxisName', config) || "y";
      var zAxisLabel = this._getEscapedProperty('zAxisName', config) || "z";

      // Cleanup previous data
      Plotly.purge('scatterplot3dContainer_' + this.__uniqueID);
      $('#' + this.id).empty();

      // create a trace for every group of data
      let dataInput = traces.map((v, i, a) => {
        let idx = i*3;
        return {
          x: tracesValues[idx],
          y: tracesValues[idx+1],
          z: tracesValues[idx+2],
          type: 'scatter3d',
          mode: 'markers',
          name: traces[i],
          marker: {
            size: this._normalizeMarkerSize(markersSizes[i]),
            opacity: 0.8,
          }
        };
      });
      // console.log(dataInput);

      // this block sets the prerequisites to display the chart
      var layout = {
        showlegend: dispLegend,
        autosize: true,
        margin: {
          t: 50
        },
        // outside background
        paper_bgcolor: isDarkTheme ? "transparent" : "#fff",
        font: {
          color: isDarkTheme ? '#DCDCDC' : '#444',
        },
        legend: {
          bgcolor: isDarkTheme ? '#212527' : '#fff',
          // move legend above the chart
          orientation: "h",
          y: 1.1,  // 1.0 is top of the plot
          x: 0.5,  // 1.0 is fully right, 0.5 is center
          xanchor: "center", // anchor point relative to x
          yanchor: "bottom" // anchor point relative to y
        },
        scene: {
          bgcolor: isDarkTheme ? "transparent" : "#fff",
          xaxis: {
            autorange: true,
            tickangle: xTickAngle,
            title: {
              text: xAxisLabel
            },
            gridcolor: isDarkTheme ? "#A6A6A6" : "#eee"
          },
          yaxis: {
            autorange: true,
            tickangle: yTickAngle,
            gridcolor: isDarkTheme ? "#A6A6A6" : "#eee",
            title: {
              text: yAxisLabel
            }
          },
          zaxis: {
            autorange: true,
            tickangle: zTickAngle,
            gridcolor: isDarkTheme ? "#A6A6A6" : "#eee",
            title: {
              text: zAxisLabel
            }
          }
        }
      };

      // Plotting the chart
      // full options at: https://github.com/plotly/plotly.js/blob/master/src/plot_api/plot_config.js
      Plotly.newPlot('scatterplot3dContainer_' + this.__uniqueID, dataInput, layout, {
        displayModeBar: modeBar,
        responsive: true,
        displaylogo: false
      });

    },

    // Normalize Marker Size. Supported range is 1-50 pixels.
    _normalizeMarkerSize: function (size) {
      if (size < 1) { return 1; }
      if (size > MAX_MARKER_SZ) { return MAX_MARKER_SZ; }
      return size;
    },

    _getEscapedProperty: function(name, config) {
        var propertyValue = config[this.getPropertyNamespaceInfo().propertyNamespace + name];
        if (propertyValue !== undefined ) propertyValue = propertyValue.replace(/"/g, '');
        return SplunkVisualizationUtils.escapeHtml(propertyValue);
    }

  });
});
