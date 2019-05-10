# Plotly.js Custom Vizualization Project - Splunk SE Summer Internship 2018
The [plotly.js](https://github.com/plotly/plotly.js/) charting library has been packaged into a Splunk application to expose the charts via the Splunk Custom Visualization Framework

Tamar A. Zamba -  Lead Developer 
SE Intern, Plano, TX

Tyler Muth - Project Manager
Analytics Architect,  Washington, D.C. 

This modular visualization app includes:
1. OHLC Chart -  for Stocks and Financial Data.    [OHLC source code](https://github.com/tmuth/plotly_custom_viz_splunk/blob/master/appserver/static/visualizations/ohlc/src/visualization_source.js)
2. Box Plot Chart - for displaying Statistical Data.    [BoxPlot source code](https://github.com/tmuth/plotly_custom_viz_splunk/blob/master/appserver/static/visualizations/boxplot/src/visualization_source.js)

## Installation
- [Download Splunk for your platform](http://www.splunk.com/download?r=productOverview).
- Unpack/Install Splunk by running the downloaded files.
- Follow the instruction on the screen.

Download the app **plotly_custom_viz_splunk** from **GitHub** and installed in your Splunk platform. Access your Splunk instance via terminal and:
- browse to your apps directory `$SPLUNK_HOME/etc/apps/`
- download the app from github `git clone https://github.com/tmuth/plotly_custom_viz_splunk`
- Restart splunk to apply changes `$SPLUNK_HOME/bin/splunk restart`

## Usage
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


Sample SPL Search for BoxPlot:

```sh
| makeresults count=100
| streamstats count as group_num
| eval group_num = ((group_num-1) % 5)+1
| eval group_num = "Test ".group_num 
| eval y=random() %51
| fields - _time
```
