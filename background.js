/***
File: Background Functions
Author: Rainbow Sprinkles
These can't reference the dom at all and only exist to support the extension in the background
***/

// catch errors
try {

  var alertCoins = [];
  var alertPrices = [];

  // the hunt for gas prices
  function GetGasPrice() {
    // the gas api
    var apiCall = 'https://gasprice-proxy.herokuapp.com/provider/ethgaswatch';
    // calling the api
    fetch(apiCall).then(function(res) {
      // wait for response
      if (res.status !== 200) {
        response({slow: 'ERR',normal: 'ERR',fast: 'ERR'});
        // console.log('API Error');
        return;
      }
      res.json().then(function(data) {
        // Store the current data for the popup page
        chrome.storage.sync.set({ slow: data.slow.gwei });
        chrome.storage.sync.set({ normal: data.normal.gwei });
        chrome.storage.sync.set({ fast: data.fast.gwei });
        // update the badge with the normal value
        chrome.action.setBadgeText({text: String(data.normal.gwei)});
        // if the gas is high, show it in red
        chrome.action.setBadgeBackgroundColor({ color: '#1565C0' });
      });
    }).catch(function(err) {
      // console.log('api gave an error: ' + err);
    });
  } // end get gas price function

  // getting the alert prices so we can keep tabs on prices
  function GetAlertPrices() {
    // get the alerts and the api call
    chrome.storage.local.get('alerts', function(data) {
      for (var i = 0; i < data.alerts.length; i++) {
        var obj = data.alerts[i];
        // get the coin names so we can get the prices
        alertCoins.push(obj.alertCoin);
      }
      // try to append that to an API call
      var alertPriceAPI = 'https://api.coingecko.com/api/v3/simple/price?ids=' + alertCoins.toString() + '&vs_currencies=usd&include_market_cap=false';
      // calling the api based on the set alerts
      fetch(alertPriceAPI).then(function(res) {
          // wait for response
          if (res.status !== 200) {
            // api refused connection
            return;
          }
          res.json().then(function(data) {
            for (var i = 0; i < Object.keys(data).length; i++) {
              var coin = Object.keys(data)[i];
              var value = data[coin].usd;
              // add the new alert to the list
              alertPrices.push({ alertCoin: coin, alertCurrentPrice: value });
              chrome.storage.sync.set({ alertPrices: alertPrices }, function(data) {});
              // now let's see if we need to fire an alert
              // ShowAlert(coin, value, 'http://google.com');

                // then update the boolean for the badge


            }
          });
        }).catch(function(err) {
          // api gave an error
        });
    }); // end get the local storage
  }

  // set a timer to update the gas
  chrome.alarms.create('update_gas',{
    "periodInMinutes": 2
  });

  // when the alarm hits, then run the function
  chrome.alarms.onAlarm.addListener(alarm => {

    // let's check to see if there's been an alert
    chrome.storage.sync.get('alerts', function(data) {
      if ( data.alerts != '') {
        // show the alert badge
        // chrome.action.setBadgeText({text: 'Alert'});
        // chrome.action.setBadgeBackgroundColor({ color: '#b92b27' });
        // don't update the gas price
        return;
      }
      // show the updated gas price
      getGasPrice();
      // GetAlertPrices();
    });
  });

  // get the coin list for the marketcaps
  function GetCoinData() {
    // the gas api
    const apiCall = 'https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=10';
    // calling the api
    fetch(apiCall).then(function(res) {
      // wait for response
      if (res.status !== 200) {
        console.log('api refused the connection');
        return;
      }
      res.json().then(function(data) {
        // console.log('Background API Call: ' + coinData);
        chrome.storage.local.set({ coins: data });
      });
    }).catch(function(err) {
      console.log('api gave an error: ' + err);
    });
  }

  // get the coin list of all alerts (btc & eth are defaults)
  function GetAlertData() {
    // the gas api
    const apiCall = 'https://api.coingecko.com/api/v3/simple/price?ids=bitcoin%2Cethereum%2Cbinancecoin&vs_currencies=usd';
    // calling the api
    fetch(apiCall).then(function(res) {
      // wait for response
      if (res.status !== 200) {
        console.log('api refused the connection');
        return;
      }
      res.json().then(function(data) {
        // console.log(data);
        // push that prices into storage
        chrome.storage.sync.set({ btcPrice: data.bitcoin.usd });
        chrome.storage.sync.set({ ethPrice: data.ethereum.usd });
        chrome.storage.sync.set({ bnbPrice: data.binancecoin.usd });

      });
    }).catch(function(err) {
      console.log('api gave an error: ' + err);
    });
  }

  // launch an alert within Chrome
  function ShowAlert(coin, price, url) {
    // send it to chrome
    chrome.notifications.create({
        // function when the alert is created
        type: 'basic',
        iconUrl: 'src/img/32.png',
        title: coin + ' Price Alert',
        message: coin + ' has hit the target price of ' + price
    });
    // make it clickable
    // chrome.notifications.onClicked.addListener(onClickNotification(url));
  }


  // initial calls when you start the extension
  GetCoinData();
  GetGasPrice();
  GetAlertData();
  GetAlertPrices();
  // se the initial currency to used
  chrome.storage.sync.set({ currency: 'usd' });

}
catch(e) {


  // output errors from service worker
  console.log(e);



} // end try
