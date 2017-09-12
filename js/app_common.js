/******************
* APP FUNCTIONALITY
******************/
//user settings
const settings = require('electron-settings');
settings.set('developer', {
  first: 'Nathan',
  last: 'Parikh'
});
  //default coins
  if(settings.has('user.coins')) {
    //do nothing because coins already set
  }
  else {
     settings.set('user', {
      coins: 'BTC,ETH,LTC'
    });
  }
  //default base currency
  if(settings.has('user.currency')) {
    //do nothing because currency already set
  }
  else {
     settings.set('user.currency', 'USD');
  }

(function() {

  function loadJSON(callback) {   
    var file = 'https://www.cryptocompare.com/api/data/coinlist/';
    var xobj = new XMLHttpRequest();
        xobj.overrideMimeType("application/json");
        xobj.open('GET', file, true);
        xobj.onreadystatechange = function () {
          if (xobj.readyState == 4 && xobj.status == "200") {
            // Required use of an anonymous callback as .open will NOT return a value but simply returns undefined in asynchronous mode
            callback(xobj.responseText);
          }
        };
        xobj.send(null);  
  } //loadJSON

  // Generate the list of all coins
  loadJSON(function(response) {
    // Parse JSON string into object
    var myDiv = document.getElementById("coinlist");
    var actual_JSON = JSON.parse(response);
    //alert(settings.get('user.coins'));
    //console.log(actual_JSON.Data);
    
    //loop through data, get coin info, generate checkbox for each coin
    Object.keys(actual_JSON.Data).forEach(function(key) {
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
      checkBox.name = "cl[]";
      //check the coins the user has already set
      var str = String(settings.get('user.coins'));
      var split_str = str.split(",");
      if (split_str.indexOf(actual_JSON.Data[key].Name) !== -1) {
          checkBox.checked = true;
      }
      myDiv.appendChild(li);
      li.appendChild(checkBox);
      li.appendChild(label);
      label.appendChild(document.createTextNode(actual_JSON.Data[key].CoinName));
      label.appendChild(document.createTextNode(' ('+actual_JSON.Data[key].Name+')'));
      label.appendChild(div);
    }); //forEach
    
  }); //loadJSON
 
  base = settings.get('user.currency'); // get the user's base currency
  var currSel = document.getElementById('base'); //select the currency select box
  currSel.value = settings.get('user.currency'); //select the option that corresponds to the user's currency
  setBase = function() {
    //selected base currency
    var sel = document.getElementById('base');
    var x   = sel.selectedIndex;
    var y   = sel.options;
    base    = y[x].text;
    settings.set('user.currency', base); //save the user's selection
    updateData(); //immediately reflect the changed currency
  };
  
})();

//Functions for creating/appending elements
function createNode(element) {
    return document.createElement(element);
}
function append(parent, el) {
  return parent.appendChild(el);
}


// Returns an array with values of the selected (checked) checkboxes in "frm"
function getSelectedChbox(frm) {
  var selchbox = []; // array that will store the value of selected checkboxes
  // gets all the input tags in frm, and their number
  var inpfields = frm.getElementsByTagName('input');
  var nr_inpfields = inpfields.length;
  // traverse the inpfields elements, and adds the value of selected (checked) checkbox in selchbox
  for(var i=0; i<nr_inpfields; i++) {
    if(inpfields[i].type == 'checkbox' && inpfields[i].checked == true) selchbox.push(inpfields[i].value);
  }
  return selchbox;
}

const ul = document.getElementById('prices'); // Get the list where we will place coins
const portfolio_ul = document.getElementById('portfolio-list');; 
const url = 'https://min-api.cryptocompare.com/data/pricemultifull?fsyms='+settings.get('user.coins') +'&tsyms='+base +'&extraParams=crypto-price-widget';

function initData() {
  fetch(url)
    .then(  
      function(response) {  
        if (response.status !== 200) {  
          console.log('Looks like there was a problem. Status Code: ' +  
            response.status);  
          return;  
        }

        // Examine the response  
        response.json().then(function(data) {
          //console.log(data);
          let prices = data.DISPLAY;
          var i = 0;
          for (let key of Object.keys(prices)) {
            let coin = prices[key];
            //console.log(coin);
            let li    = createNode('li'),
                span  = createNode('span');
                sym   = createNode('span');
            li.setAttribute("class", "price");
            li.setAttribute("id", "coin-"+[key]);
            //alert("coin-"+[key])
            //console.log(settings.get('coin.'+[key]+'.order'));
            li.setAttribute("sortorder", settings.get(li.id+'.order'));
            //alert(settings.get(li.id+'.order'));
            append(li, span);
            append(ul, li);
            i++;
          }
          //console.log(data.RAW.BTC.USD.PRICE)

          sortChildren(
              document.getElementById('prices'),
              function(li) { return +li.getAttribute('sortorder') }
          );

          //sort your coins
          sortable('#prices', {
            handle: 'span'
          })[0].addEventListener('sortstop', function(e) {
            // Declare variables
            var ul, li, i;
            ul = document.getElementById("prices");
            li = ul.getElementsByTagName('li');

            // Loop through all list items
            for (i = 0; i < li.length; i++) {
               li[i].setAttribute("sortorder", i);
               var elementID = li[i].id;
               //alert(elementID);
               settings.set(elementID, { // coin-BTC
                order: li[i].getAttribute('sortorder')
              });
              //alert(settings.get(elementID + '.order'));
            }
            //alert(settings.get('coin.'+e+'.order'));
          }); //sortable

        }); //response.json
      } //function(response)
    ) //.then
    .catch(function(err) {  
      console.log('Fetch Error :-S', err);  
    });
    updateData();
}

function updateData() {
    //console.log(settings.get('user.coins'));
    const url = 'https://min-api.cryptocompare.com/data/pricemultifull?fsyms='+settings.get('user.coins') +'&tsyms='+base +'&extraParams=crypto-price-widget';
    fetch(url)
      .then(
        function(response) {  
          if (response.status !== 200) {  
            console.log('Looks like there was a problem. Status Code: ' +  
              response.status);  
            return;  
          }
          // Examine the text in the response  
          response.json().then(function(data) { 
            let pricesDISPLAY = data.DISPLAY; // display for everything except coin symbol
            let pricesRAW     = data.RAW; // raw to get BTC instead of bitcoin symbol
            let portfolioSum  = 0;
            for (let key of Object.keys(pricesRAW)) {
              let coinDISPLAY = pricesDISPLAY[key];
                let coinDISPLAYchange = coinDISPLAY[base].CHANGEPCT24HOUR;
              let coinRAW = pricesRAW[key];
              //console.log(coinDISPLAY);
              let li = document.getElementById("coin-"+[key]),
                  span = document.querySelector("#coin-"+[key]+" span");
              span.setAttribute("class", "draggable");
              
              let coinSymbol  = coinRAW[base].FROMSYMBOL;
              let coinRate    = coinDISPLAY[base].PRICE.replace(/ /g,''); //.replace(/ /g,'') removes space after $
              
              //replace currencies that have no symbols with easier to read formats
              if(coinRate.includes("AUD")) { coinRate = coinRate.replace("AUD", "A$"); }
              if(coinRate.includes("CAD")) { coinRate = coinRate.replace("CAD",  "C$"); }
              if(coinRate.includes("HKD")) { coinRate = coinRate.replace("HKD", "HK$"); }
              if(coinRate.includes("MXN")) { coinRate = coinRate.replace("MXN", "$"); }
              if(coinRate.includes("NOK")) { coinRate = coinRate.replace("NOK", "kr"); }
              if(coinRate.includes("NZD")) { coinRate = coinRate.replace("NZD", "NZ$"); }
              if(coinRate.includes("SEK")) { coinRate = coinRate.replace("SEK", "kr"); }
              if(coinRate.includes("SGD")) { coinRate = coinRate.replace("SGD", "S$"); }
              if(coinRate.includes("TRY")) { coinRate = coinRate.replace("TRY", "₺"); }
              if(coinRate.includes("ZAR")) { coinRate = coinRate.replace("ZAR", "R"); }

              //console.log(span);
              span.innerHTML = '<span class="sym">' + coinSymbol + '</span> ' + coinRate + '<span class="change">' + coinDISPLAYchange + '%</span>'; 

              // % Change
              let change = document.querySelector("#coin-"+[key]+" .change");
              if(coinDISPLAYchange > 0) {
                change.className += " positive";
                change.classList.remove("negative");
              }
              else if(coinDISPLAYchange < 0) {
                change.className += " negative";
                change.classList.remove("postive");
              }
              else {
                change.classList.remove("postive");
                change.classList.remove("negative");
              }

              // Portfolio
              let quantityValue   = document.querySelector("#coin-"+[key]+" .quantity-value");
              let quantityNumber  = settings.get('quantity.'+[key]);
              let regp = /[^0-9.-]+/g;
              let quantityTotal   = parseFloat(coinRate.replace(regp, '')) * parseFloat(quantityNumber.replace(regp, ''));

              // sum of all total coin values
              portfolioSum += quantityTotal;
              // put sum into the markup
              let portfolioTotalValue = document.querySelector("#portfolio-total-value .value");

              // total value for each coin
              if(coinRate.includes("Ƀ")) {
                //because BTC has 8 decimal places
                quantityValue.innerHTML = quantityTotal.toFixed(8);
                portfolioTotalValue.innerHTML = portfolioSum.toFixed(8);
              }
              else {
                //standard currency format
                quantityValue.innerHTML = quantityTotal.toFixed(2).replace(/(\d)(?=(\d{3})+\.)/g, '$1,');
                portfolioTotalValue.innerHTML = portfolioSum.toFixed(2).replace(/(\d)(?=(\d{3})+\.)/g, '$1,');
              }
              
              
            } //for

          }); //then
        }  
      )
    setTimeout(function(){updateData()}, 5000); // run this once every 5 seconds
}

// Let's do this thing!
initData();

/* Test this function */
//document.getElementById('firstname').innerHTML = settings.get('user.coins');
// Click on #saveCoins, save the coin selection to the user
document.getElementById('saveCoins').onclick = function(){
  var coinForm = document.getElementById('coinlist');
  var selchb = getSelectedChbox(coinForm); // gets the array returned by getSelectedChbox()
  //alert(selchb);
  settings.set('user.coins', selchb);

  // just reloading the entire app because I have yet to figure out how to add/remove a coin from the primary list without a page reload
  location.reload(false);

  //alert(settings.get('user.currency'));
}

/***********
* PORTFOLIO
***********/
var portfolio_list_container = document.querySelector('#portfolio-list');
var portfolio_list = settings.get('user.coins');

//generate html from list of coins
for (let key of Object.keys(portfolio_list)) {
  let coin = portfolio_list[key];
  //console.log(coin);
  let li    = createNode('li'),
      span  = createNode('span');
      sym   = createNode('span');
  li.setAttribute("id", "coin-"+[coin]);

  append(li, span);
  append(portfolio_ul, li);

  if (settings.has('quantity.'+[coin])) {
    inputValue = settings.get('quantity.'+[coin]);
  }
  else {
    inputValue = '0';
  }

  span.innerHTML = '<span class="sym">' + coin + '</span> <span class="block quantity"><label for="quantity.' + coin +'">Quantity</label> <input type="number" name="quantity.' + coin +'" min="0" value="'+inputValue+'" step=".01"></span> <span class="block value"><label>Current Value</label><span class="quantity-value"></span></span>';

  i++;
} //for

// save quantities
document.getElementById('saveQuantities').onclick = function(){
  var items = portfolio_ul.getElementsByTagName("input");
  for (var i = 0; i < items.length; ++i) {
    // do something with items[i], which is a <li> element
    inputName   = items[i].getAttribute("name");
    inputValue  = items[i].value;
    //console.log(inputValue);
    settings.set(inputName, inputValue);
  }
  

  // just reloading the entire app because I have yet to figure out how to add/remove a coin from the primary list without a page reload
  //location.reload(false);
}


/*******
* APP UI
********/

//Window controls
const remote = require('electron').remote;
document.getElementById("close-btn").addEventListener("click", function (e) {
  var window = remote.getCurrentWindow();
  window.close();
});
document.getElementById("min-btn").addEventListener("click", function (e) {
  var window = remote.getCurrentWindow();
  window.minimize(); 
});

//Panel tabs
var tabLinks = document.querySelectorAll('.tabs button');
for (var i = 0; i < tabLinks.length; i++) { 
  tabLinks[i].onclick = function() {
    var target = this.getAttribute('href').replace('#', '');
    var sections = document.querySelectorAll('.panel');
    for(var j=0; j < sections.length; j++) {
      sections[j].style.display = 'none';
    }    
    document.getElementById(target).style.display = 'block';
    for(var k=0; k < tabLinks.length; k++) {
      tabLinks[k].removeAttribute('class');
    }
    this.setAttribute('class', 'active');
    return false;
  }
};

//Coin search filter
function myFunction() {
  // Declare variables
  var input, filter, ul, li, a, i;
  input = document.getElementById('myInput');
  filter = input.value.toUpperCase();
  ul = document.getElementById("coinlist");
  li = ul.getElementsByTagName('li');

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
  for(var i=0; i<l; ++i)
      arr[i] = [f(wrap.children[i]), wrap.children[i]];
  arr.sort(isNum
      ? function(a,b){ return a[0]-b[0]; }
      : function(a,b){ return a[0]<b[0] ? -1 : a[0]>b[0] ? 1 : 0; }
  );
  var par = wrap.parentNode,
      ref = wrap.nextSibling;
  par.removeChild(wrap);
  for(var i=0; i<l; ++i) wrap.appendChild(arr[i][1]);
  par.insertBefore(wrap, ref);
} //sortChildren