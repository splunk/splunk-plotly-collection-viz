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

        if (!data) {
          return;
        }
        var dataSet = data;

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

        //this is supposed get the info from the format menu
        // var plotType = config[this.getPropertyNamespaceInfo().propertyNamespace + 'plotType'] || 'candlestick';
        var plotType = config['display.visualizations.custom.candlestick_app.candlestick_chart.plotType']|| 'candlestick';



        //this block traces the chart variables and  sets the asethetics
        var trace = {

          x: time,
          close: close,

          decreasing: {
            line: {
              color: 'red'
            }
          },

          high: high,

          increasing: {
            line: {
              color: 'green'
            }
          },

          line: {
            color: 'black'
          },

          low: low,
          open: open,
          type: plotType,
          xaxis: 'x',
          yaxis: 'y'
        };

        //places the data made in the variable chart into the variable data
        var data1 = [trace];

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
            title: 'Date',
            type: 'date'
          },
          yaxis: {
            autorange: true,
            type: 'linear'
          }
        };

        Plotly.plot('candlestickContainer', data1, layout);

      }
    });
  });
