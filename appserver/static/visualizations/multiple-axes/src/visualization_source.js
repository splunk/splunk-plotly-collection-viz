define([
  'jquery',
  'underscore',
  'plotly.js-dist',
  'lodash.clonedeep',
  'd3',
  'api/SplunkVisualizationBase',
  'api/SplunkVisualizationUtils'
  // Add required assets to this list
], function (
  $,
  _,
  Plotly,
  clonedeep,
  d3,
  SplunkVisualizationBase,
  SplunkVisualizationUtils
) {

  var isDarkTheme = SplunkVisualizationUtils.getCurrentTheme &&
                    SplunkVisualizationUtils.getCurrentTheme() === 'dark';

  return SplunkVisualizationBase.extend({

    initialize: function() {
      // Save this.$el for convenience
      this.$el = $(this.el);

      // Handle multiple Graphs
      this.__uniqueID = Math.floor(Math.random() * 100000);

      // Add a css selector class
      this.$el.attr('id', 'multipleaxesContainer_' + this.__uniqueID);
    },

    getInitialDataParams: function() {
      return ({
        outputMode: SplunkVisualizationBase.COLUMN_MAJOR_OUTPUT_MODE,
        count: 10000
      });
    },

    formatData: function(data, config) {
      // Expects to have field names beginning with scatter* and line*
      // <basesearch> | _time scatterval1 scatterval2 scattervalN lineval1 lineval2 linevalN

      var columns = data.columns,
          indexTime = 0,
          retScatter = {},
          retLines = {};

      //This returns nothing if there is no data passed in
      if (columns.length < 1) {
        return;
      }

      $.each(data.fields, function(i, field){
          if (i > indexTime) {
            if (field.name.match("^scatter")) {
              // Got a scatter trace
              retScatter[field.name.toLowerCase()] = columns[i];
              return true;
            }

            if (field.name.match("^line")) {
              // Got a line trace
              var currValue = 0;
              $.each(columns[i], function (j, col) {
                if (col !== null) {
                  // Linked to autorange: "reversed". TODO Check
                  // currValue = Math.abs(col) * -1;
                  currValue = col;
                }
                // Replace null/empty values w/ latest
                columns[i][j] = currValue.toString(10);
              });
              retLines[field.name.toLowerCase()] = columns[i];
              return true;
            }

            // Throw error?
            console.log("WARNING: got a field with unknown name. Skipping.");
          }
      });

      return {
        "time": columns[indexTime],
        "lines": retLines,
        "scatter": retScatter
      }
    },

    updateView: function(data, config) {
      if (!data) {
        return;
      }

      // console.log("updateView - Got data ", data);
      var time = data.time,
          lines = data.lines,
          scatter = data.scatter;

      //get info from config
      var title = this._getEscapedProperty("titleChart", config) || "";
      var modeBar = SplunkVisualizationUtils.normalizeBoolean(
          this._getEscapedProperty('mbDisplay', config));
      var dispLegend = SplunkVisualizationUtils.normalizeBoolean(
          this._getEscapedProperty('showLegend', config));

      var xTickAngle = this._getEscapedProperty('xAngle', config) || 0;
      var yTickAngle = this._getEscapedProperty('yAngle', config) || 0;
      var y2TickAngle = this._getEscapedProperty('y2Angle', config) || 0;

      var xAxisLabel = this._getEscapedProperty('xAxisName', config) || "x";
      var yAxisLabel = this._getEscapedProperty('yAxisName', config) || "y";
      var y2AxisLabel = this._getEscapedProperty('y2AxisName', config) || "y2";

      // Cleanup previous data
      Plotly.purge('multipleaxesContainer_' + this.__uniqueID);
      $('#' + this.id).empty();

      let lineTraces = $.map(lines, function(value, key) {
        let tempValue = clonedeep(value);
        return {
            x: time,
            y: value,
            name: key,
            shape: "spline",
            smoothing: 0,
            hovertext: tempValue,
            hoverinfo: "text",
            type: "scatter",
            fill: "tonexty",
            // stackgroup: 'one',
            yaxis: "y2",
            mode: "lines"
        };
      });

      let stackingTraces = function (traces, backupTraces) {
        for (i=1; i<traces.length; i++) {
          for (j=0; j < Math.min(traces[i]["y"].length, traces[i - 1]["y"].length); j++) {
            //traces[i]["hovertext"][j] = String(traces[i]["y"][j]);
            backupTraces[i]["y"][j] = Number(traces[i]["y"][j]) + Number(traces[i - 1]["y"][j]);
            backupTraces[i]["hovertext"][j] = traces[i]["y"][j];
          }
        }
        return backupTraces;
      };

      // Handling colors
      // > See also https://stackoverflow.com/questions/40673490/how-to-get-plotly-js-default-colors-list
      var colors = d3.scale.category20(),
        colorsRange = colors.range(), // ["#ff1ada", ..]
        nextColor = -2;

      let scatterTrace = $.map(scatter, function (value, key) {
        nextColor = nextColor + 2; // Skipping colors used for line area filling
        return {
            x: time,
            y: value,
            name: key,
            //hoverinfo: "x+y",
            type: "scatter",
            // Custom color
            marker: {
              color: colorsRange[nextColor]
            },
            mode: "markers"
        };
      });

      var dataInput = stackingTraces(lineTraces, clonedeep(lineTraces));
      $.merge(dataInput, scatterTrace);

      // Major reference: https://plot.ly/javascript/reference/#layout-yaxis
      var layout = {
        title: title,
        autosize: true,
        margin: {
          t: 30,
          b: 30
        },
        showlegend: dispLegend,
        // In reference to: https://github.com/plotly/plotly.js/issues/1594
        legend: {
          orientation: "v",
          x: 1.1,
          xanchor: "left",
          y: 1
        },
        xaxis: {
          title: xAxisLabel,
          autorange: true,
          tickangle: xTickAngle
          // tickformat: "%H:%M"
        },
        yaxis: {
          title: yAxisLabel,
          tickangle: yTickAngle,
          autorange: true,
          ticksuffix: "s",
          autorange: false,
          range: [0, 40]
        },
        yaxis2: {
          title: y2AxisLabel,
          showgrid: false,
          autorange: "reversed",
          tickangle: y2TickAngle,
          titlefont: {color: 'rgb(148, 103, 189)'},
          tickfont: {color: 'rgb(148, 103, 189)'},
          overlaying: 'y',
          anchor: 'x',
          side: 'right'
        }
      };

      // Plotting the chart
      Plotly.newPlot('multipleaxesContainer_' + this.__uniqueID, dataInput, layout, {
        displayModeBar: modeBar,
        displaylogo: false
        // TODO Check buttons which can be removed from plotly mode bar
      });
    },

    _getEscapedProperty: function(name, config) {
        var propertyValue = config[this.getPropertyNamespaceInfo().propertyNamespace + name];
        if (propertyValue !== undefined ) propertyValue = propertyValue.replace(/"/g, '');
        return SplunkVisualizationUtils.escapeHtml(propertyValue);
    }

  });
});
