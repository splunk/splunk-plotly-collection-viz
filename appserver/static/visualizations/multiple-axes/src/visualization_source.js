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
      // Expects to have 2 columns corresponding to 2 fields:
      // <basesearch> | _time scattervalue linevalue1 linevalue2 linevalueX

      var columns = data.columns,
          indexTime = 0,
          indexScatter = indexTime +1,
          retLines = {};

      //This returns nothing if there is no data passed in
      if (columns.length < 1) {
        return;
      }

      // TODO handle errors

      $.each(data.fields, function(i, field){
          if (i > indexScatter) {
            // Got a line trace
            retLines[field.name.toLowerCase()] = columns[i];
          }
      });

      return {
        "time": columns[indexTime],
        "lines": retLines,
        "scatter": columns[indexScatter]
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
      var modeBar = SplunkVisualizationUtils.normalizeBoolean(this._getEscapedProperty('mbDisplay', config));
      var dispLegend = SplunkVisualizationUtils.normalizeBoolean(this._getEscapedProperty('showLegend', config));

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
          return {
            x: time,
            y: value,
            name: key,
            hoverinfo: 'x+y',
            type: 'scatter',
            fill: 'tozeroy',
            mode: 'lines'
          }
      });
      // console.log("Traces ", traces);

      var scatterTrace = {
        x: time,
        y: scatter,
        name: 'scatter',
        hoverinfo: 'x+y',
        type: 'scatter',
        mode: 'markers',
        yaxis: 'y2'
        // text: ['B-a', 'B-b', 'B-c', 'B-d', 'B-e']
        // marker: { size: 12 }
      };

      var dataInput = lineTraces;
      dataInput.push(scatterTrace);

      // Major reference: https://plot.ly/javascript/reference/#layout-yaxis
      var layout = {
        title: 'Double Y Axis Example',
        autosize: true,
        margin: {
          t: 50
        },
        showlegend: dispLegend,
        xaxis: {
          title: xAxisLabel,
          autorange: true,
          tickangle: xTickAngle
          // tickformat: "%H:%M"
        },
        yaxis: {
          title: yAxisLabel,
          tickangle: yTickAngle,
          autorange: true
        },
        yaxis2: {
          title: y2AxisLabel,
          showgrid: false,
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
        // FIXME check buttons which can be removed from plotly mode bar
      });

    },

    _getEscapedProperty: function(name, config) {
        var propertyValue = config[this.getPropertyNamespaceInfo().propertyNamespace + name];
        if (propertyValue !== undefined ) propertyValue = propertyValue.replace(/"/g, '');
        return SplunkVisualizationUtils.escapeHtml(propertyValue);
    }

  });
});
