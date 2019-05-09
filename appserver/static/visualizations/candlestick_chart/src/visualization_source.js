define([
    'jquery',
    'underscore',
    'plotly.js-dist',
    'api/SplunkVisualizationBase',
    'api/SplunkVisualizationUtils',
    'sma'
    // Add required assets to this list
  ],
  function(
    $,
    _,
    Plotly,
    SplunkVisualizationBase,
    SplunkVisualizationUtils,
    sma
  ) {

    return SplunkVisualizationBase.extend({

      initialize: function() {
        // Save this.$el for convenience

        // Handle multiple Graphs
        this.__uniqueID = Math.floor(Math.random() * 100000);
        
        this.$el = $(this.el);
        // Add a css selector class
        this.$el.attr('id', 'candlestickContainer_' + this.__uniqueID);
      },

      getInitialDataParams: function() {
        return ({
          outputMode: SplunkVisualizationBase.COLUMN_MAJOR_OUTPUT_MODE,
          count: 10000
        });
      },

      // this  for mat data method make sure that the data passed in
      formatData: function(data, config) {
        // Expects data
        // <basesearch> | table _time, open, close, low, high

        //This returns nothing if there is no data passed in
        if (data.columns.length < 1) {
          return;
        }

        //This checks if all data being passed in are numbers and displays an error if not.
        // if (_.isNaN(data)) {
        //   throw new SplunkVisualizationBase.VisualizationError(
        //     'This chart only supports numbers'
        //   );
        // }

        var columns = data.columns,
            retData = {};

        $.each(data.fields, function(i, field){
            retData[field.name.toLowerCase()] = columns[i];
        });

        return retData;
      },

      updateView: function(data, config) {

        if (!data) {
          return;
        }

        var time = data._time,
            open = data.open,
            close = data.close,
            high = data.high,
            low = data.low,
            trendHigh = high,
            trendLow = low;

        // Get info from config
        var modeBar = SplunkVisualizationUtils.normalizeBoolean(this._getEscapedProperty('mbDisplay', config));
        var dispLegend = SplunkVisualizationUtils.normalizeBoolean(this._getEscapedProperty('showLegend', config));
        var xTickAngle = this._getEscapedProperty('xAngle', config) || 0;
        var yTickAngle = this._getEscapedProperty('yAngle', config) || 0;
        var xAxisLabel = this._getEscapedProperty('xAxisName', config) || "x";
        var yAxisLabel = this._getEscapedProperty('yAxisName', config) || "y";

        var xTickAngle = this._getEscapedProperty('xAngle', config) || 0;
        var yTickAngle = this._getEscapedProperty('yAngle', config) || 0;
        var modeBar = SplunkVisualizationUtils.normalizeBoolean(this._getEscapedProperty('mbDisplay', config));
        var rSlider = SplunkVisualizationUtils.normalizeBoolean(this._getEscapedProperty('showRSlider', config));
        var dispHigh = SplunkVisualizationUtils.normalizeBoolean(this._getEscapedProperty('showHigh', config));
        var dispLow = SplunkVisualizationUtils.normalizeBoolean(this._getEscapedProperty('showLow', config));
        var tHighCol = this._getEscapedProperty('thColor', config) || '#1556C5';
        var tLowCol = this._getEscapedProperty('tlColor', config) || '#FFA500';
        var dispLegend = SplunkVisualizationUtils.normalizeBoolean(this._getEscapedProperty('showLegend', config));
        var typeChart = this._getEscapedProperty('chartType', config) || 'candlestick';
        var xAxisLabel = this._getEscapedProperty('xAxisName', config) || 'Date';
        var yAxisLabel = this._getEscapedProperty('yAxisName', config);
        var incColor = this._getEscapedProperty('highColor', config) || '#008000';
        var decColor = this._getEscapedProperty('lowColor', config) || '#FF0000';

        // Cleanup previous data
        Plotly.purge('candlestickContainer_' + this.__uniqueID);
        $('#' + this.id).empty();

        //converts the string array to a number array
        trendHigh = trendHigh.map(Number);
        trendLow = trendLow.map(Number);

        // console.log(trendHigh);
        // console.log(trendLow);

        //these blocks of code calculate the simple moving average of the elements in and array and
        //out put the avgs  in an array also.
        trendHigh = sma(trendHigh, 4);
        trendLow = sma(trendLow, 4);

        // console.log(trendHigh);
        // console.log(trendLow);

        //this block traces the chart variables and  sets the asethetics
        var trace = {

          x: time,
          close: close,
          name: 'Data',
          decreasing: {
            line: {
              color: decColor
            }
          },

          high: high,

          increasing: {
            line: {
              color: incColor
            }
          },

          line: {
            color: 'black'
          },

          low: low,
          open: open,
          type: typeChart,
          xaxis: 'x',
          yaxis: 'y'
        }; //end of trace

        var traceHighAvg = {
          x: time,
          y: trendHigh,
          name: 'High',
          line: {
            dash: 'dashdot',
            color: tHighCol,
            width: 3
          },
          mode: 'lines'
        };
        // console.log(traceHighAvg);

        var traceLowAvg = {
          x: time,
          y: trendLow,
          name: 'Low',
          line: {
            dash: 'dot',
            color: tLowCol,
            width: 3
          },
          mode: 'lines'
        };
        // console.log(traceLowAvg);

        var data1;
        //places the data made in the variable chart into the variable data
        if (!dispHigh && !dispLow) {
          data1 = [trace];
        } else if (!dispHigh && dispLow) {
          data1 = [trace, traceLowAvg];
        } else if (dispHigh && !dispLow) {
          data1 = [trace, traceHighAvg];
        } else {
          data1 = [trace, traceHighAvg, traceLowAvg];
        }

        // console.log("data1" + data1);

        // this block sets the prerequisites to display the chart
        var layout = {
          autosize: true,
          margin: {
            r: 10,
            t: 10,
            b: 40,
            l: 60
          },
          showlegend: dispLegend,
          xaxis: {
            autorange: true,
            tickangle: xTickAngle,
            title: xAxisLabel,
            rangeslider: {
              visible: rSlider
            },
            type: 'date'
          },
          yaxis: {
            autorange: true,
            tickangle: yTickAngle,
            title: yAxisLabel
          }
        };

        // Plotting the chart
        Plotly.plot('candlestickContainer_'  + this.__uniqueID, data1, layout, {
          displayModeBar: modeBar
        });

      },

      _getEscapedProperty: function(name, config) {
        var propertyValue = config[this.getPropertyNamespaceInfo().propertyNamespace + name];
        if (propertyValue !== undefined ) propertyValue = propertyValue.replace(/"/g, '');
        return SplunkVisualizationUtils.escapeHtml(propertyValue);
      }
    });
  });
