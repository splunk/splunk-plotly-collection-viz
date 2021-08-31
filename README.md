# Financial and Advanced Statistical Data Visualizations
A collection of Splunk modular visualizations based on [plotly.js](https://github.com/plotly/plotly.js/), a JavaScript open-source library used to create interactive charts for finance, engineering and sciences.

Visualizations included into this collection:
* OHLC Chart -  for Stocks and Financial Data    ([source code](appserver/static/visualizations/ohlc/src/visualization_source.js))
* Box Plot Chart - for Statistical Data    ([source code](appserver/static/visualizations/boxplot/src/visualization_source.js))
* Multiple Axes Chart - for Advanced Statistical Data Visualizations    ([source code](appserver/static/visualizations/multiple-axes/src/visualization_source.js))

## Installation
- [Download Splunk for your platform](http://www.splunk.com/download?r=productOverview).
- Unpack/Install Splunk by running the downloaded files.
- Follow the instruction on the screen.

**splunk_plotly_collection_viz** can be downloaded from either **GitHub** or Splunkbase and installed in your Splunk platform. Access your Splunk instance via terminal and:
- browse to your apps directory `$SPLUNK_HOME/etc/apps/`
- download the app from github `git clone https://github.com/splunk/splunk-plotly-collection-viz.git`
- Restart splunk to apply changes `$SPLUNK_HOME/bin/splunk restart`

## Usage
* Type your search
* Click on tab `Visualization` and then select either `OHLC Chart`, `Box Plot` or `Multiple Axes` among available visualizations
* Format the visualization as needed

### OHLC Chart
`<basesearch> | table _time open close high low [currencypair] [8pointEMA] [20pointEMA] [4pointSMA]`

If not provided, default values will be used for optional fields `currencypair`, `8pointEMA`, `20pointEMA` and `4pointEMA`.

> Field names **must** correspond to the ones specified above to be properly handled by the visualization

### Box Plot
`<basesearch> | table box_name value`

Replace `box_name` and `value` with your fields to start.

| FieldName   | Format  | Description              | Example   |
|-------------|---------|--------------------------|-----------|
| `box_name`  | string  | Label of the box         | `A`       |
| `value`     | numeric | Data forming box dataset | `20`      |

### Multiple Axes Plot
`<basesearch> | table _time scatter-y2-dataset1 scatter-y2_datasetN line-y-dataset1 line-y-datasetN`

Replace `_time`, `scatter-y2-datasetX` and `line-y-datasetX` with your fields to start.

| FieldName              | Format  | Description                                  | Example               |
|------------------------|---------|----------------------------------------------|-----------------------|
| `_time`                | date    | Event time reference                         | `2019-05-17 07:30:02` |
| `scatter-y2-dataset1`  | numeric | Dataset for 1st scatter plot on secondary Y-Axis | `-1.6`            |
| `scatter-y2-datasetN`  | numeric | Dataset for Nth scatter plot on secondary Y-Axis | `-2`              |
| `line-y-dataset1`      | numeric | Dataset for 1st line plot on regular Y-Axis      | `10`              |
| `line-y-datasetN`      | numeric | Dataset for Nth line plot on regular Y-Axis      | `32`              |

> Field names **must** begin with `scatter` and `line` to be properly handled by the visualization

## Examples
Sample SPL Search for OHLC:

```sh
| gentimes start=-30 increment=6h
| fields starttime
| eval _time=strftime(starttime,"%Y-%m-%dT%H:%M:%S") 
| eval open=(random() %50) + 1
| eval sign=if((random() %2)==0,"-","+")
| eval close=(((random() %20)/100)*open)
| eval close=sign+close
| eval close=round(close+open,1)
| eval high=if(open > close,(open*.1)+open,(close*.1)+close)
| eval low=if(open < close,open-(open*.1),close-(close*.1))
| sort starttime 
| fields - sign, starttime
| trendline ema8(close) AS 8PointEMA ema20(close) AS 20PointEMA 
| reverse
```

OHLC - Candlestick

![alt text](OHLC_candlestick.png "OHLC Chart - Candlestick")

OHLC - Bars

![alt text](OHLC_bars.png "OHLC Chart - Bars")

Sample SPL Search for BoxPlot:

```sh
| makeresults count=100
| streamstats count as group_num
| eval group_num = ((group_num-1) % 5)+1
| eval group_num = "Test ".group_num 
| eval y=random() %51
| fields - _time
```

![alt text](boxplot_chart.png "Boxplot Chart")

Sample SPL Search for Multiple-Axes:
```sh
| gentimes start=-30 increment=6h
| fields starttime
| eval _time=strftime(starttime,"%Y-%m-%dT%H:%M:%S") 
| eval line1=(random() %50) + 1 
| eval line2=(random() %50) + 1 
| eval sign=if((random() %2)==0,"-","+") 
| eval scatter=(((random() %20)/100)*line1) 
| eval scatter=sign.scatter
| fields - sign
| table _time, scatter, line1, line2
```

![alt text](MultipleAxes_plot.png "Multiple Axes Plot")

## Contributing
* Want to **contribute**? Great! Feel free to [create a Pull Request](https://github.com/splunk/splunk-plotly-collection-viz/pulls)
* **Found a bug?** [Open an issue](https://github.com/splunk/splunk-plotly-collection-viz/issues/new)

## License
This project is licensed under [Apache-2.0](LICENSE.md)
