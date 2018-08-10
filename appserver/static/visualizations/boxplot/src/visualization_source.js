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
        this.$el.attr('id', 'boxplotContainer');
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

        Plotly.purge('boxplotContainer');

        $('#' + this.id).empty();

        // this function extracts a column of an array
        function arrayColumn(arr, n) {
          return arr.map(x => x[n]);
        }
        // retuens only the unique files in an array
        function uniqueVal(value, index, self) {
          return self.indexOf(value) === index;
        }
        //filter the arrays
        function getFilteredArray(array, key, value) {
          return array.filter(function(e) {
            return e[key] == value;
          });
        }
        //create an array for each unique group
        function arrGenerator(arr) {
          return arr.map(x => groups[x] = []);
        }
        //places data to be plotted into their respective groups
        function fileData(arr, n) {
          return arr.map(x => arr[n] = getFilteredArray(data.rows, 0, ++n));
        }

        //Place arrays in variables
        var groupNum = arrayColumn(data.rows, 0);
        var yValue = arrayColumn(data.rows, 1);

        groupNum = groupNum.filter(uniqueVal);
        yValue = yValue.filter(uniqueVal);


        //this block of code creates a new array for every value in the groupNum
        var groups = [];

        groups = arrGenerator(groupNum);

        groups = fileData(groups, 0);


        //this is supposed get the info from the format menu
        var sSearches = 'display.visualizations.custom.candlestick_app.boxplot.';
        var modeBar = (config[sSearches + 'mbDisplay'] === 'true'),
          dispLegend = (config[sSearches + 'showLegend'] === 'true'),
          xAxisLabel = config[sSearches + 'xAxisName'],
          yAxisLabel = config[sSearches + 'yAxisName'];

        // create a trace for every group of data
        let groupTraces = groupNum.map((v, i, a) => {
          return {
            y: arrayColumn(groups[i], 1),
            name: groupNum[i],
            x: groupNum[i],
            boxpoints: 'all',
            type: 'box'

          };
        });

        // console.log(groupTraces);

        //convert array to list of objects
        //this is needed to ensure that the data is in the
        //proper format to be plotted.
        var objTraces = groupTraces.reduce(function(acc, cur, i) {
          acc[i] = cur;
          return acc;
        }, []);

        var data1 = objTraces;
        // console.log(data1);
        //places the data made in the variable chart into the variable data

        // this block sets the prerequisites to display the chart
        var layout = {
          autosize: false,
          width: 960,
          height: 250,
          margin: {
            r: 10,
            t: 10,
            b: 40,
            l: 60
          },
          showlegend: dispLegend,
          xaxis: {
            autorange: true,
            tickangle: 45,
            title: xAxisLabel,
            type: 'date'
          },
          yaxis: {
            zeroline: false,
            autorange: true,
            tickangle: 45,
            title: yAxisLabel
          },
          boxmode: 'group'
        };

        Plotly.plot('boxplotContainer', data1, layout, {
          displayModeBar: modeBar
        });

      } //end of layout
    });
  });
