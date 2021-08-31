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
      this.$el.attr('id', 'boxplotContainer_' + this.__uniqueID);
    },

    getInitialDataParams: function() {
      return ({
        outputMode: SplunkVisualizationBase.ROW_MAJOR_OUTPUT_MODE,
        count: 10000
      });
    },

    formatData: function(data, config) {
      // Expects to have 2 columns corresponding to 2 fields:
      // (0) box_id
      // (1) value

      var fields = data.fields;
      var rows = data.rows;

      //This returns nothing if there is no data passed in
      if (rows.length < 1) {
        return;
      }

      //This checks if all data being passed in are numbers and displays an error if not.
      if (_.isNaN(data)) {
        throw new SplunkVisualizationBase.VisualizationError(
          'This chart only supports numbers'
        );
      }

      var boxGroupLabels = rows.map(x => x[0])
                               .filter(function(x, i, rows){
                                  return rows.indexOf(x) === i;
                               });

      var boxGroupIds = Array.from({length: boxGroupLabels.length}, function(v, k){
                                  value = k+1;
                                  return value.toString();
                              });

      var groupValues = [];

      _.each(boxGroupLabels, function(groupid) {
          // get all objects with same groupid
          var arr = rows.filter(function(el){
                            return el[0] === groupid;
                         });
          groupValues.push(arr.map(x => x[1]));
      });

      // console.log(data);
      // return data;
      return {
        "fields": fields,
        "content": {
          "ids": boxGroupIds,
          "labels": boxGroupLabels,
          "values": groupValues
        }
      }
    },

    updateView: function(data, config) {
      if (!data) {
        return;
      }

      var dataset = data.content,
          boxIds = dataset.ids, // e.g. [1,2,3,4,5]
          boxLabels = dataset.labels,
          boxValues = dataset.values;

      //get info from config
      var modeBar = SplunkVisualizationUtils.normalizeBoolean(
        this._getEscapedProperty('mbDisplay', config));
      var dispLegend = SplunkVisualizationUtils.normalizeBoolean(
        this._getEscapedProperty('showLegend', config));
      var xTickAngle = this._getEscapedProperty('xAngle', config) || 0;
      var yTickAngle = this._getEscapedProperty('yAngle', config) || 0;
      var xAxisLabel = this._getEscapedProperty('xAxisName', config) || "x";
      var yAxisLabel = this._getEscapedProperty('yAxisName', config) || "y";

      var plotMean = this._getBoxDistribution(
        this._getEscapedProperty('boxMean', config) || "none");
      var plotPoints = this._getBoxOutliers(
        this._getEscapedProperty('boxPoints', config) || "none");

      // Cleanup previous data
      Plotly.purge('boxplotContainer_' + this.__uniqueID);
      $('#' + this.id).empty();

      // create a trace for every group of data
      let dataInput = boxIds.map((v, i, a) => {
        return {
          type: 'box',
          y: boxValues[i],
          hoverinfo: 'x+y',
          name: boxLabels[i],
          boxmean: plotMean,
          boxpoints: plotPoints
        };
      });
      // console.log(dataInput);

      // this block sets the prerequisites to display the chart
      var layout = {
        autosize: true,
        margin: {
          t: 50
        },

        paper_bgcolor: isDarkTheme ? "transparent" : "#fff",
        plot_bgcolor: isDarkTheme ? "transparent" : "#fff",
        font: {
          color: isDarkTheme ? '#DCDCDC' : '#444',
        },

        legend: {
          bgcolor: isDarkTheme ? '#212527' : '#fff',
        },
        showlegend: dispLegend,
        
        xaxis: {
          autorange: true,
          tickangle: xTickAngle,
          title: xAxisLabel,
          gridcolor: isDarkTheme ? "#A6A6A6" : "#eee"
        },
        yaxis: {
          zeroline: false,
          autorange: true,
          tickangle: yTickAngle,
          gridcolor: isDarkTheme ? "#A6A6A6" : "#eee",
          title: yAxisLabel
        }
      };

      // Plotting the chart
      Plotly.newPlot('boxplotContainer_' + this.__uniqueID, dataInput, layout, {
        displayModeBar: modeBar,
        displaylogo: false
      });

    },

    _getBoxDistribution: function(value) {
        if (value === "sd") {
            return value;
        }

        return value === "mean";
    },

    _getBoxOutliers : function(value) {
        if (value !== "none") {
           return value;
        }

        return value === "none";
    },

    _getEscapedProperty: function(name, config) {
        var propertyValue = config[this.getPropertyNamespaceInfo().propertyNamespace + name];
        if (propertyValue !== undefined ) propertyValue = propertyValue.replace(/"/g, '');
        return SplunkVisualizationUtils.escapeHtml(propertyValue);
    }

  });
});
