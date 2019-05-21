# Plotly.js Custom Visualizations
A collection of Splunk modular visualizations based on [plotly.js](https://github.com/plotly/plotly.js/), a JavaScript open-source library used to create interactive charts for finance, engineering and sciences.

Visualizations included into this collection:
* OHLC Chart -  for Stocks and Financial Data    ([source code](appserver/static/visualizations/ohlc/src/visualization_source.js))
* Box Plot Chart - for Statistical Data    ([source code](appserver/static/visualizations/boxplot/src/visualization_source.js))
* Multiple Axes Chart - for Advanced Statistical Data Visualizations    ([source code](appserver/static/visualizations/multiple-axes/src/visualization_source.js))

## Installation
- [Download Splunk for your platform](http://www.splunk.com/download?r=productOverview).
- Unpack/Install Splunk by running the downloaded files.
- Follow the instruction on the screen.

**plotly_custom_viz_splunk** can be downloaded from **GitHub** and installed in your Splunk platform. Access your Splunk instance via terminal and:
- browse to your apps directory `$SPLUNK_HOME/etc/apps/`
- download the app from github `git clone https://github.com/tmuth/plotly_custom_viz_splunk`
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
`<basesearch> | table _time y2-dataset y-dataset1 y-dataset2 y-datasetN`

Replace `_time`, `y2-dataset` and `y-datasetX` with your fields to start.

| FieldName    | Format  | Description                                  | Example               |
|--------------|---------|----------------------------------------------|-----------------------|
| `_time`      | date    | Event time reference                         | `2019-05-17 07:30:02` |
| `y2-dataset` | numeric | Dataset for scatter plot on secondary Y-Axis | `-1.6`                |
| `y-dataset1` | numeric | Dataset for 1st line plot on regular Y-Axis  | `10`                  |
| `y-dataset2` | numeric | Dataset for 2nd line plot on regular Y-Axis  | `3`                   |
| `y-datasetN` | numeric | Dataset for Nth line plot on regular Y-Axis  | `32`                  |

## Examples
Sample SPL Search for OHLC:

```sh
| makeresults count=60
| streamstats count
| eval _time=_time-(count*3600)
| eval open=(random() %50) + 1
| eval sign=if((random() %2)==0,"-","+")
| eval close=(((random() %20)/100)*open)
| eval close=sign+close
| eval close=round(close+open,1)
| eval high=if(open > close,(open*.1)+open,(close*.1)+close)
| eval low=if(open < close,open-(open*.1),close-(close*.1))
| fields - sign,count
| sort _time 
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


