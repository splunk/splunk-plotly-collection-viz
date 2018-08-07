define([
    'jquery',
    'underscore',
    'plotly.js',
    'api/SplunkVisualizationBase',
    'api/SplunkVisualizationUtils'
    // Add required assets to this list
  ],
  function(
    $,
    _,
    Plotly,
    SplunkVisualizationBase,
    SplunkVisualizationUtils
  ) {

    return SplunkVisualizationBase.extend({

      initialize: function() {
        // Save this.$el for convenience
        this.$el = $(this.el);

        // Add a css selector class
        this.$el.attr('id', 'candlestickContainer');
      },

      getInitialDataParams: function() {
        return ({
          outputMode: SplunkVisualizationBase.ROW_MAJOR_OUTPUT_MODE,
          count: 10000
        });
      },

      // this  for mat data method make sure that the data passed in
      formatData: function(data, config) {

        //This returns nothing if there is no data passed in
        if (data.rows.length < 1) {
          return;
        }

        //This checks if all data being passed in are numbers and displays an error if not.
        if (_.isNaN(data)) {
          throw new SplunkVisualizationBase.VisualizationError(
            'This chart only supports numbers'
          );
        }

        return data;
      },

      updateView: function(data, config) {

        // console.log("raw data?" + data);
        if (!data) {
          return;
        }

        var dataSet = data
        // console.log("dataSet?" + dataSet);

        Plotly.purge('ohlcContainer');

        $('#' + this.id).empty();


        // this function extracts a column of an array
        function arrayColumn(arr, n) {
          return arr.map(x => x[n]);
        }

        //Place arrays in variables
        var time = arrayColumn(data.rows, 0);
        var close = arrayColumn(data.rows, 1);
        var high = arrayColumn(data.rows, 2);
        var low = arrayColumn(data.rows, 3);
        var open = arrayColumn(data.rows, 4);

        // console.log(time);
        // console.log(close);
        // console.log(high);
        // console.log(low);
        // console.log(open);

        //this is supposed get the info from the format menu
        // var plotType = config[this.getPropertyNamespaceInfo().propertyNamespace + 'plotType'] || 'candlestick';
        var xTickAngle = config['display.visualizations.custom.candlestick_app.candlestick_chart.xAngle'] || 0;
        var yTickAngle = config['display.visualizations.custom.candlestick_app.candlestick_chart.yAngle'] || 0;

        var modeBar = (config['display.visualizations.custom.candlestick_app.candlestick_chart.mbDisplay'] === 'true');
        var showXLabel = (config['display.visualizations.custom.candlestick_app.candlestick_chart.xDisplay'] === 'true');
        var showYLabel = (config['display.visualizations.custom.candlestick_app.candlestick_chart.yDisplay'] === 'true');

        var xAxisLabel = config['display.visualizations.custom.candlestick_app.candlestick_chart.xAxisName'];
        var yAxisLabel = config['display.visualizations.custom.candlestick_app.candlestick_chart.yAxisName'];
        var incColor = config['display.visualizations.custom.candlestick_app.candlestick_chart.highColor'] || '#008000';
        var decColor = config['display.visualizations.custom.candlestick_app.candlestick_chart.lowColor'] || '#FF0000';


        //this block traces the chart variables and  sets the asethetics
        var trace = {

          x: time,
          close: close,

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
          type: 'ohlc',
          xaxis: 'x',
          yaxis: 'y'
        }; //end of trace

        //places the data made in the variable chart into the variable data
        var data1 = [trace];
        // console.log("data1" + data1);

        // this block sets the prerequisites to display the chart
        var layout = {
          margin: {
            r: 10,
            t: 25,
            b: 40,
            l: 60
          },
          showlegend: false,
          xaxis: {
            autorange: true,
            tickangle: xTickAngle,
            title: xAxisLabel,
            rangeslider: {
              visible: false
            },
            showticklabels: showXLabel,
            type: 'date'
          },
          yaxis: {
            autorange: true,
            showticklabels: showYLabel,
            tickangle: yTickAngle,
            title: yAxisLabel
          }
        };

        // var toggleMb = {displayModeBar: modeBar};
        console.log(modeBar);

        Plotly.plot('ohlcContainer', data1, layout, {
          displayModeBar: modeBar
        });

      } //end of layout
    });
  });
