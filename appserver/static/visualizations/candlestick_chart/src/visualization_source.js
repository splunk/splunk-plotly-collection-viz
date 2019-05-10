define([
    'jquery',
    'underscore',
    'plotly.js-dist',
    'api/SplunkVisualizationBase',
    'api/SplunkVisualizationUtils',
    'sma',
    'exponential-moving-average'
    // Add required assets to this list
  ],
  function(
    $,
    _,
    Plotly,
    SplunkVisualizationBase,
    SplunkVisualizationUtils,
    sma,
    ema
  ) {

    var CURRENCY_PAIR_FIELDNAME = "currencypair";
    var EMA8_FIELDNAME = '8pointema';
    var EMA20_FIELDNAME = '20pointema';
    var SMA4_FIELDNAME = '4pointsma';
    var COLORS = {
      'decrease': '#FF0000',
      'increase': '#008000',
      'trendlines': {
        [EMA8_FIELDNAME]: '#0140AD',
        [EMA20_FIELDNAME]: '#FF8026',
        [SMA4_FIELDNAME]: '#9B1232'
      }
    };

    var isDarkTheme = SplunkVisualizationUtils.getCurrentTheme &&
                      SplunkVisualizationUtils.getCurrentTheme() === 'dark';

    return SplunkVisualizationBase.extend({

      initialize: function() {
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
        // <basesearch> | table _time, open, close, low, high, [currencypair], [20pointEMA], [8pointEMA], [4pointSMA]

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
            if (CURRENCY_PAIR_FIELDNAME === field.name.toLowerCase()) {
                retData[field.name.toLowerCase()] = $.unique(columns[i])[0];
                return true;
            }
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
            low = data.low;

        var title = data.hasOwnProperty(CURRENCY_PAIR_FIELDNAME) ?
                        data[CURRENCY_PAIR_FIELDNAME] : '<CurrencyPair>';

        // Get info from config
        var modeBar = SplunkVisualizationUtils.normalizeBoolean(this._getEscapedProperty('mbDisplay', config));
        var dispLegend = SplunkVisualizationUtils.normalizeBoolean(this._getEscapedProperty('showLegend', config));
        var rSlider = SplunkVisualizationUtils.normalizeBoolean(this._getEscapedProperty('showRSlider', config));

        var typeChart = this._getEscapedProperty('chartType', config) || 'candlestick';

        var xTickAngle = this._getEscapedProperty('xAngle', config) || 0;
        var yTickAngle = this._getEscapedProperty('yAngle', config) || 0;
        var xAxisLabel = this._getEscapedProperty('xAxisName', config) || "Date";
        var yAxisLabel = this._getEscapedProperty('yAxisName', config);

        var showTrendEMA = this._getTrendline(this._getEscapedProperty('showEMA', config) || "none");
        var showTrendSMA = this._getTrendline(this._getEscapedProperty('showSMA', config) || "none");

        // Cleanup previous data
        Plotly.purge('candlestickContainer_' + this.__uniqueID);
        $('#' + this.id).empty();

        // Trace the chart variables and set style
        var trace = {
          type: typeChart,

          x: time,
          name: title,
          hoverinfo: 'x+y',

          open: open,
          high: high,
          close: close,
          low: low,

          increasing: {
            line: {
              color: COLORS.increase,
              width: 1
            }
          },
          decreasing: {
            line: {
              color: COLORS.decrease,
              width: 1
            }
          },
          // No need of having this trace in legend
          showlegend: false
        };

        var chartData = [trace];
        // Adding Trendlines
        if (showTrendEMA) {
          if (this._hasDataField(showTrendEMA)) {
              // Data available
              if (showTrendEMA === EMA8_FIELDNAME || showTrendEMA === 'all') {
                chartData.push(this._getTrendlineTrace(EMA8_FIELDNAME, time, data[EMA8_FIELDNAME]));
              }
              if (showTrendEMA === EMA20_FIELDNAME || showTrendEMA === 'all') {
                chartData.push(this._getTrendlineTrace(EMA20_FIELDNAME, time, data[EMA20_FIELDNAME]));
              }

          } else {
              // Calculate data depending on data.close
              if (showTrendEMA === EMA8_FIELDNAME || showTrendEMA === 'all') {
                chartData.push(this._getTrendlineTrace(EMA8_FIELDNAME, time, this._getEMA8(close)));
              }
              if (showTrendEMA === EMA20_FIELDNAME || showTrendEMA === 'all') {
                chartData.push(this._getTrendlineTrace(EMA20_FIELDNAME, time, this._getEMA20(close)));
              }
          }
        }

        if (showTrendSMA) {
          if (data.hasOwnProperty(showTrendSMA)) {
              // Data available
              chartData.push(this._getTrendlineTrace(showTrendSMA, time, data[SMA4_FIELDNAME]));
          } else {
              // Calculate data depending on data.close
              chartData.push(this._getTrendlineTrace(showTrendSMA, time, this._getSMA(close)));
          }
        }


        // this block sets the prerequisites to display the chart
        var layout = {
          title: title,
          autosize: true,
          margin: {
            t: 50
          },
          paper_bgcolor: isDarkTheme ? "transparent" : "#fff",
          plot_bgcolor: isDarkTheme ? "transparent" : "#fff",
          font: {
            color: isDarkTheme ? '#F0F0F0' : '#000',
          },
          showlegend: dispLegend,
          // https://plot.ly/javascript/reference/#layout-legend
          legend: {
            bgcolor: isDarkTheme ? '#212527' : '#fff',
            // Change orientation? https://github.com/plotly/plotly.js/issues/1199
          },
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
        // Functions ref. https://plot.ly/javascript/plotlyjs-function-reference/
        // > config details: https://github.com/plotly/plotly.js/blob/master/src/plot_api/plot_config.js
        Plotly.plot('candlestickContainer_'  + this.__uniqueID, chartData, layout, {
          displayModeBar: modeBar,
          displaylogo: false,
          // https://github.com/plotly/plotly.js/blob/master/src/components/modebar/buttons.js
          modeBarButtonsToRemove: ['pan2d', 'select2d', 'lasso2d', 'zoomIn2d', 'zoomOut2d', 'resetScale2d'],
        });

      },

      _getTrendlineTrace: function(name, time, values){
        return {
          x: time,
          y: values,

          hoverinfo: 'x+y',
          name: name,

          line: {
            // Ref: https://plot.ly/javascript/reference/#ohlc
            dash: 'solid',
            color: COLORS.trendlines[name],
            width: 1
          }
        };
      },

      _getSMA: function(values) {
        //converts the string array to a number array
        values = values.map(Number);
        // Ref. https://npm.taobao.org/package/sma
        return sma(values, 4);
      },

      _getEMA8: function(values) {
          // Ref. https://github.com/jonschlinkert/exponential-moving-average
          return ema(values, 8);
      },

      _getEMA20: function(values) {
          return ema(values, {
            range: 20,
            format: function(num) {
              return num.toFixed(3);
            }
          });
      },

      _getTrendline : function(value) {
          if (value === "none") {
            return false;
          }
          return value;
      },

      _hasDataField: function(requested) {
        var data = this.getCurrentData();
        if (requested === 'all') {
          return data.hasOwnProperty(EMA8_FIELDNAME) && data.hasOwnProperty(EMA20_FIELDNAME);
        }
        return data.hasOwnProperty(requested);
      },

      _getEscapedProperty: function(name, config) {
        var propertyValue = config[this.getPropertyNamespaceInfo().propertyNamespace + name];
        if (propertyValue !== undefined ) propertyValue = propertyValue.replace(/"/g, '');
        return SplunkVisualizationUtils.escapeHtml(propertyValue);
      }
    });
  });
