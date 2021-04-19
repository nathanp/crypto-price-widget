/******************
 * APP FUNCTIONALITY
 ******************/
//access electron from here
const remote = require("electron").remote;
//user settings
const settings = require("electron-settings");

//default coins
if (settings.has("user.coins")) {
  //do nothing because coins already set
} else {
  settings.set("user", {
    coins: ["BTC", "ETH", "LTC"],
  });
}
//default base currency
if (settings.has("user.currency")) {
  //do nothing because currency already set
} else {
  settings.set("user.currency", "USD");
}

/* Base Currency */
base = settings.get("user.currency"); // get the user's base currency
var currSel = document.getElementById("base"); //select the currency select box
currSel.value = settings.get("user.currency"); //select the option that corresponds to the user's currency
setBase = function () {
  //selected base currency
  var sel = document.getElementById("base");
  var x = sel.selectedIndex;
  var y = sel.options;
  base = y[x].text;
  settings.set("user.currency", base); //save the user's selection
  updateData(); //immediately reflect the changed currency
};

//Functions for creating/appending elements
function createNode(element) {
  return document.createElement(element);
}
function append(parent, el) {
  return parent.appendChild(el);
}

const ul = document.getElementById("prices"); // Get the list where we will place coins
const portfolio_ul = document.getElementById("portfolio-list");
var url =
  "https://min-api.cryptocompare.com/data/pricemultifull?fsyms=" +
  settings.get("user.coins") +
  "&tsyms=" +
  base +
  "&extraParams=crypto-price-widget";
var pinCheck = document.getElementById("pin-to-top");
var alwaysShowUsd = document.getElementById("always-show-usd");

function clearData() {
  ul.innerHTML = "";
  clearTimeout(appRefresh);
}

function initData() {
  //need to redeclare the url variable here to grab the latest user coins, etc.
  var url =
    "https://min-api.cryptocompare.com/data/pricemultifull?fsyms=" +
    settings.get("user.coins") +
    "&tsyms=" +
    base +
    "&extraParams=crypto-price-widget";
  fetch(url)
    .then(
      function (response) {
        // Examine the response
        response.json().then(function (data) {
          //console.log(url);
          let pricesDISPLAY = data.DISPLAY; // display for everything except coin symbol
          let pricesRAW = data.RAW; // raw to get "BTC" instead of bitcoin symbol

          var i = 0;
          for (let key of Object.keys(pricesDISPLAY)) {
            let coin = pricesDISPLAY[key];
            //console.log(coin);
            let li = createNode("li"),
              span = createNode("span");
            sym = createNode("span");
            li.setAttribute("class", "price");
            li.setAttribute("id", "coin-" + [key]);

            span.setAttribute("class", "draggable");

            //when adding a new coin, default sortorder to 999
            if (settings.get(li.id + ".order") == null) {
              settings.set(li.id + ".order", 999);
              li.setAttribute("sortorder", 999);
            } else {
              li.setAttribute("sortorder", settings.get(li.id + ".order"));
            }

            append(li, span);
            append(ul, li);
            i++;
          } //for

          //sort your coins
          sortable("#prices", {
            handle: "span",
          })[0].addEventListener("sortstop", function (e) {
            // Declare variables
            var ul, ulPortfolio, li, liPortfolio, i;
            ul = document.getElementById("prices");
            ulPortfolio = document.getElementById("portfolio-list");
            li = ul.getElementsByTagName("li");
            liPortfolio = ulPortfolio.getElementsByTagName("li");
            // Loop through all list items
            for (i = 0; i < li.length; i++) {
              li[i].setAttribute("sortorder", i);

              var elementID = li[i].id;
              //alert(elementID);
              settings.set(elementID, {
                // coin-BTC
                order: li[i].getAttribute("sortorder"),
              });
              //alert(settings.get(elementID + '.order'));
            } //for
            //alert(settings.get('coin.'+e+'.order'));
          }); //sortable

          //Pin to Top - settings check - immediately set checkbox and window to saved state
          if (settings.get("user.pinToTop") == "yes") {
            pinCheck.checked = true;
            remote.getCurrentWindow().setAlwaysOnTop(true);
          } else {
            pinCheck.checked = false;
            remote.getCurrentWindow().setAlwaysOnTop(false);
          }

          //Always show USD - settings check - immediately set checkbox and window to saved state
          if (settings.get("user.alwaysShowUsd") == "yes") {
            alwaysShowUsd.checked = true;
          } else {
            alwaysShowUsd.checked = false;
          }

          sortChildren(document.getElementById("prices"), function (li) {
            return +li.getAttribute("sortorder");
          });
          sortChildren(document.getElementById("portfolio-list"), function (
            li
          ) {
            return +li.getAttribute("sortorder");
          });
        }); //response.json
        updateData();
      } //function(response)
    ) //.then
    .catch(function (err) {
      console.log("Unable to connect!");
      var mainDiv = document.getElementById("main");
      var errorDiv = document.createElement("div");
      errorDiv.className = "error";
      errorDiv.innerHTML =
        '<h2>Uh-oh! Looks like you&#39;re offline.</h2>\
                            <img src="images/offline_doge.jpg" />\
                            <h4>Reconnect, then reload the app.</h4>\
                            <button type="button" class="refresh" onClick="location.reload(false);" >Reload</button>';
      document.getElementById("main").appendChild(errorDiv);
    }); //catch
} //initData

function updateData() {
  //need to redeclare the url variable here to grab the latest user coins, etc.
  var url =
    "https://min-api.cryptocompare.com/data/pricemultifull?fsyms=" +
    settings.get("user.coins") +
    "&tsyms=" +
    base +
    ",USD&extraParams=crypto-price-widget";
  console.log(url)
  /*
   ** What data needs to be grabbed/changed?
   ** Base currency
   ** Coin price
   ** % change
   ** Portfolio - Coin price affects current value / total
   */
  //console.log(settings.get('user.coins'));
  fetch(url).then(
    function (response) {
      // Examine the text in the response
      response.json().then(function (data) {
        let pricesDISPLAY = data.DISPLAY; // display for everything except coin symbol
        let pricesRAW = data.RAW; // raw to get "BTC" instead of bitcoin symbol
        let portfolioSum = 0;

        for (let key of Object.keys(pricesRAW)) {
          let coinDISPLAY = pricesDISPLAY[key];
          let coinDISPLAYchange = coinDISPLAY[base].CHANGEPCT24HOUR;
          let coinRAW = pricesRAW[key];
          //console.log(coinDISPLAY);
          let li = document.getElementById("coin-" + [key]),
            span = document.querySelector("#coin-" + [key] + " span");

          let coinSymbol = coinRAW[base].FROMSYMBOL;
          let coinRate = coinDISPLAY[base].PRICE.replace(/ /g, ""); //.replace(/ /g,'') removes space after $
          if (base != "USD" && settings.get("user.alwaysShowUsd") == "yes") { // display also prices in USD
            coinRate = coinRate + (" <small>($") + coinRAW["USD"].PRICE.toFixed(4) + ")</small>"
          }
          
          //replace currencies that have no symbols with easier to read formats
          if (coinRate.includes("AUD")) {
            coinRate = coinRate.replace("AUD", "A$");
          }
          if (coinRate.includes("CAD")) {
            coinRate = coinRate.replace("CAD", "C$");
          }
          if (coinRate.includes("HKD")) {
            coinRate = coinRate.replace("HKD", "HK$");
          }
          if (coinRate.includes("MXN")) {
            coinRate = coinRate.replace("MXN", "$");
          }
          if (coinRate.includes("NOK")) {
            coinRate = coinRate.replace("NOK", "kr");
          }
          if (coinRate.includes("NZD")) {
            coinRate = coinRate.replace("NZD", "NZ$");
          }
          if (coinRate.includes("SEK")) {
            coinRate = coinRate.replace("SEK", "kr");
          }
          if (coinRate.includes("SGD")) {
            coinRate = coinRate.replace("SGD", "S$");
          }
          if (coinRate.includes("TRY")) {
            coinRate = coinRate.replace("TRY", "₺");
          }
          if (coinRate.includes("ZAR")) {
            coinRate = coinRate.replace("ZAR", "R");
          }

          //console.log(span);
          span.innerHTML =
            '<span class="sym">' +
            coinSymbol +
            "</span> " +
            coinRate +
            '<span class="change">' +
            coinDISPLAYchange +
            "%</span>";

          //Price Alert Test - PRO Feature
          /*
           * Choose crypto
           * Choose price
           * Choose equals, greater than, or less than price
           * Alert set to "on"
           * Alert when matches conditions
           * When click on notification, alert set to "off"
           * Use electron settings, localStorage, or sessionStorage?
           * Should this be included in the updateData or separate?
           */

          /*
              var alerted = localStorage.getItem('alerted') || '';
              if(coinSymbol.includes("BTC") && coinRAW[base].PRICE >= "5723" && alerted != 'yes') { 
                let notif = new window.Notification('Price Alert', {
                  body: "BTC has gone above 5790!"
                });
                notif.onclick = () => {
                  //so it doesn't keep notifying us every 3 seconds.
                  localStorage.setItem('alerted','yes');
                }
              }
             */

          // % Change
          let change = document.querySelector("#coin-" + [key] + " .change");
          if (coinDISPLAYchange > 0) {
            change.className += " positive";
            change.classList.remove("negative");
          } else if (coinDISPLAYchange < 0) {
            change.className += " negative";
            change.classList.remove("postive");
          } else {
            change.classList.remove("postive");
            change.classList.remove("negative");
          }

          // Portfolio
          let quantityValue = document.querySelector(
            "#coin-" + [key] + " .quantity-value"
          );
          let quantityNumber = settings.get("quantity." + [key]);
          let regp = /[^0-9.-]+/g;
          if (quantityNumber != null) {
            quantityTotal =
              parseFloat(coinRate.replace(regp, "")) *
              parseFloat(quantityNumber.replace(regp, ""));
          }
          // sum of all total coin values
          portfolioSum += quantityTotal;
          // put sum into the markup
          let portfolioTotalValue = document.querySelector(
            "#portfolio-total-value .value"
          );

          // total value for each coin
          if (coinRate.includes("Ƀ")) {
            //because BTC has 8 decimal places
            quantityValue.innerHTML = quantityTotal.toFixed(8);
            portfolioTotalValue.innerHTML = portfolioSum.toFixed(8);
          } else if (quantityValue != null) {
            //standard currency format
            quantityValue.innerHTML = quantityTotal
              .toFixed(2)
              .replace(/(\d)(?=(\d{3})+\.)/g, "$1,");
            portfolioTotalValue.innerHTML = portfolioSum
              .toFixed(2)
              .replace(/(\d)(?=(\d{3})+\.)/g, "$1,");
          }
        } //for
      }); //response.json().then
    } //function(response)
  ); //then
  appRefresh = setTimeout(function () {
    updateData();
  }, 5000); // run this once every 5 seconds
} //updateData()

// Let's do this thing!
initData();

// Click on #saveCoins, save the coin selection to the user
document.getElementById("saveCoins").onclick = function () {
  var coinForm = document.getElementById("coinlist");
  var selchb = getSelectedChbox(coinForm); // gets the array returned by getSelectedChbox()
  settings.set("user.coins", selchb);
  //clear and reload
  clearData();
  initData();
};

/***********
 * PORTFOLIO
 ***********/
var portfolio_list_container = document.querySelector("#portfolio-list");
var portfolio_list = settings.get("user.coins");

//generate html from list of coins
for (let key of Object.keys(portfolio_list)) {
  let coin = portfolio_list[key];
  //console.log(coin);
  let li = createNode("li"),
    span = createNode("span");
  sym = createNode("span");
  li.setAttribute("id", "coin-" + [coin]);
  li.setAttribute("sortorder", settings.get(li.id + ".order"));

  append(li, span);
  append(portfolio_ul, li);

  if (settings.has("quantity." + [coin])) {
    inputValue = settings.get("quantity." + [coin]);
  } else {
    inputValue = "0";
    settings.set("quantity." + [coin], "0");
  }

  span.innerHTML =
    '<span class="sym">' +
    coin +
    '</span> <span class="block quantity"><label for="quantity.' +
    coin +
    '">Quantity</label> <input type="number" name="quantity.' +
    coin +
    '" min="0" value="' +
    inputValue +
    '" step=".01"></span> <span class="block value"><label>Current Value</label><span class="quantity-value"></span></span>';

  i++;
} //for

// save quantities
document.getElementById("saveQuantities").onclick = function () {
  var items = portfolio_ul.getElementsByTagName("input");
  for (var i = 0; i < items.length; ++i) {
    // do something with items[i], which is a <li> element
    inputName = items[i].getAttribute("name");
    inputValue = items[i].value;
    //console.log(inputValue);
    settings.set(inputName, inputValue);
  }

  // just reloading the entire app because I have yet to figure out how to add/remove a coin from the primary list without a page reload
  //location.reload(false);
};

/***********
 * SETTINGS
 ***********/
// Settings - list of coins
function loadJSON(callback) {
  //Stored local version of https://www.cryptocompare.com/api/data/coinlist/ for performance
  var file = "./coinlist.json";
  var xobj = new XMLHttpRequest();
  xobj.overrideMimeType("application/json");
  xobj.open("GET", file, true);
  xobj.onreadystatechange = function () {
    if (xobj.readyState == 4 && xobj.status == "200") {
      // Required use of an anonymous callback as .open will NOT return a value but simply returns undefined in asynchronous mode
      callback(xobj.responseText);
    }
  };
  xobj.send(null);
} //loadJSON

// Generate the list of all coins
loadJSON(function (response) {
  // Parse JSON string into object
  var myDiv = document.getElementById("coinlist");
  var actual_JSON = JSON.parse(response);
  //alert(settings.get('user.coins'));
  //console.log(actual_JSON.Data);

  //loop through data, get coin info, generate checkbox for each coin
  Object.keys(actual_JSON.Data).forEach(function (key) {
    //console.log(actual_JSON.Data[key].Name);
    //console.log(actual_JSON.Data[key].CoinName);
    var li = document.createElement("li");
    var checkBox = document.createElement("input");
    checkBox.className = "coinCode";
    var label = document.createElement("label");
    label.className = "coinName";
    var div = document.createElement("div");
    checkBox.type = "checkbox";
    checkBox.value = actual_JSON.Data[key].Name;
    checkBox.id = actual_JSON.Data[key].Name;
    label.htmlFor = actual_JSON.Data[key].Name;
    checkBox.name = "cl[]";
    //check the coins the user has already set
    var str = String(settings.get("user.coins"));
    var split_str = str.split(",");
    if (split_str.indexOf(actual_JSON.Data[key].Name) !== -1) {
      checkBox.checked = true;
    }
    myDiv.appendChild(li);
    li.appendChild(checkBox);
    li.appendChild(label);
    label.appendChild(document.createTextNode(actual_JSON.Data[key].CoinName));
    label.appendChild(
      document.createTextNode(" (" + actual_JSON.Data[key].Name + ")")
    );
    label.appendChild(div);
  }); //forEach
}); //loadJSON

// Returns an array with values of the selected (checked) checkboxes in "frm"
function getSelectedChbox(frm) {
  var selchbox = []; // array that will store the value of selected checkboxes
  // gets all the input tags in frm, and their number
  var inpfields = frm.getElementsByTagName("input");
  var nr_inpfields = inpfields.length;
  // traverse the inpfields elements, and adds the value of selected (checked) checkbox in selchbox
  for (var i = 0; i < nr_inpfields; i++) {
    if (inpfields[i].type == "checkbox" && inpfields[i].checked == true)
      selchbox.push(inpfields[i].value);
  }
  return selchbox;
}

/***********
 * PIN TO TOP
 *************/
pinCheck.onclick = function (event) {
  var window = remote.getCurrentWindow();
  var checkbox = event.target;
  if (checkbox.checked) {
    //Checkbox has been checked
    window.setAlwaysOnTop(true); //immediately make the change to the window
    settings.set("user.pinToTop", "yes");
  } else {
    //Checkbox has been unchecked
    window.setAlwaysOnTop(false);
    settings.set("user.pinToTop", "no");
  }
};

/***********
 * ALWAYS SHOW USD
 *************/
alwaysShowUsd.onclick = function (event) {
  var checkbox = event.target;
  if (checkbox.checked) {
    settings.set("user.alwaysShowUsd", "yes")
  } else {
    settings.set("user.alwaysShowUsd", "no")
  }
}

/*******
 * APP UI
 ********/

//Window controls
document.getElementById("close-btn").addEventListener("click", function (e) {
  var window = remote.getCurrentWindow();
  window.close();
});
document.getElementById("min-btn").addEventListener("click", function (e) {
  var window = remote.getCurrentWindow();
  window.minimize();
});

//Panel tabs
var tabLinks = document.querySelectorAll(".tabs button");
for (var i = 0; i < tabLinks.length; i++) {
  tabLinks[i].onclick = function () {
    var target = this.getAttribute("href").replace("#", "");
    var sections = document.querySelectorAll(".panel");
    for (var j = 0; j < sections.length; j++) {
      sections[j].style.display = "none";
    }
    document.getElementById(target).style.display = "block";
    for (var k = 0; k < tabLinks.length; k++) {
      tabLinks[k].removeAttribute("class");
    }
    this.setAttribute("class", "active");
    return false;
  };
}

//Coin search filter
function myFunction() {
  // Declare variables
  var input, filter, ul, li, a, i;
  input = document.getElementById("myInput");
  filter = input.value.toUpperCase();
  ul = document.getElementById("coinlist");
  li = ul.getElementsByTagName("li");

  // Loop through all list items, and hide those who don't match the search query
  for (i = 0; i < li.length; i++) {
    label = li[i].getElementsByTagName("label")[0];
    checkbox = li[i].getElementsByTagName("input")[0].value;
    if (label.innerHTML.toUpperCase().indexOf(filter) > -1) {
      li[i].style.display = "";
    } else {
      li[i].style.display = "none";
    }
  } //for
} //myFunction

//sort by attribute
function sortChildren(wrap, f, isNum) {
  var l = wrap.children.length,
    arr = new Array(l);
  for (var i = 0; i < l; ++i) arr[i] = [f(wrap.children[i]), wrap.children[i]];
  arr.sort(
    isNum
      ? function (a, b) {
          return a[0] - b[0];
        }
      : function (a, b) {
          return a[0] < b[0] ? -1 : a[0] > b[0] ? 1 : 0;
        }
  );
  var par = wrap.parentNode,
    ref = wrap.nextSibling;
  par.removeChild(wrap);
  for (var i = 0; i < l; ++i) wrap.appendChild(arr[i][1]);
  par.insertBefore(wrap, ref);
} //sortChildren
