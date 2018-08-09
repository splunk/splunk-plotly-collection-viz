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

        Plotly.purge('candlestickContainer');

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
        console.log(close);
        // console.log(high);
        // console.log(low);
        console.log(open);

        var trendHigh = high;
        var trendLow = low;

        trendHigh = trendHigh.map(Number);
        trendLow = trendLow.map(Number);
        //these blocks of code calculate the simple moving average of the elements in and array and
        //out put the avgs  in an array also.
        trendHigh.reduce(function(a, b, i) {
          return trendHigh[i] = (a + b) / (i + 2);
        },1);

        trendLow.reduce(function(a, b, i) {
          return trendLow[i] = (a + b) / (i + 2);
        },1);

        console.log(trendHigh);
        console.log(trendLow);

        var sSearches = 'display.visualizations.custom.candlestick_app.candlestick_chart.';

        //this is supposed get the info from the format menu
        var xTickAngle = config[sSearches + 'xAngle'] || 0,
          yTickAngle = config[sSearches + 'yAngle'] || 0,

          modeBar = (config[sSearches + 'mbDisplay'] === 'true'),
          showXLabel = (config[sSearches + 'xDisplay'] === 'true'),
          showYLabel = (config[sSearches + 'yDisplay'] === 'true'),
          rSlider = (config[sSearches + 'showRSlider'] === 'true'),

          dispHigh = (config[sSearches + 'showHigh'] === 'true'),
          dispLow = (config[sSearches + 'showLow'] === 'true'),

          tHighCol = config[sSearches + 'thColor'] || '#1556C5',
          tLowCol = config[sSearches + 'tlColor'] || '#FFA500',

          dispLegend = (config[sSearches + 'showLegend'] === 'true') || 'true',

          typeChart = config[sSearches + 'chartType'] || 'candlestick',

          xAxisLabel = config[sSearches + 'xAxisName'] || 'Date',
          yAxisLabel = config[sSearches + 'yAxisName'],

          incColor = config[sSearches + 'highColor'],
          decColor = config[sSearches + 'lowColor'];


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
        console.log(traceHighAvg);

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
        console.log(traceLowAvg);

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
          margin: {
            r: 10,
            t: 25,
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

        Plotly.plot('candlestickContainer', data1, layout, {
          displayModeBar: modeBar
        });

      } //end of layout
    });
  });
